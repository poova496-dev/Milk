// Rate Service - Supabase operations for milk rates
import { supabase } from '../config/supabase';

/**
 * Get active milk rate
 */
export const getActiveRate = async () => {
  const { data, error } = await supabase
    .from('milk_rates')
    .select('*')
    .eq('is_active', true)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
};

/**
 * Get all rate history
 */
export const getRateHistory = async () => {
  const { data, error } = await supabase
    .from('milk_rates')
    .select('*')
    .order('effective_from', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Save new rate (deactivate old ones first)
 */
export const saveRate = async (rateData) => {
  // Deactivate all existing rates
  const { error: deactivateError } = await supabase
    .from('milk_rates')
    .update({ is_active: false })
    .eq('is_active', true);

  if (deactivateError) throw deactivateError;

  // Insert new rate
  const { data, error } = await supabase
    .from('milk_rates')
    .insert([{
      rate_name: rateData.rate_name || 'Standard Rate',
      rate_per_liter: rateData.rate_per_liter,
      rate_for_1_liter: rateData.rate_for_1_liter || rateData.rate_per_liter,
      rate_for_half_liter: rateData.rate_for_half_liter || (rateData.rate_per_liter * 0.5),
      rate_for_quarter_liter: rateData.rate_for_quarter_liter || (rateData.rate_per_liter * 0.25),
      rate_for_1_75_liter: rateData.rate_for_1_75_liter || (rateData.rate_per_liter * 1.75),
      effective_from: rateData.effective_from,
      is_active: true,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get rate applicable for a specific date
 */
export const getRateForDate = async (date) => {
  const { data, error } = await supabase
    .from('milk_rates')
    .select('*')
    .lte('effective_from', date)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Delete a rate record
 */
export const deleteRate = async (rateId) => {
  const { error } = await supabase
    .from('milk_rates')
    .delete()
    .eq('rate_id', rateId);

  if (error) throw error;
  return true;
};
