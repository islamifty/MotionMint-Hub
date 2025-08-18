
import { deleteSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    deleteSession();
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}
