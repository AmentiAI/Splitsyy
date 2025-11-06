import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addMemberSchema } from "@/lib/validations/groups";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * POST /api/groups/:id/members
 * Add a member to a group (owner/admin only)
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
        { error: "Only owners and admins can add members" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = addMemberSchema.parse(body);

    // Check if user exists
    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", validatedData.userId)
      .single();

    if (userError || !userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", validatedData.userId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 400 }
      );
    }

    // Add the member
    const { data: newMember, error: insertError } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: validatedData.userId,
        role: validatedData.role,
        spend_cap: validatedData.spendCap,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding member:", insertError);
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "group.member_added",
      "group",
      groupId,
      {
        addedUserId: validatedData.userId,
        addedUserName: userExists.name,
        role: validatedData.role,
      }
    );

    return NextResponse.json(
      {
        message: "Member added successfully",
        member: {
          userId: newMember.user_id,
          name: userExists.name,
          email: userExists.email,
          role: newMember.role,
          spendCap: newMember.spend_cap,
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

    console.error("Error in POST /api/groups/:id/members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/groups/:id/members
 * Get all members of a group
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

    // Check if user is a member
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
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedMembers = members.map((member: any) => ({
      userId: member.user_id,
      name: member.users?.name,
      email: member.users?.email,
      role: member.role,
      spendCap: member.spend_cap,
    }));

    return NextResponse.json({
      members: transformedMembers,
      count: transformedMembers.length,
    });
  } catch (error) {
    console.error("Error in GET /api/groups/:id/members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

