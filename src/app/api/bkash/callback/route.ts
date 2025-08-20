import { NextRequest, NextResponse } from 'next/server';
import { executePayment } from '@/lib/bkash';
import { readDb, writeDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sms';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');

    const appUrl = process.env.APP_URL;
    if (!appUrl) {
        console.error("APP_URL is not configured in environment variables.");
        // Redirect to a generic failure page if APP_URL is not set
        return NextResponse.redirect(new URL('/payment/failure?message=Configuration+error', request.url));
    }


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
                const project = db.projects[projectIndex];
                
                if (project.paymentStatus !== 'paid') {
                    project.paymentStatus = 'paid';
                    await writeDb(db);
                    
                    const client = db.clients.find(c => c.id === project.clientId);
                    if (client?.phone) {
                        try {
                            await sendSms({
                                to: client.phone,
                                message: `Dear ${client.name}, your payment for project "${project.title}" has been confirmed. You can now download the final video. Thank you!`,
                            });
                        } catch (smsError) {
                            console.error("Failed to send payment confirmation SMS:", smsError);
                        }
                    }
                }

                // Revalidate paths to reflect updated status
                revalidatePath(`/client/projects/${project.id}`);
                revalidatePath('/client/dashboard');
                revalidatePath('/admin/projects');
                revalidatePath('/admin/dashboard');

                const successUrl = new URL(`/client/projects/${project.id}`, appUrl);
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
