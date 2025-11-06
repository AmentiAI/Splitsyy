import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";
import { z } from "zod";

const createPaymentMethodSchema = z.object({
  type: z.enum(["card", "bank_account"]),
  provider: z.enum(["stripe", "lithic", "manual"]),
  providerPaymentMethodId: z.string().optional(),
  cardBrand: z.enum(["visa", "mastercard", "amex", "discover", "jcb", "diners", "unionpay"]).optional(),
  lastFour: z.string().length(4).optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(2020).optional(),
  billingName: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * GET /api/payment-methods
 * Get all payment methods for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: paymentMethods, error } = await supabase
      .from("user_payment_methods")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
      return NextResponse.json(
        { error: "Failed to fetch payment methods" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentMethods: paymentMethods || [],
    });
  } catch (error) {
    console.error("Error in GET /api/payment-methods:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment-methods
 * Add a new payment method for the user
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
    const validatedData = createPaymentMethodSchema.parse(body);

    // Insert payment method
    const { data: paymentMethod, error } = await supabase
      .from("user_payment_methods")
      .insert({
        user_id: session.user.id,
        type: validatedData.type,
        provider: validatedData.provider,
        provider_payment_method_id: validatedData.providerPaymentMethodId,
        card_brand: validatedData.cardBrand,
        last_four: validatedData.lastFour,
        expiry_month: validatedData.expiryMonth,
        expiry_year: validatedData.expiryYear,
        billing_name: validatedData.billingName,
        is_default: validatedData.isDefault || false,
        metadata: validatedData.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment method:", error);
      return NextResponse.json(
        { error: "Failed to create payment method" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "payment_method.created",
      "payment_method",
      paymentMethod.id,
      {
        type: validatedData.type,
        provider: validatedData.provider,
      }
    );

    return NextResponse.json(
      {
        message: "Payment method added successfully",
        paymentMethod,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/payment-methods:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

