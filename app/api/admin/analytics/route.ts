import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminResponse } from "@/lib/auth/admin";

/**
 * GET /api/admin/analytics
 * Get platform-wide analytics and statistics
 */
export async function GET() {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: adminUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_platform_admin", true);

    const { count: verifiedUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("kyc_status", "approved");

    // Get groups statistics
    const { count: totalGroups } = await supabase
      .from("groups")
      .select("*", { count: "exact", head: true });

    // Get pools statistics
    const { data: poolsData } = await supabase
      .from("pools")
      .select("current_amount, target_amount, status");

    const totalPools = poolsData?.length || 0;
    const totalPoolValue = poolsData?.reduce((sum, pool) => sum + (pool.current_amount || 0), 0) || 0;
    const totalPoolTarget = poolsData?.reduce((sum, pool) => sum + (pool.target_amount || 0), 0) || 0;
    const completedPools = poolsData?.filter(p => p.status === "completed").length || 0;

    // Get cards statistics
    const { count: totalCards } = await supabase
      .from("virtual_cards")
      .select("*", { count: "exact", head: true });

    const { count: activeCards } = await supabase
      .from("virtual_cards")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Get transactions statistics
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("amount, status, type, created_at");

    const totalTransactions = transactionsData?.length || 0;
    const totalTransactionValue = transactionsData?.reduce((sum, t) => {
      if (t.status === "approved" && (t.type === "purchase" || t.type === "fee")) {
        return sum + Math.abs(t.amount);
      }
      return sum;
    }, 0) || 0;

    // Get contributions statistics
    const { data: contributionsData } = await supabase
      .from("contributions")
      .select("amount, status");

    const totalContributions = contributionsData?.length || 0;
    const successfulContributions = contributionsData?.filter(c => c.status === "succeeded").length || 0;
    const totalContributionValue = contributionsData
      ?.filter(c => c.status === "succeeded")
      .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    const { count: recentGroups } = await supabase
      .from("groups")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    const { count: recentTransactions } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    // Get platform status
    const { data: platformSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "platform_enabled")
      .single();

    const platformEnabled = platformSetting?.value?.enabled ?? true;

    return NextResponse.json({
      overview: {
        platform_enabled: platformEnabled,
        total_users: totalUsers || 0,
        admin_users: adminUsers || 0,
        verified_users: verifiedUsers || 0,
        total_groups: totalGroups || 0,
        total_pools: totalPools,
        total_cards: totalCards || 0,
        active_cards: activeCards || 0,
      },
      financial: {
        total_pool_value: totalPoolValue,
        total_pool_target: totalPoolTarget,
        pool_completion_rate: totalPoolTarget > 0 ? (totalPoolValue / totalPoolTarget) * 100 : 0,
        completed_pools: completedPools,
        total_contributions: totalContributionValue,
        successful_contributions: successfulContributions,
        total_transaction_value: totalTransactionValue,
      },
      activity: {
        total_transactions: totalTransactions,
        total_contributions: totalContributions,
        recent_users_7d: recentUsers || 0,
        recent_groups_7d: recentGroups || 0,
        recent_transactions_7d: recentTransactions || 0,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

