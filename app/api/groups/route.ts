import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGroupSchema } from "@/lib/validations/groups";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * POST /api/groups
 * Create a new group
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
    const validatedData = createGroupSchema.parse(body);

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: validatedData.name,
        currency: validatedData.currency,
        owner_id: session.user.id,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 }
      );
    }

    // Add the creator as owner in group_members
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: session.user.id,
      role: "owner",
    });

    if (memberError) {
      console.error("Error adding owner to group:", memberError);
      // Clean up the group
      await supabase.from("groups").delete().eq("id", group.id);
      return NextResponse.json(
        { error: "Failed to add owner to group" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "group.created",
      "group",
      group.id,
      {
        groupName: group.name,
        currency: group.currency,
      }
    );

    return NextResponse.json(
      {
        message: "Group created successfully",
        group: {
          id: group.id,
          name: group.name,
          currency: group.currency,
          ownerId: group.owner_id,
          createdAt: group.created_at,
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

    console.error("Error in POST /api/groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/groups
 * Get all groups for the authenticated user
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

    // Get all groups where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select(
        `
        role,
        spend_cap,
        groups (
          id,
          name,
          currency,
          owner_id,
          created_at
        )
      `
      )
      .eq("user_id", session.user.id);

    if (memberError) {
      console.error("Error fetching groups:", memberError);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 }
      );
    }

    // Transform the data
    const groups = memberships.map((membership: any) => ({
      id: membership.groups.id,
      name: membership.groups.name,
      currency: membership.groups.currency,
      ownerId: membership.groups.owner_id,
      createdAt: membership.groups.created_at,
      userRole: membership.role,
      userSpendCap: membership.spend_cap,
    }));

    return NextResponse.json({
      groups,
      count: groups.length,
    });
  } catch (error) {
    console.error("Error in GET /api/groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

