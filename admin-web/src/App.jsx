import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { loadSession } from './lib/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Billing from './pages/Billing';
import AddEntry from './pages/AddEntry';
import FixedRate from './pages/FixedRate';
import History from './pages/History';
import PaymentHistory from './pages/PaymentHistory';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Shortcuts from './pages/Shortcuts';

function RequireAuth({ children }) {
  if (!loadSession()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="entry" element={<AddEntry />} />
          <Route path="rate" element={<FixedRate />} />
          <Route path="billing" element={<Billing />} />
          <Route path="history" element={<History />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="shortcuts" element={<Shortcuts />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
