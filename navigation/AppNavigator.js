import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen   from '../screens/LoginScreen';
import SignupScreen  from '../screens/SignupScreen';
import HomeScreen    from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProductListScreen from '../screens/ProductListScreen';
import HelpAndSupportScreen from '../screens/HelpAndSupportScreen';


const Stack = createStackNavigator();

const AppNavigator = ({ initialRoute = 'Welcome', initialParams = {} }) => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login"   component={LoginScreen} />
      <Stack.Screen name="Signup"  component={SignupScreen} />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        initialParams={initialParams}
      />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} options={{ headerShown: false }} />

    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;