import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const POST = async (req: Request) => {
  try {
    const { fromUser, toUserEmail, amount, note } = await req.json();

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { message: "Invalid transfer amount" },
        { status: 400 }
      );
    }

    // Get recipient profile in a single query
    const { data: toUserProfile, error: toUserError } = await supabase
      .from("profiles")
      .select("id, balance")
      .eq("email", toUserEmail)
      .single();

    if (!toUserProfile || toUserError) {
      const message = toUserError 
        ? "Error fetching recipient profile" 
        : `User ${toUserEmail} not found`;
      return NextResponse.json(
        { message, error: toUserError?.message },
        { status: toUserError ? 500 : 404 }
      );
    }

    // Verify sender has sufficient balance
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", fromUser)
      .single();

    if ((senderProfile?.balance || 0) < amount) {
      return NextResponse.json(
        { message: "Insufficient balance" },
        { status: 400 }
      );
    }
    console.log("Transfering balance from", fromUser, "to", toUserProfile.id);
    // Use RPC for atomic balance transfer
    const { data, error: transferError } = await supabase.rpc('transfer_balance', {
      from_user_id: fromUser,
      to_user_id: toUserProfile.id,
      transfer_amount: amount,
      transfer_note: note
    });

    console.log("Transfer result:", data);

    if (transferError) {
      console.error("Transfer failed:", transferError);
      return NextResponse.json(
        { message: "Transfer failed", error: transferError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: data[0]
    });

  } catch (error: any) {
    console.error('Error processing transfer:', error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
};