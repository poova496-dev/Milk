// Auth Service - customer signup/login (phone + password) and seller login.
// Passwords are hashed with SHA-256 (expo-crypto) so plaintext is never stored.
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const SESSION_KEY = 'mmf_session';

// Hardcoded seller credentials (same style as the billing override password).
export const SELLER_ID = 'Admin';
export const SELLER_PASSWORD = '852585';

/**
 * Hash a password using SHA-256.
 */
export const hashPassword = async (plain) => {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    String(plain)
  );
};

const normalizePhone = (phone) => String(phone || '').replace(/\s/g, '').trim();

/**
 * Register a new customer. Creates a row in the customers table.
 * @returns the created customer record
 */
export const signupCustomer = async ({ name, phone, password, email, latitude, longitude }) => {
  const mobile = normalizePhone(phone);
  if (!name || !name.trim()) throw new Error('Please enter your name');
  if (!mobile) throw new Error('Please enter your phone number');
  if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');

  // Reject if the phone number is already registered.
  const { data: existing, error: existingError } = await supabase
    .from('customers')
    .select('customer_id')
    .eq('mobile_number', mobile)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) throw new Error('This phone number is already registered. Please log in.');

  const password_hash = await hashPassword(password);

  const { data, error } = await supabase
    .from('customers')
    .insert([{
      customer_name: name.trim(),
      mobile_number: mobile,
      email: email?.trim() || null,
      password_hash,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      is_active: true,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Log in a customer with phone + password.
 * @returns the customer record (without verifying via Supabase Auth)
 */
export const loginCustomer = async ({ phone, password }) => {
  const mobile = normalizePhone(phone);
  if (!mobile || !password) throw new Error('Enter phone number and password');

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('mobile_number', mobile)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('No account found for this phone number');
  if (!data.password_hash) throw new Error('This number is not registered for ordering. Please sign up.');

  const password_hash = await hashPassword(password);
  if (password_hash !== data.password_hash) throw new Error('Incorrect password');

  return data;
};

/**
 * Verify seller credentials.
 */
export const verifySeller = (id, password) => {
  return id === SELLER_ID && password === SELLER_PASSWORD;
};

// ---- Session persistence (AsyncStorage) ----

/**
 * Persist the current session.
 * @param {{type: 'customer'|'admin', customer?: object}} session
 */
export const saveSession = async (session) => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadSession = async () => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
};
