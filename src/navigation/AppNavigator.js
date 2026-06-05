// App Navigator - chooses a flow based on the auth session:
//  - no session   -> Auth flow (customer login/signup + hidden seller login)
//  - customer      -> Customer ordering flow
//  - admin         -> Existing admin/seller app (unchanged) + Orders management
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';

// Existing admin screens
import SplashScreen from '../screens/SplashScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CustomerScreen from '../screens/CustomerScreen';
import DailyEntryScreen from '../screens/DailyEntryScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import FixedRateScreen from '../screens/FixedRateScreen';
import InvoicePreviewScreen from '../screens/InvoicePreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrdersManagementScreen from '../screens/OrdersManagementScreen';

// New customer/seller-auth screens
import CustomerLoginScreen from '../screens/CustomerLoginScreen';
import CustomerSignupScreen from '../screens/CustomerSignupScreen';
import SellerLoginScreen from '../screens/SellerLoginScreen';
import PlaceOrderScreen from '../screens/PlaceOrderScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';

import SellerOrderWatcher from '../components/SellerOrderWatcher';

const Stack = createStackNavigator();

const fadeOptions = {
  headerShown: false,
  cardStyleInterpolator: ({ current: { progress } }) => ({
    cardStyle: { opacity: progress },
  }),
};

const AuthFlow = () => (
  <Stack.Navigator initialRouteName="CustomerLogin" screenOptions={fadeOptions}>
    <Stack.Screen name="CustomerLogin" component={CustomerLoginScreen} />
    <Stack.Screen name="CustomerSignup" component={CustomerSignupScreen} />
    <Stack.Screen name="SellerLogin" component={SellerLoginScreen} />
  </Stack.Navigator>
);

const CustomerFlow = () => (
  <Stack.Navigator initialRouteName="PlaceOrder" screenOptions={fadeOptions}>
    <Stack.Screen name="PlaceOrder" component={PlaceOrderScreen} />
    <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
  </Stack.Navigator>
);

const AdminFlow = () => (
  <Stack.Navigator initialRouteName="Dashboard" screenOptions={fadeOptions}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="Orders" component={OrdersManagementScreen} />
    <Stack.Screen name="Customers" component={CustomerScreen} />
    <Stack.Screen name="DailyEntry" component={DailyEntryScreen} />
    <Stack.Screen name="History" component={HistoryScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
    <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
    <Stack.Screen name="FixedRate" component={FixedRateScreen} />
    <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { loading, sessionType } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {sessionType === 'admin' ? (
        <>
          <SellerOrderWatcher />
          <AdminFlow />
        </>
      ) : sessionType === 'customer' ? (
        <CustomerFlow />
      ) : (
        <AuthFlow />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
