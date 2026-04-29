import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const C = {
  green:      '#2E7D32',
  greenLight: '#4CAF50',
  greenFaded: '#E8F5E9',
  greenDark:  '#1B5E20',
  white:      '#FFFFFF',
  border:     '#C8E6C9',
  textDark:   '#1A2E1A',
  textMid:    '#4A6045',
  textLight:  '#8A9E88',
  bg:         '#F7FAF7',
  accent:     '#FF6F00',
  accentBg:   '#FFF3E0',
  error:      '#D32F2F',
  errorBg:    '#FFEBEE',
  overlay:    'rgba(10,30,10,0.55)',
};

/**
 * LocationModal
 *
 * Props:
 *   visible      {boolean}
 *   currentValue {string}   — pre-fills the input
 *   onClose      {() => void}
 *   onSave       {(address: string) => void}
 */
const LocationModal = ({ visible, currentValue = '', onClose, onSave }) => {
  const slideAnim   = useRef(new Animated.Value(600)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  const [address,   setAddress]   = useState(currentValue);
  const [scanning,  setScanning]  = useState(false);
  const [scanError, setScanError] = useState('');
  const inputRef = useRef();

  // Sync pre-fill when modal opens
  useEffect(() => {
    if (visible) {
      setAddress(currentValue);
      setScanError('');
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 260, useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0, tension: 70, friction: 12, useNativeDriver: true,
        }),
      ]).start(() => {
        // slight delay so keyboard doesn't fight the animation
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0, duration: 200, useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 600, duration: 220, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Pulse animation for the scan button while scanning
  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [scanning]);

  const handleScan = async () => {
    setScanError('');
    setScanning(true);
    Keyboard.dismiss();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setScanError('Location permission denied. Please enable it in Settings.');
        setScanning(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (place) {
        const parts = [
          place.street,
          place.district,
          place.city || place.subregion,
          place.region,
        ].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        setScanError('Could not resolve address. Please type it manually.');
      }
    } catch (err) {
      setScanError('Failed to get location. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = () => {
    if (!address.trim()) {
      setScanError('Please enter or scan an address.');
      return;
    }
    Keyboard.dismiss();
    onSave(address.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dimmed backdrop */}
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sliding sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Drag handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerIcon}>
            <MaterialIcons name="location-on" size={20} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Delivery Address</Text>
            <Text style={s.subtitle}>Type your address or scan your location</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="close" size={16} color={C.textMid} />
          </TouchableOpacity>
        </View>

        {/* Input area */}
        <View style={s.body}>

          {/* Text input */}
          <View style={s.inputLabel}>
            <MaterialIcons name="edit-location-alt" size={14} color={C.textLight} />
            <Text style={s.inputLabelText}>Address</Text>
          </View>
          <View style={s.inputBox}>
            <MaterialIcons name="home" size={18} color={C.textLight} style={{ marginRight: 10 }} />
            <TextInput
              ref={inputRef}
              style={s.input}
              placeholder="e.g. 123 Rizal St, Davao City"
              placeholderTextColor={C.textLight}
              value={address}
              onChangeText={t => { setAddress(t); setScanError(''); }}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              blurOnSubmit
              autoCapitalize="words"
            />
            {address.length > 0 && (
              <TouchableOpacity onPress={() => setAddress('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="cancel" size={16} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Divider with OR */}
          <View style={s.dividerRow}>
            <View style={s.divLine} />
            <Text style={s.divText}>or</Text>
            <View style={s.divLine} />
          </View>

          {/* Scan button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[s.scanBtn, scanning && s.scanBtnActive]}
              onPress={handleScan}
              activeOpacity={0.85}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <ActivityIndicator size="small" color={C.green} />
                  <Text style={s.scanBtnText}>Scanning your location…</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="my-location" size={18} color={C.green} />
                  <Text style={s.scanBtnText}>Use My Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Scan hint */}
          {!scanError && !scanning && (
            <View style={s.hintRow}>
              <MaterialIcons name="info-outline" size={12} color={C.textLight} />
              <Text style={s.hintText}>
                We'll fill in your address automatically using GPS.
              </Text>
            </View>
          )}

          {/* Error message */}
          {!!scanError && (
            <View style={s.errorRow}>
              <MaterialIcons name="error-outline" size={13} color={C.error} />
              <Text style={s.errorText}>{scanError}</Text>
            </View>
          )}

        </View>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.saveBtn, !address.trim() && s.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!address.trim()}
          >
            <MaterialIcons name="check" size={16} color={C.white} />
            <Text style={s.saveText}>Save Address</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </Modal>
  );
};

export default LocationModal;

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  sheet: {
    position:             'absolute',
    bottom:               0,
    left:                 0,
    right:                0,
    backgroundColor:      C.white,
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -6 },
    shadowOpacity:        0.15,
    shadowRadius:         20,
    elevation:            24,
    paddingBottom:        Platform.OS === 'ios' ? 34 : 24,
  },
  handle: {
    width:           44,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#D0D8CF',
    alignSelf:       'center',
    marginTop:       12,
    marginBottom:    8,
  },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerIcon: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title:    { fontSize: 15, fontWeight: '800', color: C.textDark },
  subtitle: { fontSize: 11, color: C.textLight, marginTop: 1, fontWeight: '500' },
  closeBtn: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: '#F2F4F1',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop:        18,
    paddingBottom:     8,
  },
  inputLabel: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    marginBottom:   7,
  },
  inputLabelText: {
    fontSize:   11,
    fontWeight: '700',
    color:      C.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    backgroundColor:   C.bg,
    borderRadius:      14,
    borderWidth:       1.5,
    borderColor:       C.border,
    paddingHorizontal: 14,
    paddingVertical:   12,
    minHeight:         56,
  },
  input: {
    flex:       1,
    fontSize:   14,
    color:      C.textDark,
    fontWeight: '500',
    lineHeight: 20,
    padding:    0,
    paddingTop: 1,
  },

  // Divider
  dividerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: 16,
    gap:            10,
  },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { fontSize: 11, color: C.textLight, fontWeight: '600' },

  // Scan button
  scanBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               10,
    backgroundColor:   C.greenFaded,
    borderRadius:      14,
    borderWidth:       1.5,
    borderColor:       C.border,
    paddingVertical:   14,
  },
  scanBtnActive: {
    borderColor:     C.green,
    backgroundColor: '#D6EED6',
  },
  scanBtnText: {
    fontSize:   14,
    fontWeight: '700',
    color:      C.green,
  },

  // Hint / error
  hintRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    marginTop:      10,
  },
  hintText:  { fontSize: 11, color: C.textLight, fontWeight: '500', flex: 1 },
  errorRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: C.errorBg,
    borderRadius:    8,
    padding:         10,
    marginTop:       10,
  },
  errorText: { fontSize: 12, color: C.error, fontWeight: '500', flex: 1 },

  // Footer
  footer: {
    flexDirection:     'row',
    gap:               12,
    paddingHorizontal: 20,
    paddingTop:        14,
    borderTopWidth:    1,
    borderTopColor:    C.border,
  },
  cancelBtn: {
    flex:            1,
    paddingVertical: 13,
    borderRadius:    12,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     C.border,
    backgroundColor: C.white,
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: C.textMid },
  saveBtn: {
    flex:              2,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               7,
    paddingVertical:   13,
    borderRadius:      12,
    backgroundColor:   C.green,
    elevation:         4,
    shadowColor:       C.greenDark,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.3,
    shadowRadius:      8,
  },
  saveBtnDisabled: { backgroundColor: '#B0BEB0', elevation: 0, shadowOpacity: 0 },
  saveText: { fontSize: 14, fontWeight: '700', color: C.white },
});