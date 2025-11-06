import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ splitId: string; phoneHash: string }> }
) {
  try {
    const supabase = await createClient();
    const { splitId, phoneHash } = await params;

    // Get the split and participant data
    const { data: split, error: splitError } = await supabase
      .from('splits')
      .select(`
        id,
        description,
        total_amount,
        status,
        created_at,
        split_participants!inner (
          id,
          name,
          phone,
          amount,
          status,
          payment_link
        )
      `)
      .eq('id', splitId)
      .single();

    if (splitError || !split) {
      return NextResponse.json({ error: "Split not found" }, { status: 404 });
    }

    // Find the participant by phone hash
    const participant = split.split_participants.find((p: any) => {
      const phoneHashFromDb = crypto
        .createHash('sha256')
        .update(p.phone.replace(/\D/g, ''))
        .digest('hex')
        .substring(0, 16);
      return phoneHashFromDb === phoneHash;
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: split.id,
      description: split.description,
      total_amount: split.total_amount,
      status: split.status,
      created_at: split.created_at,
      participant: {
        id: participant.id,
        name: participant.name,
        phone: participant.phone,
        amount: participant.amount,
        status: participant.status
      }
    });

  } catch (error) {
    console.error('Error in split participant API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}








