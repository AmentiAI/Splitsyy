import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";
import { z } from "zod";

const sendMoneySchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.number().int().positive(),
  note: z.string().optional(),
});

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

    const body = await request.json();
    const validatedData = sendMoneySchema.parse(body);

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", validatedData.recipientId)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Prevent sending to self
    if (recipient.id === session.user.id) {
      return NextResponse.json({ error: "Cannot send money to yourself" }, { status: 400 });
    }

    // Get sender's wallet balance
    const { data: senderAccounts } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", session.user.id)
      .eq("type", "checking")
      .order("balance", { ascending: false })
      .limit(1);

    // TODO: Implement actual payment processing and balance updates
    // For now, this is a placeholder that logs the transaction

    // Log audit event
    await logAuditEvent(session.user.id, "send_money", "payment", null, {
      recipientId: validatedData.recipientId,
      recipientEmail: recipient.email,
      amount: validatedData.amount,
      note: validatedData.note,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: `txn_${Date.now()}`,
        recipientId: validatedData.recipientId,
        amount: validatedData.amount,
        status: "completed",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Send money error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

