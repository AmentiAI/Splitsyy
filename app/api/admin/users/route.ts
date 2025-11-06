import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminResponse, logAdminAction } from "@/lib/auth/admin";

/**
 * GET /api/admin/users
 * Get all users with pagination and filters
 * Query params: page, limit, search, role
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const search = searchParams.get("search") || "";
    const isAdmin = searchParams.get("is_admin");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("users")
      .select("id, email, name, kyc_status, is_platform_admin, created_at")
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (isAdmin === "true") {
      query = query.eq("is_platform_admin", true);
    } else if (isAdmin === "false") {
      query = query.eq("is_platform_admin", false);
    }

    const { data: users, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (isAdmin === "true") {
      countQuery = countQuery.eq("is_platform_admin", true);
    } else if (isAdmin === "false") {
      countQuery = countQuery.eq("is_platform_admin", false);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/:userId
 * Update user (promote to admin, update profile, etc.)
 */
export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (userId === currentUser.id && updates.is_platform_admin === false) {
      return NextResponse.json(
        { error: "Cannot remove your own admin access" },
        { status: 400 }
      );
    }

    // Update user profile
    const updateData: Record<string, unknown> = {};
    if ("is_platform_admin" in updates) {
      updateData.is_platform_admin = updates.is_platform_admin;
    }
    if ("name" in updates) {
      updateData.name = updates.name;
    }
    if ("kyc_status" in updates) {
      updateData.kyc_status = updates.kyc_status;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Log the action
    const actionType = updates.is_platform_admin === true
      ? "user_promote"
      : updates.is_platform_admin === false
      ? "user_demote"
      : "user_update";

    await logAdminAction(
      currentUser.id,
      actionType,
      { updates, userId },
      "user",
      userId,
      request
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:userId
 * Delete a user (soft delete via auth admin API)
 */
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user from auth (this will cascade to users table)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction(
      currentUser.id,
      "user_delete",
      { userId },
      "user",
      userId,
      request
    );

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

