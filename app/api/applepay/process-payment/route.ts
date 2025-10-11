import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApplePayService } from "@/lib/applepay";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * POST /api/applepay/process-payment
 * 
 * Processes an Apple Pay payment token.
 * Called after user authorizes payment in Apple Pay sheet.
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
    const { paymentToken, contributionId, poolId } = body;

    if (!paymentToken) {
      return NextResponse.json(
        { error: "Payment token is required" },
        { status: 400 }
      );
    }

    if (!contributionId) {
      return NextResponse.json(
        { error: "Contribution ID is required" },
        { status: 400 }
      );
    }

    // Verify contribution exists and belongs to user
    const { data: contribution, error: contributionError } = await supabase
      .from("contributions")
      .select("id, user_id, pool_id, status")
      .eq("id", contributionId)
      .single();

    if (contributionError || !contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      );
    }

    if (contribution.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to contribution" },
        { status: 403 }
      );
    }

    // Process the Apple Pay payment token
    const paymentResult = await ApplePayService.processPaymentToken(paymentToken);

    // Update contribution status based on payment result
    const newStatus = paymentResult.success ? "succeeded" : "failed";
    
    const { error: updateError } = await supabase
      .from("contributions")
      .update({ 
        status: newStatus,
      })
      .eq("id", contributionId);

    if (updateError) {
      console.error("Error updating contribution:", updateError);
      return NextResponse.json(
        { error: "Failed to update contribution" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      paymentResult.success ? "contribution.applepay_success" : "contribution.applepay_failed",
      "contribution",
      contributionId,
      {
        transactionId: paymentResult.transactionId,
        poolId: contribution.pool_id,
      }
    );

    // Get provider info
    const providerInfo = ApplePayService.getProviderInfo();

    return NextResponse.json({
      success: paymentResult.success,
      transactionId: paymentResult.transactionId,
      contribution: {
        id: contribution.id,
        status: newStatus,
      },
      provider: providerInfo,
    });
  } catch (error) {
    console.error("Error processing Apple Pay payment:", error);
    return NextResponse.json(
      { 
        error: "Failed to process payment",
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


