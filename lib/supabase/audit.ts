import { createClient } from "./server";

export async function logAuditEvent(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {}
) {
  try {
    const supabase = await createClient();

    // Get request context if available
    const request = {
      ip: "unknown", // Will be filled by the calling function
      userAgent: "unknown", // Will be filled by the calling function
      ...metadata,
    };

    const { error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
        ip_address: request.ip,
        user_agent: request.userAgent,
      });

    if (error) {
      console.error("Audit logging error:", error);
      // Don't throw - audit logging should never break the main flow
    }
  } catch (error) {
    console.error("Audit logging error:", error);
    // Don't throw - audit logging should never break the main flow
  }
}

export async function getAuditLogs(
  userId?: string,
  resourceType?: string,
  limit: number = 50
) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Audit logs fetch error:", error);
      return { data: [], error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Audit logs fetch error:", error);
    return { data: [], error };
  }
}
