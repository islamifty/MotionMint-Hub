import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    amount,
    currency = "BDT",
    customer_name,
    customer_email_mobile,
    metadata = {},
  } = body;

  if (!amount) {
    return NextResponse.json({ ok: false, message: "amount required" }, { status: 400 });
  }

  const res = await fetch(`${process.env.PIPRAPAY_BASE_URL}/api/create-charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // PipraPay expects API key in header
      "mh-piprapay-api-key": process.env.PIPRAPAY_API_KEY as string,
    },
    body: JSON.stringify({
      amount,
      currency,
      customer_name,
      customer_email_mobile,
      // user will be redirected here after success; PipraPay sends invoice_id to this URL
      pp_url: process.env.PIPRAPAY_RETURN_URL,
      // recommended: receive async events
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/webhooks/piprapay`,
      metadata,
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("PipraPay Create Charge Error:", data);
    return NextResponse.json({ ok: false, error: data }, { status: res.status });
  }

  // Different installs may return "url" or "payment_url"—handle both
  const paymentUrl = data?.url || data?.payment_url || data?.data?.url;
  const ppId = data?.pp_id || data?.data?.pp_id;

  return NextResponse.json({ ok: true, paymentUrl, ppId, raw: data });
}
