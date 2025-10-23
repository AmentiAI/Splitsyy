import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApplePayService } from "@/lib/applepay";

/**
 * POST /api/applepay/validate-merchant
 * 
 * Validates the merchant for an Apple Pay session.
 * Called by Apple Pay JS API during payment sheet initialization.
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

    // Parse request body
    const body = await request.json();
    const { validationURL } = body;

    if (!validationURL) {
      return NextResponse.json(
        { error: "Validation URL is required" },
        { status: 400 }
      );
    }

    // Validate merchant with Apple
    const merchantSession = await ApplePayService.validateMerchant(validationURL);

    // Get provider info for debugging
    const providerInfo = ApplePayService.getProviderInfo();

    return NextResponse.json({
      merchantSession,
      provider: providerInfo,
    });
  } catch (error) {
    console.error("Error validating Apple Pay merchant:", error);
    return NextResponse.json(
      { 
        error: "Failed to validate merchant",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET method not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}











