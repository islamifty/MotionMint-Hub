import { NextRequest, NextResponse } from 'next/server';
import { executePayment } from '@/lib/bkash';
import { readDb, writeDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';

    if (!paymentID || !status) {
        const failureUrl = new URL('/payment/failure', appUrl);
        failureUrl.searchParams.set('message', 'Payment details are missing from the callback.');
        return NextResponse.redirect(failureUrl);
    }
    
    if (status !== 'success') {
        let message = 'Payment was not successful.';
        if (status === 'cancel') {
            message = 'Payment was cancelled by the user.';
        } else if (status === 'failure') {
            message = 'Payment failed. Please try again.';
        }
        const failureUrl = new URL('/payment/failure', appUrl);
        failureUrl.searchParams.set('message', message);
        return NextResponse.redirect(failureUrl);
    }


    try {
        const executeResult = await executePayment(paymentID);

        if (executeResult && executeResult.statusCode === '0000' && executeResult.transactionStatus === 'Completed') {
            const db = await readDb();
            const projectIndex = db.projects.findIndex(p => p.orderId === executeResult.merchantInvoiceNumber);

            if (projectIndex !== -1) {
                db.projects[projectIndex].paymentStatus = 'paid';
                await writeDb(db);
                
                const projectId = db.projects[projectIndex].id;

                // Revalidate paths to reflect updated status
                revalidatePath(`/client/projects/${projectId}`);
                revalidatePath('/client/dashboard');
                revalidatePath('/admin/projects');
                revalidatePath('/admin/dashboard');

                const successUrl = new URL(`/client/projects/${projectId}`, appUrl);
                successUrl.searchParams.set('payment_status', 'success');
                return NextResponse.redirect(successUrl);
            } else {
                throw new Error('Project not found for this invoice number.');
            }
        } else {
            // If payment execution fails, redirect to a failure page
            const failureUrl = new URL('/payment/failure', appUrl);
            failureUrl.searchParams.set('message', executeResult.statusMessage || 'Payment execution failed.');
            return NextResponse.redirect(failureUrl);
        }
    } catch (error) {
        console.error('bKash callback error:', error);
        const failureUrl = new URL('/payment/failure', appUrl);
        failureUrl.searchParams.set('message', 'An internal server error occurred.');
        return NextResponse.redirect(failureUrl);
    }
}
