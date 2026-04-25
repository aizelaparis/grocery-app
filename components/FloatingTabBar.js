import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const C = {
  green:      '#2E7D32',
  greenFaded: '#E8F5E9',
  white:      '#FFFFFF',
  accent:     '#FF6F00',
  inactive:   '#A5B4A3',
  border:     '#C8E6C9',
};

const TABS = [
  { key: 'Home',    icon: 'home',          label: 'Home' },
  { key: 'Category',  icon: 'grid-view',     label: 'Browse' },
  { key: 'Cart',    icon: 'shopping-cart', label: 'Cart' },
  { key: 'Orders',  icon: 'receipt-long',  label: 'Orders' },
  { key: 'Profile', icon: 'person',        label: 'Profile' },
];

const FloatingTabBar = ({ activeTab, onTabPress, cartCount = 0 }) => {
  return (
    <View style={s.wrapper} pointerEvents="box-none">
      <View style={s.bar}>
        {TABS.map(tab => {
          const active     = activeTab === tab.key;
          const showBadge  = tab.key === 'Cart' && cartCount > 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={s.tabItem}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[s.iconWrap, active && s.iconWrapActive]}>
                <MaterialIcons
                  name={tab.icon}
                  size={active ? 23 : 21}
                  color={active ? C.green : C.inactive}
                />
                {showBadge && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.label, active && s.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default FloatingTabBar;

const s = StyleSheet.create({
  wrapper: {
    position:         'absolute',
    bottom:           15,
    left:             18,
    right:            18,
    zIndex:           999,
    alignItems:       'center',
  },
  bar: {
    flexDirection:    'row',
    backgroundColor:  C.white,
    borderRadius:     32,
    paddingVertical:  10,
    paddingHorizontal: 8,
    width:            '100%',
    shadowColor:      '#1B5E20',
    shadowOffset:     { width: 0, height: 8 },
    shadowOpacity:    0.18,
    shadowRadius:     20,
    elevation:        16,
    borderWidth:      1,
    borderColor:      'rgba(200,230,201,0.6)',
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  },
  iconWrap: {
    width:           40,
    height:          30,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    12,
    position:        'relative',
  },
  iconWrapActive: {
    backgroundColor: C.greenFaded,
  },
  label: {
    fontSize:   9,
    color:      C.inactive,
    fontWeight: '500',
  },
  labelActive: {
    color:      C.green,
    fontWeight: '700',
  },
  badge: {
    position:         'absolute',
    top:              0,
    right:            0,
    minWidth:         15,
    height:           15,
    borderRadius:     8,
    backgroundColor:  C.accent,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 3,
    borderWidth:      1.5,
    borderColor:      C.white,
  },
  badgeText: {
    fontSize:   8,
    color:      C.white,
    fontWeight: '800',
  },
});