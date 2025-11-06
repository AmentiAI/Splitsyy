import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { smsService } from "@/lib/sms";
import { z } from "zod";

const createSplitSchema = z.object({
  description: z.string().min(1, "Description is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  participants: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    amount: z.number().positive("Amount must be positive")
  })).min(1, "At least one participant is required").max(8, "Maximum 8 participants allowed")
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSplitSchema.parse(body);

    // Create the split record
    const { data: split, error: splitError } = await supabase
      .from('splits')
      .insert({
        created_by: user.id,
        description: validatedData.description,
        total_amount: validatedData.totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (splitError) {
      console.error('Error creating split:', splitError);
      return NextResponse.json({ error: "Failed to create split" }, { status: 500 });
    }

    // Create participant records and generate payment links
    const participants = await Promise.all(
      validatedData.participants.map(async (participant) => {
        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${split.id}/${participant.phone.replace(/\D/g, '')}`;
        
        const { data: participantData, error: participantError } = await supabase
          .from('split_participants')
          .insert({
            split_id: split.id,
            name: participant.name,
            phone: participant.phone,
            amount: participant.amount,
            payment_link: paymentLink,
            status: 'pending'
          })
          .select()
          .single();

        if (participantError) {
          console.error('Error creating participant:', participantError);
          throw new Error(`Failed to create participant: ${participant.name}`);
        }

        return participantData;
      })
    );

    // Send SMS messages with payment links
    const smsPromises = participants.map(async (participant) => {
      try {
        const result = await smsService.sendPaymentLink(
          participant.phone,
          participant.name,
          validatedData.description,
          participant.payment_link,
          participant.amount
        );
        
        if (!result.success) {
          console.error(`Failed to send SMS to ${participant.name}:`, result.error);
        }
        
        return { participant: participant.name, success: result.success };
      } catch (error) {
        console.error(`SMS error for ${participant.name}:`, error);
        return { participant: participant.name, success: false };
      }
    });

    const smsResults = await Promise.all(smsPromises);
    const failedSMS = smsResults.filter(r => !r.success);
    
    if (failedSMS.length > 0) {
      console.warn('Some SMS messages failed to send:', failedSMS);
    }

    return NextResponse.json({
      success: true,
      split: {
        id: split.id,
        description: split.description,
        totalAmount: split.total_amount,
        participants: participants.map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          amount: p.amount,
          paymentLink: p.payment_link,
          status: p.status
        }))
      }
    });

  } catch (error) {
    console.error('Error in splits API:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's splits
    const { data: splits, error: splitsError } = await supabase
      .from('splits')
      .select(`
        *,
        split_participants (
          id,
          name,
          phone,
          amount,
          status,
          payment_link,
          user_id
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (splitsError) {
      console.error('Error fetching splits:', splitsError);
      return NextResponse.json({ error: "Failed to fetch splits" }, { status: 500 });
    }

    return NextResponse.json({ splits });

  } catch (error) {
    console.error('Error in splits GET API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
