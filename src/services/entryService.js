// Daily Entry Service - Supabase CRUD operations for milk entries
import { supabase } from '../config/supabase';
import { formatDateDB } from '../utils/helpers';

/**
 * Add daily milk entry
 */
export const addDailyEntry = async (entryData) => {
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
  // Only set is_billed when explicitly provided (e.g. paid Cash/UPI orders),
  // so normal admin entries keep working even before the column migration.
  if (entryData.is_billed !== undefined) {
    insertObj.is_billed = entryData.is_billed;
  }

  const { data, error } = await supabase
    .from('daily_entries')
    .insert([insertObj])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get daily entries with optional filters
 */
export const getDailyEntries = async (filters = {}) => {
  let query = supabase
    .from('daily_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters.startDate) {
    query = query.gte('entry_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('entry_date', filters.endDate);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Get today's entries
 */
export const getTodayEntries = async () => {
  const today = formatDateDB(new Date());
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('entry_date', today)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get today's summary totals
 */
export const getTodaySummary = async () => {
  const today = formatDateDB(new Date());
  const { data, error } = await supabase
    .from('daily_entries')
    .select('quantity_liters, total_amount')
    .eq('entry_date', today);

  if (error) throw error;

  const totalLiters = (data || []).reduce((sum, e) => sum + parseFloat(e.quantity_liters), 0);
  const totalAmount = (data || []).reduce((sum, e) => sum + parseFloat(e.total_amount), 0);

  return { totalLiters, totalAmount, entryCount: (data || []).length };
};

/**
 * Get all entries for a customer within a date range (e.g. re-opening old invoices).
 */
export const getEntriesInPeriod = async (customerId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('customer_id', customerId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get entries that still need billing in a date range. Excludes entries already
 * marked billed (e.g. morning Cash/UPI order on the same day as an evening
 * Billing order).
 */
export const getEntriesForBilling = async (customerId, startDate, endDate) => {
  const all = await getEntriesInPeriod(customerId, startDate, endDate);
  return all.filter((e) => e.is_billed !== true);
};

/**
 * Get monthly summary
 */
export const getMonthlySummary = async () => {
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('daily_entries')
    .select('quantity_liters, total_amount')
    .gte('entry_date', startOfMonth);

  if (error) throw error;

  const totalLiters = (data || []).reduce((sum, e) => sum + parseFloat(e.quantity_liters), 0);
  const totalAmount = (data || []).reduce((sum, e) => sum + parseFloat(e.total_amount), 0);

  return { totalLiters, totalAmount };
};

/**
 * Delete a daily entry
 */
export const deleteEntry = async (entryId) => {
  const { error } = await supabase
    .from('daily_entries')
    .delete()
    .eq('entry_id', entryId);

  if (error) throw error;
  return true;
};

/**
 * Update a daily entry
 */
export const updateEntry = async (entryId, entryData) => {
  const { data, error } = await supabase
    .from('daily_entries')
    .update({
      milk_type_selected: entryData.milk_type_selected,
      quantity_liters: entryData.quantity_liters,
      rate_per_liter_used: entryData.rate_per_liter_used,
      total_amount: entryData.total_amount,
    })
    .eq('entry_id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
