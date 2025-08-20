import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readDb, writeDb } from "@/lib/db";

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
    console.warn("Unauthorized webhook attempt from PipraPay");
    return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const { status, metadata } = payload;
    const projectId = metadata?.projectId;

    if (status === "completed" && projectId) {
        const db = await readDb();
        const projectIndex = db.projects.findIndex(p => p.id === projectId);

        if (projectIndex !== -1 && db.projects[projectIndex].paymentStatus !== 'paid') {
            db.projects[projectIndex].paymentStatus = 'paid';
            await writeDb(db);
            
            revalidatePath(`/client/projects/${projectId}`);
            revalidatePath('/client/dashboard');
            revalidatePath('/admin/projects');
            revalidatePath('/admin/dashboard');

            console.log(`Payment status updated to 'paid' for project ${projectId} via webhook.`);
        }
    }

    return NextResponse.json({ status: true, message: "Webhook received" });
  } catch (error) {
    console.error("Error processing PipraPay webhook:", error);
    return NextResponse.json({ status: false, message: "Internal Server Error" }, { status: 500 });
  }
}
