import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth/viewer";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") ? sp.next : "/beheer";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    if (await isCurrentUserAdmin()) {
      redirect(next);
    }
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zvv-deep bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(11,79,156,0.14),transparent_55%)]">
      <Suspense fallback={<div className="p-8 text-center text-zvv-muted">Laden…</div>}>
        <LoginForm serverErrorKey={sp.error} />
      </Suspense>
    </div>
  );
}
