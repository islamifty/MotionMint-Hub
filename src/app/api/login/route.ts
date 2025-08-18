
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const adminEmails = ["admin@motionflow.com", "mdiftekharulislamifty@gmail.com"];

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "ID token is required" }, { status: 400 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const { auth } = getFirebaseAdmin();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!decodedToken.email) {
       return NextResponse.json({ error: "Email not found in token" }, { status: 401 });
    }

    const isAdmin = adminEmails.includes(decodedToken.email);
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set("session", sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });

    return NextResponse.json({ status: "success", isAdmin });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}
