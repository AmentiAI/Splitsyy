import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateCardSchema } from "@/lib/validations/cards";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * GET /api/cards/:id
 * Get virtual card details
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

    // Get card details
    const { data: card, error: cardError } = await supabase
      .from("virtual_cards")
      .select(
        `
        *,
        pools (
          id,
          group_id,
          target_amount,
          status,
          groups (
            name,
            currency,
            owner_id
          )
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
      .select("role, spend_cap")
      .eq("group_id", (card as any).pools.group_id)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Card not found or access denied" },
        { status: 404 }
      );
    }

    // Get pool balance
    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select("amount")
      .eq("pool_id", card.pool_id)
      .eq("status", "succeeded");

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
    }

    const totalContributed =
      contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;

    // Get transactions for this card
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, amount, currency, type, status, merchant_name, created_at")
      .eq("pool_id", card.pool_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
    }

    // Calculate available balance (contributions minus transactions)
    const totalSpent =
      transactions
        ?.filter((t) => t.type === "purchase" && t.status === "approved")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const availableBalance = totalContributed - totalSpent;

    return NextResponse.json({
      card: {
        id: card.id,
        poolId: card.pool_id,
        groupName: (card as any).pools.groups.name,
        currency: (card as any).pools.groups.currency,
        network: card.network,
        status: card.status,
        applePayTokenized: card.apple_pay_tokenized,
        last4: (card as any).last_four || "••••",
        balance: availableBalance,
        totalContributed,
        totalSpent,
      },
      transactions: transactions?.map((t) => ({
        id: t.id,
        amount: t.amount,
        currency: t.currency,
        type: t.type,
        status: t.status,
        merchantName: t.merchant_name,
        createdAt: t.created_at,
      })),
      userRole: membership.role,
    });
  } catch (error) {
    console.error("Error in GET /api/cards/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cards/:id
 * Update card status (suspend/activate/close)
 */
export async function PUT(
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
        pool_id,
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

    // Check if user is owner or admin
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

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can update card status" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateCardSchema.parse(body);

    // Prevent reopening a closed card
    if (card.status === "closed" && validatedData.status !== "closed") {
      return NextResponse.json(
        { error: "Cannot reactivate a closed card" },
        { status: 400 }
      );
    }

    // Update the card status
    // TODO: Also update status with payment provider (Stripe/Lithic)
    const { data: updatedCard, error: updateError } = await supabase
      .from("virtual_cards")
      .update({ status: validatedData.status })
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
      "card.status_updated",
      "card",
      cardId,
      {
        previousStatus: card.status,
        newStatus: validatedData.status,
      }
    );

    return NextResponse.json({
      message: "Card status updated successfully",
      card: {
        id: updatedCard.id,
        poolId: updatedCard.pool_id,
        network: updatedCard.network,
        status: updatedCard.status,
        applePayTokenized: updatedCard.apple_pay_tokenized,
      },
      note: "Payment provider integration required for actual card status update",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/cards/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cards/:id
 * Delete a virtual card (owner only, if no transactions)
 */
export async function DELETE(
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
        pool_id,
        pools (
          group_id,
          groups (
            owner_id
          )
        )
      `
      )
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if user is the owner
    if ((card as any).pools.groups.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group owner can delete cards" },
        { status: 403 }
      );
    }

    // Check if there are any transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id")
      .eq("pool_id", card.pool_id)
      .limit(1);

    if (transactionsError) {
      console.error("Error checking transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to check transactions" },
        { status: 500 }
      );
    }

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete card with existing transactions" },
        { status: 400 }
      );
    }

    // Delete the card
    // TODO: Also delete from payment provider
    const { error: deleteError } = await supabase
      .from("virtual_cards")
      .delete()
      .eq("id", cardId);

    if (deleteError) {
      console.error("Error deleting card:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete card" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "card.deleted",
      "card",
      cardId,
      {}
    );

    return NextResponse.json({
      message: "Card deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/cards/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

