// ─── App.js ──────────────────────────────────────────────────────────────────
// Entry point. React Native boots into this — it just loads the navigator.
// You rarely need to touch this file.

import 'react-native-gesture-handler'; // must be first import
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}