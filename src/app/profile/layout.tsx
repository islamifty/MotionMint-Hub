
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminLayout from '@/app/admin/layout';
import ClientLayout from '@/app/client/layout';
import { AccountLayout } from "@/components/shared/AccountLayout";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role;

  const content = <AccountLayout>{children}</AccountLayout>;

  if (userRole === 'admin') {
    return <AdminLayout>{content}</AdminLayout>;
  }
  
  return <ClientLayout>{content}</ClientLayout>;
}
