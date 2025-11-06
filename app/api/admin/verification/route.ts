import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminResponse } from "@/lib/auth/admin";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * GET /api/admin/verification
 * Get all user verification data (admin only)
 * Includes decrypted SSN for admins
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("user_verification")
      .select(
        `
        id,
        user_id,
        provider,
        provider_verification_id,
        provider_status,
        ssn_encrypted,
        date_of_birth,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        country,
        id_type,
        id_number_encrypted,
        id_issued_date,
        id_expiry_date,
        id_issuing_authority,
        verification_submitted_at,
        verification_completed_at,
        verification_expires_at,
        provider_response,
        provider_error,
        admin_notes,
        created_at,
        updated_at,
        users (
          id,
          email,
          name,
          kyc_status
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (status) {
      query = query.eq("provider_status", status);
    }

    const { data: verifications, error } = await query;

    if (error) {
      console.error("Error fetching verifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch verifications" },
        { status: 500 }
      );
    }

    // Decrypt SSN for admin viewing
    const crypto = require("crypto");
    const encryptionKey = process.env.SSN_ENCRYPTION_KEY || "dev-key-change-in-production-NEVER-USE-IN-PROD";
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(encryptionKey, "salt", 32);
    
    function decrypt(encryptedText: string): string {
      try {
        const parts = encryptedText.split(":");
        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
      } catch (error) {
        console.error("Decryption error:", error);
        return ""; // Return empty if decryption fails
      }
    }
    
    function maskSsn(ssn: string): string {
      if (!ssn || ssn.length < 4) return "***-**-****";
      const cleaned = ssn.replace(/-/g, "");
      if (cleaned.length < 9) return "***-**-****";
      return `***-**-${cleaned.slice(-4)}`;
    }
    
    function maskId(idNumber: string): string {
      if (!idNumber || idNumber.length < 4) return "****";
      return `****${idNumber.slice(-4)}`;
    }

    const decryptedVerifications = verifications?.map((v: any) => {
      const ssnDecrypted = v.ssn_encrypted ? decrypt(v.ssn_encrypted) : "";
      const idDecrypted = v.id_number_encrypted ? decrypt(v.id_number_encrypted) : "";

      return {
        ...v,
        ssn_masked: maskSsn(ssnDecrypted),
        ssn_full: ssnDecrypted,
        id_number_masked: maskId(idDecrypted),
        id_number_full: idDecrypted,
      };
    });

    // Get total count
    let countQuery = supabase
      .from("user_verification")
      .select("*", { count: "exact", head: true });

    if (userId) countQuery = countQuery.eq("user_id", userId);
    if (status) countQuery = countQuery.eq("provider_status", status);

    const { count } = await countQuery;

    return NextResponse.json({
      verifications: decryptedVerifications || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/verification
 * Update verification data (update status, add notes, etc.)
 */
export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { verificationId, ...updates } = body;

    if (!verificationId) {
      return NextResponse.json(
        { error: "verificationId is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if ("admin_notes" in updates) updateData.admin_notes = updates.admin_notes;
    if ("provider_status" in updates) updateData.provider_status = updates.provider_status;
    if ("verification_completed_at" in updates) {
      updateData.verification_completed_at = updates.verification_completed_at;
    }

    // If status changed to approved, update user KYC status
    if (updates.provider_status === "approved") {
      const { data: verification } = await supabase
        .from("user_verification")
        .select("user_id")
        .eq("id", verificationId)
        .single();

      if (verification) {
        await supabase
          .from("users")
          .update({ kyc_status: "approved" })
          .eq("id", verification.user_id);
      }
    }

    const { data: updated, error } = await supabase
      .from("user_verification")
      .update(updateData)
      .eq("id", verificationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating verification:", error);
      return NextResponse.json(
        { error: "Failed to update verification" },
        { status: 500 }
      );
    }

    await logAuditEvent(
      currentUser.id,
      "verification.updated",
      "verification",
      verificationId,
      { updates }
    );

    return NextResponse.json({
      success: true,
      verification: updated,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

