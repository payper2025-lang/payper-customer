import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const supabase = createClient();
  const { amount, note, userId } = await req.json();

  try {
    // Generate unique token
    const token = uuidv4();
    
    // Store transfer request in database
    const { data, error } = await supabase
      .from('payment_links')
      .insert([{
        token,
        amount,
        note,
        from_user: userId,
        status: 'pending'
      }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      paymentLink: `${process.env.WEB_URL}/transfer-balance/${token}`,
    //   expiresAt: data.expires_at
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}