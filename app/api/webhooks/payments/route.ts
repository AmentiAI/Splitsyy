import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PaymentService, PAYMENT_CONFIG } from "@/lib/payments";

/**
 * POST /api/webhooks/payments
 * Handle payment provider webhooks (Stripe/Lithic)
 * 
 * This endpoint receives real-time events from payment providers:
 * - Contribution payment succeeded/failed
 * - Card transaction authorized/declined
 * - Card status changes
 * - Refunds processed
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    // Verify webhook signature
    const webhookSecret = PAYMENT_CONFIG.stripe.webhookSecret;
    if (webhookSecret && signature) {
      const isValid = await PaymentService.verifyWebhookSignature(
        body,
        signature,
        webhookSecret
      );

      if (!isValid) {
        console.error("❌ Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
      console.log("✅ Webhook signature verified");
    } else {
      console.warn("⚠️ Webhook signature verification skipped (no secret configured)");
    }

    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
    } catch (e) {
      console.error("Failed to parse webhook body:", e);
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role for webhook processing
    // Note: In production webhooks you'd use createClient with service role key
    const supabase = await createClient();

    console.log("Received webhook event:", event.type);

    // Handle different event types
    switch (event.type) {
      // Contribution/Payment events
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(supabase, event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(supabase, event.data.object);
        break;

      // Card issuing events (Stripe Issuing)
      case "issuing_authorization.request":
        await handleAuthorizationRequest(supabase, event.data.object);
        break;

      case "issuing_authorization.created":
        await handleAuthorizationCreated(supabase, event.data.object);
        break;

      case "issuing_transaction.created":
        await handleTransactionCreated(supabase, event.data.object);
        break;

      case "issuing_card.updated":
        await handleCardUpdated(supabase, event.data.object);
        break;

      // Refund events
      case "charge.refunded":
        await handleRefund(supabase, event.data.object);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 to prevent retries for processing errors
    // Log the error for investigation
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment intent (contribution)
 */
async function handlePaymentSucceeded(supabase: any, paymentIntent: any) {
  try {
    // Extract contribution ID from metadata
    const contributionId = paymentIntent.metadata?.contributionId;

    if (!contributionId) {
      console.error("No contributionId in payment intent metadata");
      return;
    }

    // Update contribution status to succeeded
    const { error } = await supabase
      .from("contributions")
      .update({
        status: "succeeded",
      })
      .eq("id", contributionId);

    if (error) {
      console.error("Error updating contribution:", error);
    } else {
      console.log(`Contribution ${contributionId} marked as succeeded`);
    }
  } catch (error) {
    console.error("Error in handlePaymentSucceeded:", error);
  }
}

/**
 * Handle failed payment intent (contribution)
 */
async function handlePaymentFailed(supabase: any, paymentIntent: any) {
  try {
    const contributionId = paymentIntent.metadata?.contributionId;

    if (!contributionId) {
      console.error("No contributionId in payment intent metadata");
      return;
    }

    // Update contribution status to failed
    const { error } = await supabase
      .from("contributions")
      .update({
        status: "failed",
      })
      .eq("id", contributionId);

    if (error) {
      console.error("Error updating contribution:", error);
    } else {
      console.log(`Contribution ${contributionId} marked as failed`);
    }
  } catch (error) {
    console.error("Error in handlePaymentFailed:", error);
  }
}

/**
 * Handle authorization request for card transaction
 * This is where you can approve/decline transactions in real-time
 */
async function handleAuthorizationRequest(supabase: any, authorization: any) {
  try {
    // Get card from provider_card_id
    const { data: card, error: cardError } = await supabase
      .from("virtual_cards")
      .select("id, pool_id, status")
      .eq("provider_card_id", authorization.card)
      .single();

    if (cardError || !card) {
      console.error("Card not found:", authorization.card);
      return;
    }

    // Check if card is active
    if (card.status !== "active") {
      console.log("Transaction declined: card not active");
      // In real implementation, you would call payment provider API to decline
      return;
    }

    // Get pool balance
    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select("amount")
      .eq("pool_id", card.pool_id)
      .eq("status", "succeeded");

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
      return;
    }

    const totalContributed =
      contributions?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;

    // Get existing transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("pool_id", card.pool_id)
      .eq("type", "purchase")
      .eq("status", "approved");

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return;
    }

    const totalSpent =
      transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

    const availableBalance = totalContributed - totalSpent;

    // Check if sufficient balance
    if (authorization.amount > availableBalance) {
      console.log("Transaction declined: insufficient balance");
      // In real implementation, call payment provider API to decline
      return;
    }

    console.log("Transaction approved");
    // In real implementation, call payment provider API to approve
  } catch (error) {
    console.error("Error in handleAuthorizationRequest:", error);
  }
}

/**
 * Handle authorization created (after approval)
 */
async function handleAuthorizationCreated(supabase: any, authorization: any) {
  try {
    console.log("Authorization created:", authorization.id);
    // Additional logging or processing can be done here
  } catch (error) {
    console.error("Error in handleAuthorizationCreated:", error);
  }
}

/**
 * Handle transaction created (settled transaction)
 */
async function handleTransactionCreated(supabase: any, transaction: any) {
  try {
    // Get card from provider_card_id
    const { data: card, error: cardError } = await supabase
      .from("virtual_cards")
      .select("id, pool_id")
      .eq("provider_card_id", transaction.card)
      .single();

    if (cardError || !card) {
      console.error("Card not found:", transaction.card);
      return;
    }

    // Get pool currency
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("groups(currency)")
      .eq("id", card.pool_id)
      .single();

    if (poolError) {
      console.error("Error fetching pool:", poolError);
      return;
    }

    // Create transaction record
    const { error: insertError } = await supabase.from("transactions").insert({
      pool_id: card.pool_id,
      amount: Math.abs(transaction.amount), // Store as positive number
      currency: transaction.currency || (pool as any).groups.currency,
      type: transaction.amount < 0 ? "purchase" : "refund",
      status: transaction.status === "complete" ? "approved" : "pending",
      merchant_name: transaction.merchant?.name || "Unknown",
    });

    if (insertError) {
      console.error("Error creating transaction:", insertError);
    } else {
      console.log("Transaction created for pool:", card.pool_id);
    }
  } catch (error) {
    console.error("Error in handleTransactionCreated:", error);
  }
}

/**
 * Handle card status update
 */
async function handleCardUpdated(supabase: any, card: any) {
  try {
    // Update card status in database
    const { error } = await supabase
      .from("virtual_cards")
      .update({
        status: card.status,
      })
      .eq("provider_card_id", card.id);

    if (error) {
      console.error("Error updating card status:", error);
    } else {
      console.log(`Card ${card.id} status updated to ${card.status}`);
    }
  } catch (error) {
    console.error("Error in handleCardUpdated:", error);
  }
}

/**
 * Handle refund
 */
async function handleRefund(supabase: any, charge: any) {
  try {
    const contributionId = charge.metadata?.contributionId;

    if (!contributionId) {
      console.log("Refund not associated with a contribution");
      return;
    }

    // You might want to update contribution status or create a refund record
    console.log(`Refund processed for contribution ${contributionId}`);
  } catch (error) {
    console.error("Error in handleRefund:", error);
  }
}

/**
 * GET method not allowed for webhooks
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

