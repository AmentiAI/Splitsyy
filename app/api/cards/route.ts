import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCardSchema } from "@/lib/validations/cards";
import { logAuditEvent } from "@/lib/supabase/audit";
import { PaymentService } from "@/lib/payments";
import { Database } from "@/types/database";

/**
 * POST /api/cards
 * Create a virtual card for a pool
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
    const validatedData = createCardSchema.parse(body);

    // Get pool and group info
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("id, group_id, status, target_amount")
      .eq("id", validatedData.poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Check if pool is open
    if (pool.status !== "open") {
      return NextResponse.json(
        { error: "Can only create cards for open pools" },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", pool.group_id)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Pool not found or access denied" },
        { status: 404 }
      );
    }

    // Only owners and admins can create cards
    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can create virtual cards" },
        { status: 403 }
      );
    }

    // Check if card already exists for this pool
    const { data: existingCard, error: existingError } = await supabase
      .from("virtual_cards")
      .select("id")
      .eq("pool_id", validatedData.poolId)
      .single();

    if (existingCard) {
      return NextResponse.json(
        { error: "A virtual card already exists for this pool" },
        { status: 400 }
      );
    }

    // Get total contributions to ensure there are funds
    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select("amount")
      .eq("pool_id", validatedData.poolId)
      .eq("status", "succeeded");

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
      return NextResponse.json(
        { error: "Failed to check pool balance" },
        { status: 500 }
      );
    }

    const totalBalance =
      contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;

    if (totalBalance === 0) {
      return NextResponse.json(
        { error: "Cannot create card for pool with no contributions" },
        { status: 400 }
      );
    }

    // Get pool currency
    const { data: poolCurrency, error: poolCurrencyError } = await supabase
      .from("pools")
      .select("groups(currency)")
      .eq("id", validatedData.poolId)
      .single();

    const currency = (poolCurrency as any)?.groups?.currency?.toUpperCase() || "USD";

    // Create virtual card with payment provider
    let providerCard;
    try {
      providerCard = await PaymentService.createVirtualCard({
        poolId: validatedData.poolId,
        userId: session.user.id,
        spendingLimit: totalBalance,
        currency: currency,
      });
    } catch (error) {
      console.error("Error creating virtual card with provider:", error);
      return NextResponse.json(
        { error: "Failed to create virtual card with payment provider" },
        { status: 500 }
      );
    }

    // Create the virtual card record in database
    const { data: card, error: cardError } = await supabase
      .from("virtual_cards")
      .insert({
        pool_id: validatedData.poolId,
        provider_card_id: providerCard.id,
        network: validatedData.network,
        last_four: providerCard.last4 || String(Math.floor(1000 + Math.random() * 9000)),
        status: "active",
        apple_pay_tokenized: false,
      })
      .select()
      .single();

    if (cardError) {
      console.error("Error creating virtual card record:", cardError);
      return NextResponse.json(
        { error: "Failed to create virtual card record" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "card.created",
      "card",
      card.id,
      {
        poolId: validatedData.poolId,
        network: validatedData.network,
        providerCardId: providerCard.id,
      }
    );

    // Get payment provider info
    const providerInfo = PaymentService.getProviderInfo();

    return NextResponse.json(
      {
        message: "Virtual card created successfully",
        card: {
          id: card.id,
          poolId: card.pool_id,
          providerCardId: providerCard.id,
          last4: providerCard.last4,
          network: card.network,
          status: card.status,
          applePayTokenized: card.apple_pay_tokenized,
          balance: totalBalance,
          spendingLimit: providerCard.spendingLimit,
        },
        provider: providerInfo,
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

    console.error("Error in POST /api/cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cards
 * Get all virtual cards for groups the user is a member of
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

    // Get optional query parameter
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get("poolId");

    // Get user's group memberships
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", session.user.id);

    if (memberError) {
      console.error("Error fetching memberships:", memberError);
      return NextResponse.json(
        { error: "Failed to fetch memberships" },
        { status: 500 }
      );
    }

    const groupIds = memberships.map((m) => m.group_id);

    if (groupIds.length === 0) {
      return NextResponse.json({ cards: [], count: 0 });
    }

    // Get pools for these groups
    let poolQuery = supabase
      .from("pools")
      .select("id")
      .in("group_id", groupIds);

    if (poolId) {
      poolQuery = poolQuery.eq("id", poolId);
    }

    const { data: pools, error: poolsError } = await poolQuery;

    if (poolsError) {
      console.error("Error fetching pools:", poolsError);
      return NextResponse.json(
        { error: "Failed to fetch pools" },
        { status: 500 }
      );
    }

    const poolIds = pools.map((p) => p.id);

    if (poolIds.length === 0) {
      return NextResponse.json({ cards: [], count: 0 });
    }

    // Get virtual cards for these pools
    const { data: cards, error: cardsError } = await supabase
      .from("virtual_cards")
      .select(
        `
        id,
        pool_id,
        provider_card_id,
        network,
        status,
        apple_pay_tokenized,
        pools (
          group_id,
          target_amount,
          groups (
            name,
            currency
          )
        )
      `
      )
      .in("pool_id", poolIds);

    if (cardsError) {
      console.error("Error fetching cards:", cardsError);
      return NextResponse.json(
        { error: "Failed to fetch cards" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedCards = cards.map((card: any) => ({
      id: card.id,
      poolId: card.pool_id,
      groupName: card.pools?.groups?.name,
      currency: card.pools?.groups?.currency,
      network: card.network,
      status: card.status,
      applePayTokenized: card.apple_pay_tokenized,
    }));

    return NextResponse.json({
      cards: transformedCards,
      count: transformedCards.length,
    });
  } catch (error) {
    console.error("Error in GET /api/cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

