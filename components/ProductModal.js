// components/ProductModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getCategoryMeta } from '../constants/categoryIcons';
import { supabase } from '../api/db';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const C = {
  green:      '#2E7D32',
  greenLight: '#4CAF50',
  greenFaded: '#E8F5E9',
  greenDark:  '#1B5E20',
  white:      '#FFFFFF',
  border:     '#C8E6C9',
  borderMid:  '#E2E6DA',
  textDark:   '#1A2E1A',
  textMid:    '#4A6045',
  textLight:  '#8A9E88',
  bg:         '#F7FAF7',
  accent:     '#FF6F00',
  accentBg:   '#FFF3E0',
};

const TAG_COLORS = {
  Sale:    { bg: '#FFF3E0', text: '#E65100' },
  Popular: { bg: '#E8F5E9', text: '#2E7D32' },
  New:     { bg: '#E3F2FD', text: '#1565C0' },
};

// ── Product image with emoji fallback ───────────────────────────
const ProductImage = ({ imageUrl, category, style }) => {
  const [hasError, setHasError] = useState(false);
  const emoji = getCategoryMeta(category).emoji;

  if (imageUrl && !hasError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={style}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }
  return (
    <View style={[style, s.emojiBg]}>
      <Text style={s.fallbackEmoji}>{emoji}</Text>
    </View>
  );
};

// ── Info row helper ──────────────────────────────────────────────
const InfoRow = ({ icon, label, value, valueColor }) => (
  <View style={s.infoRow}>
    <View style={s.infoIconWrap}>
      <MaterialIcons name={icon} size={15} color={C.green} />
    </View>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, valueColor ? { color: valueColor } : null]}>
      {value ?? '—'}
    </Text>
  </View>
);

