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
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../api/db';

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
 *   currentValue {string}   — pre-fills the custom input
 *   onClose      {() => void}
 *   onSave       {(address: string) => void}
 */
const LocationModal = ({ visible, currentValue = '', onClose, onSave }) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const [locations,    setLocations]    = useState([]);   // all active locations from DB
  const [loadingLocs,  setLoadingLocs]  = useState(false);
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState(null); // { id, label, area }
  const [customText,   setCustomText]   = useState('');
  const [useCustom,    setUseCustom]    = useState(false);
  const [error,        setError]        = useState('');

  const searchRef = useRef();

  // ── Fetch locations from DB ──────────────────────────────
const fetchLocations = async () => {
  setLoadingLocs(true);
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, label, area')
      .eq('status', 'active')
      .order('area', { ascending: true })
      .order('label', { ascending: true });

    if (error) throw error;
    setLocations(data ?? []);
  } catch (err) {
    setError('Could not load locations. You can type your address manually.');
  } finally {
    setLoadingLocs(false);
  }
};

  // ── Slide animation on visibility change ────────────────
  useEffect(() => {
    if (visible) {
      // Reset state when opening
      setSearch('');
      setError('');
      setUseCustom(false);
      setSelected(null);
      setCustomText(currentValue);

      fetchLocations();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 260, useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0, tension: 70, friction: 12, useNativeDriver: true,
        }),
      ]).start();
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

  // ── Filtered list based on search ───────────────────────
  const filtered = locations.filter(loc => {
    const q = search.toLowerCase();
    return (
      loc.label.toLowerCase().includes(q) ||
      loc.area.toLowerCase().includes(q)
    );
  });

  // Group filtered results by area
  const grouped = filtered.reduce((acc, loc) => {
    if (!acc[loc.area]) acc[loc.area] = [];
    acc[loc.area].push(loc);
    return acc;
  }, {});

  const groupedKeys = Object.keys(grouped).sort();

  // ── Save handler ─────────────────────────────────────────
  const handleSave = () => {
    Keyboard.dismiss();
    if (useCustom) {
      if (!customText.trim()) {
        setError('Please enter your address.');
        return;
      }
      onSave(customText.trim());
    } else {
      if (!selected) {
        setError('Please select a location or type a custom address.');
        return;
      }
      // Format: "Gate 1 Form 1378 · Main Compound"
      onSave(`${selected.label} · ${selected.area}`);
    }
    onClose();
  };

  // ── Render a single location row ─────────────────────────
  const LocationRow = ({ item }) => {
    const isSelected = selected?.id === item.id && !useCustom;
    return (
      <TouchableOpacity
        style={[ls.row, isSelected && ls.rowSelected]}
        onPress={() => {
          setSelected(item);
          setUseCustom(false);
          setError('');
        }}
        activeOpacity={0.7}
      >
        <View style={[ls.dot, isSelected && ls.dotSelected]}>
          {isSelected && <View style={ls.dotInner} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[ls.rowLabel, isSelected && ls.rowLabelSelected]}>
            {item.label}
          </Text>
          <Text style={ls.rowArea}>{item.area}</Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check-circle" size={18} color={C.green} />
        )}
      </TouchableOpacity>
    );
  };

  // ── What to render inside the list ──────────────────────
  const renderContent = () => {
    if (loadingLocs) {
      return (
        <View style={s.centerWrap}>
          <ActivityIndicator size="small" color={C.green} />
          <Text style={s.loadingText}>Loading locations…</Text>
        </View>
      );
    }

    if (locations.length === 0) {
      return (
        <View style={s.centerWrap}>
          <MaterialIcons name="location-off" size={32} color={C.textLight} />
          <Text style={s.emptyTitle}>No locations found</Text>
          <Text style={s.emptyText}>Use the custom field below to type your address.</Text>
        </View>
      );
    }

    if (filtered.length === 0 && search.length > 0) {
      return (
        <View style={s.centerWrap}>
          <MaterialIcons name="search-off" size={28} color={C.textLight} />
          <Text style={s.emptyTitle}>No matches for "{search}"</Text>
          <Text style={s.emptyText}>Try a different keyword or type your address below.</Text>
        </View>
      );
    }

    return (
      <>
        {groupedKeys.map(area => (
          <View key={area}>
            {/* Area group header */}
            <View style={ls.areaHeader}>
              <MaterialIcons name="place" size={12} color={C.textLight} />
              <Text style={ls.areaLabel}>{area}</Text>
            </View>
            {grouped[area].map(item => (
              <LocationRow key={String(item.id)} item={item} />
            ))}
          </View>
        ))}
      </>
    );
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
            <Text style={s.title}>Delivery Location</Text>
            <Text style={s.subtitle}>Pick from a location or type your own</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="close" size={16} color={C.textMid} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={s.searchWrap}>
          <MaterialIcons name="search" size={18} color={C.textLight} style={{ marginRight: 8 }} />
          <TextInput
            ref={searchRef}
            style={s.searchInput}
            placeholder="Search gates, buildings, areas…"
            placeholderTextColor={C.textLight}
            value={search}
            onChangeText={t => { setSearch(t); setError(''); }}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="cancel" size={16} color={C.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Locations list */}
        <View style={s.listWrap}>
          {renderContent()}
        </View>

        {/* Divider with OR */}
        <View style={s.dividerRow}>
          <View style={s.divLine} />
          <Text style={s.divText}>or type manually</Text>
          <View style={s.divLine} />
        </View>

        {/* Custom address input */}
        <View style={s.customSection}>
          <TouchableOpacity
            style={[s.customToggle, useCustom && s.customToggleActive]}
            onPress={() => {
              setUseCustom(v => !v);
              setSelected(null);
              setError('');
            }}
            activeOpacity={0.8}
          >
            <View style={[s.customCheck, useCustom && s.customCheckActive]}>
              {useCustom && <MaterialIcons name="check" size={12} color={C.white} />}
            </View>
            <Text style={[s.customToggleText, useCustom && { color: C.green }]}>
              Enter a custom address
            </Text>
          </TouchableOpacity>

          {useCustom && (
            <View style={s.customInputBox}>
              <MaterialIcons name="home" size={16} color={C.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={s.customInput}
                placeholder="e.g. Block 4, Lot 12, Phase 2…"
                placeholderTextColor={C.textLight}
                value={customText}
                onChangeText={t => { setCustomText(t); setError(''); }}
                multiline
                returnKeyType="done"
                blurOnSubmit
                autoCapitalize="words"
                autoFocus
              />
              {customText.length > 0 && (
                <TouchableOpacity onPress={() => setCustomText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="cancel" size={15} color={C.textLight} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Error */}
        {!!error && (
          <View style={s.errorRow}>
            <MaterialIcons name="error-outline" size={13} color={C.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.saveBtn,
              (!selected && (!useCustom || !customText.trim())) && s.saveBtnDisabled,
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <MaterialIcons name="check" size={16} color={C.white} />
            <Text style={s.saveText}>Save Location</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </Modal>
  );
};

export default LocationModal;

// ── Location row styles ───────────────────────────────────────────
const ls = StyleSheet.create({
  areaHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 14,
    paddingTop:        10,
    paddingBottom:     4,
  },
  areaLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         C.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 14,
    paddingVertical:   11,
    backgroundColor:   C.white,
  },
  rowSelected: {
    backgroundColor: C.greenFaded,
  },
  dot: {
    width:           18,
    height:          18,
    borderRadius:    9,
    borderWidth:     2,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dotSelected: {
    borderColor: C.green,
  },
  dotInner: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: C.green,
  },
  rowLabel: {
    fontSize:   13,
    fontWeight: '600',
    color:      C.textDark,
  },
  rowLabelSelected: {
    color: C.green,
  },
  rowArea: {
    fontSize:   11,
    color:      C.textLight,
    fontWeight: '500',
    marginTop:  1,
  },
});

// ── Main styles ───────────────────────────────────────────────────
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
    maxHeight:            '88%',
    paddingBottom:        Platform.OS === 'ios' ? 34 : 20,
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

  // Search
  searchWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.bg,
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       C.border,
    marginHorizontal:  16,
    marginVertical:    12,
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  searchInput: {
    flex:       1,
    fontSize:   14,
    color:      C.textDark,
    fontWeight: '500',
    padding:    0,
  },

  // List
  listWrap: {
    maxHeight:        220,
    borderTopWidth:   1,
    borderTopColor:   C.border,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor:  C.white,
  },

  centerWrap: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 24,
    gap:             6,
  },
  loadingText: { fontSize: 12, color: C.textLight, fontWeight: '500' },
  emptyTitle:  { fontSize: 13, fontWeight: '700', color: C.textMid },
  emptyText:   { fontSize: 11, color: C.textLight, textAlign: 'center', paddingHorizontal: 32 },

  // Divider
  dividerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  16,
    marginVertical:    12,
    gap:               10,
  },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { fontSize: 11, color: C.textLight, fontWeight: '600' },

  // Custom address
  customSection: {
    paddingHorizontal: 16,
    gap:               10,
    marginBottom:      4,
  },
  customToggle: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    backgroundColor:   C.bg,
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       C.border,
    paddingHorizontal: 14,
    paddingVertical:   11,
  },
  customToggleActive: {
    borderColor:     C.green,
    backgroundColor: C.greenFaded,
  },
  customCheck: {
    width:           20,
    height:          20,
    borderRadius:    6,
    borderWidth:     2,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: C.white,
  },
  customCheckActive: {
    backgroundColor: C.green,
    borderColor:     C.green,
  },
  customToggleText: {
    fontSize:   13,
    fontWeight: '600',
    color:      C.textMid,
  },
  customInputBox: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    backgroundColor:   C.bg,
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       C.green,
    paddingHorizontal: 12,
    paddingVertical:   10,
    minHeight:         52,
    gap:               4,
  },
  customInput: {
    flex:       1,
    fontSize:   14,
    color:      C.textDark,
    fontWeight: '500',
    lineHeight: 20,
    padding:    0,
    paddingTop: 1,
  },

  // Error
  errorRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   C.errorBg,
    borderRadius:      8,
    paddingHorizontal: 14,
    paddingVertical:   9,
    marginHorizontal:  16,
    marginBottom:      8,
  },
  errorText: { fontSize: 12, color: C.error, fontWeight: '500', flex: 1 },

  // Footer
  footer: {
    flexDirection:     'row',
    gap:               12,
    paddingHorizontal: 16,
    paddingTop:        12,
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
  saveBtnDisabled: {
    backgroundColor: '#B0BEB0',
    elevation:       0,
    shadowOpacity:   0,
  },
  saveText: { fontSize: 14, fontWeight: '700', color: C.white },
});