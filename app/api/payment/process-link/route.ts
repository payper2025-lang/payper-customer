import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

export async function POST(req: Request) {
  const supabase = createClient();
  const { token, recipientId } = await req.json();
  try {
    // Verify payment link
    const { data: link, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('token', token)
      .single();
    if (linkError || !link || link.status !== 'pending') {
      return NextResponse.json(
        { error: "Invalid or expired payment link" },
        { status: 400 }
      );
    }

    // Process the transfer using your existing RPC function
    const { data, error: transferError } = await supabase.rpc('transfer_balance', {
      from_user_id: link.from_user,
      to_user_id: recipientId,
      transfer_amount: link.amount,
      transfer_note: link.note
    });

    if (transferError) throw transferError;

    // Mark link as used
    await supabase
      .from('payment_links')
      .update({ status: 'completed', completed_at: new Date() })
      .eq('token', token);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}