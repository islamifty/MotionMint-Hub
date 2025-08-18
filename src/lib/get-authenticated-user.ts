
import { cookies } from "next/headers";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

// This function runs on the server and safely gets the authenticated user
// from the session cookie.
export async function getAuthenticatedUser() {
  const session = cookies().get("session")?.value || "";

  if (!session) {
    return null;
  }

  try {
    const { auth } = getFirebaseAdmin();
    const decodedClaims = await auth.verifySessionCookie(session, true);
    return decodedClaims;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
