import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTimeNL } from "@/lib/utils/format-date";

export default async function AuditLogPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_logs")
    .select("id, entity, entity_id, action, created_at, before_snapshot, after_snapshot, verification")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header className="border-b border-zvv-border pb-6">
        <p className="club-page-eyebrow">Beheer · Audit</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink">Audit Trail</h1>
        <p className="mt-2 text-sm text-zvv-muted">Volledige traceability met before/after snapshots en verificatie per wijziging.</p>
      </header>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((row) => (
            <details key={row.id} className="rounded-xl border border-zvv-border bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-zvv-ink">
                [{formatDateTimeNL(row.created_at)}] {row.entity} {row.entity_id ?? "—"} · {row.action}
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <pre className="overflow-auto rounded-lg bg-zvv-card-mid p-3 text-xs">before: {JSON.stringify(row.before_snapshot, null, 2)}</pre>
                <pre className="overflow-auto rounded-lg bg-zvv-card-mid p-3 text-xs">after: {JSON.stringify(row.after_snapshot, null, 2)}</pre>
                <pre className="overflow-auto rounded-lg bg-zvv-card-mid p-3 text-xs">verification: {JSON.stringify(row.verification, null, 2)}</pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
