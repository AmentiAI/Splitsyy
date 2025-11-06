import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminResponse } from "@/lib/auth/admin";

/**
 * GET /api/admin/transactions
 * Get all transactions across the platform (admin only)
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const poolId = searchParams.get("poolId");
    const cardId = searchParams.get("cardId");

    // Build query
    let query = supabase
      .from("transactions")
      .select(
        `
        id,
        pool_id,
        card_id,
        amount,
        currency,
        type,
        status,
        merchant_name,
        merchant_category,
        description,
        provider_transaction_id,
        metadata,
        created_at,
        pools (
          id,
          target_amount,
          groups (
            id,
            name,
            owner_id,
            currency
          )
        ),
        virtual_cards (
          id,
          last_four,
          network,
          status
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (poolId) {
      query = query.eq("pool_id", poolId);
    }

    if (cardId) {
      query = query.eq("card_id", cardId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("transactions")
      .select("*", { count: "exact", head: true });

    if (status) countQuery = countQuery.eq("status", status);
    if (type) countQuery = countQuery.eq("type", type);
    if (poolId) countQuery = countQuery.eq("pool_id", poolId);
    if (cardId) countQuery = countQuery.eq("card_id", cardId);
    if (startDate) countQuery = countQuery.gte("created_at", startDate);
    if (endDate) countQuery = countQuery.lte("created_at", endDate);

    const { count } = await countQuery;

    // Get pool contributors for context
    const poolIds = transactions
      ?.map((t) => t.pool_id)
      .filter((id): id is string => id !== null) || [];

    const { data: pools } = await supabase
      .from("pools")
      .select("id, group_id")
      .in("id", [...new Set(poolIds)]);

    const groupIds = pools?.map((p) => p.group_id).filter((id): id is string => id !== null) || [];

    const { data: members } = await supabase
      .from("group_members")
      .select("group_id, user_id, role, users(id, name, email)")
      .in("group_id", [...new Set(groupIds)]);

    // Transform transactions data
    const transformedTransactions = transactions?.map((transaction: any) => {
      const group = transaction.pools?.groups;
      const poolMembers = members?.filter((m) => m.group_id === group?.id) || [];

      return {
        id: transaction.id,
        poolId: transaction.pool_id,
        cardId: transaction.card_id,
        amount: transaction.amount,
        currency: transaction.currency || group?.currency || "USD",
        type: transaction.type,
        status: transaction.status,
        merchantName: transaction.merchant_name,
        merchantCategory: transaction.merchant_category,
        description: transaction.description,
        providerTransactionId: transaction.provider_transaction_id,
        metadata: transaction.metadata,
        createdAt: transaction.created_at,
        pool: transaction.pools
          ? {
              id: transaction.pools.id,
              targetAmount: transaction.pools.target_amount,
              group: group
                ? {
                    id: group.id,
                    name: group.name,
                    ownerId: group.owner_id,
                    currency: group.currency,
                    members: poolMembers.map((m: any) => ({
                      userId: m.user_id,
                      role: m.role,
                      userName: m.users?.name,
                      userEmail: m.users?.email,
                    })),
                  }
                : null,
            }
          : null,
        card: transaction.virtual_cards
          ? {
              id: transaction.virtual_cards.id,
              lastFour: transaction.virtual_cards.last_four,
              network: transaction.virtual_cards.network,
              status: transaction.virtual_cards.status,
            }
          : null,
      };
    });

    // Calculate summary statistics
    const totalValue = transactions?.reduce((sum, t) => {
      if (t.status === "approved" && (t.type === "purchase" || t.type === "fee")) {
        return sum + Math.abs(t.amount);
      }
      return sum;
    }, 0) || 0;

    const statusCounts = {
      pending: transactions?.filter((t) => t.status === "pending").length || 0,
      approved: transactions?.filter((t) => t.status === "approved").length || 0,
      declined: transactions?.filter((t) => t.status === "declined").length || 0,
      reversed: transactions?.filter((t) => t.status === "reversed").length || 0,
    };

    const typeCounts = {
      purchase: transactions?.filter((t) => t.type === "purchase").length || 0,
      refund: transactions?.filter((t) => t.type === "refund").length || 0,
      fee: transactions?.filter((t) => t.type === "fee").length || 0,
      adjustment: transactions?.filter((t) => t.type === "adjustment").length || 0,
    };

    return NextResponse.json({
      transactions: transformedTransactions || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      summary: {
        totalValue,
        statusCounts,
        typeCounts,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


