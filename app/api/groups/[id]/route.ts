import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateGroupSchema } from "@/lib/validations/groups";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * GET /api/groups/:id
 * Get group details with members and pools
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

    const { id: groupId } = await params;

    // Check if user is a member of this group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role, spend_cap")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select(
        `
        user_id,
        role,
        spend_cap,
        users (
          id,
          name,
          email
        )
      `
      )
      .eq("group_id", groupId);

    if (membersError) {
      console.error("Error fetching group members:", membersError);
    }

    // Get all pools for this group
    const { data: pools, error: poolsError } = await supabase
      .from("pools")
      .select("id, target_amount, status, designated_payer, created_at")
      .eq("group_id", groupId);

    if (poolsError) {
      console.error("Error fetching pools:", poolsError);
    }

    // Transform members data
    const transformedMembers =
      members?.map((member: any) => ({
        userId: member.user_id,
        name: member.users?.name,
        email: member.users?.email,
        role: member.role,
        spendCap: member.spend_cap,
      })) || [];

    // Transform pools data
    const transformedPools =
      pools?.map((pool) => ({
        id: pool.id,
        targetAmount: pool.target_amount,
        status: pool.status,
        designatedPayer: pool.designated_payer,
        createdAt: pool.created_at,
      })) || [];

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        currency: group.currency,
        ownerId: group.owner_id,
        createdAt: group.created_at,
        userRole: membership.role,
        userSpendCap: membership.spend_cap,
      },
      members: transformedMembers,
      pools: transformedPools,
    });
  } catch (error) {
    console.error("Error in GET /api/groups/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/groups/:id
 * Update group details (owner only)
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

    const { id: groupId } = await params;

    // Check if user is owner or admin
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can update group details" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateGroupSchema.parse(body);

    // Update the group
    const { data: group, error: updateError } = await supabase
      .from("groups")
      .update({
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.currency && { currency: validatedData.currency }),
      })
      .eq("id", groupId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating group:", updateError);
      return NextResponse.json(
        { error: "Failed to update group" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "group.updated",
      "group",
      groupId,
      {
        updates: validatedData,
      }
    );

    return NextResponse.json({
      message: "Group updated successfully",
      group: {
        id: group.id,
        name: group.name,
        currency: group.currency,
        ownerId: group.owner_id,
        createdAt: group.created_at,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/groups/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groups/:id
 * Delete a group (owner only)
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

    const { id: groupId } = await params;

    // Check if user is the owner
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("owner_id, name")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can delete the group" },
        { status: 403 }
      );
    }

    // Check if there are any active pools
    const { data: activePools, error: poolsError } = await supabase
      .from("pools")
      .select("id")
      .eq("group_id", groupId)
      .eq("status", "open");

    if (poolsError) {
      console.error("Error checking for active pools:", poolsError);
      return NextResponse.json(
        { error: "Failed to check for active pools" },
        { status: 500 }
      );
    }

    if (activePools && activePools.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete group with active pools" },
        { status: 400 }
      );
    }

    // Delete the group (cascade will handle members)
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      console.error("Error deleting group:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete group" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "group.deleted",
      "group",
      groupId,
      {
        groupName: group.name,
      }
    );

    return NextResponse.json({
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/groups/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

