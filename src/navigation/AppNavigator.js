// App Navigator - Stack navigation for all screens
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            },
          }),
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Customers" component={CustomerScreen} />
        <Stack.Screen name="DailyEntry" component={DailyEntryScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
        <Stack.Screen name="FixedRate" component={FixedRateScreen} />
        <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
