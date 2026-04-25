import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');

const C = {
  bg:          '#F0F2EC',
  green:       '#4CAF50',
  greenDark:   '#2E7D32',
  white:       '#FFFFFF',
  textDark:    '#1A2E1A',
  textLight:   '#6B7B6A',
  dotActive:   '#4A4A4A',
  dotInactive: '#C8C8C8',
};

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const btnAnim   = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(imageAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, duration: 500, useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.root}>

      {/* Illustration */}
      <Animated.View style={[s.imageWrap, { opacity: imageAnim }]}>
        <Image
          source={require('../assets/Pic.png')}
          style={s.illustration}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Dots */}
      <View style={s.dotsRow}>
        <View style={[s.dot, s.dotActive]} />
        <View style={s.dot} />
        <View style={s.dot} />
      </View>

      {/* Text */}
      <Animated.View style={[s.textWrap, {
        opacity:   fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Text style={s.title}>Fresh picks,{'\n'}delivered fast.</Text>
        <Text style={s.subtitle}>
          Everything your kitchen needs —{'\n'}
          farm-fresh and at your door daily.
        </Text>
      </Animated.View>

      {/* Button */}
      <Animated.View style={[s.btnWrap, { opacity: btnAnim }]}>
        <TouchableOpacity
          style={s.btn}
          activeOpacity={0.85}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={s.btnText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
};

export default WelcomeScreen;

const s = StyleSheet.create({
  root: {
    flex:              1,
    backgroundColor:   C.bg,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 28,
  },

  imageWrap: {
    width:          width * 0.85,
    height:         height * 0.42,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   24,
  },
  illustration: {
    width:  '100%',
    height: '100%',
  },

  dotsRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  32,
  },
  dot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: C.dotInactive,
  },
  dotActive: {
    width:           28,
    backgroundColor: C.dotActive,
  },

  textWrap: {
    alignItems:        'center',
    marginBottom:      44,
    paddingHorizontal: 10,
  },
  title: {
    fontSize:      30,
    fontWeight:    '700',
    fontStyle:     'italic',          // gives a natural editorial feel
    color:         C.textDark,
    marginBottom:  12,
    letterSpacing: -0.5,
    textAlign:     'center',
    lineHeight:    38,
  },
  subtitle: {
    fontSize:   14,
    color:      C.textLight,
    textAlign:  'center',
    lineHeight: 23,
    fontWeight: '300',
    letterSpacing: 0.1,
  },

  btnWrap: {
    width: '100%',
  },
  btn: {
    backgroundColor: C.green,
    borderRadius:    50,
    paddingVertical: 18,
    top:            50,
    alignItems:      'center',
    shadowColor:     C.greenDark,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.3,
    shadowRadius:    12,
    elevation:       8,
  },
  btnText: {
    color:         C.white,
    fontSize:      17,
    fontWeight:    '600',
    letterSpacing: 0.4,
  },
});