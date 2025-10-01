import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
export interface TableOrder {
  id: string;
  table_id: string;
  order_id: string;
  created_at: string;
}

export interface TableNotification {
  id: string;
  table_id: string;
  type: "waiter_call" | "bill_request" | "special_request" | "new_order";
  status: "pending" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

export type DatabaseTableStatus =
  | "free"
  | "occupied"
  | "waiting_order"
  | "preparing"
  | "delivered"
  | "bill_requested"
  | "producing"
  | "paid";

export interface TableSession {
  id: string
  table_id: string
  start_time: string
  end_time: string | null
  total_spent: number
  status: 'active' | 'closed'
}

export async function createTableOrder(
  tableId: string,
  orderId: string
): Promise<TableOrder> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase.from("tables").select("id");

    if (!tables) {
      throw new Error("No tables found");
    }

    const { data, error } = await supabase
      .from("table_orders")
      .insert({
        table_id: tableId,
        order_id: orderId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating table order:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from table order creation");
    }

    return data;
  } catch (error) {
    console.error("Failed to create table order:", error);
    throw error;
  }
}

/**
 * Create or retrieve a table session based on the following rules:
 * 1. Each table can only have one table_session at a time
 * 2. If an active session exists, return it (don't create new)
 * 3. If a closed session exists, create a new active session
 * 4. If no session exists, create a new active session
 */
export async function createTableSession(tableId: string): Promise<TableSession> {
  try {
    // Check if there's already a session for this table (active or closed)
    // Get the most recent session ordered by start_time
    const { data: existingSessions, error: checkError } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('table_id', tableId)
      .order('start_time', { ascending: false })
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking existing sessions:', checkError)
      throw checkError
    }

    // If a session exists, check its status
    if (existingSessions && existingSessions.length > 0) {
      const latestSession = existingSessions[0] as TableSession

      // Rule 2: If active session exists, return it (don't create new)
      if (latestSession.status === 'active') {
        return latestSession
      }
    }

    // Create a new active session
    const startTime = new Date()
    const { data, error } = await supabase
      .from('table_sessions')
      .insert({
        table_id: tableId,
        start_time: startTime.toISOString(),
        end_time: null,
        total_spent: 0,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating table session:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from table session creation')
    }

    return data
  } catch (error) {
    console.error('Failed to create table session:', error)
    throw error
  }
}

/**
 * Create a new table notification
 */
export async function createTableNotification(
  tableId: string,
  type: "waiter_call" | "bill_request" | "special_request" | "new_order"
): Promise<TableNotification> {
  try {

    const { data, error } = await supabase
      .from("table_notifications")
      .insert({
        table_id: tableId,
        type: type,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating table notification:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from table notification creation");
    }

    return data;
  } catch (error) {
    console.error("Failed to create table notification:", error);
    throw error;
  }
}

/**
 * Update table status
 */
export async function updateTableStatus(
  tableId: string,
  newStatus: DatabaseTableStatus
): Promise<void> {
  console.log('Updating table status:', { tableId, newStatus })

  try {
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Reset current_guests to 0 when table becomes free
    if (newStatus === "free") {
      updateData.current_guests = 0
    }

    const { data, error } = await supabase
      .from("tables")
      .update(updateData)
      .eq("id", tableId)
      .select()

    if (error) {
      console.error("Error updating table status:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`No table found with ID: ${tableId}`)
    }
  } catch (error) {
    console.error("Failed to update table status:", error);
    throw error;
  }
}
