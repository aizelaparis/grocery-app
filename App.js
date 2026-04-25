import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { getSession } from './api/session';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [initialRoute, setInitialRoute]   = useState(null);
  const [initialParams, setInitialParams] = useState({});

  useEffect(() => {
    const checkSession = async () => {
      const user = await getSession();
      if (user) {
        setInitialRoute('Home');
        setInitialParams({ user });
      } else {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (!hasLaunched) {
          await AsyncStorage.setItem('hasLaunched', 'true');
          setInitialRoute('Welcome'); 
        } else {
          setInitialRoute('Login');
        }
      }
    };
    checkSession();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator initialRoute={initialRoute} initialParams={initialParams} />
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: '#F7FAF7',
  },
});