import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * POST /api/pools/:id/close
 * Close a pool (owner/admin only)
 */
export async function POST(
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
      .select("group_id, status")
      .eq("id", poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Check if already closed
    if (pool.status === "closed") {
      return NextResponse.json(
        { error: "Pool is already closed" },
        { status: 400 }
      );
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
        { error: "Only owners and admins can close pools" },
        { status: 403 }
      );
    }

    // Close the pool
    const { data: closedPool, error: updateError } = await supabase
      .from("pools")
      .update({ status: "closed" })
      .eq("id", poolId)
      .select()
      .single();

    if (updateError) {
      console.error("Error closing pool:", updateError);
      return NextResponse.json(
        { error: "Failed to close pool" },
        { status: 500 }
      );
    }

    // Optionally, suspend any active virtual cards for this pool
    const { error: cardError } = await supabase
      .from("virtual_cards")
      .update({ status: "suspended" })
      .eq("pool_id", poolId)
      .eq("status", "active");

    if (cardError) {
      console.error("Error suspending cards:", cardError);
      // Don't fail the request if card suspension fails
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "pool.closed",
      "pool",
      poolId,
      {}
    );

    return NextResponse.json({
      message: "Pool closed successfully",
      pool: {
        id: closedPool.id,
        groupId: closedPool.group_id,
        targetAmount: closedPool.target_amount,
        status: closedPool.status,
        designatedPayer: closedPool.designated_payer,
        createdAt: closedPool.created_at,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/pools/:id/close:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

