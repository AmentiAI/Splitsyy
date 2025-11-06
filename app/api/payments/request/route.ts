import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";
import { z } from "zod";

const requestMoneySchema = z.object({
  requesterId: z.string().uuid(),
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
    const validatedData = requestMoneySchema.parse(body);

    // Check if requester exists
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", validatedData.requesterId)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    }

    // Prevent requesting from self
    if (requester.id === session.user.id) {
      return NextResponse.json({ error: "Cannot request money from yourself" }, { status: 400 });
    }

    // TODO: Create a money request record in the database
    // For now, this is a placeholder that logs the request

    // Log audit event
    await logAuditEvent(session.user.id, "request_money", "payment", null, {
      requesterId: validatedData.requesterId,
      requesterEmail: requester.email,
      amount: validatedData.amount,
      note: validatedData.note,
    });

    return NextResponse.json({
      success: true,
      request: {
        id: `req_${Date.now()}`,
        requesterId: validatedData.requesterId,
        amount: validatedData.amount,
        status: "pending",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Request money error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

