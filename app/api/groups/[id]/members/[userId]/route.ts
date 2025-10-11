import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateMemberSchema } from "@/lib/validations/groups";
import { logAuditEvent } from "@/lib/supabase/audit";
import { Database } from "@/types/database";

/**
 * PUT /api/groups/:id/members/:userId
 * Update member role or spend cap (owner/admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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

    const { id: groupId, userId: targetUserId } = await params;

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
        { error: "Only owners and admins can update members" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateMemberSchema.parse(body);

    // Get group owner ID
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("owner_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Prevent changing the owner's role
    if (targetUserId === group.owner_id && validatedData.role) {
      return NextResponse.json(
        { error: "Cannot change the owner's role" },
        { status: 400 }
      );
    }

    // Update the member
    const updateData: any = {};
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.spendCap !== undefined)
      updateData.spend_cap = validatedData.spendCap;

    const { data: updatedMember, error: updateError } = await supabase
      .from("group_members")
      .update(updateData)
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating member:", updateError);
      return NextResponse.json(
        { error: "Failed to update member" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "group.member_updated",
      "group",
      groupId,
      {
        updatedUserId: targetUserId,
        updates: validatedData,
      }
    );

    return NextResponse.json({
      message: "Member updated successfully",
      member: {
        userId: updatedMember.user_id,
        role: updatedMember.role,
        spendCap: updatedMember.spend_cap,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/groups/:id/members/:userId:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove a member from a group (owner/admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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

    const { id: groupId, userId: targetUserId } = await params;

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
        { error: "Only owners and admins can remove members" },
        { status: 403 }
      );
    }

    // Get group owner ID
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("owner_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Prevent removing the owner
    if (targetUserId === group.owner_id) {
      return NextResponse.json(
        { error: "Cannot remove the group owner" },
        { status: 400 }
      );
    }

    // Get user info before deletion
    const { data: targetMember, error: targetError } = await supabase
      .from("group_members")
      .select(
        `
        user_id,
        users (
          name,
          email
        )
      `
      )
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: "Member not found in this group" },
        { status: 404 }
      );
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "group.member_removed",
      "group",
      groupId,
      {
        removedUserId: targetUserId,
        removedUserName: (targetMember as any).users?.name,
      }
    );

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/groups/:id/members/:userId:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

