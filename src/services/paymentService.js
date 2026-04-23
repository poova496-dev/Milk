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
 * Get pending amounts per customer
 */
export const getPendingAmounts = async () => {
  // Get all entries total
  const { data: entries, error: entriesError } = await supabase
    .from('daily_entries')
    .select('customer_id, customer_name, total_amount');

  if (entriesError) throw entriesError;

  // Get all payments total
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('customer_id, paid_amount');

  if (paymentsError) throw paymentsError;

  // Calculate pending per customer
  const customerTotals = {};

  (entries || []).forEach(entry => {
    if (!customerTotals[entry.customer_id]) {
      customerTotals[entry.customer_id] = {
        customer_id: entry.customer_id,
        customer_name: entry.customer_name,
        total_entries_amount: 0,
        total_paid: 0,
      };
    }
    customerTotals[entry.customer_id].total_entries_amount += parseFloat(entry.total_amount);
  });

  (payments || []).forEach(payment => {
    if (customerTotals[payment.customer_id]) {
      customerTotals[payment.customer_id].total_paid += parseFloat(payment.paid_amount);
    }
  });

  return Object.values(customerTotals).map(c => ({
    ...c,
    pending_amount: c.total_entries_amount - c.total_paid,
  })).filter(c => c.pending_amount > 0);
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
 * Check for duplicate payment in same billing range
 */
export const checkDuplicatePayment = async (customerId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('payments')
    .select('payment_id')
    .eq('customer_id', customerId)
    .eq('bill_start_date', startDate)
    .eq('bill_end_date', endDate);

  if (error) throw error;
  return (data || []).length > 0;
};

/**
 * Get total pending collections amount
 */
export const getTotalPendingAmount = async () => {
  const pending = await getPendingAmounts();
  return pending.reduce((sum, p) => sum + p.pending_amount, 0);
};
