import { NextResponse } from "next/server";
import { getSettings } from "@/app/admin/settings/actions";

export async function POST(req: Request) {
  const { piprapayApiKey, piprapayBaseUrl } = await getSettings();

  if (!piprapayApiKey || !piprapayBaseUrl) {
    return NextResponse.json({ ok: false, message: "PipraPay is not configured." }, { status: 500 });
  }

  const { invoice_id } = await req.json().catch(() => ({}));
  if (!invoice_id) {
    return NextResponse.json({ ok: false, message: "invoice_id required" }, { status: 400 });
  }

  const res = await fetch(`${piprapayBaseUrl}/verify-payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "mh-piprapay-api-key": piprapayApiKey,
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
