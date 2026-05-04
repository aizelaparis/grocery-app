import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { sql } from '../api/db';
import { Image } from 'react-native';

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
};

const DELIVERY_FEE  = 0;   // free delivery — adjust if needed
const FREE_DELIVERY = 300;
const TAB_BAR_HEIGHT = 64;

// ── COD Info Banner ──────────────────────────────────────────────
const CODBanner = () => (
  <View style={b.wrap}>
    <View style={b.iconBox}>
      <MaterialIcons name="payments" size={20} color={C.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={b.title}>Cash on Delivery</Text>
      <Text style={b.sub}>
        Your payment will be settled once your order is delivered to your location.
        Please prepare the exact amount.
      </Text>
    </View>
  </View>
);

const b = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               12,
    backgroundColor:   C.accentBg,
    borderRadius:      14,
    borderWidth:       1.5,
    borderColor:       '#FFCC80',
    padding:           14,
  },
  iconBox: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: '#FFE0B2',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       2,
  },
  title: { fontSize: 13, fontWeight: '700', color: C.accent, marginBottom: 4 },
  sub:   { fontSize: 11, color: '#BF360C', lineHeight: 16, fontWeight: '500' },
});

// ── Place Order Confirmation Modal ───────────────────────────────
const PlaceOrderModal = ({ visible, onClose, onConfirm, orderData, placing }) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[mo.overlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[mo.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={mo.handle} />

        {/* Header */}
        <View style={mo.header}>
          <View style={mo.headerIcon}>
            <MaterialIcons name="shopping-cart-checkout" size={22} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mo.title}>Confirm Your Order</Text>
            <Text style={mo.subtitle}>Review before placing</Text>
          </View>
          <TouchableOpacity style={mo.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="close" size={16} color={C.textMid} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>

            {/* Delivery address */}
            <View style={mo.infoRow}>
              <MaterialIcons name="location-on" size={16} color={C.green} />
              <View style={{ flex: 1 }}>
                <Text style={mo.infoLabel}>Delivery Address</Text>
                <Text style={mo.infoVal}>{orderData?.address || 'No address set'}</Text>
              </View>
            </View>

            {/* Payment method */}
            <View style={mo.infoRow}>
              <MaterialIcons name="payments" size={16} color={C.accent} />
              <View style={{ flex: 1 }}>
                <Text style={mo.infoLabel}>Payment Method</Text>
                <Text style={[mo.infoVal, { color: C.accent }]}>Cash on Delivery (COD)</Text>
              </View>
            </View>

            {/* COD notice */}
            <View style={mo.codNotice}>
              <MaterialIcons name="info-outline" size={13} color={C.textMid} />
              <Text style={mo.codNoticeText}>
                Payment will be collected upon delivery. Please prepare the exact amount.
              </Text>
            </View>

            {/* Items */}
            <Text style={mo.sectionLabel}>ORDER ITEMS</Text>
           {orderData?.items?.map((item) => (
  <View key={String(item.id)} style={mo.itemRow}>
                <Text style={mo.itemEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={mo.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={mo.itemUnit}>{item.unit} × {item.qty}</Text>
                </View>
                <Text style={mo.itemPrice}>₱{(item.price * item.qty).toFixed(2)}</Text>
              </View>
            ))}

            {/* Divider */}
            <View style={mo.divider} />

            {/* Totals */}
            <View style={mo.totalRow}>
              <Text style={mo.totalLabel}>Subtotal</Text>
              <Text style={mo.totalVal}>₱{orderData?.subtotal?.toFixed(2)}</Text>
            </View>
            <View style={mo.totalRow}>
              <Text style={mo.totalLabel}>Delivery Fee</Text>
              <Text style={[mo.totalVal, { color: C.green }]}>Free</Text>
            </View>
            <View style={[mo.totalRow, { marginTop: 6 }]}>
              <Text style={mo.grandLabel}>Total to Pay (COD)</Text>
              <Text style={mo.grandVal}>₱{orderData?.total?.toFixed(2)}</Text>
            </View>

            {/* Note input */}
            <Text style={[mo.sectionLabel, { marginTop: 16 }]}>ORDER NOTES (Optional)</Text>
            <View style={mo.noteBox}>
              <TextInput
                style={mo.noteInput}
                placeholder="e.g. Please knock twice, Gate 2..."
                placeholderTextColor={C.textLight}
                value={orderData?.notes}
                onChangeText={orderData?.setNotes}
                multiline
                maxLength={200}
                returnKeyType="done"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={mo.footer}>
          <TouchableOpacity style={mo.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={mo.cancelText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[mo.placeBtn, placing && { opacity: 0.7 }]}
            onPress={onConfirm}
            activeOpacity={0.85}
            disabled={placing}
          >
            {placing
              ? <ActivityIndicator size="small" color={C.white} />
              : <>
                  <MaterialIcons name="check-circle" size={16} color={C.white} />
                  <Text style={mo.placeBtnText}>Place Order</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const mo = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,30,10,0.55)',
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
    width:           42,
    height:          42,
    borderRadius:    12,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title:    { fontSize: 15, fontWeight: '800', color: C.textDark },
  subtitle: { fontSize: 11, color: C.textLight, marginTop: 1 },
  closeBtn: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: '#F2F4F1',
    alignItems:      'center',
    justifyContent:  'center',
  },

  infoRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               10,
    backgroundColor:   C.bg,
    borderRadius:      12,
    padding:           12,
    marginBottom:      10,
    marginTop:         12,
    borderWidth:       1,
    borderColor:       C.border,
  },
  infoLabel: { fontSize: 10, color: C.textLight, fontWeight: '600', marginBottom: 2 },
  infoVal:   { fontSize: 13, fontWeight: '700', color: C.textDark },

  codNotice: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               8,
    backgroundColor:   C.accentBg,
    borderRadius:      10,
    padding:           10,
    marginBottom:      16,
  },
  codNoticeText: { flex: 1, fontSize: 11, color: '#BF360C', lineHeight: 16 },

  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         C.textLight,
    letterSpacing: 1,
    marginBottom:  8,
  },

  itemRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemEmoji: { fontSize: 24 },
  itemName:  { fontSize: 13, fontWeight: '600', color: C.textDark },
  itemUnit:  { fontSize: 11, color: C.textLight, marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: C.green },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 13, color: C.textLight },
  totalVal:   { fontSize: 13, fontWeight: '600', color: C.textDark },
  grandLabel: { fontSize: 14, fontWeight: '700', color: C.textDark },
  grandVal:   { fontSize: 18, fontWeight: '800', color: C.green },

  noteBox: {
    backgroundColor:   C.bg,
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       C.border,
    paddingHorizontal: 12,
    paddingVertical:   10,
    minHeight:         64,
  },
  noteInput: {
    fontSize:   13,
    color:      C.textDark,
    lineHeight: 20,
  },

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
    paddingVertical: 14,
    borderRadius:    12,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     C.border,
    backgroundColor: C.white,
  },
  cancelText:   { fontSize: 14, fontWeight: '600', color: C.textMid },
  placeBtn: {
    flex:            2,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 14,
    borderRadius:    12,
    backgroundColor: C.green,
    elevation:       4,
    shadowColor:     C.greenDark,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.3,
    shadowRadius:    8,
  },
  placeBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
});

