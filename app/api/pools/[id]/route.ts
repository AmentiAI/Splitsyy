import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updatePoolSchema } from "@/lib/validations/pools";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * GET /api/pools/:id
 * Get pool details with contributions and balance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: poolId } = await params;

    // Get pool details
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(
        `
        *,
        groups (
          id,
          name,
          currency,
          owner_id
        )
      `
      )
      .eq("id", poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role, spend_cap")
      .eq("group_id", (pool as any).group_id)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Pool not found or access denied" },
        { status: 404 }
      );
    }

    // Get contributions for this pool
    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select(
        `
        id,
        user_id,
        amount,
        method,
        status,
        created_at,
        users (
          name,
          email
        )
      `
      )
      .eq("pool_id", poolId)
      .order("created_at", { ascending: false });

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
    }

    // Get virtual card if exists
    const { data: card, error: cardError } = await supabase
      .from("virtual_cards")
      .select("id, network, status, apple_pay_tokenized")
      .eq("pool_id", poolId)
      .single();

    // Calculate total contributed (from successful contributions)
    const totalContributed =
      contributions
        ?.filter((c) => c.status === "succeeded")
        .reduce((sum, c) => sum + c.amount, 0) || 0;

    // Transform contributions data
    const transformedContributions =
      contributions?.map((contribution: any) => ({
        id: contribution.id,
        userId: contribution.user_id,
        userName: contribution.users?.name,
        amount: contribution.amount,
        method: contribution.method,
        status: contribution.status,
        createdAt: contribution.created_at,
      })) || [];

    return NextResponse.json({
      pool: {
        id: pool.id,
        groupId: (pool as any).group_id,
        groupName: (pool as any).groups?.name,
        currency: (pool as any).groups?.currency,
        targetAmount: pool.target_amount,
        totalContributed,
        remaining: pool.target_amount - totalContributed,
        status: pool.status,
        designatedPayer: pool.designated_payer,
        createdAt: pool.created_at,
      },
      contributions: transformedContributions,
      card: card
        ? {
            id: card.id,
            network: card.network,
            status: card.status,
            applePayTokenized: card.apple_pay_tokenized,
          }
        : null,
      userRole: membership.role,
    });
  } catch (error) {
    console.error("Error in GET /api/pools/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pools/:id
 * Update pool details (owner/admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: poolId } = await params;

    // Get pool and group info
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("group_id")
      .eq("id", poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Check if user is owner or admin
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", pool.group_id)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Pool not found or access denied" },
        { status: 404 }
      );
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can update pools" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePoolSchema.parse(body);

    // Build update object
    const updateData: any = {};
    if (validatedData.targetAmount !== undefined)
      updateData.target_amount = validatedData.targetAmount;
    if (validatedData.designatedPayer !== undefined)
      updateData.designated_payer = validatedData.designatedPayer;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;

    // Update the pool
    const { data: updatedPool, error: updateError } = await supabase
      .from("pools")
      .update(updateData)
      .eq("id", poolId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating pool:", updateError);
      return NextResponse.json(
        { error: "Failed to update pool" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "pool.updated",
      "pool",
      poolId,
      {
        updates: validatedData,
      }
    );

    return NextResponse.json({
      message: "Pool updated successfully",
      pool: {
        id: updatedPool.id,
        groupId: updatedPool.group_id,
        targetAmount: updatedPool.target_amount,
        status: updatedPool.status,
        designatedPayer: updatedPool.designated_payer,
        createdAt: updatedPool.created_at,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/pools/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pools/:id
 * Delete a pool (owner only, if no contributions)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: poolId } = await params;

    // Get pool and group info
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("group_id, groups(owner_id)")
      .eq("id", poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Check if user is the owner
    if ((pool as any).groups?.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group owner can delete pools" },
        { status: 403 }
      );
    }

    // Check if there are any contributions
    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select("id")
      .eq("pool_id", poolId)
      .eq("status", "succeeded");

    if (contributionsError) {
      console.error("Error checking contributions:", contributionsError);
      return NextResponse.json(
        { error: "Failed to check contributions" },
        { status: 500 }
      );
    }

    if (contributions && contributions.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete pool with existing contributions" },
        { status: 400 }
      );
    }

    // Delete the pool
    const { error: deleteError } = await supabase
      .from("pools")
      .delete()
      .eq("id", poolId);

    if (deleteError) {
      console.error("Error deleting pool:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete pool" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "pool.deleted",
      "pool",
      poolId,
      {}
    );

    return NextResponse.json({
      message: "Pool deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/pools/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

