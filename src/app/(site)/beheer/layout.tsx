import { requireAdmin } from "@/lib/auth/require-admin";

export default async function BeheerLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin({ loginRedirect: "/login?next=%2Fbeheer", forbiddenRedirect: "/" });

  return <>{children}</>;
}
