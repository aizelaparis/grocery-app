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
import { loginUser } from '../api/auth';

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
  shadow:       'rgba(46,125,50,0.12)',
};

const ALERT_MAP = {
  success: { icon: 'check-circle', bg: '#E8F5E9', border: '#2E7D32', text: '#2E7D32' },
  error:   { icon: 'error',        bg: '#FFEBEE', border: '#D32F2F', text: '#D32F2F' },
  info:    { icon: 'info',         bg: '#E1F5FE', border: '#0277BD', text: '#0277BD' },
};

// ─── InputField ───────────────────────────────────────────────────────────────
const InputField = ({
  icon, placeholder, value, onChangeText, secureEntry = false,
  error = '', keyboardType = 'default', autoCapitalize = 'none',
  returnKeyType = 'next', onSubmitEditing, inputRef,
}) => {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[iStyles.box, { borderColor: error ? C.error : focused ? C.borderFocus : C.border }]}>
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
            <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={C.textLight} />
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

// ─── PrimaryButton ────────────────────────────────────────────────────────────
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

// ─── FloatingAlert ────────────────────────────────────────────────────────────
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

// ─── LoginScreen ──────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState({});

  const alertRef    = useRef();
  const passwordRef = useRef();

  const validate = () => {
    const e = {};
    if (!email.trim())             e.email    = 'Email is required.';
    else if (!email.includes('@')) e.email    = 'Enter a valid email.';
    if (!password)                 e.password = 'Password is required.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const loggedInUser = await loginUser({ email, password });
      alertRef.current?.show({ type: 'success', message: 'Welcome back!' });
      setTimeout(() => navigation.replace('Home', { user: loggedInUser }), 1500);
    } catch (err) {
      alertRef.current?.show({ type: 'error', message: err.message || 'Invalid credentials. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      alertRef.current?.show({ type: 'info', message: 'Enter your email first.' });
      return;
    }
    alertRef.current?.show({ type: 'info', message: `Reset link sent to ${email}` });
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FloatingAlert ref={alertRef} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <MaterialIcons name="eco" size={44} color={C.white} />
          <Text style={s.logo}>Pamili</Text>
          <Text style={s.tagline}>Your family grocery companion</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome back 👋</Text>
          <Text style={s.cardSub}>Sign in to continue</Text>

          <InputField
            icon="email" placeholder="Email address" value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
            keyboardType="email-address" error={errors.email}
            returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <InputField
            icon="lock" placeholder="Password" value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
            secureEntry error={errors.password} inputRef={passwordRef}
            returnKeyType="done" onSubmitEditing={handleLogin}
          />

          <View style={s.optRow}>
            <TouchableOpacity style={s.remRow} onPress={() => setRememberMe(v => !v)} activeOpacity={0.7}>
              <View style={[s.checkbox, rememberMe && s.checkboxOn]}>
                {rememberMe && <MaterialIcons name="check" size={13} color={C.white} />}
              </View>
              <Text style={s.remText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} style={{ marginBottom: 20 }} />

          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>or</Text>
            <View style={s.divLine} />
          </View>

          <View style={s.bottomRow}>
            <Text style={s.bottomPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={s.bottomLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const iStyles = StyleSheet.create({
  box: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.inputBg,
    borderWidth:       1.5,
    borderRadius:      12,
    height:            52,
    paddingHorizontal: 14,
  },
  input: {
    flex:            1,
    fontSize:        16,
    color:           C.textDark,
    paddingVertical: 0,
  },
  errorText: {
    fontSize:   11,
    color:      C.error,
    marginLeft: 4,
    fontWeight: '500',
  },
});

const bStyles = StyleSheet.create({
  btn: {
    backgroundColor: C.green,
    borderRadius:    14,
    height:          54,
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

const aStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top:      52,
    left:     16,
    right:    16,
    zIndex:   9999,
  },
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      12,
    borderLeftWidth:   4,
    paddingVertical:   12,
    paddingHorizontal: 14,
    shadowColor:       '#000',
    shadowOffset:      { width: 10, height: 14 },
    shadowOpacity:     0.5,
    shadowRadius:      18,
    elevation:         16,
  },
  msg: {
    flex:       1,
    fontSize:   13,
    fontWeight: '500',
  },
});

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.white },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: C.green,
    paddingTop:      190,
    paddingBottom:   52,
    alignItems:      'center',
  },
  logo: {
    fontSize:      40,
    fontWeight:    '800',
    color:         C.white,
    letterSpacing: -1,
    marginTop:     8,
  },
  tagline: {
    fontSize:      13,
    color:         'rgba(255,255,255,0.82)',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor:   C.white,
    marginHorizontal:  18,
    marginTop:         -28,
    borderRadius:      24,
    paddingHorizontal: 22,
    paddingTop:        28,
    paddingBottom:     8,
    shadowColor:       C.shadow,
    shadowOffset:      { width: 0, height: 6 },
    shadowOpacity:     1,
    shadowRadius:      16,
    elevation:         8,
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
    marginBottom: 24,
  },
  optRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   22,
    marginTop:      2,
  },
  remRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  checkbox: {
    width:           20,
    height:          20,
    borderRadius:    5,
    borderWidth:     1.5,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: C.white,
  },
  checkboxOn: {
    backgroundColor: C.green,
    borderColor:     C.green,
  },
  remText: {
    fontSize:   13,
    color:      C.textMid,
    fontWeight: '500',
  },
  forgotText: {
    fontSize:   13,
    color:      C.green,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  18,
  },
  divLine: {
    flex:            1,
    height:          1,
    backgroundColor: C.border,
  },
  divText: {
    marginHorizontal: 12,
    fontSize:         13,
    color:            C.textLight,
  },
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