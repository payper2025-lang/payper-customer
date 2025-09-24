import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient()

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        // Await the params object first
        const { id: orderId } = await params;
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items (
                    id,
                    product_id,
                    quantity,
                    unit_price,
                    products (
                        name,
                        image_url
                    )
                )`)
            .eq("id", orderId)
            .single();

        if (error) {
            throw error;
        }
        return NextResponse.json({ data: data, status: 200 });
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id: orderId } = params
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`*, order_items (
                    id,
                    product_id,
                    quantity,
                    unit_price,
                    products (
                        name,
                        image_url,
                        stock
                    )
                ), user:profiles!user_id (balance)`)
            .eq("id", orderId)
            .single();
        if (orderError) throw orderError;

        // Check cancellation eligibility
        const orderCreatedTime = new Date(order.created_at).getTime();
        const currentTime = Date.now();
        const timeElapsed = (currentTime - orderCreatedTime) / 1000; // in seconds
        const CANCELLATION_WINDOW = 120; // 2 minutes

        // Orders cannot be cancelled if:
        // 1. Status is "preparing", "ready", "delivered", or "cancelled"
        // 2. More than 2 minutes have passed since creation (for "pending" or "paying" orders)
        const nonCancellableStatuses = ["preparing", "ready", "delivered", "cancelled"];

        if (nonCancellableStatuses.includes(order.status)) {
            return NextResponse.json({
                error: `Order cannot be cancelled. Order is currently ${order.status}.`
            }, { status: 400 });
        }

        if ((order.status === "pending" || order.status === "paying") && timeElapsed > CANCELLATION_WINDOW) {
            return NextResponse.json({
                error: "Order cannot be cancelled after 2 minutes. Order is now in suspension."
            }, { status: 400 });
        }

        // Refund the user if payment method was balance
        if (order.payment_method === "balance") {
            const { data: userUpdate, error: userError } = await supabase
                .from('profiles')
                .update({
                    balance: order.user.balance + order.total_amount,
                })
                .eq('id', order.user_id)
                .select()
                .single();
            if (userError) throw userError;
            console.log("Refunded balance to user:", userUpdate);
        }

        const { data: orderUpdate, error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
            })
            .eq('id', orderId)
            .select()
            .single();
        if (orderUpdateError) throw orderUpdateError;

        // Create notifications
        const notifications = [
            {
                user_id: order.user_id,
                message: `Tu pedido con el ID ${orderId} ha sido cancelado.`,
                type: 'order_cancelled',
                title: 'Pedido cancelado',
                metadata: {
                    order_id: orderId,
                }
            }
        ];

        // Add refund notification if payment was made with balance
        if (order.payment_method === "balance") {
            notifications.push({
                user_id: order.user_id,
                message: `Se ha reembolsado $${order.total_amount} a tu saldo por la cancelación del pedido ${orderId}.`,
                type: 'balance_updated',
                title: 'Reembolso procesado',
                metadata: {
                    order_id: orderId,
                }
            });
        }

        await supabase
            .from('notifications')
            .insert(notifications);

        fetch("/api/mails", {
            method: "POST",
            body: JSON.stringify({
                email: order.user.email,
                type: "order_cancelled",
                orderNumber: orderId,
            }),
        });

        // console.log(orderUpdate);
        // for (const item of order.order_items) {
        //     const { data: productUpdate, error: productError } = await supabase
        //         .from('products')
        //         .update({
        //             stock: item.products.stock + item.quantity,
        //         })
        //         .eq('id', item.product_id)
        //         .select()
        //         .single();
        //     if (productError) throw productError;
        //     console.log(productUpdate);
        // }

        return NextResponse.json({ data: orderUpdate, status: 200 });
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

