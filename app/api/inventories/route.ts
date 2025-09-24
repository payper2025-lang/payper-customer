import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get("barId"); 

    const supabase = createClient();

    try {
            // Fetch a specific product by ID
            const { data, error } = await supabase
                .from("inventory")
                .select("id, product_id, quantity, created_at")
                .eq("bar_id", barId)

            if (error) {
                return NextResponse.json(
                    { message: "Failed to fetch inventory", error: error.message },
                    { status: 404 }
                );
            }

            return NextResponse.json({ inventory: data });
    } catch (err) {
        return NextResponse.json(
            { message: "An unexpected error occurred", error: (err as Error).message },
            { status: 500 }
        );
    }
}