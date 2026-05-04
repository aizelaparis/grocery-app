import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { sql } from '../api/db';

// ── Live countdown hook ──────────────────────────────────────────
const useCountdown = (deadline) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!deadline) return;

    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) {
        setRemaining('Arriving now! 🛵');
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s}s remaining`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
};

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

// ── Status config ────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label:   'Pending',
    color:   '#F57C00',
    bg:      '#FFF3E0',
    icon:    'hourglass-empty',
    step:    1,
  },
  confirmed: {
    label:   'Confirmed',
    color:   '#1565C0',
    bg:      '#E3F2FD',
    icon:    'check-circle',
    step:    2,
  },
  in_transit: {
    label:   'On the Way',
    color:   C.accent,
    bg:      C.accentBg,
    icon:    'local-shipping',
    step:    3,
  },
  delivered: {
    label:   'Delivered',
    color:   C.green,
    bg:      C.greenFaded,
    icon:    'done-all',
    step:    4,
  },
  cancelled: {
    label:   'Cancelled',
    color:   C.error,
    bg:      C.errorBg,
    icon:    'cancel',
    step:    0,
  },
};

const TRACK_STEPS = [
  { key: 'pending',    label: 'Placed',     icon: 'receipt' },
  { key: 'confirmed',  label: 'Confirmed',  icon: 'check-circle' },
  { key: 'in_transit', label: 'On the Way', icon: 'local-shipping' },
  { key: 'delivered',  label: 'Delivered',  icon: 'done-all' },
];

const TABS = [
  { key: 'active',    label: 'Active'       },
  { key: 'past',      label: 'Past Orders'  },
  { key: 'cancelled', label: 'Cancelled'    },
];

const EMPTY_STATES = {
  active: {
    icon:  '🛒',
    title: 'No active orders',
    sub:   "You don't have any orders in progress right now.",
  },
  past: {
    icon:  '📋',
    title: 'No past orders yet',
    sub:   'Your completed orders will appear here.',
  },
  cancelled: {
    icon:  '🚫',
    title: 'No cancelled orders',
    sub:   "You haven't cancelled any orders — keep it up!",
  },
};

// ── Tracking Bar ─────────────────────────────────────────────────
const TrackingBar = ({ status, estimatedDelivery, deliveryDeadline }) => {
  const currentStep = STATUS_CONFIG[status]?.step ?? 1;
  const countdown   = useCountdown(deliveryDeadline);

  return (
    <View style={t.wrap}>
      {deliveryDeadline ? (
        <View style={t.etaRow}>
          <MaterialIcons name="timer" size={14} color={C.accent} />
          <Text style={t.etaText}>
            <Text style={{ fontWeight: '800', color: C.accent }}>{countdown}</Text>
          </Text>
        </View>
      ) : estimatedDelivery ? (
        <View style={t.etaRow}>
          <MaterialIcons name="access-time" size={14} color={C.accent} />
          <Text style={t.etaText}>
            Estimated delivery:{' '}
            <Text style={{ fontWeight: '800', color: C.accent }}>{estimatedDelivery}</Text>
          </Text>
        </View>
      ) : null}

      <View style={t.stepsRow}>
        {TRACK_STEPS.map((step, i) => {
          const stepNum = i + 1;
          const done    = currentStep > stepNum;
          const current = currentStep === stepNum;
          const isLast  = i === TRACK_STEPS.length - 1;

          return (
            <React.Fragment key={step.key}>
              <View style={t.stepCol}>
                <View style={[
                  t.dot,
                  done    && t.dotDone,
                  current && t.dotCurrent,
                ]}>
                  {done
                    ? <MaterialIcons name="check" size={10} color={C.white} />
                    : <MaterialIcons
                        name={step.icon}
                        size={10}
                        color={current ? C.white : C.textLight}
                      />
                  }
                </View>
                <Text style={[t.stepLbl, (done || current) && t.stepLblActive]}>
                  {step.label}
                </Text>
              </View>
              {!isLast && (
                <View style={[t.line, done && t.lineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const t = StyleSheet.create({
  wrap: {
    backgroundColor: C.bg,
    borderRadius:    12,
    padding:         12,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     C.border,
    gap:             12,
  },
  etaRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    backgroundColor: C.accentBg,
    borderRadius:   8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  etaText:   { fontSize: 12, color: '#BF360C', flex: 1 },
  stepsRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  stepCol:   { alignItems: 'center', gap: 5, flex: 0 },
  dot: {
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dotDone:    { backgroundColor: C.green },
  dotCurrent: { backgroundColor: C.greenLight },
  stepLbl:    {
    fontSize:   8,
    color:      C.textLight,
    fontWeight: '500',
    textAlign:  'center',
    maxWidth:   48,
  },
  stepLblActive: { color: C.green, fontWeight: '700' },
  line:          { flex: 1, height: 2, backgroundColor: C.border, marginTop: 11, marginHorizontal: 2 },
  lineDone:      { backgroundColor: C.green },
});

// ── Empty State ──────────────────────────────────────────────────
const EmptyState = ({ tabKey }) => {
  const { icon, title, sub } = EMPTY_STATES[tabKey];
  return (
    <View style={e.wrap}>
      <View style={e.iconBox}>
        <Text style={e.iconText}>{icon}</Text>
      </View>
      <Text style={e.title}>{title}</Text>
      <Text style={e.sub}>{sub}</Text>
    </View>
  );
};

const e = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  iconBox: {
    width:           88,
    height:          88,
    borderRadius:    24,
    backgroundColor: C.greenFaded,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    20,
  },
  iconText: { fontSize: 40 },
  title:    { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 8, textAlign: 'center' },
  sub:      { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 20 },
});

// ── Order Card ───────────────────────────────────────────────────
const OrderCard = ({ order }) => {
  const cfg        = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const isActive   = ['pending', 'confirmed', 'in_transit'].includes(order.status);
  const isCancelled = order.status === 'cancelled';

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });

  return (
    <View style={oc.card}>

      {/* Top row — order ID + status */}
      <View style={oc.topRow}>
        <View>
          <Text style={oc.orderId}>Order #{String(order.id).padStart(5, '0')}</Text>
          <Text style={oc.orderDate}>{formattedDate}</Text>
        </View>
        <View style={[oc.statusPill, { backgroundColor: cfg.bg }]}>
          <MaterialIcons name={cfg.icon} size={12} color={cfg.color} />
          <Text style={[oc.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Tracking bar — only for active orders */}
      {isActive && (
        <TrackingBar
          status={order.status}
          estimatedDelivery={order.estimated_delivery}
          deliveryDeadline={order.delivery_deadline}
        />
      )}

      {/* COD badge */}
      <View style={oc.codRow}>
        <MaterialIcons name="payments" size={13} color={C.accent} />
        <Text style={oc.codText}>Cash on Delivery</Text>
      </View>

      {/* Delivery address */}
      <View style={oc.addressRow}>
        <MaterialIcons name="location-on" size={13} color={C.textLight} />
        <Text style={oc.addressText} numberOfLines={1}>{order.delivery_address}</Text>
      </View>

      {/* Items list */}
      <View style={oc.itemsWrap}>
        {order.items.map((item, i) => (
          <View key={i} style={oc.itemRow}>
            <View style={oc.itemDot} />
            <Text style={oc.itemName} numberOfLines={1}>{item.product_name}</Text>
            <Text style={oc.itemQty}>×{item.quantity}</Text>
            <Text style={oc.itemPrice}>₱{parseFloat(item.subtotal).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Notes */}
      {!!order.notes && (
        <View style={oc.noteRow}>
          <MaterialIcons name="sticky-note-2" size={13} color={C.textLight} />
          <Text style={oc.noteText}>{order.notes}</Text>
        </View>
      )}

      <View style={oc.divider} />

      {/* Footer — total + actions */}
      <View style={oc.footer}>
        <View>
          <Text style={oc.totalLabel}>Total (COD)</Text>
          <Text style={oc.totalVal}>₱{parseFloat(order.total_amount).toFixed(2)}</Text>
        </View>
        <View style={oc.btnRow}>
          {/* Cancelled orders can be reordered */}
          {isCancelled && (
            <TouchableOpacity
              style={oc.btnFill}
              onPress={() => Alert.alert('Reorder', 'Items will be added to your cart.')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="replay" size={14} color={C.white} />
              <Text style={oc.btnFillText}>Reorder</Text>
            </TouchableOpacity>
          )}

          {/* Delivered orders can be reordered */}
          {order.status === 'delivered' && (
            <TouchableOpacity
              style={oc.btnFill}
              onPress={() => Alert.alert('Reorder', 'Items will be added to your cart.')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="replay" size={14} color={C.white} />
              <Text style={oc.btnFillText}>Reorder</Text>
            </TouchableOpacity>
          )}

          {/* Pending orders can be cancelled by user */}
          {order.status === 'pending' && (
            <TouchableOpacity
              style={oc.btnOutline}
              onPress={() =>
                Alert.alert(
                  'Cancel Order',
                  'Are you sure you want to cancel this order?',
                  [
                    { text: 'No',  style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive',
                      onPress: () => order.onCancel?.(order.id) },
                  ]
                )
              }
              activeOpacity={0.7}
            >
              <Text style={oc.btnOutlineText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const oc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    16,
    padding:         14,
    marginBottom:    12,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#1B5E20',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   10,
  },
  orderId:   { fontSize: 14, fontWeight: '800', color: C.textDark },
  orderDate: { fontSize: 11, color: C.textLight, marginTop: 2 },
  statusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  codRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    marginBottom:      6,
  },
  codText: { fontSize: 11, color: C.accent, fontWeight: '600' },

  addressRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    marginBottom:   10,
  },
  addressText: { fontSize: 11, color: C.textLight, flex: 1 },

  itemsWrap: {
    backgroundColor: C.bg,
    borderRadius:    10,
    padding:         10,
    gap:             6,
    marginBottom:    8,
    borderWidth:     1,
    borderColor:     C.border,
  },
  itemRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
  },
  itemDot: {
    width:           5,
    height:          5,
    borderRadius:    3,
    backgroundColor: C.green,
  },
  itemName:  { flex: 1, fontSize: 12, color: C.textDark, fontWeight: '500' },
  itemQty:   { fontSize: 12, color: C.textLight, fontWeight: '500' },
  itemPrice: { fontSize: 12, color: C.green, fontWeight: '700' },

  noteRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               6,
    backgroundColor:   '#FFFBF0',
    borderRadius:      8,
    padding:           8,
    marginBottom:      8,
  },
  noteText: { fontSize: 11, color: C.textMid, flex: 1, lineHeight: 16 },

  divider: { height: 1, backgroundColor: C.border, marginBottom: 12 },

  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, color: C.textLight, fontWeight: '500' },
  totalVal:   { fontSize: 18, fontWeight: '800', color: C.textDark },
  btnRow:     { flexDirection: 'row', gap: 8 },

  btnOutline: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      9,
    borderWidth:       1.5,
    borderColor:       C.error,
    backgroundColor:   C.errorBg,
  },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: C.error },

  btnFill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      9,
    backgroundColor:   C.green,
    elevation:         3,
  },
  btnFillText: { fontSize: 12, fontWeight: '700', color: C.white },
});

// ── Main Screen ──────────────────────────────────────────────────
const OrdersScreen = ({ user }) => {
  const [activeTab,  setActiveTab]  = useState('active');
  const [orders,     setOrders]     = useState({ active: [], past: [], cancelled: [] });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch orders from Neon DB ──────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Fetch all orders for this user
      const rows = await sql`
        SELECT
          o.id,
          o.status,
          o.total_amount,
          o.delivery_address,
          o.notes,
          o.estimated_delivery,
          o.delivery_deadline,
          o.created_at,
          o.confirmed_at,
          o.delivered_at
        FROM orders o
        WHERE o.user_id = ${user.id}
        ORDER BY o.created_at DESC
      `;

      // Fetch order items for all orders
      const orderIds = rows.map(r => r.id);
      let itemRows = [];
      if (orderIds.length > 0) {
        itemRows = await sql`
          SELECT
            order_id,
            product_name,
            unit_price,
            quantity,
            subtotal
          FROM order_items
          WHERE order_id = ANY(${orderIds})
        `;
      }

      // Attach items to each order
      const ordersWithItems = rows.map(order => ({
        ...order,
        items: itemRows.filter(item => item.order_id === order.id),
      }));

      // Split into tabs
      const active    = ordersWithItems.filter(o =>
        ['pending', 'confirmed', 'in_transit'].includes(o.status)
      );
      const past      = ordersWithItems.filter(o => o.status === 'delivered');
      const cancelled = ordersWithItems.filter(o => o.status === 'cancelled');

      setOrders({ active, past, cancelled });
    } catch (err) {
      console.error('Fetch orders error:', err);
      Alert.alert('Error', 'Could not load your orders. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // ── Cancel order (only pending) ────────────────────────────────
  const handleCancel = async (orderId) => {
    try {
      await sql`
        UPDATE orders
        SET status = 'cancelled'
        WHERE id = ${orderId} AND status = 'pending'
      `;
      fetchOrders();
    } catch (err) {
      Alert.alert('Error', 'Could not cancel the order. Please try again.');
    }
  };

  const currentOrders = (orders[activeTab] ?? []).map(o => ({
    ...o,
    onCancel: handleCancel,
  }));

  const activeBadge = orders.active.length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>

        {/* Refresh button */}
        <TouchableOpacity onPress={handleRefresh} style={s.refreshBtn} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={20} color={C.green} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabsWrap}>
        <View style={s.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.key === 'active' && activeBadge > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeText}>{activeBadge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={s.loadingText}>Loading your orders…</Text>
        </View>
      ) : currentOrders.length === 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.green} />
          }
        >
          <EmptyState tabKey={activeTab} />
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.green} />
          }
        >
          {currentOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default OrdersScreen;

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
  refreshBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
  },

  tabsWrap: {
    backgroundColor:   C.white,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabsRow: { flexDirection: 'row' },
  tab: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingBottom:     12,
    paddingRight:      20,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive:      { borderBottomColor: C.green },
  tabLabel:       { fontSize: 13, fontWeight: '600', color: C.textLight },
  tabLabelActive: { color: C.green },
  tabBadge: {
    minWidth:          17,
    height:            17,
    borderRadius:      9,
    backgroundColor:   C.green,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },

  loadingWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
  },
  loadingText: { fontSize: 13, color: C.textLight, fontWeight: '500' },

  body: { padding: 14 },
});