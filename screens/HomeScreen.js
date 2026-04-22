import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FloatingTabBar from '../components/FloatingTabBar';

const C = {
  green:       '#2E7D32',
  greenLight:  '#4CAF50',
  greenFaded:  '#E8F5E9',
  greenDark:   '#1B5E20',
  white:       '#FFFFFF',
  border:      '#C8E6C9',
  textDark:    '#1A2E1A',
  textMid:     '#4A6045',
  textLight:   '#8A9E88',
  bg:          '#F7FAF7',
  accent:      '#FF6F00',
};

const CATEGORIES = [
  { id: '1', label: 'Fruits',    icon: 'local-florist', color: '#E8F5E9', shadow: '#A5D6A7' },
  { id: '2', label: 'Veggies',   icon: 'eco',           color: '#F1F8E9', shadow: '#C5E1A5' },
  { id: '3', label: 'Dairy',     icon: 'local-drink',   color: '#E3F2FD', shadow: '#90CAF9' },
  { id: '4', label: 'Meat',      icon: 'restaurant',    color: '#FFF3E0', shadow: '#FFCC80' },
  { id: '5', label: 'Bakery',    icon: 'cake',          color: '#FCE4EC', shadow: '#F48FB1' },
  { id: '6', label: 'Beverages', icon: 'coffee',        color: '#EDE7F6', shadow: '#CE93D8' },
];

const FEATURED = [
  { id: '1', name: 'Fresh Mangoes',     price: '₱120', unit: '/kg',   tag: 'Sale',    emoji: '🥭' },
  { id: '2', name: 'Brown Eggs (12pc)', price: '₱95',  unit: '/tray', tag: 'Popular', emoji: '🥚' },
  { id: '3', name: 'Whole Milk 1L',     price: '₱75',  unit: '/pc',   tag: 'New',     emoji: '🥛' },
  { id: '4', name: 'White Bread',       price: '₱55',  unit: '/loaf', tag: null,      emoji: '🍞' },
  { id: '5', name: 'Ripe Bananas',      price: '₱40',  unit: '/kg',   tag: 'Sale',    emoji: '🍌' },
  { id: '6', name: 'Tomatoes',          price: '₱65',  unit: '/kg',   tag: null,      emoji: '🍅' },
];

const TAG_COLORS = {
  Sale:    { bg: '#FFF3E0', text: '#E65100' },
  Popular: { bg: '#E8F5E9', text: '#2E7D32' },
  New:     { bg: '#E3F2FD', text: '#1565C0' },
};

const PlaceholderTab = ({ label, icon }) => (
  <View style={ph.wrap}>
    <MaterialIcons name={icon} size={52} color={C.border} />
    <Text style={ph.title}>{label}</Text>
    <Text style={ph.sub}>Coming soon</Text>
  </View>
);

const ph = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 10 },
  title: { fontSize: 20, fontWeight: '700', color: C.textDark },
  sub:   { fontSize: 13, color: C.textLight },
});