// ── Similar item card ────────────────────────────────────────────
const SimilarCard = ({ item, onPress, onAdd }) => {
  const [imgErr, setImgErr] = useState(false);
  const emoji = getCategoryMeta(item.category).emoji;

  return (
    <TouchableOpacity style={s.simCard} onPress={() => onPress(item)} activeOpacity={0.85}>
      <View style={s.simImgWrap}>
        {item.image_url && !imgErr ? (
          <Image
            source={{ uri: item.image_url }}
            style={s.simImg}
            resizeMode="cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <Text style={s.simEmoji}>{emoji}</Text>
        )}
        <TouchableOpacity
          style={s.simAddBtn}
          onPress={() => onAdd(item, 1)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={16} color={C.white} />
        </TouchableOpacity>
      </View>
      <Text style={s.simPrice}>₱{parseFloat(item.unit_price).toFixed(2)}</Text>
      <Text style={s.simName} numberOfLines={2}>{item.name}</Text>
      <Text style={s.simUnit}>{item.unit}</Text>
    </TouchableOpacity>
  );
};

// ── Main component ───────────────────────────────────────────────
const ProductModal = ({ product, visible, onClose, onAddToCart }) => {
  const slideAnim  = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const [qty,          setQty]          = useState(1);
  const [similarItems, setSimilarItems] = useState([]);
  const [wishlist,     setWishlist]     = useState(false);

  // Slide in/out from right
  useEffect(() => {
    if (visible) {
      setQty(1);
      Animated.spring(slideAnim, {
        toValue:         0,
        tension:         80,
        friction:        14,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue:         SCREEN_WIDTH,
        duration:        240,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Load similar items when product changes
  useEffect(() => {
    if (!product) return;
    const fetchSimilar = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, unit_price, unit, category, stock, threshold, image_url')
          .ilike('category', product.category)
          .neq('id', product.id)
          .limit(6);
        if (!error) setSimilarItems(data ?? []);
      } catch (_) {}
    };
    fetchSimilar();
  }, [product?.id]);

  const toggleWishlist = () => {
    setWishlist(v => !v);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, tension: 200 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, tension: 200 }),
    ]).start();
  };

  if (!product) return null;

  const unitPrice  = parseFloat(product.unit_price);
  const totalPrice = (unitPrice * qty).toFixed(2);
  const isLowStock = product.stock <= product.threshold;
  const isSoldOut  = product.stock === 0;
  const atMaxQty   = qty >= product.stock;
  const atMinQty   = qty <= 1;

  const stockStatus = isSoldOut
    ? { label: 'Out of Stock',            color: '#D32F2F' }
    : isLowStock
    ? { label: `Only ${product.stock} left!`, color: C.accent }
    : { label: 'In Stock',                color: C.green };

  const tag = isLowStock ? 'Sale' : null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[s.screen, { transform: [{ translateX: slideAnim }] }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />

        {/* ── Fixed top bar ── */}
        <SafeAreaView edges={['top']} style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color={C.textDark} />
          </TouchableOpacity>

          <Text style={s.topTitle} numberOfLines={1}>{product.name}</Text>

          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <TouchableOpacity style={s.iconBtn} onPress={toggleWishlist} activeOpacity={0.7}>
              <MaterialIcons
                name={wishlist ? 'favorite' : 'favorite-border'}
                size={22}
                color={wishlist ? '#E53935' : C.textDark}
              />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>

        {/* ── Scrollable body ── */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Hero image */}
          <View style={s.heroWrap}>
            <ProductImage
              imageUrl={product.image_url}
              category={product.category}
              style={s.heroImage}
            />

            {/* Sold-out hero overlay */}
            {isSoldOut && (
              <View style={s.soldOutOverlay}>
                <View style={s.soldOutBadge}>
                  <Text style={s.soldOutBadgeText}>SOLD OUT</Text>
                </View>
              </View>
            )}

            {/* Category badge */}
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>{product.category}</Text>
            </View>

            {/* Sale tag */}
            {tag && !isSoldOut && (
              <View style={[s.tagBadge, { backgroundColor: TAG_COLORS[tag].bg }]}>
                <Text style={[s.tagText, { color: TAG_COLORS[tag].text }]}>{tag}</Text>
              </View>
            )}
          </View>

          {/* ── Content card ── */}
          <View style={s.contentCard}>

            {/* Name + stock pill */}
            <View style={s.nameRow}>
              <Text style={[s.productName, isSoldOut && { color: C.textLight }]}>
                {product.name}
              </Text>
              <View style={[
                s.stockPill,
                { backgroundColor: isSoldOut ? '#FFEBEE' : isLowStock ? C.accentBg : C.greenFaded },
              ]}>
                <Text style={[s.stockText, { color: stockStatus.color }]}>
                  {stockStatus.label}
                </Text>
              </View>
            </View>

            {/* Price */}
            <View style={s.priceRow}>
              <Text style={[s.price, isSoldOut && { color: C.textLight }]}>
                ₱{unitPrice.toFixed(2)}
              </Text>
              <Text style={s.perUnit}>/ {product.unit}</Text>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Product details */}
            <Text style={s.sectionLabel}>PRODUCT DETAILS</Text>
            <View style={s.infoCard}>
              {product.sku ? (
                <>
                  <InfoRow icon="qr-code"      label="SKU"      value={product.sku} />
                  <View style={s.infoSep} />
                </>
              ) : null}
              <InfoRow icon="category"          label="Category" value={product.category} />
              <View style={s.infoSep} />
              <InfoRow icon="straighten"        label="Unit"     value={product.unit} />
              <View style={s.infoSep} />
              <InfoRow
                icon="inventory-2"
                label="Stock"
                value={`${product.stock} ${product.unit}`}
                valueColor={stockStatus.color}
              />
              {product.supplier ? (
                <>
                  <View style={s.infoSep} />
                  <InfoRow icon="local-shipping" label="Supplier" value={product.supplier} />
                </>
              ) : null}
            </View>

            {/* Similar items */}
            {similarItems.length > 0 && (
              <>
                <View style={s.divider} />
                <Text style={s.sectionLabel}>SIMILAR ITEMS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.simRow}
                >
                  {similarItems.map(item => (
                    <SimilarCard
                      key={String(item.id)}
                      item={item}
                      onPress={(p) => {
                        onClose();
                        setTimeout(() => onAddToCart(p, 0), 300);
                      }}
                      onAdd={onAddToCart}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            <View style={{ height: 110 }} />
          </View>
        </ScrollView>

        {/* ── Sticky footer ── */}
        <SafeAreaView edges={['bottom']} style={s.footer}>

          {/* Max qty warning — only shown when at stock limit */}
          {atMaxQty && !isSoldOut && (
            <View style={s.maxWarningRow}>
              <MaterialIcons name="info-outline" size={13} color={C.accent} />
              <Text style={s.maxWarningText}>
                Max {product.stock} available
              </Text>
            </View>
          )}

          {/* Button row */}
          <View style={s.footerRow}>

            {/* Qty stepper — hidden when sold out */}
            {!isSoldOut && (
              <View style={s.footerQtyPill}>
                <TouchableOpacity
                  onPress={() => setQty(v => Math.max(1, v - 1))}
                  style={[s.footerQtyBtn, atMinQty && s.footerQtyBtnDisabled]}
                  activeOpacity={0.7}
                  disabled={atMinQty}
                >
                  <MaterialIcons
                    name="remove"
                    size={20}
                    color={atMinQty ? '#C8D5C8' : C.textDark}
                  />
                </TouchableOpacity>

                <Text style={s.footerQtyNum}>{qty}</Text>

                <TouchableOpacity
                  onPress={() => setQty(v => Math.min(product.stock, v + 1))}
                  style={[s.footerQtyBtn, atMaxQty && s.footerQtyBtnDisabled]}
                  activeOpacity={0.7}
                  disabled={atMaxQty}
                >
                  <MaterialIcons
                    name="add"
                    size={20}
                    color={atMaxQty ? '#C8D5C8' : C.textDark}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Add to basket / Out of stock button */}
            <TouchableOpacity
              style={[s.addBtn, isSoldOut && s.addBtnDisabled]}
              onPress={() => {
                if (!isSoldOut) {
                  onAddToCart(product, qty);
                  onClose();
                }
              }}
              activeOpacity={0.85}
              disabled={isSoldOut}
            >
              <Text style={s.addBtnText}>
                {isSoldOut
                  ? 'Out of Stock'
                  : `Add To Basket  ₱${totalPrice}`}
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>

      </Animated.View>
    </Modal>
  );
};

export default ProductModal;

// ── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: C.bg,
  },

  // Top bar
  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.white,
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    gap:               8,
  },
  iconBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#F2F4F1',
    alignItems:      'center',
    justifyContent:  'center',
  },
  topTitle: {
    flex:       1,
    fontSize:   16,
    fontWeight: '700',
    color:      C.textDark,
    textAlign:  'center',
  },

  // Hero
  heroWrap: {
    width:           SCREEN_WIDTH,
    height:          SCREEN_HEIGHT * 0.42,
    backgroundColor: '#F2F2F2',
  },
  heroImage: {
    width:  '100%',
    height: '100%',
  },
  emojiBg: {
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#F2F4F0',
  },
  fallbackEmoji: { fontSize: 110 },

  // Sold-out hero overlay
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  soldOutBadge: {
    backgroundColor:   'rgba(0,0,0,0.6)',
    borderRadius:      10,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderWidth:       1.5,
    borderColor:       'rgba(255,255,255,0.3)',
  },
  soldOutBadgeText: {
    fontSize:      16,
    fontWeight:    '800',
    color:         C.white,
    letterSpacing: 2,
  },

  catBadge: {
    position:          'absolute',
    bottom:            14,
    left:              14,
    backgroundColor:   'rgba(0,0,0,0.45)',
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   5,
  },
  catBadgeText: { fontSize: 12, color: C.white, fontWeight: '600' },

  tagBadge: {
    position:          'absolute',
    top:               14,
    left:              14,
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  tagText: { fontSize: 12, fontWeight: '700' },

  // Content card
  contentCard: {
    backgroundColor:      C.white,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    marginTop:            -20,
    paddingHorizontal:    20,
    paddingTop:           24,
  },

  nameRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            10,
    marginBottom:   8,
  },
  productName: {
    flex:       1,
    fontSize:   22,
    fontWeight: '800',
    color:      C.textDark,
    lineHeight: 28,
  },
  stockPill: {
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    marginTop:         4,
  },
  stockText: { fontSize: 11, fontWeight: '700' },

  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           4,
    marginBottom:  18,
  },
  price:   { fontSize: 30, fontWeight: '800', color: C.green },
  perUnit: { fontSize: 14, color: C.textLight, fontWeight: '500' },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },

  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         C.textLight,
    letterSpacing: 1.4,
    marginBottom:  12,
  },

  infoCard: {
    backgroundColor: C.bg,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     C.border,
    marginBottom:    20,
    overflow:        'hidden',
  },
  infoRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 14,
    paddingVertical:   11,
    gap:               10,
  },
  infoIconWrap: {
    width:           28,
    height:          28,
    borderRadius:    8,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
  },
  infoLabel: { flex: 1, fontSize: 12, color: C.textLight, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: C.textDark },
  infoSep:   { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  // Similar items
  simRow: { gap: 10, paddingBottom: 4 },
  simCard: {
    width:           140,
    backgroundColor: C.bg,
    borderRadius:    14,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     C.borderMid,
  },
  simImgWrap: {
    height:          120,
    backgroundColor: '#F0F2EE',
    alignItems:      'center',
    justifyContent:  'center',
  },
  simImg:   { width: '100%', height: '100%', resizeMode: 'cover' },
  simEmoji: { fontSize: 48 },
  simAddBtn: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: C.green,
    alignItems:      'center',
    justifyContent:  'center',
  },
  simPrice: {
    fontSize:          14,
    fontWeight:        '800',
    color:             C.textDark,
    paddingHorizontal: 10,
    paddingTop:        8,
  },
  simName: {
    fontSize:          12,
    fontWeight:        '500',
    color:             C.textMid,
    paddingHorizontal: 10,
    marginTop:         2,
    lineHeight:        16,
  },
  simUnit: {
    fontSize:          11,
    color:             C.textLight,
    paddingHorizontal: 10,
    paddingBottom:     10,
    marginTop:         2,
  },

  // Footer
  footer: {
    flexDirection:     'column',
    paddingHorizontal: 16,
    paddingTop:        10,
    paddingBottom:     8,
    backgroundColor:   C.white,
    borderTopWidth:    1,
    borderTopColor:    C.borderMid,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  maxWarningRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    marginBottom:   6,
  },
  maxWarningText: {
    fontSize:   11,
    color:      C.accent,
    fontWeight: '600',
  },
  footerQtyPill: {
    flexDirection:   'row',
    alignItems:      'center',
    borderRadius:    50,
    borderWidth:     1.5,
    borderColor:     C.border,
    backgroundColor: C.white,
    overflow:        'hidden',
  },
  footerQtyBtn: {
    paddingHorizontal: 14,
    paddingVertical:   12,
  },
  footerQtyBtnDisabled: {
    opacity: 0.35,
  },
  footerQtyNum: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.textDark,
    minWidth:   28,
    textAlign:  'center',
  },
  addBtn: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    backgroundColor:   C.green,
    paddingVertical:   15,
    borderRadius:      50,
    elevation:         3,
    shadowColor:       C.greenDark,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.25,
    shadowRadius:      6,
  },
  addBtnDisabled: {
    backgroundColor: '#B0BEB0',
    elevation:       0,
    shadowOpacity:   0,
  },
  addBtnText: {
    fontSize:      15,
    fontWeight:    '700',
    color:         C.white,
    letterSpacing: 0.3,
  },
});