// ── Order Success Modal ──────────────────────────────────────────
const OrderSuccessModal = ({ visible, orderId, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={su.overlay}>
      <View style={su.card}>
        <View style={su.iconCircle}>
          <MaterialIcons name="check-circle" size={52} color={C.green} />
        </View>
        <Text style={su.title}>Order Placed! 🎉</Text>
        <Text style={su.orderId}>#{String(orderId).padStart(5, '0')}</Text>
        <Text style={su.message}>
          Your order has been received. Payment will be collected upon delivery.
          Please prepare the exact amount.
        </Text>
        <View style={su.codBox}>
          <MaterialIcons name="payments" size={18} color={C.accent} />
          <Text style={su.codText}>Cash on Delivery — Pay when it arrives</Text>
        </View>
        <TouchableOpacity style={su.btn} onPress={onClose} activeOpacity={0.85}>
          <Text style={su.btnText}>Track My Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const su = StyleSheet.create({
  overlay: {
    flex:              1,
    backgroundColor:   'rgba(0,0,0,0.5)',
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 28,
  },
  card: {
    width:             '100%',
    backgroundColor:   C.white,
    borderRadius:      24,
    padding:           28,
    alignItems:        'center',
    elevation:         16,
  },
  iconCircle: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    16,
  },
  title:   { fontSize: 22, fontWeight: '800', color: C.textDark, marginBottom: 4 },
  orderId: { fontSize: 13, color: C.textLight, fontWeight: '600', marginBottom: 14 },
  message: {
    fontSize:     13,
    color:        C.textMid,
    textAlign:    'center',
    lineHeight:   20,
    marginBottom: 16,
  },
  codBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   C.accentBg,
    borderRadius:      10,
    paddingHorizontal: 14,
    paddingVertical:   10,
    marginBottom:      22,
    width:             '100%',
  },
  codText: { fontSize: 12, fontWeight: '600', color: C.accent, flex: 1 },
  btn: {
    width:           '100%',
    backgroundColor: C.green,
    borderRadius:    14,
    paddingVertical: 14,
    alignItems:      'center',
    elevation:       4,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: C.white },
});

