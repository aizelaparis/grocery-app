import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../api/db';
import { getCategoryMeta } from '../constants/categoryIcons';
import ProductModal from '../components/ProductModal';

const { width, height } = Dimensions.get('window');

const C = {
  bg:         '#F7FAF5',
  white:      '#FFFFFF',
  dark:       '#1A2A14',
  mid:        '#3A4A30',
  muted:      '#8FA67A',
  border:     '#E2E6DA',
  green:      '#2E7D32',
  greenLight: '#4CAF50',
  greenFaded: '#E8F5E9',
  greenDark:  '#1B5E20',
  accent:     '#FF6F00',
  textLight:  '#8A9E88',
};

const TAG_COLORS = {
  Sale:    { bg: '#FFF3E0', text: '#E65100' },
  Popular: { bg: '#E8F5E9', text: '#2E7D32' },
  New:     { bg: '#E3F2FD', text: '#1565C0' },
};

const getTag = (product, index) => {
  if (product.stock <= product.threshold) return 'Sale';
  if (index < 2) return 'Popular';
  if (index === 2) return 'New';
  return null;
};

// ── Product image with emoji fallback ───────────────────────────
const ProductImage = ({ imageUrl, category }) => {
  const [hasError, setHasError] = useState(false);
  const emoji = getCategoryMeta(category).emoji;

  if (imageUrl && !hasError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={s.productImg}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }
  return <Text style={s.productEmoji}>{emoji}</Text>;
};

