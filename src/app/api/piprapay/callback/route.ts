
import { NextRequest, NextResponse } from 'next/server';
import { verifyPipraPayPayment } from '@/lib/piprapay';
import { readDb, writeDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');

    if (status === 'cancel') {
        const failureUrl = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL);
        failureUrl.searchParams.set('message', 'Payment was cancelled.');
        return NextResponse.redirect(failureUrl);
    }
    
    if (!invoiceId || status !== 'success') {
        const failureUrl = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL);
        failureUrl.searchParams.set('message', 'Invalid payment details received.');
        return NextResponse.redirect(failureUrl);
    }

    try {
        const verificationResult = await verifyPipraPayPayment(invoiceId);

        if (verificationResult.success && verificationResult.status === 'completed') {
            const db = readDb();
            const projectIndex = db.projects.findIndex(p => p.orderId === invoiceId);

            if (projectIndex !== -1) {
                db.projects[projectIndex].paymentStatus = 'paid';
                writeDb(db);
                
                const projectId = db.projects[projectIndex].id;

                // Revalidate paths to reflect updated status
                revalidatePath(`/client/projects/${projectId}`);
                revalidatePath('/client/dashboard');
                revalidatePath('/admin/projects');
                revalidatePath('/admin/dashboard');

                const successUrl = new URL('/payment/success', process.env.NEXT_PUBLIC_APP_URL);
                successUrl.searchParams.set('projectId', projectId);
                successUrl.searchParams.set('amount', db.projects[projectIndex].amount.toString());
                successUrl.searchParams.set('transactionId', invoiceId);
                return NextResponse.redirect(successUrl);
            } else {
                throw new Error('Project not found for this invoice number.');
            }
        } else {
            const failureUrl = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL);
            failureUrl.searchParams.set('message', verificationResult.error || 'Payment verification failed.');
            return NextResponse.redirect(failureUrl);
        }
    } catch (error: any) {
        console.error('PipraPay callback error:', error);
        const failureUrl = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL);
        failureUrl.searchParams.set('message', error.message || 'An internal server error occurred.');
        return NextResponse.redirect(failureUrl);
    }
}
