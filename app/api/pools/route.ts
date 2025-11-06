import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPoolSchema } from "@/lib/validations/pools";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * POST /api/pools
 * Create a new pool for a group
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPoolSchema.parse(body);

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", validatedData.groupId)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    // Only owners and admins can create pools
    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can create pools" },
        { status: 403 }
      );
    }

    // If designated payer is specified, verify they are a group member
    if (validatedData.designatedPayer) {
      const { data: payerMembership, error: payerError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", validatedData.groupId)
        .eq("user_id", validatedData.designatedPayer)
        .single();

      if (payerError || !payerMembership) {
        return NextResponse.json(
          { error: "Designated payer is not a member of this group" },
          { status: 400 }
        );
      }
    }

    // Create the pool
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .insert({
        group_id: validatedData.groupId,
        target_amount: validatedData.targetAmount,
        designated_payer: validatedData.designatedPayer,
        status: "open",
      })
      .select()
      .single();

    if (poolError) {
      console.error("Error creating pool:", poolError);
      return NextResponse.json(
        { error: "Failed to create pool" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "pool.created",
      "pool",
      pool.id,
      {
        groupId: validatedData.groupId,
        targetAmount: validatedData.targetAmount,
      }
    );

    return NextResponse.json(
      {
        message: "Pool created successfully",
        pool: {
          id: pool.id,
          groupId: pool.group_id,
          targetAmount: pool.target_amount,
          status: pool.status,
          designatedPayer: pool.designated_payer,
          createdAt: pool.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/pools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pools
 * Get all pools for groups the user is a member of
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get optional query parameters
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const status = searchParams.get("status");

    // Get user's group memberships
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", session.user.id);

    if (memberError) {
      console.error("Error fetching memberships:", memberError);
      return NextResponse.json(
        { error: "Failed to fetch memberships" },
        { status: 500 }
      );
    }

    const groupIds = memberships.map((m) => m.group_id);

    if (groupIds.length === 0) {
      return NextResponse.json({ pools: [], count: 0 });
    }

    // Build query
    let query = supabase
      .from("pools")
      .select(
        `
        id,
        group_id,
        target_amount,
        current_amount,
        status,
        designated_payer,
        created_at,
        groups (
          name,
          currency
        )
      `
      )
      .in("group_id", groupIds);

    // Apply filters
    if (groupId) {
      query = query.eq("group_id", groupId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: pools, error: poolsError } = await query;

    if (poolsError) {
      console.error("Error fetching pools:", poolsError);
      return NextResponse.json(
        { error: "Failed to fetch pools" },
        { status: 500 }
      );
    }

    // Transform data and calculate balance from contributions
    const transformedPools = await Promise.all(
      pools.map(async (pool: any) => {
        // Get contributions for this pool
        const { data: contributions } = await supabase
          .from("contributions")
          .select("amount")
          .eq("pool_id", pool.id)
          .eq("status", "succeeded");
        
        const balance = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        
        return {
          id: pool.id,
          groupId: pool.group_id,
          groupName: pool.groups?.name,
          currency: pool.groups?.currency,
          targetAmount: pool.target_amount,
          currentAmount: pool.current_amount || 0,
          balance, // Use calculated balance from contributions
          status: pool.status,
          designatedPayer: pool.designated_payer,
          createdAt: pool.created_at,
        };
      })
    );

    return NextResponse.json({
      pools: transformedPools,
      count: transformedPools.length,
    });
  } catch (error) {
    console.error("Error in GET /api/pools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