// ── Dropdown overlay ─────────────────────────────────────────────
const CategoryDropdown = ({ visible, categories, currentId, onSelect, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0,  duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1,  duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -300, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,    duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.dropSheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {categories.map((cat) => {
            const meta    = getCategoryMeta(cat.name);
            const active  = cat.id === currentId;
            return (
              <TouchableOpacity
                key={String(cat.id)}
                style={[s.dropRow, active && s.dropRowActive]}
                onPress={() => { onSelect(cat); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={[s.dropIcon, { backgroundColor: active ? C.green : meta.bg }]}>
                  <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                </View>
                <Text style={[s.dropLabel, active && s.dropLabelActive]}>
                  {cat.name}
                </Text>
                {active && (
                  <MaterialIcons name="check" size={18} color={C.green} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ── Main Screen ──────────────────────────────────────────────────
const ProductListScreen = ({ route, navigation }) => {
  // initialCategory comes from CategoryScreen navigation
  const initialCategory = route?.params?.category ?? null;

  const [allCategories,    setAllCategories]    = useState([]);
  const [activeCategory,   setActiveCategory]   = useState(initialCategory);
  const [products,         setProducts]         = useState([]);
  const [search,           setSearch]           = useState('');
  const [loading,          setLoading]          = useState(true);
  const [dropdownVisible,  setDropdownVisible]  = useState(false);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [modalVisible,     setModalVisible]     = useState(false);
  const [cartItems,        setCartItems]        = useState(
    route?.params?.cartItems ?? []
  );

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('status', 'active')
          .order('name', { ascending: true });
        if (error) throw error;
        setAllCategories(data ?? []);
      } catch (err) {
        console.error('Categories load error:', err.message);
      }
    };
    loadCategories();
  }, []);

  // Load products when activeCategory changes
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('id, name, unit_price, unit, category, stock, threshold, image_url')
          .order('created_at', { ascending: false });

        if (activeCategory) {
          query = query.ilike('category', activeCategory.name);
        }

        const { data, error } = await query;
        if (error) throw error;
        setProducts(data ?? []);
      } catch (err) {
        console.error('Products load error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [activeCategory]);

  const filteredProducts = search.length === 0
    ? products
    : products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddToCart = (product, qty) => {
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
        image_url:  product.image_url ?? null,
        price:      parseFloat(product.unit_price),
        unit:       product.unit,
        qty,
        stock:      product.stock,
      }];
    });

    // Propagate up if a callback was provided
    route?.params?.onAddToCart?.(product, qty);
  };

 const renderProduct = ({ item, index }) => {
  const tag      = getTag(item, index);
  const soldOut  = item.stock === 0;

  return (
    <TouchableOpacity
      style={[s.productCard, soldOut && { opacity: 0.55 }]}
      activeOpacity={soldOut ? 1 : 0.92}
      disabled={soldOut}
      onPress={() => {
        if (!soldOut) { setSelectedProduct(item); setModalVisible(true); }
      }}
    >
      <View style={s.imageArea}>
        <ProductImage imageUrl={item.image_url} category={item.category} />

        {soldOut && (
          <View style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.38)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
              SOLD OUT
            </Text>
          </View>
        )}
      </View>

      {/* hide tag badge and add button when sold out */}
      {tag && !soldOut && (
        <View style={[s.tagBadge, { backgroundColor: TAG_COLORS[tag]?.bg }]}>
          <Text style={[s.tagText, { color: TAG_COLORS[tag]?.text }]}>{tag}</Text>
        </View>
      )}

      <View style={s.infoArea}>
        <Text style={[s.productName, soldOut && { color: C.muted }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[s.productPrice, soldOut && { color: C.muted }]}>
          ₱{parseFloat(item.unit_price).toFixed(2)}
        </Text>
        <Text style={s.productUnit}>{item.unit}</Text>
      </View>

      {!soldOut && (
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => handleAddToCart(item, 1)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={20} color={C.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={C.dark} />
        </TouchableOpacity>

        {/* Category dropdown trigger */}
        <TouchableOpacity
          style={s.dropTrigger}
          onPress={() => setDropdownVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={s.dropTriggerText}>
            {activeCategory ? activeCategory.name : 'All Products'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={C.dark} />
        </TouchableOpacity>

        {/* Cart badge */}
        <TouchableOpacity style={s.cartBtn}>
          <MaterialIcons name="shopping-cart" size={22} color={C.dark} />
          {cartItems.length > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>
                {cartItems.reduce((sum, i) => sum + i.qty, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <MaterialIcons name="search" size={20} color={C.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search this store..."
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Sub-category chips (Pints & Tubs, Cones, etc.) ── */}
      {/* Extend this later with sub-category data from Supabase */}
      {/* Currently shows a count summary */}
      {!loading && (
        <View style={s.countRow}>
          <Text style={s.countText}>
            {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
            {activeCategory ? ` in ${activeCategory.name}` : ''}
          </Text>
        </View>
      )}

      {/* ── Product grid ── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => String(item.id)}
          numColumns={3}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          renderItem={renderProduct}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 40 }}>🛒</Text>
              <Text style={s.emptyText}>No products found.</Text>
            </View>
          }
        />
      )}

      {/* ── Category dropdown ── */}
      <CategoryDropdown
        visible={dropdownVisible}
        categories={allCategories}
        currentId={activeCategory?.id ?? null}
        onSelect={setActiveCategory}
        onClose={() => setDropdownVisible(false)}
      />

      {/* ── Product modal ── */}
      <ProductModal
        product={selectedProduct}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddToCart={(product, qty) => handleAddToCart(product, qty)}
      />
    </SafeAreaView>
  );
};

export default ProductListScreen;

// ── Styles ───────────────────────────────────────────────────────
const COLS      = 3;
const GAP       = 8;
const CARD_W    = (width - 32 - GAP * (COLS - 1)) / COLS;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   12,
    backgroundColor:   C.bg,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropTrigger: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             4,
  },
  dropTriggerText: {
    fontSize:   17,
    fontWeight: '700',
    color:      C.dark,
  },
  cartBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  cartBadge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: C.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cartBadgeText: { fontSize: 10, fontWeight: '700', color: C.white },

  // Search
  searchWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.white,
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       C.border,
    marginHorizontal:  16,
    marginBottom:      8,
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.dark, padding: 0 },

  countRow: { paddingHorizontal: 18, paddingBottom: 8 },
  countText: { fontSize: 12, color: C.muted, fontWeight: '500' },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 110 },
  row:  { gap: GAP, marginBottom: GAP },

  // Product card
  productCard: {
    width:           CARD_W,
    backgroundColor: C.white,
    borderRadius:    12,
    overflow:        'visible',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
    elevation:       3,
  },
  imageArea: {
    backgroundColor:      '#F2F2F2',
    borderTopLeftRadius:  12,
    borderTopRightRadius: 12,
    height:               CARD_W,
    alignItems:           'center',
    justifyContent:       'center',
    overflow:             'hidden',
  },
  productImg:   { width: '100%', height: '100%' },
  productEmoji: { fontSize: CARD_W * 0.45 },

  tagBadge: {
    position:          'absolute',
    top:               6,
    left:              6,
    borderRadius:      20,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  tagText: { fontSize: 9, fontWeight: '700' },

  infoArea: {
    paddingHorizontal: 8,
    paddingTop:        7,
    paddingBottom:     36,
  },
  productName:  { fontSize: 11, fontWeight: '600', color: C.dark, marginBottom: 3, lineHeight: 15 },
  productPrice: { fontSize: 13, fontWeight: '800', color: C.green, marginBottom: 1 },
  productUnit:  { fontSize: 10, color: C.textLight },

  addBtn: {
    position:        'absolute',
    bottom:          8,
    right:           8,
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: C.green,
    alignItems:      'center',
    justifyContent:  'center',
    elevation:       4,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap:   { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText:   { fontSize: 14, color: C.muted },

  // Dropdown
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dropSheet: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    maxHeight:       height * 0.65,
    backgroundColor: C.white,
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
    paddingTop:      8,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.15,
    shadowRadius:    12,
    elevation:       10,
  },
  handle: {
    alignSelf:       'center',
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: C.border,
    marginBottom:    12,
  },
  dropRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   13,
    gap:               14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropRowActive: {
    backgroundColor: C.greenFaded,
  },
  dropIcon: {
    width:          34,
    height:         34,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dropLabel: {
    flex:       1,
    fontSize:   15,
    fontWeight: '500',
    color:      C.dark,
  },
  dropLabelActive: {
    color:      C.green,
    fontWeight: '700',
  },
});