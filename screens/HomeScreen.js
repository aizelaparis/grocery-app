import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import FloatingTabBar      from '../components/FloatingTabBar';
import ProfileScreen       from './ProfileScreen';
import CategoryScreen      from './CategoryScreen';
import CartScreen          from './CartScreen';
import OrdersScreen        from './OrdersScreen';
import { supabase }        from '../api/db';
import { getCategoryMeta } from '../constants/categoryIcons';
import ProductModal        from '../components/ProductModal';

const C = {
  green:      '#2E7D32',
  greenLight: '#4CAF50',
  greenFaded: '#E8F5E9',
  greenDark:  '#1B5E20',
  white:      '#FFFFFF',
  border:     '#C8E6C9',
  borderMid:  '#E8EDE8',
  textDark:   '#1A2E1A',
  textMid:    '#4A6045',
  textLight:  '#8A9E88',
  bg:         '#F7FAF7',
  accent:     '#FF6F00',
};

// ── Product image ─────────────────────────────────────────────────
const ProductImage = ({ imageUrl, category }) => {
  const [hasError, setHasError] = useState(false);
  const emoji = getCategoryMeta(category).emoji;

  if (imageUrl && !hasError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={pr.img}
        resizeMode="contain"
        onError={() => setHasError(true)}
      />
    );
  }
  return <Text style={pr.emoji}>{emoji}</Text>;
};

