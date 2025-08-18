
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
import { getSession } from "@/lib/session";
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const allUsers = await getUsers(session.user.email);
  
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
