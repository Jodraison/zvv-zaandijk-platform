import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logAdminAction(params: {
  userId: string;
  action: string;
  entity: string;
  entity_id?: string | null;
  before_snapshot?: unknown;
  after_snapshot?: unknown;
  verification?: unknown;
}): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("admin_logs").insert({
      user_id: params.userId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id ?? null,
      before_snapshot: params.before_snapshot ?? null,
      after_snapshot: params.after_snapshot ?? null,
      verification: params.verification ?? null,
    });
    if (error) {
      console.error("admin_logs failed", error);
    }
  } catch (error) {
    console.error("admin_logs failed", error);
  }
}
