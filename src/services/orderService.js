// Order Service - customer milk orders and seller fulfilment flow.
import { supabase } from '../config/supabase';
import { addDailyEntry } from './entryService';
import { savePayment } from './paymentService';
import { formatDateDB } from '../utils/helpers';

/**
 * Create a new milk order (status = pending).
 */
export const createOrder = async ({
  customer_id,
  customer_name,
  quantity_liters,
  rate_per_liter,
  total_amount,
  latitude,
  longitude,
  notes,
}) => {
  // Only one live order per customer at a time. A new order is allowed only
  // after the previous one is delivered (or cancelled).
  const existing = await getActiveOrder(customer_id);
  if (existing) {
    throw new Error('You already have an active order. You can place a new order after it is delivered.');
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([{
      customer_id,
      customer_name,
      quantity_liters,
      rate_per_liter,
      total_amount,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      notes: notes || null,
      status: 'pending',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get a customer's current live order (pending or accepted), if any.
 * @param {string} customerId
 * @returns {Promise<object|null>}
 */
export const getActiveOrder = async (customerId) => {
  if (!customerId) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .in('status', ['pending', 'accepted'])
    .order('ordered_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data && data.length > 0) ? data[0] : null;
};

/**
 * Count orders waiting for seller action (for dashboard summary).
 * @returns {{ pendingToAccept: number, pendingToDeliver: number }}
 */
export const getOrderSummaryCounts = async () => {
  const [pendingRes, acceptedRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted'),
  ]);

  if (pendingRes.error) throw pendingRes.error;
  if (acceptedRes.error) throw acceptedRes.error;

  return {
    pendingToAccept: pendingRes.count ?? 0,
    pendingToDeliver: acceptedRes.count ?? 0,
  };
};

/**
 * Get orders, optionally filtered by status and/or customer.
 * @param {{status?: string|string[], customer_id?: string}} filters
 */
export const getOrders = async (filters = {}) => {
  let query = supabase
    .from('orders')
    .select('*, customers(mobile_number)')
    .order('ordered_at', { ascending: false });

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Seller accepts a pending order.
 */
export const acceptOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Seller cancels an order.
 */
export const cancelOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Mark an order delivered and apply the chosen payment method.
 *
 * Every delivered order creates a daily_entry (single source of truth for
 * milk given, so it shows in History/liters/Billed tracking). For Cash/UPI we
 * also create a same-day payment so the customer's pending nets to zero and it
 * counts in collections. For Billing, only the entry is created (stays pending
 * and is billed later via the existing Payment screen).
 *
 * @param {object} order The full order record.
 * @param {'Cash'|'UPI'|'Billing'} method
 */
export const deliverOrder = async (order, method) => {
  const today = formatDateDB(new Date());
  const paidNow = method === 'Cash' || method === 'UPI';

  // 1. Record the milk as a daily entry. Cash/UPI are settled immediately so
  //    the entry is marked billed; Billing stays pending (is_billed = false).
  const entry = await addDailyEntry({
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    entry_date: today,
    milk_type_selected: 'custom',
    quantity_liters: order.quantity_liters,
    rate_per_liter_used: order.rate_per_liter,
    total_amount: order.total_amount,
    entered_by: 'order',
    is_billed: paidNow,
  });

  // 2. For immediate payments, record a same-day payment. markEntriesBilled is
  //    false so it does NOT flag other same-day entries (e.g. Billing orders).
  let payment = null;
  if (paidNow) {
    payment = await savePayment({
      customer_id: order.customer_id,
      bill_start_date: today,
      bill_end_date: today,
      total_liters: order.quantity_liters,
      total_amount: order.total_amount,
      paid_amount: order.total_amount,
      payment_method: method,
      notes: 'Paid on delivery (order)',
      markEntriesBilled: false,
    });
  }

  // 3. Update the order record.
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      payment_method: method,
      delivered_at: new Date().toISOString(),
      daily_entry_id: entry?.entry_id || null,
      payment_id: payment?.payment_id || null,
    })
    .eq('order_id', order.order_id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
