import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  StatusBar,
  Alert,
  Keyboard,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sql } from '../api/db';
import { clearSession } from '../api/session';
import LocationModal from '../components/LocationModal';

const C = {
  green:      '#2E7D32',
  greenLight: '#4CAF50',
  greenFaded: '#E8F5E9',
  greenDark:  '#1B5E20',
  white:      '#FFFFFF',
  border:     '#C8E6C9',
  borderFocus:'#2E7D32',
  textDark:   '#1A2E1A',
  textMid:    '#4A6045',
  textLight:  '#8A9E88',
  bg:         '#F7FAF7',
  error:      '#D32F2F',
  errorBg:    '#FFEBEE',
  accent:     '#FF6F00',
  accentBg:   '#FFF3E0',
};

const ProfileScreen = ({ user, onLogout, onUserUpdate }) => {
  const [firstName,  setFirstName]  = useState(user?.first_name ?? '');
  const [lastName,   setLastName]   = useState(user?.last_name  ?? '');
  const [email,      setEmail]      = useState(user?.email      ?? '');
  const [address,    setAddress]    = useState(user?.address    ?? '');
  const [activeField, setActiveField] = useState(null);
  const [isDirty,    setIsDirty]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPassword,   setNewPassword]   = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [passLoading,   setPassLoading]   = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const firstRef = useRef();
  const lastRef  = useRef();
  const emailRef = useRef();

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const fullName = `${firstName} ${lastName}`.trim() || 'Guest User';

  const dismissEditing = () => {
    Keyboard.dismiss();
    setActiveField(null);
  };

  const cancelEdits = () => {
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name   ?? '');
    setEmail(user?.email          ?? '');
    setAddress(user?.address      ?? '');
    setIsDirty(false);
    dismissEditing();
  };

  const handleChange = (field, value) => {
    if (field === 'firstName') setFirstName(value);
    if (field === 'lastName')  setLastName(value);
    if (field === 'email')     setEmail(value);
    setIsDirty(true);
  };

  const handleUpdate = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Validation', 'Enter a valid email address.');
      return;
    }
    setSaving(true);
    dismissEditing();
    try {
      await sql`
        UPDATE users
        SET first_name = ${firstName.trim()},
            last_name  = ${lastName.trim()},
            email      = ${email.trim()},
            address    = ${address.trim() || null}
        WHERE id = ${user.id}
      `;
      setIsDirty(false);
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          email:      email.trim(),
          address:    address.trim() || null,
        });
      }
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            onLogout();
          },
        },
      ]
    );
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Photo', 'This feature is coming soon!');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Validation', 'Password must be at least 8 characters.');
      return;
    }
    setPassLoading(true);
    try {
      await sql`
        UPDATE users SET password = ${newPassword} WHERE id = ${user.id}
      `;
      setNewPassword('');
      setShowPassModal(false);
      Alert.alert('Success', 'Password updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

const handleAddressSave = async (newAddress) => {
  setAddress(newAddress);
  // Save immediately to DB
  try {
    await sql`
      UPDATE users SET address = ${newAddress} WHERE id = ${user.id}
    `;
    if (onUserUpdate) {
      onUserUpdate({ ...user, address: newAddress });
    }
    Alert.alert('Saved', 'Your delivery address has been updated.');
  } catch (err) {
    Alert.alert('Error', err.message || 'Failed to save address.');
  }
};

  return (
    <TouchableWithoutFeedback onPress={dismissEditing}>
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.green} />

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Green header ── */}
          <View style={s.greenHeader}>
            <View style={s.headerTopRow}>
              <Text style={s.pageTitle}></Text>
              <TouchableOpacity style={s.settingsBtn} activeOpacity={0.8}>
                <MaterialIcons name="settings" size={20} color={C.white} />
              </TouchableOpacity>
            </View>

            <View style={s.avatarWrap}>
              <View style={s.avatarCircle}>
                <MaterialIcons name="person" size={52} color={C.green} />
              </View>
              <TouchableOpacity style={s.cameraBtn} onPress={handleChangePhoto} activeOpacity={0.8}>
                <MaterialIcons name="camera-alt" size={13} color={C.white} />
              </TouchableOpacity>
            </View>
            <Text style={s.nameText}>{fullName}</Text>
            <Text style={s.emailText}>{email || '—'}</Text>

            {/* Address chip under email */}
            {address ? (
              <TouchableOpacity
                style={s.addressChip}
                onPress={() => setShowLocationModal(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="location-on" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={s.addressChipText} numberOfLines={1}>{address}</Text>
                <MaterialIcons name="edit" size={11} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={s.addAddressChip}
                onPress={() => setShowLocationModal(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add-location-alt" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={s.addAddressText}>Add delivery address</Text>
              </TouchableOpacity>
            )}

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statVal}>24</Text>
                <Text style={s.statLbl}>Orders</Text>
              </View>
              <View style={s.statSep} />
              <View style={s.statBox}>
                <Text style={s.statVal}>₱4.2K</Text>
                <Text style={s.statLbl}>Saved</Text>
              </View>
              <View style={s.statSep} />
              <View style={s.statBox}>
                <Text style={s.statVal}>4.9★</Text>
                <Text style={s.statLbl}>Rating</Text>
              </View>
            </View>
          </View>

          <View style={s.body}>

            {/* Membership banner */}
            <View style={s.membershipBanner}>
              <View style={s.mbIcon}>
                <MaterialIcons name="verified" size={20} color={C.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.mbTitle}>Pamili Gold Member</Text>
                <Text style={s.mbSub}>Unlock exclusive deals & free delivery</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.white} />
            </View>

            {/* Account Details */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Account Details</Text>
              <View style={s.card}>
                <EditableRow
                  icon="person-outline"
                  label="First Name"
                  value={firstName}
                  inputRef={firstRef}
                  focused={activeField === 'firstName'}
                  onFocus={() => setActiveField('firstName')}
                  onChangeText={v => handleChange('firstName', v)}
                  returnKeyType="next"
                  onSubmitEditing={() => lastRef.current?.focus()}
                  autoCapitalize="words"
                />
                <Divider />
                <EditableRow
                  icon="person-outline"
                  label="Last Name"
                  value={lastName}
                  inputRef={lastRef}
                  focused={activeField === 'lastName'}
                  onFocus={() => setActiveField('lastName')}
                  onChangeText={v => handleChange('lastName', v)}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  autoCapitalize="words"
                />
                <Divider />
                <EditableRow
                  icon="email"
                  label="Email Address"
                  value={email}
                  inputRef={emailRef}
                  focused={activeField === 'email'}
                  onFocus={() => setActiveField('email')}
                  onChangeText={v => handleChange('email', v)}
                  returnKeyType="done"
                  onSubmitEditing={dismissEditing}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Divider />
                <ReadOnlyRow icon="phone" label="Phone Number" value="+63 917 123 4567" />
                <Divider />
                <ReadOnlyRow icon="calendar-today" label="Member Since" value={joined} />

                {isDirty && (
                  <View style={s.actionRow}>
                    <TouchableOpacity style={s.cancelBtn} onPress={cancelEdits} activeOpacity={0.7}>
                      <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.updateBtn} onPress={handleUpdate} activeOpacity={0.8} disabled={saving}>
                      {saving
                        ? <ActivityIndicator size="small" color={C.white} />
                        : <Text style={s.updateText}>Save Changes</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Preferences */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Preferences</Text>
              <View style={s.card}>
                {/* Delivery Address row — taps open LocationModal */}
                <SettingsRow
                  icon="location-on"
                  label="Delivery Address"
                  value={address || 'Not set — tap to add'}
                  valueColor={address ? C.textLight : C.accent}
                  onPress={() => setShowLocationModal(true)}
                />
                <Divider />
                <SettingsRow
                  icon="credit-card"
                  label="Payment Method"
                  value="GCash ••••4567"
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* Settings */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Settings</Text>
              <View style={s.card}>
                <SettingsRow icon="lock-outline"       label="Change Password" onPress={() => setShowPassModal(true)} />
                <Divider />
                <SettingsRow icon="notifications-none" label="Notifications"   onPress={() => {}} />
                <Divider />
                <SettingsRow icon="help-outline"        label="Help & Support"  onPress={() => {}} />
              </View>
            </View>

            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <MaterialIcons name="logout" size={18} color={C.error} />
              <Text style={s.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={s.version}>Pamili v1.0.0</Text>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ── Location Modal ── */}
        <LocationModal
          visible={showLocationModal}
          currentValue={address}
          onClose={() => setShowLocationModal(false)}
          onSave={handleAddressSave}
        />

        {/* ── Password Modal ── */}
        <Modal
          visible={showPassModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPassModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => { setShowPassModal(false); setNewPassword(''); }}>
            <View style={m.overlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={m.card}>
                  <View style={m.handle} />
                  <View style={m.iconCircle}>
                    <MaterialIcons name="lock-outline" size={28} color={C.green} />
                  </View>
                  <Text style={m.title}>Change Password</Text>
                  <Text style={m.subtitle}>Enter your new password below.</Text>

                  <View style={m.inputBox}>
                    <MaterialIcons name="lock" size={18} color={C.textLight} style={{ marginRight: 8 }} />
                    <TextInput
                      style={m.input}
                      placeholder="New password"
                      placeholderTextColor={C.textLight}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={18} color={C.textLight} />
                    </TouchableOpacity>
                  </View>

                  <View style={m.btnRow}>
                    <TouchableOpacity style={m.cancelBtn} onPress={() => { setShowPassModal(false); setNewPassword(''); }} activeOpacity={0.7}>
                      <Text style={m.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={m.saveBtn} onPress={handleChangePassword} activeOpacity={0.8} disabled={passLoading}>
                      {passLoading
                        ? <ActivityIndicator size="small" color={C.white} />
                        : <Text style={m.saveText}>Save</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

/* ── Sub-components ──────────────────────────────────────── */

const EditableRow = ({
  icon, label, value, inputRef, focused,
  onFocus, onChangeText, returnKeyType,
  onSubmitEditing, keyboardType = 'default', autoCapitalize = 'none',
}) => (
  <TouchableWithoutFeedback onPress={() => inputRef?.current?.focus()}>
    <View style={[r.row, focused && r.rowFocused]}>
      <View style={[r.iconWrap, focused && r.iconWrapFocused]}>
        <MaterialIcons name={icon} size={17} color={focused ? C.green : C.textLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={r.label}>{label}</Text>
        <TextInput
          ref={inputRef}
          style={[r.value, focused && r.valueFocused]}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          underlineColorAndroid="transparent"
        />
      </View>
      {focused && (
        <MaterialIcons name="edit" size={15} color={C.green} style={{ marginLeft: 4 }} />
      )}
    </View>
  </TouchableWithoutFeedback>
);

const ReadOnlyRow = ({ icon, label, value }) => (
  <View style={r.row}>
    <View style={r.iconWrap}>
      <MaterialIcons name={icon} size={17} color={C.textLight} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={r.label}>{label}</Text>
      <Text style={r.value}>{value}</Text>
    </View>
  </View>
);

const SettingsRow = ({ icon, label, value, onPress, valueColor }) => (
  <TouchableOpacity style={r.row} activeOpacity={0.7} onPress={onPress}>
    <View style={[r.iconWrap, r.iconWrapGreen]}>
      <MaterialIcons name={icon} size={17} color={C.green} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[r.value, { fontSize: 13 }]}>{label}</Text>
      {value ? <Text style={[r.label, valueColor && { color: valueColor }]}>{value}</Text> : null}
    </View>
    <MaterialIcons name="chevron-right" size={20} color={C.textLight} />
  </TouchableOpacity>
);

const Divider = () => <View style={r.divider} />;

/* ── StyleSheets ─────────────────────────────────────────── */

const r = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   12,
    paddingHorizontal: 14,
    gap:               10,
    backgroundColor:   C.white,
  },
  rowFocused: { backgroundColor: '#F0FAF0' },
  iconWrap: {
    width:           32,
    height:          32,
    borderRadius:    9,
    backgroundColor: '#F3F6F3',
    alignItems:      'center',
    justifyContent:  'center',
  },
  iconWrapFocused: { backgroundColor: C.greenFaded },
  iconWrapGreen:   { backgroundColor: C.greenFaded },
  label: {
    fontSize:     10,
    color:        C.textLight,
    fontWeight:   '500',
    marginBottom: 1,
  },
  value: {
    fontSize:   13,
    color:      C.textDark,
    fontWeight: '600',
    padding:    0,
    margin:     0,
  },
  valueFocused: { color: C.green },
  divider: {
    height:           1,
    backgroundColor:  C.border,
    marginHorizontal: 14,
  },
});

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1 },

  greenHeader: {
    backgroundColor:         C.green,
    paddingTop:              52,
    paddingBottom:           28,
    alignItems:              'center',
    borderBottomLeftRadius:  32,
    borderBottomRightRadius: 32,
  },
  headerTopRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    width:             '100%',
    paddingHorizontal: 20,
    marginBottom:      20,
  },
  pageTitle: {
    fontSize:      16,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarWrap:   { position: 'relative', marginBottom: 12 },
  avatarCircle: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     3,
    borderColor:     'rgba(255,255,255,0.5)',
  },
  cameraBtn: {
    position:        'absolute',
    bottom:          2,
    right:           2,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: C.greenDark,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     C.white,
  },
  nameText:  { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 3 },
  emailText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 8 },

  // Address chips under email
  addressChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   'rgba(255,255,255,0.15)',
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   5,
    marginBottom:      14,
    maxWidth:          '80%',
  },
  addressChipText: {
    fontSize:   11,
    color:      'rgba(255,255,255,0.9)',
    fontWeight: '600',
    flex:       1,
  },
  addAddressChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   'rgba(255,255,255,0.1)',
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical:   5,
    marginBottom:      14,
  },
  addAddressText: {
    fontSize:   11,
    color:      'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },

  statsRow: {
    flexDirection:    'row',
    backgroundColor:  'rgba(255,255,255,0.12)',
    borderRadius:     14,
    overflow:         'hidden',
    marginHorizontal: 24,
    width:            '85%',
  },
  statBox: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: 12,
    gap:             3,
  },
  statSep:  { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statVal:  { fontSize: 17, fontWeight: '800', color: C.white },
  statLbl:  { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  body: { paddingTop: 18 },

  membershipBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    backgroundColor:   C.accent,
    marginHorizontal:  18,
    marginBottom:      18,
    borderRadius:      14,
    paddingVertical:   14,
    paddingHorizontal: 16,
  },
  mbIcon: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  mbTitle: { fontSize: 13, fontWeight: '700', color: C.white },
  mbSub:   { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  section: {
    marginHorizontal: 18,
    marginBottom:     18,
  },
  sectionLabel: {
    fontSize:      11,
    fontWeight:    '700',
    color:         C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  8,
    marginLeft:    4,
  },
  card: {
    backgroundColor: C.white,
    borderRadius:    16,
    shadowColor:     '#1B5E20',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.08,
    shadowRadius:    10,
    elevation:       4,
    overflow:        'hidden',
  },

  actionRow: {
    flexDirection:   'row',
    gap:             10,
    padding:         14,
    borderTopWidth:  1,
    borderTopColor:  C.border,
    backgroundColor: '#FAFFFE',
  },
  cancelBtn: {
    flex:            1,
    paddingVertical: 11,
    borderRadius:    10,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     C.border,
    backgroundColor: C.white,
  },
  cancelText: { fontSize: 13, fontWeight: '600', color: C.textMid },
  updateBtn: {
    flex:            2,
    paddingVertical: 11,
    borderRadius:    10,
    alignItems:      'center',
    backgroundColor: C.green,
    elevation:       4,
  },
  updateText: { fontSize: 13, fontWeight: '700', color: C.white },

  logoutBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    marginHorizontal:  18,
    marginBottom:      12,
    paddingVertical:   14,
    borderRadius:      14,
    backgroundColor:   C.errorBg,
    borderWidth:       1.5,
    borderColor:       '#FFCDD2',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.error },
  version:    { textAlign: 'center', fontSize: 11, color: C.textLight, marginBottom: 6 },
});

