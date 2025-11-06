import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { smsService } from "@/lib/sms";
import { z } from "zod";

const processPaymentSchema = z.object({
  splitId: z.string().uuid(),
  participantId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['card', 'apple_pay', 'google_pay', 'bank_transfer'])
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = processPaymentSchema.parse(body);

    // Get the split and participant data
    const { data: split, error: splitError } = await supabase
      .from('splits')
      .select(`
        id,
        description,
        total_amount,
        status,
        split_participants!inner (
          id,
          name,
          phone,
          amount,
          status
        )
      `)
      .eq('id', validatedData.splitId)
      .single();

    if (splitError || !split) {
      return NextResponse.json({ error: "Split not found" }, { status: 404 });
    }

    const participant = split.split_participants.find((p: any) => p.id === validatedData.participantId);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (participant.status === 'paid') {
      return NextResponse.json({ error: "Payment already completed" }, { status: 400 });
    }

    // TODO: Integrate with actual payment processing
    // For now, we'll simulate a successful payment
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('split_payments')
      .insert({
        split_id: validatedData.splitId,
        participant_id: validatedData.participantId,
        amount: validatedData.amount,
        payment_method: validatedData.paymentMethod,
        status: 'succeeded',
        payment_intent_id: paymentIntentId,
        provider_payment_id: paymentIntentId
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
    }

    // Update participant status
    const { error: participantUpdateError } = await supabase
      .from('split_participants')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', validatedData.participantId);

    if (participantUpdateError) {
      console.error('Error updating participant status:', participantUpdateError);
      return NextResponse.json({ error: "Failed to update participant status" }, { status: 500 });
    }

    // Send confirmation SMS
    try {
      await smsService.sendPaymentConfirmation(
        participant.phone,
        participant.name,
        split.description,
        validatedData.amount
      );
    } catch (smsError) {
      console.error('Failed to send confirmation SMS:', smsError);
      // Don't fail the payment if SMS fails
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paymentIntentId: payment.payment_intent_id
      }
    });

  } catch (error) {
    console.error('Error in payment processing:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}








