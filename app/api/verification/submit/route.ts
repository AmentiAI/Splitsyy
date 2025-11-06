import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";
import { z } from "zod";

const verificationSchema = z.object({
  ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, "Invalid SSN format"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().min(5),
  country: z.string().default("US"),
  idType: z.enum(["drivers_license", "passport", "state_id", "national_id"]),
  idNumber: z.string().min(1),
  idIssuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  idExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  idIssuingAuthority: z.string().optional(),
  provider: z.enum(["stripe_identity", "socure", "persona", "jumio", "onfido", "custom"]).default("custom"),
});

/**
 * POST /api/verification/submit
 * Submit user verification data for third-party processing
 * Note: In production, this should call the actual third-party API
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = verificationSchema.parse(body);

    // Check if user already has verification data
    const { data: existing } = await supabase
      .from("user_verification")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Verification already submitted" },
        { status: 400 }
      );
    }

    // In production, here you would:
    // 1. Call third-party verification API (Stripe Identity, Socure, Persona, etc.)
    // 2. Get verification ID from provider
    // 3. Store encrypted SSN
    
    // For now, we'll encrypt and store (mock the third-party call)
    const encryptionKey = process.env.SSN_ENCRYPTION_KEY || "dev-key-change-in-production";
    
    // Encrypt SSN using Supabase RPC (will be handled at DB level)
    // For now, we'll store encrypted value (in production, use proper encryption)
    const ssnEncrypted = await supabase.rpc("encrypt_ssn", { ssn: validatedData.ssn });
    
    // Mock third-party verification (replace with actual API call)
    const mockProviderResponse = {
      verification_id: `verify_${Date.now()}`,
      status: "pending",
      submitted_at: new Date().toISOString(),
    };

    // Insert verification data
    const { data: verification, error } = await supabase
      .from("user_verification")
      .insert({
        user_id: session.user.id,
        provider: validatedData.provider,
        provider_verification_id: mockProviderResponse.verification_id,
        provider_status: "pending",
        ssn_encrypted: ssnEncrypted,
        date_of_birth: validatedData.dateOfBirth,
        address_line1: validatedData.addressLine1,
        address_line2: validatedData.addressLine2,
        city: validatedData.city,
        state: validatedData.state,
        zip_code: validatedData.zipCode,
        country: validatedData.country,
        id_type: validatedData.idType,
        id_number_encrypted: idNumberEncrypted,
        id_issued_date: validatedData.idIssuedDate,
        id_expiry_date: validatedData.idExpiryDate,
        id_issuing_authority: validatedData.idIssuingAuthority,
        verification_submitted_at: new Date().toISOString(),
        provider_response: mockProviderResponse,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating verification:", error);
      return NextResponse.json(
        { error: "Failed to submit verification" },
        { status: 500 }
      );
    }

    // Update user KYC status to pending
    await supabase
      .from("users")
      .update({ kyc_status: "pending" })
      .eq("id", session.user.id);

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "verification.submitted",
      "verification",
      verification.id,
      {
        provider: validatedData.provider,
        provider_verification_id: mockProviderResponse.verification_id,
      }
    );

    return NextResponse.json(
      {
        message: "Verification submitted successfully",
        verification: {
          id: verification.id,
          providerStatus: verification.provider_status,
          providerVerificationId: verification.provider_verification_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/verification/submit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verification/submit
 * Get current user's verification status
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: verification, error } = await supabase
      .from("user_verification")
      .select("id, provider, provider_status, provider_verification_id, verification_submitted_at, verification_completed_at, provider_error")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching verification:", error);
      return NextResponse.json(
        { error: "Failed to fetch verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verification: verification || null,
    });
  } catch (error) {
    console.error("Error in GET /api/verification/submit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

