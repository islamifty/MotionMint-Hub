
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readDb, writeDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendSms } from "@/lib/sms";

export async function POST(req: Request) {
  const { PIPRAPAY_WEBHOOK_VERIFY_KEY } = process.env;

  if (!PIPRAPAY_WEBHOOK_VERIFY_KEY) {
      logger.warn("PipraPay Webhook Verification Key is not set. Cannot process webhook.");
      return NextResponse.json({ status: false, message: "Webhook service not configured." }, { status: 500 });
  }
  
  const headers = Object.fromEntries(req.headers);
  const incomingKey =
    headers["mh-piprapay-api-key"] ||
    headers["Mh-Piprapay-Api-Key"] ||
    headers["http_mh_piprapay_api_key"];

  if (incomingKey !== PIPRAPAY_WEBHOOK_VERIFY_KEY) {
    logger.warn("Unauthorized webhook attempt from PipraPay", {
      ip: req.headers.get('x-forwarded-for')
    });
    return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    logger.info("PipraPay webhook received.", payload);
    const { status, metadata } = payload;
    const projectId = metadata?.projectId;

    if (status === "completed" && projectId) {
        const db = await readDb();
        const projectIndex = db.projects.findIndex(p => p.id === projectId);

        if (projectIndex !== -1 && db.projects[projectIndex].paymentStatus !== 'paid') {
            const project = db.projects[projectIndex];
            project.paymentStatus = 'paid';
            await writeDb(db);
            
            revalidatePath(`/client/projects/${projectId}`);
            revalidatePath('/client/dashboard');
            revalidatePath('/admin/projects');
            revalidatePath('/admin/dashboard');

            logger.info(`Payment status updated to 'paid' for project ${projectId} via webhook.`);
            
            const client = db.clients.find(c => c.id === project.clientId);
            if (client?.phone) {
                 try {
                    await sendSms({
                        to: client.phone,
                        message: `Dear ${client.name}, your payment for project "${project.title}" has been confirmed. You can now download the final video. Thank you!`,
                    });
                } catch (smsError) {
                    logger.error("Failed to send payment confirmation SMS via webhook:", smsError);
                }
            }
        }
    }

    return NextResponse.json({ status: true, message: "Webhook received" });
  } catch (error) {
    logger.error("Error processing PipraPay webhook:", { error });
    return NextResponse.json({ status: false, message: "Internal Server Error" }, { status: 500 });
  }
}
