import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen  from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen   from '../screens/HomeScreen';

const Stack = createStackNavigator();

const AppNavigator = ({ initialRoute = 'Login', initialParams = {} }) => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login"  component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        initialParams={initialParams}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;