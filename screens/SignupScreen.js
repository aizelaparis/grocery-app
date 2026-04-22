// ─── SignupScreen.js ─────────────────────────────────────────────────────────
// Self-contained. Colors, fonts, InputField, PrimaryButton all live here.
// No external theme files needed.

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// COLORS — change these to retheme this screen
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  green:        '#2E7D32',
  greenLight:   '#4CAF50',
  greenFaded:   '#E8F5E9',
  greenDark:    '#1B5E20',
  white:        '#FFFFFF',
  inputBg:      '#F1F8F1',
  border:       '#C8E6C9',
  borderFocus:  '#2E7D32',
  textDark:     '#1A2E1A',
  textMid:      '#4A6045',
  textLight:    '#8A9E88',
  error:        '#D32F2F',
  errorBg:      '#FFEBEE',
  warning:      '#F57C00',
  shadow:       'rgba(46,125,50,0.12)',
};

// ─────────────────────────────────────────────────────────────────────────────
// InputField — reusable inside this file
// ─────────────────────────────────────────────────────────────────────────────
const InputField = ({ icon, placeholder, value, onChangeText, secureEntry = false,
  error = '', keyboardType = 'default', autoCapitalize = 'none',
  returnKeyType = 'next', onSubmitEditing, inputRef, style }) => {

  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    // Wrapper — controls gap below each input
    <View style={[{ marginBottom: 14 }, style]}>

      {/* Input box */}
      <View style={[
        iStyles.box,
        { borderColor: error ? C.error : focused ? C.borderFocus : C.border },
      ]}>
        {icon && (
          <MaterialIcons name={icon} size={20}
            color={focused ? C.greenLight : C.textLight}
            style={{ marginRight: 10 }}
          />
        )}

        <TextInput
          ref={inputRef}
          style={iStyles.input}
          placeholder={placeholder}
          placeholderTextColor={C.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureEntry && !showPass}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {secureEntry && (
          <TouchableOpacity onPress={() => setShowPass(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'}
              size={20} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {!!error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 4 }}>
          <MaterialIcons name="error-outline" size={12} color={C.error} />
          <Text style={iStyles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const iStyles = StyleSheet.create({
  box: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  C.inputBg,
    borderWidth:      1.5,
    borderRadius:     12,
    height:           52,       // ← input height
    paddingHorizontal: 14,      // ← inner left/right padding
  },
  input: {
    flex:          1,
    fontSize:      16,
    color:         C.textDark,
    paddingVertical: 0,
  },
  errorText: {
    fontSize:   11,
    color:      C.error,
    marginLeft: 4,
    fontWeight: '500',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PrimaryButton
// ─────────────────────────────────────────────────────────────────────────────
const PrimaryButton = ({ label, onPress, loading = false, disabled = false, style }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    disabled={disabled || loading}
    style={[bStyles.btn, (disabled || loading) && bStyles.btnDisabled, style]}
  >
    {loading
      ? <ActivityIndicator color={C.white} size="small" />
      : <Text style={bStyles.label}>{label}</Text>
    }
  </TouchableOpacity>
);

const bStyles = StyleSheet.create({
  btn: {
    backgroundColor: C.green,
    borderRadius:    14,
    height:          54,       // ← button height
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     C.greenDark,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.25,
    shadowRadius:    8,
    elevation:       5,
  },
  btnDisabled: {
    opacity:       0.6,
    elevation:     0,
    shadowOpacity: 0,
  },
  label: {
    color:         C.white,
    fontSize:      16,
    fontWeight:    '600',
    letterSpacing: 0.4,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// FloatingAlert
// ─────────────────────────────────────────────────────────────────────────────
const ALERT_MAP = {
  success: { icon: 'check-circle', bg: '#E8F5E9', border: '#2E7D32', text: '#2E7D32' },
  error:   { icon: 'error',        bg: '#FFEBEE', border: '#D32F2F', text: '#D32F2F' },
  info:    { icon: 'info',         bg: '#E1F5FE', border: '#0277BD', text: '#0277BD' },
};

const FloatingAlert = forwardRef((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [cfg, setCfg]         = useState({ type: 'info', message: '' });
  const translateY = useRef(new Animated.Value(-100)).current;
  const timer      = useRef(null);

  useImperativeHandle(ref, () => ({
    show({ type = 'info', message = '', duration = 3000 }) {
      if (timer.current) clearTimeout(timer.current);
      setCfg({ type, message });
      setVisible(true);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true })
          .start(() => setVisible(false));
      }, duration);
    },
  }));

  if (!visible) return null;
  const a = ALERT_MAP[cfg.type] || ALERT_MAP.info;

  return (
    <Animated.View style={[aStyles.wrapper, { transform: [{ translateY }] }]}>
      <View style={[aStyles.card, { backgroundColor: a.bg, borderLeftColor: a.border }]}>
        <MaterialIcons name={a.icon} size={22} color={a.text} style={{ marginRight: 10 }} />
        <Text style={[aStyles.msg, { color: a.text }]} numberOfLines={3}>{cfg.message}</Text>
      </View>
    </Animated.View>
  );
});

const aStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top:      52,         // ← gap from top of screen
    left:     16,
    right:    16,
    zIndex:   9999,
  },
  card: {
    flexDirection:    'row',
    alignItems:       'center',
    borderRadius:     12,
    borderLeftWidth:  4,
    paddingVertical:  12,
    paddingHorizontal: 14,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.1,
    shadowRadius:     8,
    elevation:        6,
  },
  msg: {
    flex:       1,
    fontSize:   13,
    fontWeight: '500',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PasswordStrengthBar (inline sub-component, only used here)
// ─────────────────────────────────────────────────────────────────────────────
const PasswordStrengthBar = ({ password }) => {
  const getScore = p => {
    let s = 0;
    if (p.length >= 8)              s++;
    if (/[A-Z]/.test(p))            s++;
    if (/[0-9]/.test(p))            s++;
    if (/[^A-Za-z0-9]/.test(p))    s++;
    return s;
  };
  const score  = getScore(password);
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [C.error, C.error, C.warning, C.greenLight, C.green];

  return (
    // Wrapper — sits between password input and confirm input
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: -4 }}>
      <View style={{ flexDirection: 'row', flex: 1, gap: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            backgroundColor: i <= score ? colors[score] : C.border,
          }} />
        ))}
      </View>
      <Text style={{ marginLeft: 10, fontSize: 11, fontWeight: '600', color: colors[score], minWidth: 50 }}>
        {labels[score]}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SignupScreen
// ─────────────────────────────────────────────────────────────────────────────
const SignupScreen = ({ navigation }) => {
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState({});

  const alertRef    = useRef();
  const lastRef     = useRef();
  const emailRef    = useRef();
  const passRef     = useRef();
  const confirmRef  = useRef();

  const clear = field => setErrors(e => ({ ...e, [field]: '' }));

  const validate = () => {
    const e = {};
    if (!firstName.trim())         e.firstName = 'Required.';
    if (!lastName.trim())          e.lastName  = 'Required.';
    if (!email.trim())             e.email     = 'Email is required.';
    else if (!email.includes('@')) e.email     = 'Enter a valid email.';
    if (!password)                 e.password  = 'Password is required.';
    else if (password.length < 8)  e.password  = 'At least 8 characters.';
    if (!confirm)                  e.confirm   = 'Please confirm password.';
    else if (confirm !== password) e.confirm   = 'Passwords do not match.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); // TODO: replace with real API
      alertRef.current?.show({ type: 'success', message: 'Account created! Welcome to Pamili 🎉' });
      navigation.replace('Home');
    } catch {
      alertRef.current?.show({ type: 'error', message: 'Registration failed. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FloatingAlert ref={alertRef} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Green header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="arrow-back-ios" size={22} color={C.white} />
          </TouchableOpacity>

          <MaterialIcons name="eco" size={38} color={C.white} />
          <Text style={s.logo}>Pamili</Text>
          <Text style={s.tagline}>Create your family account</Text>
        </View>

        {/* ── White card ───────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Join Pamili 🛒</Text>
          <Text style={s.cardSub}>Fill in your details to get started</Text>

          {/* First + Last name side by side */}
          <View style={s.nameRow}>
            <InputField icon="person" placeholder="First name" value={firstName}
              onChangeText={t => { setFirstName(t); clear('firstName'); }}
              autoCapitalize="words" error={errors.firstName}
              returnKeyType="next" onSubmitEditing={() => lastRef.current?.focus()}
              style={s.nameLeft}                         // ← controls width of first name field
            />
            <InputField placeholder="Last name" value={lastName}
              onChangeText={t => { setLastName(t); clear('lastName'); }}
              autoCapitalize="words" error={errors.lastName}
              inputRef={lastRef} returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              style={s.nameRight}                        // ← controls width of last name field
            />
          </View>

          <InputField icon="email" placeholder="Email address" value={email}
            onChangeText={t => { setEmail(t); clear('email'); }}
            keyboardType="email-address" error={errors.email}
            inputRef={emailRef} returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()} />

          <InputField icon="lock" placeholder="Password" value={password}
            onChangeText={t => { setPassword(t); clear('password'); }}
            secureEntry error={errors.password}
            inputRef={passRef} returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()} />

          {/* Password strength bar — shows when user starts typing */}
          {password.length > 0 && <PasswordStrengthBar password={password} />}

          <InputField icon="lock-outline" placeholder="Confirm password" value={confirm}
            onChangeText={t => { setConfirm(t); clear('confirm'); }}
            secureEntry error={errors.confirm}
            inputRef={confirmRef} returnKeyType="done"
            onSubmitEditing={handleSignup} />

          {/* Create account button */}
          <PrimaryButton label="Create Account" onPress={handleSignup}
            loading={loading} style={{ marginTop: 6, marginBottom: 16 }} />

          {/* Terms */}
          <Text style={s.terms}>
            By signing up you agree to our{' '}
            <Text style={s.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.termsLink}>Privacy Policy</Text>.
          </Text>

          {/* Back to login */}
          <View style={s.bottomRow}>
            <Text style={s.bottomPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.bottomLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.white,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Green header ────────────────────────────────────────────────────────
  header: {
    backgroundColor:  C.green,
    paddingTop:       160,       // ← space from top (status bar)
    paddingBottom:    46,       // ← space below tagline before card
    alignItems:       'center',
    gap:              6,        // ← gap between icon, logo, tagline
  },
  backBtn: {
    position: 'absolute',
    top:      60,               // ← must match paddingTop above
    left:     20,
  },
  logo: {
    fontSize:      34,          // ← "Pamili" size on signup screen
    fontWeight:    '800',
    color:         C.white,
    letterSpacing: -0.5,
    marginTop:     2,
  },
  tagline: {
    fontSize:  13,
    color:     'rgba(255,255,255,0.82)',
    letterSpacing: 0.3,
  },

  // ── White card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor:  C.white,
    marginHorizontal: 18,       // ← card side insets
    marginTop:        -24,      // ← overlap over green header
    borderRadius:     24,
    paddingHorizontal: 22,      // ← inner left/right padding
    paddingTop:       26,       // ← space above card title
    paddingBottom:    8,
    shadowColor:      C.shadow,
    shadowOffset:     { width: 0, height: 6 },
    shadowOpacity:    1,
    shadowRadius:     16,
    elevation:        8,
  },
  cardTitle: {
    fontSize:     22,
    fontWeight:   '700',
    color:        C.textDark,
    marginBottom: 4,
  },
  cardSub: {
    fontSize:     13,
    color:        C.textLight,
    marginBottom: 20,           // ← gap before first input
  },

  // ── Side-by-side name row ────────────────────────────────────────────────
  nameRow: {
    flexDirection: 'row',
    gap:           10,          // ← gap between first and last name fields
  },
  nameLeft: {
    flex: 1,                    // ← change to e.g. 1.2 to make first name wider
    marginBottom: 14,
  },
  nameRight: {
    flex: 1,
    marginBottom: 14,
  },

  // ── Terms text ──────────────────────────────────────────────────────────
  terms: {
    fontSize:   11,
    color:      C.textLight,
    textAlign:  'center',
    lineHeight: 11 * 1.6,
    marginBottom: 16,           // ← gap below terms before login row
  },
  termsLink: {
    color:      C.green,
    fontWeight: '600',
  },

  // ── Already have account row ─────────────────────────────────────────────
  bottomRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    paddingBottom:  10,
  },
  bottomPrompt: {
    fontSize: 13,
    color:    C.textLight,
  },
  bottomLink: {
    fontSize:   13,
    color:      C.green,
    fontWeight: '700',
  },
});