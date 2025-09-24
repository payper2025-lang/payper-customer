import { type NextRequest, NextResponse } from "next/server";
import {createClient} from "@/utils/supabase/client";

const supabase = createClient()

export const GET = async (req: Request) => {
    try {
        const body = await req.json();

        const {email} = body;
        const { data:user, error } = await supabase.from("profiles").select("*").eq("email", email);
        if (error) {
            console.error("Error creating transaction:", error);
            return NextResponse.json(
              {
                message: "An unexpected error occurred",
                error: error.message,
              },
              { status: 500 }
            );
          }

        if (!user) {
            return NextResponse.json(
              {
                message: "User not found",
              },
              { status: 404 }
            );
          }
        return NextResponse.json({ user, status: 200 });
    } catch (error: any) {
        console.error('Error finding user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const PUT = async (req: Request) => {
    try {
        const body = await req.json();

        const {id, ...data} = body;
        console.log(body)
        const { data:user, error } = await supabase.from("profiles").update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
        if (error) throw error

        return NextResponse.json({ user, status: 200 });
    } catch (error: any) {
        console.error('Error updating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
