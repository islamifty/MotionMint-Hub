
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readDb, writeDb } from "@/lib/db";
import { sendSms } from "@/lib/sms";

export async function POST(req: Request) {
  const db = await readDb();
  const { piprapayWebhookVerifyKey } = db.settings;

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
        const freshDb = await readDb(); // Read fresh data to avoid race conditions
        const projectIndex = freshDb.projects.findIndex(p => p.id === projectId);

        if (projectIndex !== -1 && freshDb.projects[projectIndex].paymentStatus !== 'paid') {
            const project = freshDb.projects[projectIndex];
            project.paymentStatus = 'paid';
            
            const client = freshDb.clients.find(c => c.id === project.clientId);
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
            await writeDb(freshDb);
            
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
