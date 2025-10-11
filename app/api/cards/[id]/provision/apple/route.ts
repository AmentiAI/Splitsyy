import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionApplePaySchema } from "@/lib/validations/cards";
import { logAuditEvent } from "@/lib/supabase/audit";
import { PaymentService } from "@/lib/payments";
import { Database } from "@/types/database";

/**
 * POST /api/cards/:id/provision/apple
 * Provision a virtual card to Apple Pay
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

    const { id: cardId } = await params;

    // Get card and pool info
    const { data: card, error: cardError } = await supabase
      .from("virtual_cards")
      .select(
        `
        id,
        pool_id,
        provider_card_id,
        status,
        apple_pay_tokenized,
        pools (
          group_id
        )
      `
      )
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", (card as any).pools.group_id)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Card not found or access denied" },
        { status: 404 }
      );
    }

    // Check if card is active
    if (card.status !== "active") {
      return NextResponse.json(
        { error: "Can only provision active cards to Apple Pay" },
        { status: 400 }
      );
    }

    // Check if already provisioned
    if (card.apple_pay_tokenized) {
      return NextResponse.json(
        { error: "Card is already provisioned to Apple Pay" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = provisionApplePaySchema.parse(body);

    // Provision to Apple Pay using payment service
    let provisioningData;
    try {
      provisioningData = await PaymentService.provisionToApplePay({
        cardId: card.provider_card_id,
        certificates: validatedData.certificates,
        nonce: validatedData.nonce,
        nonceSignature: validatedData.nonceSignature,
      });
    } catch (error) {
      console.error("Error provisioning to Apple Pay:", error);
      return NextResponse.json(
        { error: "Failed to provision card to Apple Pay" },
        { status: 500 }
      );
    }

    // Mark card as tokenized
    const { data: updatedCard, error: updateError } = await supabase
      .from("virtual_cards")
      .update({ apple_pay_tokenized: true })
      .eq("id", cardId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating card:", updateError);
      return NextResponse.json(
        { error: "Failed to update card" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "card.apple_pay_provisioned",
      "card",
      cardId,
      {
        userId: session.user.id,
      }
    );

    // Get payment provider info
    const providerInfo = PaymentService.getProviderInfo();

    return NextResponse.json({
      message: "Card provisioned to Apple Pay successfully",
      card: {
        id: updatedCard.id,
        poolId: updatedCard.pool_id,
        network: updatedCard.network,
        status: updatedCard.status,
        applePayTokenized: updatedCard.apple_pay_tokenized,
      },
      activationData: {
        encryptedPassData: provisioningData.encryptedPassData,
        ephemeralPublicKey: provisioningData.ephemeralPublicKey,
        activationData: provisioningData.activationData,
      },
      provider: providerInfo,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/cards/:id/provision/apple:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cards/:id/provision/apple
 * Check Apple Pay provisioning status
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

    const { id: cardId } = await params;

    // Get card info
    const { data: card, error: cardError } = await supabase
      .from("virtual_cards")
      .select(
        `
        id,
        apple_pay_tokenized,
        status,
        pools (
          group_id
        )
      `
      )
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", (card as any).pools.group_id)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Card not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cardId: card.id,
      applePayProvisioned: card.apple_pay_tokenized,
      cardStatus: card.status,
      canProvision: card.status === "active" && !card.apple_pay_tokenized,
    });
  } catch (error) {
    console.error("Error in GET /api/cards/:id/provision/apple:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