// ── Product card ─────────────────────────────────────────────────
const ProductCard = ({ item, onPress, onAddToCart }) => {
  const isSoldOut = item.stock === 0;

  return (
    <TouchableOpacity
      style={[pr.card, isSoldOut && pr.cardSoldOut]}
      activeOpacity={isSoldOut ? 1 : 0.93}
      onPress={() => !isSoldOut && onPress(item)}
      disabled={isSoldOut}
    >
      <View style={pr.imgWrap}>
        <ProductImage imageUrl={item.image_url} category={item.category} />

        {isSoldOut && (
          <View style={pr.soldOutOverlay}>
            <Text style={pr.soldOutText}>Sold Out</Text>
          </View>
        )}
      </View>

      <View style={pr.info}>
        <Text style={[pr.name, isSoldOut && { color: C.textLight }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={pr.unit}>{item.unit}</Text>
        <View style={pr.bottom}>
          <Text style={[pr.price, isSoldOut && { color: C.textLight }]}>
            ₱{parseFloat(item.unit_price).toFixed(2)}
          </Text>
          {!isSoldOut && (
            <TouchableOpacity
              style={pr.addBtn}
              onPress={() => onAddToCart(item, 1)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color={C.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const pr = StyleSheet.create({
  card: {
    width:           '48%',
    backgroundColor: C.white,
    borderRadius:    14,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     C.borderMid,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       3,
    marginBottom:    12,
  },
  cardSoldOut: {
    opacity: 0.6,
  },

  // Image
  imgWrap: {
    backgroundColor: '#F5F7F5',
    height:          150,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  img:   { width: '85%', height: '85%' },
  emoji: { fontSize: 70 },

  // Sold-out overlay
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  soldOutText: {
    fontSize:          12,
    fontWeight:        '700',
    color:             '#FFFFFF',
    letterSpacing:     0.8,
    textTransform:     'uppercase',
    backgroundColor:   'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      6,
    overflow:          'hidden',
  },

  // Info
  info: {
    padding:    10,
    paddingTop: 9,
    gap:        3,
  },
  name: {
    fontSize:   13,
    fontWeight: '600',
    color:      C.textDark,
    lineHeight: 18,
  },
  unit: {
    fontSize: 11,
    color:    C.textLight,
  },

  // Price + add
  bottom: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      6,
  },
  price: {
    fontSize:      16,
    fontWeight:    '800',
    color:         C.textDark,
    letterSpacing: -0.3,
  },
  addBtn: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: C.green,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     C.greenDark,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.3,
    shadowRadius:    4,
    elevation:       4,
  },
});

// ── Home tab content ──────────────────────────────────────────────
const HomeTabContent = ({ onAddToCart }) => {
  const [search,           setSearch]           = useState('');
  const [allProducts,      setAllProducts]      = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [modalVisible,     setModalVisible]     = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: products, error: pErr }, { data: cats, error: cErr }] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, unit_price, unit, category, stock, threshold, image_url')
            // ✅ removed .gt('stock', 0) — sold-out products should still appear
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('categories')
            .select('id, name')
            .eq('status', 'active')
            .order('name', { ascending: true })
            .limit(10),
        ]);
        if (pErr) throw pErr;
        if (cErr) throw cErr;
        setAllProducts(products ?? []);
        setCategories(cats ?? []);
      } catch (err) {
        console.error('HomeScreen fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  const filteredProducts = allProducts
    .filter(p =>
      activeCategoryId
        ? p.category.toLowerCase() === activeCategory?.name.toLowerCase()
        : true
    )
    .filter(p =>
      search.length === 0 ||
      p.name.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
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

      {/* Search */}
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

      {/* Promo Banner */}
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

      {loading ? (
        <View style={hs.loadingWrap}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <>
          {/* Categories */}
          <View style={hs.sectionHeader}>
            <Text style={hs.sectionTitle}>Categories</Text>
            <TouchableOpacity><Text style={hs.seeAll}>See all</Text></TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={hs.catRow}
          >
            <TouchableOpacity
              style={[hs.catCard, { backgroundColor: activeCategoryId === null ? C.green : C.greenFaded }]}
              activeOpacity={0.8}
              onPress={() => setActiveCategoryId(null)}
            >
              <Text style={hs.catEmoji}>🛒</Text>
              <Text style={[hs.catLabel, { color: activeCategoryId === null ? C.white : C.textMid }]}>
                All
              </Text>
            </TouchableOpacity>

            {categories.map(cat => {
              const meta   = getCategoryMeta(cat.name);
              const active = activeCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={String(cat.id)}
                  style={[hs.catCard, { backgroundColor: active ? C.green : meta.bg }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveCategoryId(active ? null : cat.id)}
                >
                  <Text style={hs.catEmoji}>{meta.emoji}</Text>
                  <Text style={[hs.catLabel, { color: active ? C.white : C.textMid }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Products */}
          <View style={hs.sectionHeader}>
            <Text style={hs.sectionTitle}>
              {activeCategory ? activeCategory.name : 'Featured Items'}
            </Text>
            <TouchableOpacity><Text style={hs.seeAll}>See all</Text></TouchableOpacity>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={hs.emptyWrap}>
              <Text style={hs.emptyEmoji}>🛒</Text>
              <Text style={hs.emptyText}>No products in this category yet.</Text>
            </View>
          ) : (
            <View style={hs.grid}>
              {filteredProducts.map((item) => (
                <ProductCard
                  key={String(item.id)}
                  item={item}
                  onPress={(p) => { setSelectedProduct(p); setModalVisible(true); }}
                  onAddToCart={onAddToCart}
                />
              ))}
            </View>
          )}
        </>
      )}

      <ProductModal
        product={selectedProduct}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddToCart={(product, qty) => {
          // ✅ qty === 0 means "preview only" signal from similar items — skip cart
          if (qty > 0) onAddToCart(product, qty);
        }}
      />
    </ScrollView>
  );
};

// ── Home Screen shell ─────────────────────────────────────────────
const HomeScreen = ({ route, navigation }) => {
  const [activeTab,        setActiveTab]        = useState('Home');
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [cartCount,        setCartCount]        = useState(0);
  const [cartItems,        setCartItems]        = useState([]);
  const [user,             setUser]             = useState(route?.params?.user ?? null);

  const renderContent = () => {
    switch (activeTab) {
      case 'Home': return (
        <HomeTabContent
          onAddToCart={(product, qty) => {
            // ✅ guard: never add 0-qty items
            if (qty <= 0) return;

            setCartCount(v => v + qty);
            setCartItems(prev => {
              const existing = prev.find(i => i.product_id === product.id);
              if (existing) {
                return prev.map(i =>
                  i.product_id === product.id ? { ...i, qty: i.qty + qty, stock: product.stock } : i
                );
              }
              return [...prev, {
                id:         String(product.id),
                product_id: product.id,
                name:       product.name,
                emoji:      '🛒',
                image_url:  product.image_url ?? null,
                price:      parseFloat(product.unit_price),
                unit:       product.unit,
                qty,
                stock:      product.stock,
              }];
            });
          }}
        />
      );
      case 'Category': return <CategoryScreen navigation={navigation} />;
      case 'Cart': return (
        <CartScreen
          user={user}
          cartItems={cartItems}
          onCartUpdate={(updated) => {
            setCartItems(updated);
            setCartCount(updated.reduce((sum, i) => sum + i.qty, 0));
          }}
          onOrderPlaced={() => { setCartCount(0); setCartItems([]); }}
        />
      );
      case 'Orders': return (
        <OrdersScreen user={user} onActiveOrdersChange={setActiveOrderCount} />
      );
      case 'Profile': return (
        <ProfileScreen
          user={user}
          onUserUpdate={(updated) => setUser(updated)}
          onLogout={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
        />
      );
      default: return null;
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={{ flex: 1 }}>{renderContent()}</View>
      <FloatingTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        cartCount={cartCount}
        ordersCount={activeOrderCount}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

// ── Styles ────────────────────────────────────────────────────────
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
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
  },
  notifDot: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: C.accent,
    borderWidth:     1.5,
    borderColor:     C.white,
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

  loadingWrap: { paddingVertical: 60, alignItems: 'center' },

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
    elevation:         3,
  },
  catEmoji: { fontSize: 22 },
  catLabel: { fontSize: 10, fontWeight: '600' },

  grid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: 14,
    justifyContent:    'space-between',
  },

  emptyWrap:  { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { fontSize: 14, color: C.textLight },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});