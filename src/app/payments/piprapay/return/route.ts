import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readDb, writeDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const invoice_id = req.nextUrl.searchParams.get("invoice_id");
  if (!invoice_id) {
    const failureUrl = new URL('/payment/failure', req.url);
    failureUrl.searchParams.set('message', 'No invoice ID returned from PipraPay.');
    return NextResponse.redirect(failureUrl);
  }

  // Verify server-side
  const verifyUrl = new URL("/api/payments/piprapay/verify", req.url);
  const res = await fetch(verifyUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice_id }),
    cache: "no-store",
  });

  const verificationResult = await res.json();
  const paymentData = verificationResult?.data?.data;
  
  if (verificationResult.ok && paymentData && paymentData.status === "completed") {
      const db = await readDb();
      // The invoice_id from PipraPay is our project's orderId
      const projectIndex = db.projects.findIndex(p => p.orderId === invoice_id);

      if (projectIndex !== -1) {
          const project = db.projects[projectIndex];
          if (project.paymentStatus !== 'paid') {
            project.paymentStatus = 'paid';
            await writeDb(db);
            
            revalidatePath(`/client/projects/${project.id}`);
            revalidatePath('/client/dashboard');
            revalidatePath('/admin/projects');
            revalidatePath('/admin/dashboard');
          }

          const successUrl = new URL('/payment/success', req.url);
          successUrl.searchParams.set('projectId', project.id);
          successUrl.searchParams.set('amount', project.amount.toString());
          successUrl.searchParams.set('transactionId', invoice_id);
          return NextResponse.redirect(successUrl);
      } else {
           const failureUrl = new URL('/payment/failure', req.url);
           failureUrl.searchParams.set('message', `Project not found for invoice ID: ${invoice_id}`);
           return NextResponse.redirect(failureUrl);
      }
  } else {
    const failureUrl = new URL('/payment/failure', req.url);
    failureUrl.searchParams.set('message', paymentData?.status_message || 'Payment verification failed or payment is not complete.');
    return NextResponse.redirect(failureUrl);
  }
}
