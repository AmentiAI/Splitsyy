import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createContributionSchema } from "@/lib/validations/pools";
import { logAuditEvent } from "@/lib/supabase/audit";
import { PaymentService } from "@/lib/payments";
import { Database } from "@/types/database";

/**
 * POST /api/pools/:id/contributions
 * Add a contribution to a pool
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

    const { id: poolId } = await params;

    // Get pool and group info
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("group_id, status, target_amount")
      .eq("id", poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Check if pool is open
    if (pool.status !== "open") {
      return NextResponse.json(
        { error: "Pool is not open for contributions" },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role, spend_cap")
      .eq("group_id", pool.group_id)
      .eq("user_id", session.user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Pool not found or access denied" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createContributionSchema.parse(body);

    // Check if contribution would exceed target amount
    const { data: existingContributions, error: contributionsError } =
      await supabase
        .from("contributions")
        .select("amount")
        .eq("pool_id", poolId)
        .eq("status", "succeeded");

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
      return NextResponse.json(
        { error: "Failed to check existing contributions" },
        { status: 500 }
      );
    }

    const totalContributed =
      existingContributions?.reduce((sum, c) => sum + c.amount, 0) || 0;

    if (totalContributed + validatedData.amount > pool.target_amount) {
      return NextResponse.json(
        {
          error: "Contribution would exceed target amount",
          details: {
            targetAmount: pool.target_amount,
            currentAmount: totalContributed,
            available: pool.target_amount - totalContributed,
          },
        },
        { status: 400 }
      );
    }

    // Check spend cap if set
    if (membership.spend_cap) {
      const { data: userContributions, error: userContributionsError } =
        await supabase
          .from("contributions")
          .select("amount")
          .eq("pool_id", poolId)
          .eq("user_id", session.user.id)
          .eq("status", "succeeded");

      if (userContributionsError) {
        console.error(
          "Error fetching user contributions:",
          userContributionsError
        );
      }

      const userTotal =
        userContributions?.reduce((sum, c) => sum + c.amount, 0) || 0;

      if (userTotal + validatedData.amount > membership.spend_cap) {
        return NextResponse.json(
          {
            error: "Contribution would exceed your spend cap",
            details: {
              spendCap: membership.spend_cap,
              currentSpent: userTotal,
              available: membership.spend_cap - userTotal,
            },
          },
          { status: 400 }
        );
      }
    }

    // Create the contribution record
    const { data: contribution, error: insertError } = await supabase
      .from("contributions")
      .insert({
        pool_id: poolId,
        user_id: session.user.id,
        amount: validatedData.amount,
        method: validatedData.method,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating contribution:", insertError);
      return NextResponse.json(
        { error: "Failed to create contribution" },
        { status: 500 }
      );
    }

    // Get user's payment method if provided
    let paymentMethodId = validatedData.paymentMethodId;
    if (!paymentMethodId) {
      // Try to get user's default payment method
      const { data: defaultMethod } = await supabase
        .from("user_payment_methods")
        .select("provider_payment_method_id")
        .eq("user_id", session.user.id)
        .eq("is_default", true)
        .eq("is_active", true)
        .single();
      
      if (defaultMethod?.provider_payment_method_id) {
        paymentMethodId = defaultMethod.provider_payment_method_id;
      }
    }

    // Create payment intent using payment service
    let paymentIntent;
    try {
      paymentIntent = await PaymentService.createPaymentIntent({
        amount: validatedData.amount,
        currency: (pool as any).groups?.currency || "usd",
        contributionId: contribution.id,
        userId: session.user.id,
        poolId: poolId,
        paymentMethod: paymentMethodId,
      });

      // If payment succeeded immediately (mock mode with auto-succeed)
      if (paymentIntent.status === "succeeded") {
        await supabase
          .from("contributions")
          .update({ status: "succeeded" })
          .eq("id", contribution.id);
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      // Mark contribution as failed
      await supabase
        .from("contributions")
        .update({ status: "failed" })
        .eq("id", contribution.id);
      
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "contribution.created",
      "contribution",
      contribution.id,
      {
        poolId,
        amount: validatedData.amount,
        method: validatedData.method,
        paymentIntentId: paymentIntent.id,
      }
    );

    // Get payment provider info
    const providerInfo = PaymentService.getProviderInfo();

    return NextResponse.json(
      {
        message: "Contribution initiated",
        contribution: {
          id: contribution.id,
          poolId: contribution.pool_id,
          userId: contribution.user_id,
          amount: contribution.amount,
          method: contribution.method,
          status: paymentIntent.status === "succeeded" ? "succeeded" : contribution.status,
          createdAt: contribution.created_at,
        },
        payment: {
          intentId: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
          status: paymentIntent.status,
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

    console.error("Error in POST /api/pools/:id/contributions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pools/:id/contributions
 * Get all contributions for a pool
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

    const { id: poolId } = await params;

    // Get pool and group info
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("group_id")
      .eq("id", poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
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

    // Get all contributions
    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select(
        `
        id,
        user_id,
        amount,
        method,
        status,
        created_at,
        users (
          name,
          email
        )
      `
      )
      .eq("pool_id", poolId)
      .order("created_at", { ascending: false });

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
      return NextResponse.json(
        { error: "Failed to fetch contributions" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedContributions = contributions.map((contribution: any) => ({
      id: contribution.id,
      userId: contribution.user_id,
      userName: contribution.users?.name,
      userEmail: contribution.users?.email,
      amount: contribution.amount,
      method: contribution.method,
      status: contribution.status,
      createdAt: contribution.created_at,
    }));

    // Calculate totals
    const totalContributed =
      contributions
        ?.filter((c) => c.status === "succeeded")
        .reduce((sum, c) => sum + c.amount, 0) || 0;

    const pending =
      contributions
        ?.filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + c.amount, 0) || 0;

    return NextResponse.json({
      contributions: transformedContributions,
      summary: {
        count: contributions.length,
        totalContributed,
        pending,
        succeeded: contributions.filter((c) => c.status === "succeeded").length,
        failed: contributions.filter((c) => c.status === "failed").length,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/pools/:id/contributions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