const HomeTabContent = ({ onAddToCart }) => {
  const [search, setSearch] = useState('');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={hs.topBar}>
        <View>
          <Text style={hs.greeting}>Good morning! 👋</Text>
          <Text style={hs.subGreeting}>What are you shopping for today?</Text>
        </View>
        <TouchableOpacity style={hs.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={C.green} />
          <View style={hs.notifDot} />
        </TouchableOpacity>
      </View>

      <View style={hs.searchBar}>
        <MaterialIcons name="search" size={20} color={C.textLight} style={{ marginRight: 8 }} />
        <TextInput
          style={hs.searchInput}
          placeholder="Search groceries..."
          placeholderTextColor={C.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <View style={hs.promoBanner}>
        <View style={{ flex: 1 }}>
          <Text style={hs.promoTag}>🎉 Weekly Deals</Text>
          <Text style={hs.promoTitle}>Fresh picks,{'\n'}better prices</Text>
          <TouchableOpacity style={hs.promoBtn}>
            <Text style={hs.promoBtnText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 62, lineHeight: 70 }}>🛒</Text>
      </View>

      <View style={hs.sectionHeader}>
        <Text style={hs.sectionTitle}>Categories</Text>
        <TouchableOpacity><Text style={hs.seeAll}>See all</Text></TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={hs.catRow}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[hs.catCard, { backgroundColor: cat.color, shadowColor: cat.shadow }]}
            activeOpacity={0.8}
          >
            <MaterialIcons name={cat.icon} size={22} color={C.green} />
            <Text style={hs.catLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={hs.sectionHeader}>
        <Text style={hs.sectionTitle}>Featured Items</Text>
        <TouchableOpacity><Text style={hs.seeAll}>See all</Text></TouchableOpacity>
      </View>

      <View style={hs.featuredGrid}>
        {FEATURED.map(item => (
          <View key={item.id} style={hs.productCard}>
            <View style={hs.productEmoji}>
              <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
            </View>
            {item.tag && (
              <View style={[hs.productTag, { backgroundColor: TAG_COLORS[item.tag]?.bg }]}>
                <Text style={[hs.productTagText, { color: TAG_COLORS[item.tag]?.text }]}>
                  {item.tag}
                </Text>
              </View>
            )}
            {!item.tag && <View style={{ height: 18 }} />}
            <Text style={hs.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={hs.productPrice}>
              {item.price}<Text style={hs.productUnit}>{item.unit}</Text>
            </Text>
            <TouchableOpacity style={hs.addBtn} onPress={onAddToCart}>
              <MaterialIcons name="add" size={16} color={C.white} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [cartCount, setCartCount] = useState(2);

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':    return <HomeTabContent onAddToCart={() => setCartCount(v => v + 1)} />;
      case 'Browse':  return <PlaceholderTab label="Browse"  icon="grid-view" />;
      case 'Cart':    return <PlaceholderTab label="Cart"    icon="shopping-cart" />;
      case 'Orders':  return <PlaceholderTab label="Orders"  icon="receipt-long" />;
      case 'Profile': return <PlaceholderTab label="Profile" icon="person" />;
      default:        return null;
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
      <FloatingTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        cartCount={cartCount}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const hs = StyleSheet.create({
  topBar: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 18,
    paddingTop:        56,
    paddingBottom:     8,
  },
  greeting:    { fontSize: 18, fontWeight: '700', color: C.textDark },
  subGreeting: { fontSize: 13, color: C.textLight, marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.greenFaded,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.accent,
    borderWidth: 1.5, borderColor: C.white,
  },
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.white,
    borderRadius:      12,
    marginHorizontal:  18,
    marginBottom:      16,
    paddingHorizontal: 14,
    height:            46,
    borderWidth:       1.5,
    borderColor:       C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textDark },
  promoBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.green,
    marginHorizontal:  18,
    borderRadius:      18,
    paddingVertical:   20,
    paddingHorizontal: 22,
    marginBottom:      22,
  },
  promoTag:     { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  promoTitle:   { fontSize: 20, fontWeight: '800', color: C.white, lineHeight: 26, marginBottom: 14 },
  promoBtn: {
    backgroundColor:   C.white,
    borderRadius:      8,
    paddingHorizontal: 16,
    paddingVertical:   8,
    alignSelf:         'flex-start',
  },
  promoBtnText: { fontSize: 13, fontWeight: '700', color: C.green },
  sectionHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 18,
    marginBottom:      12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  seeAll:       { fontSize: 13, color: C.green, fontWeight: '600' },
  catRow: {
    paddingHorizontal: 18,
    gap:               8,
    paddingBottom:     6,
    marginBottom:      22,
  },
  catCard: {
    alignItems:        'center',
    justifyContent:    'center',
    borderRadius:      12,
    paddingVertical:   8,
    paddingHorizontal: 12,
    gap:               4,
    minWidth:          62,
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.45,
    shadowRadius:      6,
    elevation:         5,
  },
  catLabel: { fontSize: 10, fontWeight: '600', color: C.textMid },
  featuredGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: 12,
    gap:               8,
  },
  productCard: {
    width:           '31%',
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         9,
    shadowColor:     '#1B5E20',
    shadowOffset:    { width: 0, height: 5 },
    shadowOpacity:   0.12,
    shadowRadius:    10,
    elevation:       6,
  },
  productEmoji: {
    alignItems:     'center',
    justifyContent: 'center',
    height:         54,
    marginBottom:   6,
  },
  productTag: {
    alignSelf:         'flex-start',
    borderRadius:      5,
    paddingHorizontal: 5,
    paddingVertical:   2,
    marginBottom:      4,
  },
  productTagText: { fontSize: 9,  fontWeight: '700' },
  productName:    { fontSize: 11, fontWeight: '600', color: C.textDark, marginBottom: 3, minHeight: 28 },
  productPrice:   { fontSize: 13, fontWeight: '800', color: C.green, marginBottom: 8 },
  productUnit:    { fontSize: 10, fontWeight: '400', color: C.textLight },
  addBtn: {
    backgroundColor: C.green,
    borderRadius:    7,
    height:          26,
    alignItems:      'center',
    justifyContent:  'center',
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});