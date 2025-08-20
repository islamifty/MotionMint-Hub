import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readDb, writeDb } from "@/lib/db";

export async function POST(req: Request) {
  const headers = Object.fromEntries(req.headers);
  // PipraPay sends API key in header "mh-piprapay-api-key"
  const incomingKey =
    headers["mh-piprapay-api-key"] ||
    headers["Mh-Piprapay-Api-Key"] ||
    headers["http_mh_piprapay_api_key"];

  if (incomingKey !== process.env.PIPRAPAY_WEBHOOK_VERIFY_KEY) {
    console.warn("Unauthorized webhook attempt from PipraPay");
    return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json().catch(() => ({}));

    // Example fields per docs
    // pp_id, customer_name, customer_email_mobile, payment_method, amount, fee, total, currency, status, date, metadata, sender_number, transaction_id
    const { status, metadata } = payload;
    const projectId = metadata?.projectId;

    if (status === "completed" && projectId) {
        const db = await readDb();
        const projectIndex = db.projects.findIndex(p => p.id === projectId);

        if (projectIndex !== -1 && db.projects[projectIndex].paymentStatus !== 'paid') {
            db.projects[projectIndex].paymentStatus = 'paid';
            await writeDb(db);
            
            // Revalidate paths to reflect updated status
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