// ── Main Cart Screen ─────────────────────────────────────────────
const CartScreen = ({ user, cartItems = [], onCartUpdate, onOrderPlaced }) => {
  const insets = useSafeAreaInsets();

  // cartItems format: [{ id, name, emoji, price, unit, qty, product_id }]
  const [items,       setItems]       = useState(cartItems);
  const [notes,       setNotes]       = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [placing,     setPlacing]     = useState(false);
  const [newOrderId,  setNewOrderId]  = useState(null);

  // Keep in sync if parent updates cartItems
  useEffect(() => { setItems(cartItems); }, [cartItems]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const delivery = 0; // COD, free delivery
  const total    = subtotal + delivery;

  const changeQty = (id, delta) => {
    const updated = items
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0);
    setItems(updated);
    onCartUpdate?.(updated);
  };

  const removeItem = (id) => {
    Alert.alert('Remove Item', 'Remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          const updated = items.filter(i => i.id !== id);
          setItems(updated);
          onCartUpdate?.(updated);
        },
      },
    ]);
  };

  const handleCheckoutPress = () => {
    if (items.length === 0) {
      Alert.alert('Cart is empty', 'Add some items first!');
      return;
    }
    if (!user?.address) {
      Alert.alert(
        'No Delivery Address',
        'Please set your delivery address in your Profile before placing an order.',
      );
      return;
    }
    setShowModal(true);
  };

  // ── Place Order → write to Neon DB ──────────────────────────
  const handlePlaceOrder = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to place an order.');
      return;
    }
    setPlacing(true);
    try {
      // 1. Insert order
      const orderResult = await sql`
        INSERT INTO orders (user_id, status, total_amount, delivery_address, notes)
        VALUES (
          ${user.id},
          'pending',
          ${total},
          ${user.address},
          ${notes.trim() || null}
        )
        RETURNING id
      `;
      const orderId = orderResult[0].id;

      // 2. Insert order_items
      for (const item of items) {
        await sql`
          INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
          VALUES (
            ${orderId},
            ${item.product_id},
            ${item.name},
            ${item.price},
            ${item.qty},
            ${item.price * item.qty}
          )
        `;
      }

      // 3. Clear cart, show success
      setShowModal(false);
      setNewOrderId(orderId);
      setShowSuccess(true);
      setItems([]);
      setNotes('');
      onCartUpdate?.([]);
      onOrderPlaced?.();
    } catch (err) {
      console.error('Place order error:', err);
      Alert.alert('Error', err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── Empty state ──────────────────────────────────────────────
  if (items.length === 0 && !showSuccess) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.emptyWrap}>
          <Text style={s.emptyEmoji}>🛒</Text>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Fill up your cart with some fresh items!</Text>
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
      </View>

      {/* Store banner */}
      <View style={s.storeBanner}>
        <MaterialIcons name="store" size={16} color={C.green} />
        <Text style={s.storeName}>Pamili Fresh Market</Text>
        <Text style={s.freeDelivery}>✓ Free delivery</Text>
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
  {item.image_url
    ? <Image
        source={{ uri: item.image_url }}
        style={{ width: 64, height: 64, borderRadius: 12 }}
        resizeMode="cover"
      />
    : <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
  }
</View>
            <View style={s.itemInfo}>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemUnit}>{item.unit}</Text>
              <Text style={s.itemPrice}>₱{(item.price * item.qty).toFixed(2)}</Text>
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

        {/* COD Banner */}
        <CODBanner />

        {/* Order Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Order Summary</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLbl}>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</Text>
            <Text style={s.summaryVal}>₱{subtotal.toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLbl}>Delivery fee</Text>
            <Text style={[s.summaryVal, { color: C.green, fontWeight: '700' }]}>Free</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}>
            <Text style={s.totalLbl}>Total (COD)</Text>
            <Text style={s.totalVal}>₱{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery address reminder */}
        {user?.address ? (
          <View style={s.addressBox}>
            <MaterialIcons name="location-on" size={15} color={C.green} />
            <View style={{ flex: 1 }}>
              <Text style={s.addressLabel}>Delivering to</Text>
              <Text style={s.addressVal}>{user.address}</Text>
            </View>
          </View>
        ) : (
          <View style={[s.addressBox, { borderColor: C.error, backgroundColor: C.errorBg }]}>
            <MaterialIcons name="location-off" size={15} color={C.error} />
            <View style={{ flex: 1 }}>
              <Text style={[s.addressLabel, { color: C.error }]}>No delivery address set</Text>
              <Text style={[s.addressVal, { color: C.error }]}>Go to Profile → set your delivery address</Text>
            </View>
          </View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Checkout Footer */}
      <View style={[s.footer, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]}>
        <View style={s.footerInfo}>
          <Text style={s.footerLabel}>Total (COD)</Text>
          <Text style={s.footerTotal}>₱{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[s.checkoutBtn, !user?.address && s.checkoutBtnDisabled]}
          onPress={handleCheckoutPress}
          activeOpacity={0.85}
        >
          <MaterialIcons name="shopping-cart-checkout" size={18} color={C.white} />
          <Text style={s.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>

      {/* Place Order Confirmation Modal */}
      <PlaceOrderModal
        visible={showModal}
        onClose={() => !placing && setShowModal(false)}
        onConfirm={handlePlaceOrder}
        placing={placing}
        orderData={{
          items,
          subtotal,
          total,
          address: user?.address,
          notes,
          setNotes,
        }}
      />

      {/* Success Modal */}
      <OrderSuccessModal
        visible={showSuccess}
        orderId={newOrderId}
        onClose={() => setShowSuccess(false)}
      />
    </SafeAreaView>
  );
};

export default CartScreen;

// ── Styles ───────────────────────────────────────────────────────
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

  addressBox: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               10,
    backgroundColor:   C.greenFaded,
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       C.border,
    padding:           12,
  },
  addressLabel: { fontSize: 10, fontWeight: '600', color: C.textLight, marginBottom: 2 },
  addressVal:   { fontSize: 12, fontWeight: '600', color: C.textDark },

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
    marginBottom: 30,
    shadowColor:       C.greenDark,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.3,
    shadowRadius:      8,
  },
  checkoutBtnDisabled: { backgroundColor: '#B0BEB0', elevation: 0, shadowOpacity: 0 },
  checkoutText: { fontSize: 15, fontWeight: '700', color: C.white },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.textDark },
  emptySub:   { fontSize: 13, color: C.textLight, textAlign: 'center', paddingHorizontal: 40 },
});