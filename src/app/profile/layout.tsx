
import { AccountLayout } from "@/components/shared/AccountLayout";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return <AccountLayout>{children}</AccountLayout>
}
