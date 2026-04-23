// Invoice Service - Generate invoice numbers, save invoices
import { supabase } from '../config/supabase';

/**
 * Generate next invoice number using database function
 */
export const generateInvoiceNumber = async () => {
  const { data, error } = await supabase.rpc('generate_invoice_number');
  if (error) {
    // Fallback: generate locally
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 9999) + 1;
    return `MMF/${year}/${String(random).padStart(4, '0')}`;
  }
  return data;
};

/**
 * Save invoice record
 */
export const saveInvoice = async (invoiceData) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([{
      invoice_number: invoiceData.invoice_number,
      payment_id: invoiceData.payment_id,
      customer_id: invoiceData.customer_id,
      customer_name: invoiceData.customer_name,
      invoice_date: invoiceData.invoice_date,
      bill_start_date: invoiceData.bill_start_date,
      bill_end_date: invoiceData.bill_end_date,
      total_liters: invoiceData.total_liters,
      total_amount: invoiceData.total_amount,
      paid_amount: invoiceData.paid_amount,
      pdf_url: invoiceData.pdf_url || null,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get invoice by payment ID
 */
export const getInvoiceByPaymentId = async (paymentId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('payment_id', paymentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Get all invoices
 */
export const getInvoices = async (filters = {}) => {
  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Update invoice PDF URL
 */
export const updateInvoicePdfUrl = async (invoiceId, pdfUrl) => {
  const { data, error } = await supabase
    .from('invoices')
    .update({ pdf_url: pdfUrl })
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
