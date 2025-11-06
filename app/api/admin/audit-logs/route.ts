import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminResponse } from "@/lib/auth/admin";

/**
 * GET /api/admin/audit-logs
 * Get audit logs and admin actions
 * Query params: page, limit, type, userId, startDate, endDate
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const actionType = searchParams.get("type");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const offset = (page - 1) * limit;

    // Build query for admin actions
    let adminActionsQuery = supabase
      .from("admin_actions")
      .select(`
        *,
        admin:admin_id (
          id,
          email,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (actionType) {
      adminActionsQuery = adminActionsQuery.eq("action_type", actionType);
    }

    if (userId) {
      adminActionsQuery = adminActionsQuery.eq("admin_id", userId);
    }

    if (startDate) {
      adminActionsQuery = adminActionsQuery.gte("created_at", startDate);
    }

    if (endDate) {
      adminActionsQuery = adminActionsQuery.lte("created_at", endDate);
    }

    const { data: adminActions, error: adminError, count: adminCount } = await adminActionsQuery
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (adminError) {
      console.error("Error fetching admin actions:", adminError);
    }

    // Build query for regular audit logs
    let auditLogsQuery = supabase
      .from("audit_logs")
      .select(`
        *,
        user:user_id (
          id,
          email,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (userId) {
      auditLogsQuery = auditLogsQuery.eq("user_id", userId);
    }

    if (startDate) {
      auditLogsQuery = auditLogsQuery.gte("created_at", startDate);
    }

    if (endDate) {
      auditLogsQuery = auditLogsQuery.lte("created_at", endDate);
    }

    const { data: auditLogs, error: auditError, count: auditCount } = await auditLogsQuery
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (auditError) {
      console.error("Error fetching audit logs:", auditError);
    }

    // Combine and sort by date
    const allLogs = [
      ...(adminActions?.map(action => ({
        ...action,
        log_type: "admin_action",
      })) || []),
      ...(auditLogs?.map(log => ({
        ...log,
        log_type: "audit_log",
      })) || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Get total counts
    const totalCount = (adminCount || 0) + (auditCount || 0);

    return NextResponse.json({
      logs: allLogs.slice(0, limit),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Audit logs fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

