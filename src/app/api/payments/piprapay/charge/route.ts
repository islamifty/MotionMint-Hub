
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/url";
import { readDb } from "@/lib/db";

export async function POST(req: Request) {
  const db = await readDb();
  const { piprapayApiKey, piprapayBaseUrl } = db.settings;

  if (!piprapayApiKey || !piprapayBaseUrl) {
    return NextResponse.json({ ok: false, message: "PipraPay is not configured." }, { status: 500 });
  }

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

  const appUrl = getBaseUrl();

  try {
      const res = await fetch(`${piprapayBaseUrl}/create-charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "mh-piprapay-api-key": piprapayApiKey,
        },
        body: JSON.stringify({
          amount,
          currency,
          customer_name,
          customer_email_mobile,
          pp_url: `${appUrl}/payments/piprapay/return`,
          webhook_url: `${appUrl}/api/webhooks/piprapay`,
          metadata,
        }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("PipraPay Create Charge Error:", data);
        return NextResponse.json({ ok: false, error: data }, { status: res.status });
      }

      const paymentUrl = data?.url || data?.payment_url || data?.data?.url;
      const ppId = data?.pp_id || data?.data?.pp_id;

      return NextResponse.json({ ok: true, paymentUrl, ppId, raw: data });
  } catch (error: any) {
    console.error("Error creating PipraPay charge:", error);
    return NextResponse.json({ ok: false, message: "An unexpected error occurred while contacting PipraPay." }, { status: 500 });
  }
}
