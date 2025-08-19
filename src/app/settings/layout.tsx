
import { AccountLayout } from "@/components/shared/AccountLayout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return <AccountLayout>{children}</AccountLayout>
}
