import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";
import { z } from "zod";

const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  billingName: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * PUT /api/payment-methods/:id
 * Update a payment method
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePaymentMethodSchema.parse(body);

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("user_payment_methods")
      .select("user_id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    if (existing.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update payment method
    const updateData: any = {};
    if (validatedData.isDefault !== undefined) updateData.is_default = validatedData.isDefault;
    if (validatedData.isActive !== undefined) updateData.is_active = validatedData.isActive;
    if (validatedData.billingName !== undefined) updateData.billing_name = validatedData.billingName;
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata;

    const { data: paymentMethod, error } = await supabase
      .from("user_payment_methods")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment method:", error);
      return NextResponse.json(
        { error: "Failed to update payment method" },
        { status: 500 }
      );
    }

    await logAuditEvent(
      session.user.id,
      "payment_method.updated",
      "payment_method",
      id,
      updateData
    );

    return NextResponse.json({
      message: "Payment method updated successfully",
      paymentMethod,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/payment-methods/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payment-methods/:id
 * Delete a payment method
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("user_payment_methods")
      .select("user_id, is_default")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    if (existing.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete (mark as inactive instead of hard delete)
    const { error } = await supabase
      .from("user_payment_methods")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting payment method:", error);
      return NextResponse.json(
        { error: "Failed to delete payment method" },
        { status: 500 }
      );
    }

    await logAuditEvent(
      session.user.id,
      "payment_method.deleted",
      "payment_method",
      id,
      {}
    );

    return NextResponse.json({
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/payment-methods/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

