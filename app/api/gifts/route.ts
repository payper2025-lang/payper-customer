import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const userId = searchParams.get('userId');
        const giftId = searchParams.get('giftId');

        if(userId) {
            const { data, error } = await supabase
                .from('gifts')
                .select(`*, products (
                        id,
                        name,
                        image_url,
                        sale_price
                    ),  sender:profiles!sender_id (
          id,
          email,
          name
        )`)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
    
            if (error) {
                throw error;
            }
            return NextResponse.json({ data: data, status: 200 });
        } else if(giftId) {
            const { data, error } = await supabase
                .from('gifts')
                .select(`*, products (
                        id,
                        name,
                        image_url,
                        sale_price
                    ),  sender:profiles!sender_id (
          id,
          email,
          name
        )`)
                .eq("id", giftId)
                .order("created_at", { ascending: false })
    
            if (error) {
                throw error;
            }
            return NextResponse.json({ data: data, status: 200 });
        }

    } catch (error: any) {
        console.error('Error creating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};