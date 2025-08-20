import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { invoice_id } = await req.json().catch(() => ({}));
  if (!invoice_id) {
    return NextResponse.json({ ok: false, message: "invoice_id required" }, { status: 400 });
  }

  const res = await fetch(`${process.env.PIPRAPAY_BASE_URL}/api/verify-payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "mh-piprapay-api-key": process.env.PIPRAPAY_API_KEY as string,
    },
    body: JSON.stringify({ invoice_id }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("PipraPay Verify Payment Error:", data);
    return NextResponse.json({ ok: false, error: data }, { status: res.status });
  }
  return NextResponse.json({ ok: true, data });
}
