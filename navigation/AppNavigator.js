// ─── AppNavigator.js ─────────────────────────────────────────────────────────
// Registers all screens. Add new screens here as the app grows.
//
// Install (run once):
//   npx expo install @react-navigation/native @react-navigation/stack
//   npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen  from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen   from '../screens/HomeScreen';

const Stack = createStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"  component={LoginScreen}  />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;