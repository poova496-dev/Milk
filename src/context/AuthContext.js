// Auth context - holds the current session (customer or admin) and exposes
// sign-in / sign-out helpers. Session is persisted via authService.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveSession, loadSession, clearSession } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState(null); // 'customer' | 'admin' | null
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await loadSession();
        if (session?.type === 'customer' && session.customer) {
          setSessionType('customer');
          setCustomer(session.customer);
        } else if (session?.type === 'admin') {
          setSessionType('admin');
        }
      } catch (e) {
        // ignore corrupt session
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signInCustomer = useCallback(async (customerRecord) => {
    setSessionType('customer');
    setCustomer(customerRecord);
    await saveSession({ type: 'customer', customer: customerRecord });
  }, []);

  const signInAdmin = useCallback(async () => {
    setSessionType('admin');
    setCustomer(null);
    await saveSession({ type: 'admin' });
  }, []);

  const updateCustomer = useCallback(async (customerRecord) => {
    setCustomer(customerRecord);
    await saveSession({ type: 'customer', customer: customerRecord });
  }, []);

  const signOut = useCallback(async () => {
    setSessionType(null);
    setCustomer(null);
    await clearSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{ loading, sessionType, customer, signInCustomer, signInAdmin, updateCustomer, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
