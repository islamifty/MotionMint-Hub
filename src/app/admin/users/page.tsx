
import { cookies } from "next/headers";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getUsers } from "./actions";
import { UserRow } from "./UserRow";
import type { DecodedIdToken } from "firebase-admin/auth";

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
  const session = cookies().get("session")?.value || "";

  if (!session) {
    return null;
  }

  try {
    const { auth } = getFirebaseAdmin();
    // Use 'false' to prevent checking for revocation, which can be faster
    const decodedClaims = await auth.verifySessionCookie(session, false);
    return decodedClaims;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

export default async function UsersPage() {
  const user = await getAuthenticatedUser();
  const allUsers = await getUsers(user?.email);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>
              List of all users who have signed up. You can promote a user to a client.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No registered users found.
                    </TableCell>
                </TableRow>
            ) : (
              allUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
