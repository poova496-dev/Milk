// Payment Service - Supabase operations for payments
import { supabase } from '../config/supabase';
import { formatDateDB } from '../utils/helpers';

/**
 * Get last payment date for a customer
 */
export const getLastPaymentDate = async (customerId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('bill_end_date')
    .eq('customer_id', customerId)
    .order('bill_end_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.bill_end_date || null;
};

/**
 * Save payment record
 */
export const savePayment = async (paymentData) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      customer_id: paymentData.customer_id,
      bill_start_date: paymentData.bill_start_date,
      bill_end_date: paymentData.bill_end_date,
      total_liters: paymentData.total_liters,
      total_amount: paymentData.total_amount,
      paid_amount: paymentData.paid_amount,
      payment_date: paymentData.payment_date || formatDateDB(new Date()),
      payment_time: paymentData.payment_time || new Date().toTimeString().slice(0, 8),
      payment_method: paymentData.payment_method || 'Cash',
      notes: paymentData.notes || null,
      invoice_url: paymentData.invoice_url || null,
    }])
    .select()
    .single();

  if (error) throw error;

  // Mark only the entries included in this bill as billed. Never re-mark
  // entries already billed earlier the same day (e.g. morning Cash/UPI).
  if (paymentData.markEntriesBilled !== false) {
    try {
      if (paymentData.entry_ids?.length) {
        await supabase
          .from('daily_entries')
          .update({ is_billed: true })
          .in('entry_id', paymentData.entry_ids)
          .eq('is_billed', false);
      } else {
        await supabase
          .from('daily_entries')
          .update({ is_billed: true })
          .eq('customer_id', paymentData.customer_id)
          .eq('is_billed', false)
          .gte('entry_date', paymentData.bill_start_date)
          .lte('entry_date', paymentData.bill_end_date);
      }
    } catch (e) {
      // Non-fatal: if the is_billed column is missing, payment still succeeds.
    }
  }

  return data;
};

/**
 * Get payment history with optional filters
 */
export const getPaymentHistory = async (filters = {}) => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      customers (customer_name, mobile_number)
    `)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters.startDate) {
    query = query.gte('payment_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('payment_date', filters.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Get pending amounts per customer — sum of milk entries that are not yet
 * billed (is_billed !== true). Matches Entry History "Not Billed" status and
 * is not reduced by Cash/UPI payments or overlapping bill records.
 */
export const getPendingAmounts = async () => {
  try {
    const { data: entries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('customer_id, customer_name, total_amount, is_billed');

    if (entriesError) throw entriesError;

    const customerTotals = {};

    (entries || []).forEach((entry) => {
      if (!entry.customer_id || entry.is_billed === true) return;

      const cid = String(entry.customer_id);
      if (!customerTotals[cid]) {
        customerTotals[cid] = {
          customer_id: entry.customer_id,
          customer_name: entry.customer_name || 'Unknown',
          pending_amount: 0,
        };
      }
      customerTotals[cid].pending_amount += (parseFloat(entry.total_amount) || 0);
    });

    return Object.values(customerTotals)
      .map((c) => ({
        ...c,
        pending_amount: Math.round(c.pending_amount * 100) / 100,
      }))
      .filter((c) => c.pending_amount > 0.01);
  } catch (error) {
    console.error('Error in getPendingAmounts:', error);
    throw error;
  }
};

/**
 * Get the pending (not yet billed) balance for a single customer.
 * @param {string} customerId
 * @returns {Promise<number>} pending amount (>= 0)
 */
export const getCustomerPending = async (customerId) => {
  if (!customerId) return 0;

  const { data: entries, error } = await supabase
    .from('daily_entries')
    .select('total_amount, is_billed')
    .eq('customer_id', customerId);

  if (error) throw error;

  const pending = (entries || [])
    .filter((e) => e.is_billed !== true)
    .reduce((s, e) => s + (parseFloat(e.total_amount) || 0), 0);

  return Math.round(pending * 100) / 100;
};

/**
 * Get total collected this month
 */
export const getMonthlyCollected = async () => {
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('payments')
    .select('paid_amount')
    .gte('payment_date', startOfMonth);

  if (error) throw error;

  return (data || []).reduce((sum, p) => sum + parseFloat(p.paid_amount), 0);
};

/**
 * Check whether the requested billing range OVERLAPS any existing bill for
 * this customer. This catches re-billing of a period (or part of a period)
 * that has already been invoiced, even when the start/end dates are not an
 * exact match.
 *
 * Two ranges [s1,e1] and [s2,e2] overlap when: s1 <= e2 AND e1 >= s2.
 *
 * @returns {Object|null} The first conflicting payment (with its dates) or
 *   null when no existing bill overlaps the requested range.
 */
export const checkDuplicatePayment = async (customerId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('payments')
    .select('payment_id, bill_start_date, bill_end_date, paid_amount, payment_date')
    .eq('customer_id', customerId)
    .lte('bill_start_date', endDate)
    .gte('bill_end_date', startDate)
    .order('bill_end_date', { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data && data.length > 0) ? data[0] : null;
};

/**
 * Get all billing periods (from saved payments). Used to determine whether a
 * daily entry has already been billed.
 *
 * @param {string|number} [customerId] Optional - limit to one customer.
 * @returns {Array<{customer_id, bill_start_date, bill_end_date}>}
 */
export const getBillingPeriods = async (customerId) => {
  let query = supabase
    .from('payments')
    .select('customer_id, bill_start_date, bill_end_date');

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Get total pending collections amount
 */
export const getTotalPendingAmount = async () => {
  const pending = await getPendingAmounts();
  return pending.reduce((sum, p) => sum + p.pending_amount, 0);
};
