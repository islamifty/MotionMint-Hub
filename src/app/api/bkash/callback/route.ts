import { NextRequest, NextResponse } from 'next/server';
import { executePayment } from '@/lib/bkash';
import { readDb, writeDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');

    if (!paymentID || status !== 'success') {
        const failureUrl = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL);
        failureUrl.searchParams.set('message', 'Payment was cancelled or failed.');
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

                const successUrl = new URL(`/client/projects/${projectId}`, process.env.NEXT_PUBLIC_APP_URL);
                successUrl.searchParams.set('payment_status', 'success');
                return NextResponse.redirect(successUrl);
            } else {
                throw new Error('Project not found for this invoice number.');
            }
        } else {
            // If payment execution fails, redirect to a failure page
            const failureUrl = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL);
            failureUrl.searchParams.set('message', executeResult.statusMessage || 'Payment execution failed.');
            return NextResponse.redirect(failureUrl);
        }
    } catch (error) {
        console.error('bKash callback error:', error);
        const failureUrl = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL);
        failureUrl.searchParams.set('message', 'An internal server error occurred.');
        return NextResponse.redirect(failureUrl);
    }
}
