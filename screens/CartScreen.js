import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

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
};

// Empty by default — populate with real cart data from your state/context
const SAMPLE_CART = [];

const DELIVERY_FEE  = 49;
const FREE_DELIVERY = 300;
const PROMO_CODES   = { PAMILI10: 10, SAVE20: 20, FRESH50: 50 };

// Tab bar height — adjust to match your navigator's tabBarHeight
const TAB_BAR_HEIGHT = 64;

const CartScreen = () => {
  const insets = useSafeAreaInsets();
  const [items,    setItems]    = useState(SAMPLE_CART.map(i => ({ ...i, qty: 1 })));
  const [promo,    setPromo]    = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const delivery = subtotal >= FREE_DELIVERY ? 0 : DELIVERY_FEE;
  const total    = subtotal + delivery - discount;

  const changeQty = (id, delta) => {
    setItems(prev =>
      prev
        .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  };

  const removeItem = (id) => {
    Alert.alert('Remove Item', 'Remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems(p => p.filter(i => i.id !== id)) },
    ]);
  };

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) { setPromoMsg('Please enter a promo code.'); return; }
    if (PROMO_CODES[code]) {
      setDiscount(PROMO_CODES[code]);
      setPromoMsg(`✓ Promo applied! ₱${PROMO_CODES[code]} off your order.`);
    } else {
      setDiscount(0);
      setPromoMsg('✗ Invalid promo code. Try PAMILI10, SAVE20, or FRESH50.');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) { Alert.alert('Cart is empty', 'Add some items first!'); return; }
    Alert.alert('Order Placed!', `Your order of ₱${total} has been placed successfully. 🎉`, [{ text: 'OK' }]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.emptyWrap}>
          <Text style={s.emptyEmoji}>🛒</Text>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Fill up your cart with some fresh items!</Text>

           <TouchableOpacity style={s.shopBtn} activeOpacity={0.85}>
            <MaterialIcons name="storefront" size={18} color={C.white} />
            <Text style={s.shopBtnText}>Browse the Market</Text>
          </TouchableOpacity>
        </View>
        
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Cart</Text>
          <Text style={s.headerSub}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Edit Mode', 'Tap × on items to remove them.')}>
          <Text style={s.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Store banner */}
      <View style={s.storeBanner}>
        <MaterialIcons name="store" size={16} color={C.green} />
        <Text style={s.storeName}>Pamili Fresh Market</Text>
        <Text style={s.freeDelivery}>
          {delivery === 0
            ? '✓ Free delivery'
            : `₱${FREE_DELIVERY - subtotal} away from free delivery`}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        {items.map(item => (
          <View key={item.id} style={s.cartItem}>
            <View style={s.itemEmoji}>
              <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
            </View>

            <View style={s.itemInfo}>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemUnit}>{item.unit}</Text>
              <Text style={s.itemPrice}>₱{item.price * item.qty}</Text>
            </View>

            <View style={s.itemRight}>
              <TouchableOpacity onPress={() => removeItem(item.id)} style={s.removeBtn}>
                <MaterialIcons name="close" size={14} color={C.textLight} />
              </TouchableOpacity>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => changeQty(item.id, -1)} activeOpacity={0.7}>
                  <MaterialIcons name={item.qty === 1 ? 'delete-outline' : 'remove'} size={16} color={C.green} />
                </TouchableOpacity>
                <Text style={s.qtyNum}>{item.qty}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => changeQty(item.id, 1)} activeOpacity={0.7}>
                  <MaterialIcons name="add" size={16} color={C.green} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Delivery progress bar */}
        {delivery > 0 && (
          <View style={s.progressCard}>
            <View style={s.progressHeader}>
              <MaterialIcons name="local-shipping" size={16} color={C.accent} />
              <Text style={s.progressText}>
                Add{' '}
                <Text style={{ fontWeight: '700', color: C.accent }}>
                  ₱{FREE_DELIVERY - subtotal}
                </Text>
                {' '}more for free delivery
              </Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.min((subtotal / FREE_DELIVERY) * 100, 100)}%` }]} />
            </View>
          </View>
        )}

        {/* Promo Code */}
        <View style={s.promoCard}>
          <View style={s.promoRow}>
            <MaterialIcons name="local-offer" size={18} color={C.textLight} />
            <TextInput
              style={s.promoInput}
              placeholder="Enter promo code..."
              placeholderTextColor={C.textLight}
              value={promo}
              onChangeText={v => { setPromo(v); setPromoMsg(''); }}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={s.promoBtn} onPress={applyPromo}>
              <Text style={s.promoBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {promoMsg ? (
            <Text style={[s.promoMsg, { color: promoMsg.startsWith('✓') ? C.green : C.error }]}>
              {promoMsg}
            </Text>
          ) : null}
        </View>

        {/* Order Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Order Summary</Text>

          <View style={s.summaryRow}>
            <Text style={s.summaryLbl}>Subtotal ({items.length} items)</Text>
            <Text style={s.summaryVal}>₱{subtotal}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLbl}>Delivery fee</Text>
            <Text style={[s.summaryVal, delivery === 0 && { color: C.green, fontWeight: '700' }]}>
              {delivery === 0 ? 'Free' : `₱${delivery}`}
            </Text>
          </View>
          {discount > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLbl}>Promo discount</Text>
              <Text style={[s.summaryVal, { color: C.accent }]}>−₱{discount}</Text>
            </View>
          )}
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}>
            <Text style={s.totalLbl}>Total</Text>
            <Text style={s.totalVal}>₱{total}</Text>
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Checkout Footer — sits above tab bar */}
      <View style={[s.footer, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]}>
        <View style={s.footerInfo}>
          <Text style={s.footerLabel}>Total to pay</Text>
          <Text style={s.footerTotal}>₱{total}</Text>
        </View>
        <TouchableOpacity style={s.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
          <MaterialIcons name="shopping-cart-checkout" size={18} color={C.white} />
          <Text style={s.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    backgroundColor:   C.white,
    paddingHorizontal: 18,
    paddingTop:        16,
    paddingBottom:     14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.textDark },
  headerSub:   { fontSize: 12, color: C.textLight, marginTop: 2 },
  editBtn:     { fontSize: 14, color: C.green, fontWeight: '600' },

  storeBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   C.greenFaded,
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  storeName:    { fontSize: 13, fontWeight: '600', color: C.green, flex: 1 },
  freeDelivery: { fontSize: 11, color: C.textMid, fontWeight: '500' },

  body: { padding: 14, gap: 10 },

  cartItem: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.white,
    borderRadius:    16,
    padding:         12,
    gap:             12,
    borderWidth:     1,
    borderColor:     C.border,
  },
  itemEmoji: {
    width:           64,
    height:          64,
    borderRadius:    12,
    backgroundColor: '#F2F2F2',
    alignItems:      'center',
    justifyContent:  'center',
  },
  itemInfo:  { flex: 1 },
  itemName:  { fontSize: 14, fontWeight: '600', color: C.textDark, marginBottom: 2 },
  itemUnit:  { fontSize: 11, color: C.textLight, marginBottom: 6 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: C.green },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  removeBtn: {
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: '#F5F5F5',
    alignItems:      'center',
    justifyContent:  'center',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width:           30,
    height:          30,
    borderRadius:    15,
    borderWidth:     1.5,
    borderColor:     C.border,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
  },
  qtyNum: { fontSize: 14, fontWeight: '700', color: C.textDark, minWidth: 20, textAlign: 'center' },

  progressCard: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         14,
    gap:             10,
    borderWidth:     1,
    borderColor:     C.border,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText:   { fontSize: 12, color: C.textMid, flex: 1 },
  progressBar: {
    height:          6,
    backgroundColor: '#F0F0F0',
    borderRadius:    3,
    overflow:        'hidden',
  },
  progressFill: {
    height:          6,
    backgroundColor: C.accent,
    borderRadius:    3,
  },

  promoCard: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         14,
    borderWidth:     1,
    borderColor:     C.border,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  promoInput: {
    flex:       1,
    fontSize:   13,
    color:      C.textDark,
    padding:    0,
  },
  promoBtn: {
    backgroundColor:   C.greenFaded,
    borderRadius:      8,
    paddingHorizontal: 14,
    paddingVertical:   7,
  },
  promoBtnText: { fontSize: 13, fontWeight: '700', color: C.green },
  promoMsg:     { fontSize: 12, marginTop: 8, fontWeight: '500' },

  summaryCard: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         16,
    borderWidth:     1,
    borderColor:     C.border,
  },
  summaryTitle:   { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 12 },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLbl:     { fontSize: 13, color: C.textLight },
  summaryVal:     { fontSize: 13, fontWeight: '600', color: C.textDark },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  totalLbl:       { fontSize: 15, fontWeight: '700', color: C.textDark },
  totalVal:       { fontSize: 18, fontWeight: '800', color: C.green },

  footer: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.white,
    paddingHorizontal: 18,
    paddingTop:        14,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    gap:               14,
  },
  footerInfo:  { flex: 1 },
  footerLabel: { fontSize: 11, color: C.textLight, fontWeight: '500' },
  footerTotal: { fontSize: 20, fontWeight: '800', color: C.textDark },
  checkoutBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   C.green,
    paddingHorizontal: 24,
    paddingVertical:   14,
    borderRadius:      14,
    elevation:         4,
  },
  checkoutText: { fontSize: 15, fontWeight: '700', color: C.white },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.textDark },
  emptySub:   { fontSize: 13, color: C.textLight, textAlign: 'center', paddingHorizontal: 40 },
  shopBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   C.green,
    paddingHorizontal: 28,
    paddingVertical:   14,
    borderRadius:      14,
    elevation:         4,
    marginBottom:      28,
  },
  shopBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});