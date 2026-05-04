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
import FloatingTabBar   from '../components/FloatingTabBar';
import ProfileScreen    from './ProfileScreen';
import CategoryScreen   from './CategoryScreen';
import CartScreen       from './CartScreen';
import OrdersScreen     from './OrdersScreen';
import { sql }             from '../api/db';
import { getCategoryMeta } from '../constants/categoryIcons';
import ProductModal        from '../components/ProductModal';

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
};

const TAG_COLORS = {
  Sale:    { bg: '#FFF3E0', text: '#E65100' },
  Popular: { bg: '#E8F5E9', text: '#2E7D32' },
  New:     { bg: '#E3F2FD', text: '#1565C0' },
};

const getTag = (product, index) => {
  if (product.stock <= product.threshold) return 'Sale';
  if (index < 2)                          return 'Popular';
  if (index === 2)                        return 'New';
  return null;
};

// ── Product image — real URL or emoji fallback ───────────────────
const ProductImage = ({ imageUrl, category }) => {
  const [hasError, setHasError] = useState(false);
  const emoji = getCategoryMeta(category).emoji;

  if (imageUrl && !hasError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={hs.productImg}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return <Text style={hs.productEmoji}>{emoji}</Text>;
};

// ── Home tab content ─────────────────────────────────────────────
const HomeTabContent = ({ onAddToCart }) => {
  const [search,           setSearch]           = useState('');
  const [allProducts,      setAllProducts]      = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null); // null = All
  const [loading,          setLoading]          = useState(true);
const [selectedProduct,  setSelectedProduct]  = useState(null);
const [modalVisible,     setModalVisible]     = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [products, cats] = await Promise.all([
          sql`
            SELECT id, name, unit_price, unit, category, stock, threshold, image_url
            FROM products
            WHERE stock > 0
            ORDER BY created_at DESC
            LIMIT 50
          `,
          sql`
            SELECT id, name
            FROM categories
            WHERE status = 'active'
            ORDER BY name ASC
            LIMIT 10
          `,
        ]);
        setAllProducts(products);
        setCategories(cats);
      } catch (err) {
        console.error('HomeScreen fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  // Filter by selected category + search, then cap at 6
  const filteredProducts = allProducts
    .filter(p =>
      activeCategoryId
        ? p.category.toLowerCase() === activeCategory?.name.toLowerCase()
        : true
    )
    .filter(p =>
      search.length === 0 ||
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 6);

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
          {/* ── Categories ── */}
          <View style={hs.sectionHeader}>
            <Text style={hs.sectionTitle}>Categories</Text>
            <TouchableOpacity><Text style={hs.seeAll}>See all</Text></TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={hs.catRow}
          >
            {/* "All" pill */}
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

          {/* ── Featured / Filtered Items ── */}
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
            <View style={hs.featuredGrid}>
              {filteredProducts.map((item, index) => {
                const tag = getTag(item, index);
                return (
                  <TouchableOpacity
  key={String(item.id)}
  style={hs.productCard}
  activeOpacity={0.92}
  onPress={() => { setSelectedProduct(item); setModalVisible(true); }}
>

                    {/* Image area */}
                    <View style={hs.imageArea}>
                      <ProductImage imageUrl={item.image_url} category={item.category} />
                    </View>

                    {/* Tag badge */}
                    {tag && (
                      <View style={[hs.tagBadge, { backgroundColor: TAG_COLORS[tag]?.bg }]}>
                        <Text style={[hs.tagText, { color: TAG_COLORS[tag]?.text }]}>{tag}</Text>
                      </View>
                    )}

                    {/* Info */}
                    <View style={hs.infoArea}>
                      <Text style={hs.productName} numberOfLines={2}>{item.name}</Text>
                      <Text style={hs.productPrice}>₱{parseFloat(item.unit_price).toFixed(2)}</Text>
                      <Text style={hs.productUnit}>{item.unit}</Text>
                    </View>

                    {/* Add button */}
<TouchableOpacity
  style={hs.addBtn}
  onPress={() => onAddToCart(item, 1)}
  activeOpacity={0.85}
>
  <MaterialIcons name="add" size={20} color={C.white} />
</TouchableOpacity>

                 </TouchableOpacity>
                  
                );
              })}
            </View>
          )}
        </>
      )}
   <ProductModal
        product={selectedProduct}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddToCart={(product, qty) => onAddToCart(product, qty)}
      />
    </ScrollView>
  );
};

// ── Home Screen shell ────────────────────────────────────────────
const HomeScreen = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [user,      setUser]      = useState(route?.params?.user ?? null);

  const renderContent = () => {
    switch (activeTab) {
      case 'Home': return (
  <HomeTabContent
    onAddToCart={(product, qty) => {
      setCartCount(v => v + 1);
      setCartItems(prev => {
        const existing = prev.find(i => i.product_id === product.id);
        if (existing) {
          return prev.map(i =>
            i.product_id === product.id ? { ...i, qty: i.qty + qty } : i
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
  qty:        qty,
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
    onOrderPlaced={() => {
      setCartCount(0);
      setCartItems([]);
    }}
  />
);
      case 'Orders': return <OrdersScreen user={user} />;
      case 'Profile':  return (
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
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

// ── Styles ───────────────────────────────────────────────────────
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

  featuredGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: 14,
    gap:               12,
    marginBottom:      8,
  },
  productCard: {
    width:           '47%',
    backgroundColor: C.white,
    borderRadius:    16,
    overflow:        'visible',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.08,
    shadowRadius:    8,
    elevation:       4,
  },
  imageArea: {
    backgroundColor:      '#F2F2F2',
    borderTopLeftRadius:  16,
    borderTopRightRadius: 16,
    height:               140,
    alignItems:           'center',
    justifyContent:       'center',
    overflow:             'hidden',
  },
  productImg:   { width: '100%', height: '100%' },  // real image fills box
  productEmoji: { fontSize: 66 },                    // fallback emoji

  tagBadge: {
    position:          'absolute',
    top:               10,
    left:              10,
    borderRadius:      20,
    paddingHorizontal: 9,
    paddingVertical:   4,
  },
  tagText: { fontSize: 10, fontWeight: '700' },

  infoArea: {
    paddingHorizontal: 12,
    paddingTop:        10,
    paddingBottom:     44,
  },
  productName:  { fontSize: 14, fontWeight: '600', color: C.textDark, marginBottom: 5, lineHeight: 19 },
  productPrice: { fontSize: 16, fontWeight: '800', color: C.green, marginBottom: 2 },
  productUnit:  { fontSize: 12, color: C.textLight },

  addBtn: {
    position:        'absolute',
    bottom:          12,
    right:           12,
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: C.green,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     C.greenDark,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.4,
    shadowRadius:    6,
    elevation:       6,
  },

  emptyWrap:  { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { fontSize: 14, color: C.textLight },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});