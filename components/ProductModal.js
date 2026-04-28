// components/ProductModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getCategoryMeta } from '../constants/categoryIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  overlay:    'rgba(10,30,10,0.55)',
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
    <Text style={[s.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);

// ── Main modal component ─────────────────────────────────────────
const ProductModal = ({ product, visible, onClose, onAddToCart }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (visible) {
      setQty(1);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 260, useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0, tension: 68, friction: 12, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0, duration: 200, useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!product) return null;

  const unitPrice   = parseFloat(product.unit_price);
  const totalPrice  = (unitPrice * qty).toFixed(2);
  const isLowStock  = product.stock <= product.threshold;
  const stockStatus = product.stock === 0
    ? { label: 'Out of Stock', color: '#D32F2F' }
    : isLowStock
    ? { label: `Only ${product.stock} left!`, color: C.accent }
    : { label: 'In Stock', color: C.green };

  // Derive tag same way as HomeScreen
  const tag = isLowStock ? 'Sale' : null;

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

        {/* Close button */}
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <MaterialIcons name="close" size={18} color={C.textMid} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* Product image */}
          <View style={s.imageWrap}>
            <ProductImage
              imageUrl={product.image_url}
              category={product.category}
              style={s.productImage}
            />

            {/* Category badge */}
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>{product.category}</Text>
            </View>

            {/* Sale tag if applicable */}
            {tag && (
              <View style={[s.tagBadge, { backgroundColor: TAG_COLORS[tag].bg }]}>
                <Text style={[s.tagText, { color: TAG_COLORS[tag].text }]}>{tag}</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={s.content}>

            {/* Name + stock */}
            <View style={s.nameRow}>
              <Text style={s.productName}>{product.name}</Text>
              <View style={[s.stockPill, { backgroundColor: isLowStock ? C.accentBg : C.greenFaded }]}>
                <Text style={[s.stockText, { color: stockStatus.color }]}>{stockStatus.label}</Text>
              </View>
            </View>

            {/* Price */}
            <View style={s.priceRow}>
              <Text style={s.price}>₱{unitPrice.toFixed(2)}</Text>
              <Text style={s.perUnit}>/ {product.unit}</Text>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Product details */}
            <Text style={s.sectionLabel}>PRODUCT DETAILS</Text>
            <View style={s.infoCard}>
              <InfoRow icon="qr-code"         label="SKU"        value={product.sku} />
              <View style={s.infoSep} />
              <InfoRow icon="category"        label="Category"   value={product.category} />
              <View style={s.infoSep} />
              <InfoRow icon="straighten"      label="Unit"       value={product.unit} />
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

            {/* Quantity selector */}
            <View style={s.qtySection}>
              <Text style={s.qtyLabel}>Quantity</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity
                  style={[s.qtyBtn, qty <= 1 && s.qtyBtnDisabled]}
                  onPress={() => setQty(v => Math.max(1, v - 1))}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="remove" size={18} color={qty <= 1 ? C.textLight : C.green} />
                </TouchableOpacity>
                <Text style={s.qtyNum}>{qty}</Text>
                <TouchableOpacity
                  style={[s.qtyBtn, qty >= product.stock && s.qtyBtnDisabled]}
                  onPress={() => setQty(v => Math.min(product.stock, v + 1))}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={18} color={qty >= product.stock ? C.textLight : C.green} />
                </TouchableOpacity>
                <Text style={s.qtyTotal}>= ₱{totalPrice}</Text>
              </View>
            </View>

          </View>
        </ScrollView>

        {/* Add to cart footer */}
        <View style={s.footer}>
          <View style={s.footerInfo}>
            <Text style={s.footerLabel}>Total</Text>
            <Text style={s.footerTotal}>₱{totalPrice}</Text>
          </View>
          <TouchableOpacity
            style={[s.addBtn, product.stock === 0 && s.addBtnDisabled]}
            onPress={() => {
              if (product.stock > 0) {
                onAddToCart(product, qty);
                onClose();
              }
            }}
            activeOpacity={0.85}
            disabled={product.stock === 0}
          >
            <MaterialIcons name="shopping-cart" size={18} color={C.white} />
            <Text style={s.addBtnText}>
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </Modal>
  );
};

export default ProductModal;

// ── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  sheet: {
    position:              'absolute',
    bottom:                0,
    left:                  0,
    right:                 0,
    backgroundColor:       C.white,
    borderTopLeftRadius:   28,
    borderTopRightRadius:  28,
    maxHeight:             SCREEN_HEIGHT * 0.88,
    shadowColor:           '#000',
    shadowOffset:          { width: 0, height: -6 },
    shadowOpacity:         0.15,
    shadowRadius:          20,
    elevation:             24,
  },
  handle: {
    width:           44,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#D0D8CF',
    alignSelf:       'center',
    marginTop:       12,
    marginBottom:    4,
  },
  closeBtn: {
    position:        'absolute',
    top:             14,
    right:           16,
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: '#F2F4F1',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },

  // Image
  imageWrap: {
    marginHorizontal: 16,
    marginTop:        10,
    borderRadius:     20,
    overflow:         'hidden',
    height:           220,
  },
  productImage: { width: '100%', height: '100%' },
  emojiBg: {
    backgroundColor: '#F2F4F0',
    alignItems:      'center',
    justifyContent:  'center',
  },
  fallbackEmoji: { fontSize: 90 },

  catBadge: {
    position:          'absolute',
    bottom:            12,
    left:              12,
    backgroundColor:   'rgba(0,0,0,0.45)',
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  catBadgeText: { fontSize: 11, color: C.white, fontWeight: '600' },

  tagBadge: {
    position:          'absolute',
    top:               12,
    left:              12,
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  tagText: { fontSize: 11, fontWeight: '700' },

  // Content
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },

  nameRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            10,
    marginBottom:   8,
  },
  productName: {
    flex:       1,
    fontSize:   20,
    fontWeight: '800',
    color:      C.textDark,
    lineHeight: 26,
  },
  stockPill: {
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    marginTop:         2,
  },
  stockText: { fontSize: 11, fontWeight: '700' },

  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           4,
    marginBottom:  16,
  },
  price:   { fontSize: 28, fontWeight: '800', color: C.green },
  perUnit: { fontSize: 13, color: C.textLight, fontWeight: '500' },

  divider: { height: 1, backgroundColor: C.border, marginBottom: 16 },

  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         C.textLight,
    letterSpacing: 1.2,
    marginBottom:  10,
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

  // Quantity
  qtySection: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   24,
  },
  qtyLabel: { fontSize: 14, fontWeight: '700', color: C.textDark },
  qtyRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    borderWidth:     1.5,
    borderColor:     C.border,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
  },
  qtyBtnDisabled: { borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  qtyNum: {
    fontSize:  18,
    fontWeight:'800',
    color:     C.textDark,
    minWidth:  28,
    textAlign: 'center',
  },
  qtyTotal: { fontSize: 14, fontWeight: '700', color: C.green },

  // Footer
  footer: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   16,
    paddingBottom:     28,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    backgroundColor:   C.white,
    gap:               16,
  },
  footerInfo:  { flex: 1 },
  footerLabel: { fontSize: 11, color: C.textLight, fontWeight: '500' },
  footerTotal: { fontSize: 22, fontWeight: '800', color: C.textDark },
  addBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   C.green,
    paddingHorizontal: 24,
    paddingVertical:   14,
    borderRadius:      14,
    elevation:         4,
    shadowColor:       C.greenDark,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.3,
    shadowRadius:      8,
  },
  addBtnDisabled: { backgroundColor: '#B0BEB0', elevation: 0 },
  addBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});