const m = StyleSheet.create({
  overlay: {
    flex:              1,
    backgroundColor:   'rgba(0,0,0,0.45)',
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 28,
  },
  card: {
    width:             '100%',
    backgroundColor:   C.white,
    borderRadius:      24,
    paddingHorizontal: 24,
    paddingTop:        20,
    paddingBottom:     24,
    alignItems:        'center',
    elevation:         12,
  },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 18 },
  iconCircle: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    14,
  },
  title:    { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 6 },
  subtitle: { fontSize: 13, color: C.textLight, marginBottom: 22, textAlign: 'center' },
  inputBox: {
    flexDirection:     'row',
    alignItems:        'center',
    width:             '100%',
    backgroundColor:   '#F1F8F1',
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       C.border,
    paddingHorizontal: 14,
    height:            50,
    marginBottom:      20,
  },
  input:     { flex: 1, fontSize: 15, color: C.textDark, padding: 0 },
  btnRow:    { flexDirection: 'row', width: '100%', gap: 10 },
  cancelBtn: {
    flex:            1,
    paddingVertical: 13,
    borderRadius:    12,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     C.border,
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: C.textMid },
  saveBtn: {
    flex:            2,
    paddingVertical: 13,
    borderRadius:    12,
    alignItems:      'center',
    backgroundColor: C.green,
    elevation:       4,
  },
  saveText: { fontSize: 14, fontWeight: '700', color: C.white },
});

export default ProfileScreen;