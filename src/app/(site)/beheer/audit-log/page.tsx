import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTimeNL } from "@/lib/utils/format-date";
import { AdminPageHeader, AdminSection } from "@/components/admin/shell/admin-ui";

export default async function AuditLogPage() {
  await requireAdmin({ capability: "view_audit", forbiddenRedirect: "/beheer" });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_logs")
    .select("id, entity, entity_id, action, created_at, before_snapshot, after_snapshot, verification")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Beheer · Controle"
        title="Wijzigingslog"
        description="Volledige traceerbaarheid met voor/na-snapshots en verificatie per wijziging."
      />
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <AdminSection title="Recente wijzigingen">
          <div className="space-y-3">
            {(data ?? []).length === 0 ? (
              <p className="text-sm text-zvv-muted">Nog geen wijzigingen geregistreerd.</p>
            ) : (
              (data ?? []).map((row) => (
                <details key={row.id} className="rounded-xl border border-zvv-border bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-zvv-ink">
                    [{formatDateTimeNL(row.created_at)}] {row.entity} {row.entity_id ?? "—"} · {row.action}
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <pre className="overflow-auto rounded-lg bg-zvv-card-mid p-3 text-xs">
                      voor: {JSON.stringify(row.before_snapshot, null, 2)}
                    </pre>
                    <pre className="overflow-auto rounded-lg bg-zvv-card-mid p-3 text-xs">
                      na: {JSON.stringify(row.after_snapshot, null, 2)}
                    </pre>
                    <pre className="overflow-auto rounded-lg bg-zvv-card-mid p-3 text-xs">
                      verificatie: {JSON.stringify(row.verification, null, 2)}
                    </pre>
                  </div>
                </details>
              ))
            )}
          </div>
        </AdminSection>
      )}
    </div>
  );
}
