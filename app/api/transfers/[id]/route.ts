import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient()

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id: transferId } = params
        const { data, error } = await supabase
            .from('balance_transfers')
            .select(`*, user:profiles!to_user(email, name)`)
            .eq("id", transferId)
            .single();

        if (error) {
            throw error;
        }
        return NextResponse.json({ data: data, status: 200 });
    } catch (error: any) {
        console.error('Error getting transfer:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};