import { supabase } from './supabase';
import { formatDateDB, todayDB } from './helpers';
import { hashPassword } from './auth';

// ——— Customers ———
export async function getCustomers(includeInactive = true) {
  let q = supabase.from('customers').select('*').order('customer_name');
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getCustomerById(id) {
  const { data, error } = await supabase.from('customers').select('*').eq('customer_id', id).single();
  if (error) throw error;
  return data;
}

export async function addCustomer({ customer_name, mobile_number, email }) {
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      customer_name: customer_name.trim(),
      mobile_number: mobile_number?.trim() || null,
      email: email?.trim() || null,
      is_active: true,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id, fields) {
  const row = {
    customer_name: fields.customer_name?.trim(),
    mobile_number: fields.mobile_number?.trim() || null,
    email: fields.email?.trim() || null,
    is_active: fields.is_active,
  };
  if (fields.newPassword?.length >= 4) {
    row.password_hash = await hashPassword(fields.newPassword);
  }
  const { data, error } = await supabase.from('customers').update(row).eq('customer_id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('customer_id', id);
  if (error) throw error;
}

export async function getCustomerCount() {
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  if (error) throw error;
  return count || 0;
}

// ——— Entries ———
export async function getEntriesInPeriod(customerId, startDate, endDate) {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('customer_id', customerId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date')
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function getEntriesForBilling(customerId, startDate, endDate) {
  const all = await getEntriesInPeriod(customerId, startDate, endDate);
  return all.filter((e) => e.is_billed !== true);
}

export async function getDailyEntries(filters = {}) {
  let q = supabase.from('daily_entries').select('*').order('entry_date', { ascending: false });
  if (filters.customer_id) q = q.eq('customer_id', filters.customer_id);
  if (filters.startDate) q = q.gte('entry_date', filters.startDate);
  if (filters.endDate) q = q.lte('entry_date', filters.endDate);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function deleteEntry(entryId) {
  const { error } = await supabase.from('daily_entries').delete().eq('entry_id', entryId);
  if (error) throw error;
}

export async function addDailyEntry(entryData) {
  const insertObj = {
    customer_id: entryData.customer_id,
    customer_name: entryData.customer_name,
    entry_date: entryData.entry_date,
    milk_type_selected: entryData.milk_type_selected,
    quantity_liters: entryData.quantity_liters,
    rate_per_liter_used: entryData.rate_per_liter_used,
    total_amount: entryData.total_amount,
    entered_by: entryData.entered_by || 'admin',
  };
  if (entryData.is_billed !== undefined) {
    insertObj.is_billed = entryData.is_billed;
  }
  const { data, error } = await supabase.from('daily_entries').insert([insertObj]).select().single();
  if (error) throw error;
  return data;
}

export async function getTodaySummary() {
  const today = todayDB();
  return getEntriesSummary(today, today);
}

/** Milk entry totals for a date range (inclusive). Omit dates for all time. */
export async function getEntriesSummary(startDate, endDate) {
  let q = supabase.from('daily_entries').select('quantity_liters, total_amount, is_billed');
  if (startDate) q = q.gte('entry_date', startDate);
  if (endDate) q = q.lte('entry_date', endDate);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data || [];
  const notBilledAmount = rows
    .filter((e) => e.is_billed !== true)
    .reduce((s, e) => s + (parseFloat(e.total_amount) || 0), 0);
  return {
    totalLiters: rows.reduce((s, e) => s + (parseFloat(e.quantity_liters) || 0), 0),
    totalAmount: rows.reduce((s, e) => s + (parseFloat(e.total_amount) || 0), 0),
    entryCount: rows.length,
    notBilledAmount: Math.round(notBilledAmount * 100) / 100,
  };
}

/** Full business report for admin Reports page. */
export async function getBusinessReport({ startDate, endDate, customer_id } = {}) {
  const entryFilters = {};
  const payFilters = { limit: 5000 };
  if (startDate) {
    entryFilters.startDate = startDate;
    payFilters.startDate = startDate;
  }
  if (endDate) {
    entryFilters.endDate = endDate;
    payFilters.endDate = endDate;
  }
  if (customer_id) {
    entryFilters.customer_id = customer_id;
    payFilters.customer_id = customer_id;
  }

  const [entries, payments] = await Promise.all([
    getDailyEntries(entryFilters),
    getPaymentHistory(payFilters),
  ]);

  const byCustomer = {};
  const daily = {};
  const byMethod = {};

  entries.forEach((e) => {
    const cid = String(e.customer_id);
    if (!byCustomer[cid]) {
      byCustomer[cid] = {
        customer_id: e.customer_id,
        customer_name: e.customer_name,
        liters: 0,
        amount: 0,
        entryCount: 0,
        notBilled: 0,
        collected: 0,
        paymentCount: 0,
      };
    }
    const c = byCustomer[cid];
    const liters = parseFloat(e.quantity_liters) || 0;
    const amt = parseFloat(e.total_amount) || 0;
    c.liters += liters;
    c.amount += amt;
    c.entryCount += 1;
    if (e.is_billed !== true) c.notBilled += amt;

    const d = e.entry_date;
    if (!daily[d]) daily[d] = { date: d, liters: 0, amount: 0, entries: 0, notBilled: 0 };
    daily[d].liters += liters;
    daily[d].amount += amt;
    daily[d].entries += 1;
    if (e.is_billed !== true) daily[d].notBilled += amt;
  });

  let totalCollected = 0;
  payments.forEach((p) => {
    const paid = parseFloat(p.paid_amount) || 0;
    totalCollected += paid;
    const method = p.payment_method || 'Cash';
    byMethod[method] = (byMethod[method] || 0) + paid;

    const cid = String(p.customer_id);
    if (!byCustomer[cid]) {
      byCustomer[cid] = {
        customer_id: p.customer_id,
        customer_name: p.customers?.customer_name || '—',
        liters: 0,
        amount: 0,
        entryCount: 0,
        notBilled: 0,
        collected: 0,
        paymentCount: 0,
      };
    }
    byCustomer[cid].collected += paid;
    byCustomer[cid].paymentCount += 1;
  });

  const round2 = (n) => Math.round(n * 100) / 100;
  const customers = Object.values(byCustomer)
    .map((c) => ({
      ...c,
      liters: round2(c.liters),
      amount: round2(c.amount),
      notBilled: round2(c.notBilled),
      collected: round2(c.collected),
    }))
    .sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));

  const dailyRows = Object.values(daily)
    .map((d) => ({
      ...d,
      liters: round2(d.liters),
      amount: round2(d.amount),
      notBilled: round2(d.notBilled),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const notBilledAmount = entries
    .filter((e) => e.is_billed !== true)
    .reduce((s, e) => s + (parseFloat(e.total_amount) || 0), 0);

  return {
    summary: {
      totalLiters: round2(entries.reduce((s, e) => s + (parseFloat(e.quantity_liters) || 0), 0)),
      totalAmount: round2(entries.reduce((s, e) => s + (parseFloat(e.total_amount) || 0), 0)),
      entryCount: entries.length,
      notBilledAmount: round2(notBilledAmount),
      paymentCount: payments.length,
      totalCollected: round2(totalCollected),
    },
    customers,
    daily: dailyRows,
    byMethod: Object.entries(byMethod).map(([method, amount]) => ({
      method,
      amount: round2(amount),
    })),
  };
}

/** Payments collected in a date range (inclusive). */
export async function getCollectedInPeriod(startDate, endDate) {
  let q = supabase.from('payments').select('paid_amount');
  if (startDate) q = q.gte('payment_date', startDate);
  if (endDate) q = q.lte('payment_date', endDate);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).reduce((s, p) => s + (parseFloat(p.paid_amount) || 0), 0);
}

// ——— Payments ———
export async function getPendingAmounts() {
  const { data: entries, error } = await supabase
    .from('daily_entries')
    .select('customer_id, customer_name, total_amount, is_billed');
  if (error) throw error;
  const totals = {};
  (entries || []).forEach((e) => {
    if (!e.customer_id || e.is_billed === true) return;
    const cid = String(e.customer_id);
    if (!totals[cid]) {
      totals[cid] = { customer_id: e.customer_id, customer_name: e.customer_name, pending_amount: 0 };
    }
    totals[cid].pending_amount += parseFloat(e.total_amount) || 0;
  });
  return Object.values(totals)
    .map((c) => ({ ...c, pending_amount: Math.round(c.pending_amount * 100) / 100 }))
    .filter((c) => c.pending_amount > 0.01);
}

export async function getTotalPendingAmount() {
  const list = await getPendingAmounts();
  return list.reduce((s, p) => s + p.pending_amount, 0);
}

export async function getMonthlyCollected() {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { data, error } = await supabase.from('payments').select('paid_amount').gte('payment_date', start);
  if (error) throw error;
  return (data || []).reduce((s, p) => s + parseFloat(p.paid_amount), 0);
}

export async function savePayment(paymentData) {
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      customer_id: paymentData.customer_id,
      bill_start_date: paymentData.bill_start_date,
      bill_end_date: paymentData.bill_end_date,
      total_liters: paymentData.total_liters,
      total_amount: paymentData.total_amount,
      paid_amount: paymentData.paid_amount,
      payment_date: paymentData.payment_date || todayDB(),
      payment_method: paymentData.payment_method || 'Cash',
      notes: paymentData.notes || null,
    }])
    .select()
    .single();
  if (error) throw error;

  if (paymentData.markEntriesBilled !== false) {
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
  }
  return data;
}

export async function getPaymentHistory(filters = {}) {
  let q = supabase
    .from('payments')
    .select('*, customers(customer_name, mobile_number)')
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.customer_id) q = q.eq('customer_id', filters.customer_id);
  if (filters.startDate) q = q.gte('payment_date', filters.startDate);
  if (filters.endDate) q = q.lte('payment_date', filters.endDate);

  const limit = filters.limit ?? 200;
  q = q.limit(limit);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getInvoiceByPaymentId(paymentId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('payment_id', paymentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ——— Invoices ———
export async function generateInvoiceNumber() {
  const { data, error } = await supabase.rpc('generate_invoice_number');
  if (error) {
    const y = new Date().getFullYear();
    const n = Math.floor(Math.random() * 9999) + 1;
    return `MMF/${y}/${String(n).padStart(4, '0')}`;
  }
  return data;
}

export async function saveInvoice(row) {
  const { data, error } = await supabase.from('invoices').insert([row]).select().single();
  if (error) throw error;
  return data;
}

// ——— Orders ———
export async function getOrderSummaryCounts() {
  const [p, a] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
  ]);
  if (p.error) throw p.error;
  if (a.error) throw a.error;
  return { pendingToAccept: p.count ?? 0, pendingToDeliver: a.count ?? 0 };
}

export async function getOrders(status) {
  let q = supabase.from('orders').select('*, customers(mobile_number)').order('ordered_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function acceptOrder(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelOrder(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('order_id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deliverOrder(order, method) {
  const today = todayDB();
  const paidNow = method === 'Cash' || method === 'UPI';
  const { data: entry, error: entryErr } = await supabase
    .from('daily_entries')
    .insert([{
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      entry_date: today,
      milk_type_selected: 'custom',
      quantity_liters: order.quantity_liters,
      rate_per_liter_used: order.rate_per_liter,
      total_amount: order.total_amount,
      entered_by: 'order',
      is_billed: paidNow,
    }])
    .select()
    .single();
  if (entryErr) throw entryErr;

  let paymentId = null;
  if (paidNow) {
    const payment = await savePayment({
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
    paymentId = payment.payment_id;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      payment_method: method,
      delivered_at: new Date().toISOString(),
      daily_entry_id: entry?.entry_id,
      payment_id: paymentId,
    })
    .eq('order_id', order.order_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ——— Rates ———
export async function getActiveRate() {
  const { data, error } = await supabase
    .from('milk_rates')
    .select('*')
    .eq('is_active', true)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRateHistory() {
  const { data, error } = await supabase
    .from('milk_rates')
    .select('*')
    .order('effective_from', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveRate(rateData) {
  const { error: deactivateError } = await supabase
    .from('milk_rates')
    .update({ is_active: false })
    .eq('is_active', true);
  if (deactivateError) throw deactivateError;

  const rate = parseFloat(rateData.rate_per_liter);
  const { data, error } = await supabase
    .from('milk_rates')
    .insert([{
      rate_name: rateData.rate_name || 'Standard Rate',
      rate_per_liter: rate,
      rate_for_1_liter: parseFloat(rateData.rate_for_1_liter) || rate,
      rate_for_half_liter: parseFloat(rateData.rate_for_half_liter) || rate * 0.5,
      rate_for_quarter_liter: parseFloat(rateData.rate_for_quarter_liter) || rate * 0.25,
      rate_for_1_75_liter: parseFloat(rateData.rate_for_1_75_liter) || rate * 1.75,
      effective_from: rateData.effective_from || todayDB(),
      is_active: true,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
