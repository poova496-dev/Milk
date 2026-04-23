// Customer Service - Supabase CRUD operations for customers
import { supabase } from '../config/supabase';

/**
 * Get all active customers
 */
export const getCustomers = async (includeInactive = false) => {
  let query = supabase
    .from('customers')
    .select('*')
    .order('customer_name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Get single customer by ID
 */
export const getCustomerById = async (customerId) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_id', customerId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Search customers by name or phone
 */
export const searchCustomers = async (searchTerm) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .or(`customer_name.ilike.%${searchTerm}%,mobile_number.ilike.%${searchTerm}%`)
    .order('customer_name', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Add new customer
 */
export const addCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      customer_name: customerData.customer_name.trim(),
      mobile_number: customerData.mobile_number?.trim() || null,
      is_active: true,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update customer
 */
export const updateCustomer = async (customerId, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update({
      customer_name: customerData.customer_name.trim(),
      mobile_number: customerData.mobile_number?.trim() || null,
      is_active: customerData.is_active,
    })
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Toggle customer active status
 */
export const toggleCustomerStatus = async (customerId, isActive) => {
  const { data, error } = await supabase
    .from('customers')
    .update({ is_active: isActive })
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete customer (soft delete by deactivating)
 */
export const deleteCustomer = async (customerId) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('customer_id', customerId);

  if (error) throw error;
  return true;
};

/**
 * Get customer count
 */
export const getCustomerCount = async () => {
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) throw error;
  return count || 0;
};
