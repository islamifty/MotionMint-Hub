import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from '@/lib/turso';
import { projects, clients } from '@/lib/schema';
import { getSettings } from "@/app/admin/settings/actions";
import { eq } from 'drizzle-orm';
import { sendSms } from "@/lib/sms";

export async function POST(req: Request) {
  const { piprapayWebhookVerifyKey } = await getSettings();

  if (!piprapayWebhookVerifyKey) {
      console.warn("PipraPay Webhook Verification Key is not set. Cannot process webhook.");
      return NextResponse.json({ status: false, message: "Webhook service not configured." }, { status: 500 });
  }
  
  const headers = Object.fromEntries(req.headers);
  const incomingKey =
    headers["mh-piprapay-api-key"] ||
    headers["Mh-Piprapay-Api-Key"] ||
    headers["http_mh_piprapay_api_key"];

  if (incomingKey !== piprapayWebhookVerifyKey) {
    console.warn("Unauthorized webhook attempt from PipraPay", {
      ip: req.headers.get('x-forwarded-for')
    });
    return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    console.info("PipraPay webhook received.", payload);
    const { status, metadata } = payload;
    const projectId = metadata?.projectId;

    if (status === "completed" && projectId) {
        const projectResult = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        const project = projectResult[0];

        if (project && project.paymentStatus !== 'paid') {
            await db.update(projects).set({ paymentStatus: 'paid' }).where(eq(projects.id, projectId));
            
            const clientResult = await db.select().from(clients).where(eq(clients.id, project.clientId)).limit(1);
            const client = clientResult[0];

            if (client?.phone) {
                 try {
                    await sendSms({
                        to: client.phone,
                        message: `Dear ${client.name}, your payment for project "${project.title}" has been confirmed. You can now download the final video. Thank you!`,
                    });
                } catch (smsError) {
                    console.error("Failed to send payment confirmation SMS via webhook:", smsError);
                }
            }
            
            revalidatePath(`/client/projects/${projectId}`);
            revalidatePath('/client/dashboard');
            revalidatePath('/admin/projects');
            revalidatePath('/admin/dashboard');

            console.info(`Payment status updated to 'paid' for project ${projectId} via webhook.`);
        }
    }

    return NextResponse.json({ status: true, message: "Webhook received" });
  } catch (error) {
    console.error("Error processing PipraPay webhook:", { error });
    return NextResponse.json({ status: false, message: "Internal Server Error" }, { status: 500 });
  }
}
