import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const C = {
  bg:         '#F0F2EC',
  green:      '#4CAF50',
  greenDark:  '#2E7D32',
  white:      '#FFFFFF',
  textDark:   '#1A2E1A',
  textLight:  '#6B7B6A',
  dotActive:  '#4A4A4A',
  dotInactive:'#C8C8C8',
};

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const btnAnim     = useRef(new Animated.Value(0)).current;
  const imageAnim   = useRef(new Animated.Value(0)).current;

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
      {/* Illustration area */}
      <Animated.View style={[s.imageWrap, { opacity: imageAnim }]}>
        <Image
          source={require('../assets/Pic.png')}
          style={s.illustration}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Dot indicators */}
      <View style={s.dotsRow}>
        <View style={[s.dot, s.dotActive]} />
        <View style={s.dot} />
        <View style={s.dot} />
      </View>

      {/* Text content */}
      <Animated.View style={[s.textWrap, {
        opacity:   fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Text style={s.title}>Grocery Shop</Text>
        <Text style={s.subtitle}>
          Shop Smart, Save Time, Freshness{'\n'}
          Delivered Daily, or Your Pantry,{'\n'}
          One Click Away.
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
    flex:            1,
    backgroundColor: C.bg,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 28,
  },

  imageWrap: {
    width:        width * 0.85,
    height:       height * 0.42,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  illustration: {
    width:  '100%',
    height: '100%',
  },

  dotsRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  36,
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
    alignItems:   'center',
    marginBottom: 48,
    paddingHorizontal: 10,
  },
  title: {
    fontSize:     28,
    fontWeight:   '800',
    color:        C.textDark,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize:   14,
    color:      C.textLight,
    textAlign:  'center',
    lineHeight: 22,
    fontWeight: '400',
  },

  btnWrap: {
    width: '100%',
  },
  btn: {
    backgroundColor: C.green,
    borderRadius:    50,
    paddingVertical: 18,
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
    fontWeight:    '700',
    letterSpacing: 0.3,
  },
});