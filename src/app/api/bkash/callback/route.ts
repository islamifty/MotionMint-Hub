import { NextRequest, NextResponse } from 'next/server';
import { executePayment } from '@/lib/bkash';
import { db } from '@/lib/turso';
import { projects, clients } from '@/lib/schema';
import { getSettings } from '@/app/admin/settings/actions';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sms';
import { getBaseUrl } from '@/lib/url';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');
    const appUrl = getBaseUrl();


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
        const settings = await getSettings();
        const executeResult = await executePayment(paymentID, settings);

        if (executeResult && executeResult.statusCode === '0000' && executeResult.transactionStatus === 'Completed') {
            
            const projectResult = await db.select().from(projects).where(eq(projects.orderId, executeResult.merchantInvoiceNumber)).limit(1);
            const project = projectResult[0];

            if (project) {
                if (project.paymentStatus !== 'paid') {
                    await db.update(projects).set({ paymentStatus: 'paid' }).where(eq(projects.id, project.id));
                    
                    const clientResult = await db.select().from(clients).where(eq(clients.id, project.clientId)).limit(1);
                    const client = clientResult[0];

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
