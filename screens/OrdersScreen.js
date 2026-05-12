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
import { supabase } from '../api/db';

// ── Live countdown hook ──────────────────────────────────────────
const useCountdown = (deadline) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setRemaining('Arriving now'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
};

// ── Colors ───────────────────────────────────────────────────────
const C = {
  green:      '#2E7D32',
  greenLight: '#4CAF50',
  greenFaded: '#F1F8F1',
  white:      '#FFFFFF',
  border:     '#E8F0E8',
  textDark:   '#111827',
  textMid:    '#4B5563',
  textLight:  '#9CA3AF',
  bg:         '#F9FBF9',
  accent:     '#EA580C',
  accentBg:   '#FFF7ED',
  error:      '#DC2626',
  errorBg:    '#FEF2F2',
  pill:       '#F3F4F6',
};

// ── Status config — step labels adapt to fulfillment mode ────────
// When pickup-only: step 3 becomes "Ready" instead of "On the Way"
const getStatusConfig = (fulfillmentMode) => ({
  pending:    { label: 'Pending',    color: '#D97706', bg: '#FFFBEB',    icon: 'schedule',       step: 1 },
  confirmed:  { label: 'Confirmed',  color: '#1D4ED8', bg: '#EFF6FF',    icon: 'check-circle',   step: 2 },
  in_transit: {
    label: fulfillmentMode === 'pickup' ? 'Ready for Pick-up' : 'On the Way',
    color: C.accent,
    bg:    C.accentBg,
    icon:  fulfillmentMode === 'pickup' ? 'storefront' : 'local-shipping',
    step:  3,
  },
  delivered:  {
    label: fulfillmentMode === 'pickup' ? 'Picked Up' : 'Delivered',
    color: C.green,
    bg:    C.greenFaded,
    icon:  fulfillmentMode === 'pickup' ? 'done-all' : 'done-all',
    step:  4,
  },
  cancelled:  { label: 'Cancelled',  color: C.error,   bg: C.errorBg,    icon: 'cancel',         step: 0 },
});

// Step labels also adapt to pickup mode
const getTrackSteps = (fulfillmentMode) => [
  { key: 'pending',    label: 'Placed',     icon: 'receipt'                                              },
  { key: 'confirmed',  label: 'Confirmed',  icon: 'check-circle'                                         },
  { key: 'in_transit', label: fulfillmentMode === 'pickup' ? 'Ready' : 'On the Way',
    icon: fulfillmentMode === 'pickup' ? 'storefront' : 'local-shipping'                                  },
  { key: 'delivered',  label: fulfillmentMode === 'pickup' ? 'Picked Up' : 'Delivered', icon: 'done-all' },
];

const TABS = [
  { key: 'active',    label: 'Active'    },
  { key: 'past',      label: 'Past'      },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_STATES = {
  active:    { icon: '🛒', title: 'No active orders',    sub: "You don't have any orders in progress." },
  past:      { icon: '📋', title: 'No past orders yet',  sub: 'Completed orders will appear here.'     },
  cancelled: { icon: '🚫', title: 'No cancelled orders', sub: "You haven't cancelled any orders."      },
};

// ── Fulfillment mode banner (shown at top when pickup-only) ──────
const FulfillmentBanner = ({ mode }) => {
  if (mode === 'both' || !mode) return null;

  const config = {
    pickup: {
      icon:    'storefront',
      bg:      '#FFFBEB',
      border:  '#FDE68A',
      color:   '#92400E',
      message: 'Pick-up only — collect your order at the store.',
    },
    delivery: {
      icon:    'local-shipping',
      bg:      C.greenFaded,
      border:  C.border,
      color:   C.green,
      message: 'Delivery only — your order will be delivered to your address.',
    },
  };

  const cfg = config[mode];
  if (!cfg) return null;

  return (
    <View style={[fb.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <MaterialIcons name={cfg.icon} size={14} color={cfg.color} />
      <Text style={[fb.text, { color: cfg.color }]}>{cfg.message}</Text>
    </View>
  );
};

const fb = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    marginHorizontal:  14,
    marginTop:         12,
    marginBottom:      4,
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:      10,
    borderWidth:       1,
  },
  text: { fontSize: 12, fontWeight: '600', flex: 1 },
});

// ── Compact Tracking Bar ─────────────────────────────────────────
const TrackingBar = ({ status, estimatedDelivery, deliveryDeadline, fulfillmentMode }) => {
  const STATUS_CONFIG = getStatusConfig(fulfillmentMode);
  const TRACK_STEPS   = getTrackSteps(fulfillmentMode);

  const currentStep = STATUS_CONFIG[status]?.step ?? 1;
  const countdown   = useCountdown(deliveryDeadline);
  const isArriving  = countdown === 'Arriving now';

  // ETA label adapts: pickup shows "Ready in X" instead of "X away"
  const etaLabel = (() => {
    if (!deliveryDeadline && !estimatedDelivery) return null;
    if (deliveryDeadline) {
      if (isArriving) return fulfillmentMode === 'pickup' ? 'Ready now!' : 'Arriving now!';
      return fulfillmentMode === 'pickup' ? `Ready in ${countdown}` : `${countdown} away`;
    }
    return `Est. ${estimatedDelivery}`;
  })();

  return (
    <View style={tr.wrap}>
      {/* ETA pill */}
      {etaLabel && (
        <View style={[tr.etaPill, isArriving && tr.etaPillGreen]}>
          <MaterialIcons
            name={isArriving
              ? (fulfillmentMode === 'pickup' ? 'storefront' : 'place')
              : 'timer'}
            size={12}
            color={isArriving ? C.green : C.accent}
          />
          <Text style={[tr.etaText, isArriving && tr.etaTextGreen]}>
            {etaLabel}
          </Text>
        </View>
      )}

      {/* Step dots */}
      <View style={tr.stepsRow}>
        {TRACK_STEPS.map((step, i) => {
          const stepNum = i + 1;
          const done    = currentStep > stepNum;
          const current = currentStep === stepNum;
          const isLast  = i === TRACK_STEPS.length - 1;

          return (
            <React.Fragment key={step.key}>
              <View style={tr.stepCol}>
                <View style={[tr.dot, done && tr.dotDone, current && tr.dotCurrent]}>
                  {done
                    ? <MaterialIcons name="check" size={9} color={C.white} />
                    : <MaterialIcons name={step.icon} size={9} color={current ? C.white : '#D1D5DB'} />
                  }
                </View>
                <Text style={[tr.lbl, (done || current) && tr.lblActive]}>
                  {step.label}
                </Text>
              </View>
              {!isLast && <View style={[tr.line, done && tr.lineDone]} />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const tr = StyleSheet.create({
  wrap: {
    borderRadius:      10,
    paddingVertical:   10,
    paddingHorizontal: 12,
    backgroundColor:   C.greenFaded,
    borderWidth:       1,
    borderColor:       C.border,
    gap:               10,
    marginBottom:      12,
  },
  etaPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    alignSelf:         'flex-start',
    backgroundColor:   C.accentBg,
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  etaPillGreen:  { backgroundColor: '#DCFCE7' },
  etaText:       { fontSize: 11, fontWeight: '700', color: C.accent },
  etaTextGreen:  { color: C.green },
  stepsRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  stepCol:       { alignItems: 'center', gap: 4, flex: 0 },
  dot: {
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: '#E5E7EB',
    alignItems:      'center',
    justifyContent:  'center',
  },
  dotDone:    { backgroundColor: C.green },
  dotCurrent: { backgroundColor: C.greenLight },
  lbl:        { fontSize: 8, color: C.textLight, fontWeight: '500', textAlign: 'center', maxWidth: 46 },
  lblActive:  { color: C.green, fontWeight: '700' },
  line:       { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginTop: 10, marginHorizontal: 3 },
  lineDone:   { backgroundColor: C.green },
});

// ── Empty State ──────────────────────────────────────────────────
const EmptyState = ({ tabKey }) => {
  const { icon, title, sub } = EMPTY_STATES[tabKey];
  return (
    <View style={em.wrap}>
      <Text style={em.icon}>{icon}</Text>
      <Text style={em.title}>{title}</Text>
      <Text style={em.sub}>{sub}</Text>
    </View>
  );
};

const em = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 72, paddingHorizontal: 40 },
  icon:  { fontSize: 44, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '800', color: C.textDark, marginBottom: 6, textAlign: 'center' },
  sub:   { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 19 },
});

// ── Order Card ───────────────────────────────────────────────────
const OrderCard = ({ order, fulfillmentMode }) => {
  const STATUS_CONFIG = getStatusConfig(fulfillmentMode);
  const cfg           = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const isActive      = ['pending', 'confirmed', 'in_transit'].includes(order.status);
  const isCancelled   = order.status === 'cancelled';
  const isDelivered   = order.status === 'delivered';

  // "Pay on Pickup" label adapts to mode
  const paymentLabel = fulfillmentMode === 'delivery'
    ? 'Total · Pay on Delivery'
    : 'Total · Pay on Pick-up';

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const visibleItems = order.items.slice(0, 2);
  const hiddenCount  = order.items.length - 2;

  return (
    <View style={oc.card}>

      {/* ── Header: Order ID + Status ── */}
      <View style={oc.header}>
        <View>
          <Text style={oc.orderId}>Order #{String(order.id).padStart(5, '0')}</Text>
          <Text style={oc.date}>{formattedDate}</Text>
        </View>
        <View style={[oc.statusPill, { backgroundColor: cfg.bg }]}>
          <MaterialIcons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[oc.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* ── Tracking bar (active only) ── */}
      {isActive && (
        <TrackingBar
          status={order.status}
          estimatedDelivery={order.estimated_delivery}
          deliveryDeadline={order.delivery_deadline}
          fulfillmentMode={fulfillmentMode}
        />
      )}

      {/* ── Items ── */}
      <View style={oc.itemsBox}>
        {visibleItems.map((item, i) => (
          <View key={i} style={oc.itemRow}>
            <View style={oc.itemBullet} />
            <Text style={oc.itemName} numberOfLines={1}>{item.product_name}</Text>
            <Text style={oc.itemMeta}>×{item.quantity}</Text>
            <Text style={oc.itemPrice}>₱{parseFloat(item.subtotal).toFixed(2)}</Text>
          </View>
        ))}
        {hiddenCount > 0 && (
          <Text style={oc.moreItems}>+{hiddenCount} more item{hiddenCount > 1 ? 's' : ''}</Text>
        )}
      </View>

      {/* ── Delivery address (only shown when delivery is active) ── */}
      {order.delivery_address && (fulfillmentMode === 'delivery' || fulfillmentMode === 'both') && (
        <View style={oc.addressRow}>
          <MaterialIcons name="place" size={12} color={C.textLight} />
          <Text style={oc.addressText} numberOfLines={2}>{order.delivery_address}</Text>
        </View>
      )}

      {/* ── Notes ── */}
      {!!order.notes && (
        <View style={oc.noteRow}>
          <MaterialIcons name="sticky-note-2" size={12} color={C.textLight} />
          <Text style={oc.noteText} numberOfLines={2}>{order.notes}</Text>
        </View>
      )}

      {/* ── Footer: Total + Action ── */}
      <View style={oc.footer}>
        <View>
          <Text style={oc.totalLabel}>{paymentLabel}</Text>
          <Text style={oc.totalVal}>₱{parseFloat(order.total_amount).toFixed(2)}</Text>
        </View>

        <View style={oc.actions}>
          {(isCancelled || isDelivered) && (
            <TouchableOpacity
              style={oc.btnPrimary}
              onPress={() => Alert.alert('Reorder', 'Items will be added to your cart.')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="replay" size={13} color={C.white} />
              <Text style={oc.btnPrimaryText}>Reorder</Text>
            </TouchableOpacity>
          )}
          {order.status === 'pending' && (
            <TouchableOpacity
              style={oc.btnDanger}
              onPress={() =>
                Alert.alert('Cancel Order', 'Cancel this order?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Cancel Order', style: 'destructive', onPress: () => order.onCancel?.(order.id) },
                ])
              }
              activeOpacity={0.7}
            >
              <Text style={oc.btnDangerText}>Cancel</Text>
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
    padding:         16,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.04,
    shadowRadius:    6,
    elevation:       2,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   12,
  },
  orderId:    { fontSize: 14, fontWeight: '800', color: C.textDark, letterSpacing: -0.3 },
  date:       { fontSize: 11, color: C.textLight, marginTop: 2 },
  statusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 9,
    paddingVertical:   5,
    borderRadius:      20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemsBox: {
    backgroundColor:   C.bg,
    borderRadius:      10,
    paddingVertical:   8,
    paddingHorizontal: 12,
    gap:               6,
    marginBottom:      10,
  },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.greenLight, flexShrink: 0 },
  itemName:   { flex: 1, fontSize: 12, color: C.textDark, fontWeight: '500' },
  itemMeta:   { fontSize: 11, color: C.textLight },
  itemPrice:  { fontSize: 12, color: C.green, fontWeight: '700' },
  moreItems:  { fontSize: 11, color: C.textLight, marginLeft: 13, marginTop: 2 },
  addressRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               6,
    paddingHorizontal: 10,
    paddingVertical:   8,
    backgroundColor:   '#EFF6FF',
    borderRadius:      8,
    marginBottom:      10,
  },
  addressText: { fontSize: 11, color: '#1D4ED8', flex: 1, lineHeight: 16 },
  noteRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               6,
    paddingHorizontal: 10,
    paddingVertical:   8,
    backgroundColor:   '#FEFCE8',
    borderRadius:      8,
    marginBottom:      10,
  },
  noteText: { fontSize: 11, color: C.textMid, flex: 1, lineHeight: 16 },
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel:     { fontSize: 11, color: C.textLight },
  totalVal:       { fontSize: 17, fontWeight: '800', color: C.textDark, letterSpacing: -0.5 },
  actions:        { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      10,
    backgroundColor:   C.green,
  },
  btnPrimaryText: { fontSize: 12, fontWeight: '700', color: C.white },
  btnDanger: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      10,
    backgroundColor:   C.errorBg,
    borderWidth:       1,
    borderColor:       '#FECACA',
  },
  btnDangerText: { fontSize: 12, fontWeight: '600', color: C.error },
});

// ── Fulfillment Method Selector (used at checkout) ────────────────
// Import and use this wherever the customer picks how to receive their order.
// Pass in fulfillmentMode from store_settings so it grays out unavailable options.
export const FulfillmentMethodPicker = ({ fulfillmentMode, selected, onSelect }) => {
  const pickupEnabled   = fulfillmentMode === 'pickup'   || fulfillmentMode === 'both';
  const deliveryEnabled = fulfillmentMode === 'delivery' || fulfillmentMode === 'both';

  return (
    <View style={fp.row}>
      {/* Pick-up card */}
      <TouchableOpacity
        style={[
          fp.card,
          selected === 'pickup'   && fp.cardActive,
          !pickupEnabled          && fp.cardDisabled,
        ]}
        onPress={() => pickupEnabled && onSelect('pickup')}
        activeOpacity={pickupEnabled ? 0.7 : 1}
      >
        <MaterialIcons
          name="storefront"
          size={22}
          color={pickupEnabled ? (selected === 'pickup' ? C.green : C.textMid) : '#D1D5DB'}
        />
        <Text style={[fp.label, !pickupEnabled && fp.labelDim]}>Pick-up</Text>
        <Text style={[fp.sub,   !pickupEnabled && fp.labelDim]}>
          {pickupEnabled ? 'Collect at store' : 'Unavailable'}
        </Text>
        {!pickupEnabled && (
          <View style={fp.badge}>
            <Text style={fp.badgeText}>Unavailable</Text>
          </View>
        )}
        {selected === 'pickup' && pickupEnabled && (
          <View style={fp.checkMark}>
            <MaterialIcons name="check" size={10} color={C.white} />
          </View>
        )}
      </TouchableOpacity>

      {/* Delivery card */}
      <TouchableOpacity
        style={[
          fp.card,
          selected === 'delivery'  && fp.cardActive,
          !deliveryEnabled         && fp.cardDisabled,
        ]}
        onPress={() => deliveryEnabled && onSelect('delivery')}
        activeOpacity={deliveryEnabled ? 0.7 : 1}
      >
        <MaterialIcons
          name="local-shipping"
          size={22}
          color={deliveryEnabled ? (selected === 'delivery' ? C.green : C.textMid) : '#D1D5DB'}
        />
        <Text style={[fp.label, !deliveryEnabled && fp.labelDim]}>Delivery</Text>
        <Text style={[fp.sub,   !deliveryEnabled && fp.labelDim]}>
          {deliveryEnabled ? 'Delivered to you' : 'Unavailable'}
        </Text>
        {!deliveryEnabled && (
          <View style={fp.badge}>
            <Text style={fp.badgeText}>Unavailable</Text>
          </View>
        )}
        {selected === 'delivery' && deliveryEnabled && (
          <View style={fp.checkMark}>
            <MaterialIcons name="check" size={10} color={C.white} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const fp = StyleSheet.create({
  row:          { flexDirection: 'row', gap: 10 },
  card: {
    flex:              1,
    alignItems:        'center',
    gap:               4,
    paddingVertical:   14,
    paddingHorizontal: 10,
    borderRadius:      12,
    borderWidth:       1.5,
    borderColor:       C.border,
    backgroundColor:   C.white,
    position:          'relative',
  },
  cardActive:   { borderColor: C.green, backgroundColor: C.greenFaded },
  cardDisabled: { borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  label:        { fontSize: 13, fontWeight: '700', color: C.textDark, marginTop: 2 },
  sub:          { fontSize: 10, color: C.textLight, textAlign: 'center' },
  labelDim:     { color: '#D1D5DB' },
  badge: {
    marginTop:         4,
    backgroundColor:   '#F3F4F6',
    borderRadius:      20,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  badgeText:  { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  checkMark: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: C.green,
    alignItems:      'center',
    justifyContent:  'center',
  },
});

// ── Main Screen ──────────────────────────────────────────────────
const OrdersScreen = ({ user, onActiveOrdersChange }) => {
  const [activeTab,       setActiveTab]       = useState('active');
  const [orders,          setOrders]          = useState({ active: [], past: [], cancelled: [] });
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  // ── Fulfillment mode fetched once here, passed down to all children ──
  const [fulfillmentMode, setFulfillmentMode] = useState('pickup');

  // Fetch fulfillment mode from store_settings
  useEffect(() => {
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'fulfillment_mode')
      .single()
      .then(({ data }) => {
        if (data?.value) setFulfillmentMode(data.value);
      });
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: rows, error } = await supabase
        .from('orders')
        .select(`
          id, status, total_amount, delivery_address,
          notes, estimated_delivery, delivery_deadline,
          created_at, confirmed_at, delivered_at,
          order_items (
            order_id, product_name, unit_price, quantity, subtotal
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped    = (rows ?? []).map(o => ({ ...o, items: o.order_items ?? [] }));
      const active    = mapped.filter(o => ['pending', 'confirmed', 'in_transit'].includes(o.status));
      const past      = mapped.filter(o => o.status === 'delivered');
      const cancelled = mapped.filter(o => o.status === 'cancelled');

      setOrders({ active, past, cancelled });
      onActiveOrdersChange?.(active.length);
    } catch (err) {
      console.error('Fetch orders error:', err.message);
      Alert.alert('Error', 'Could not load your orders. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, onActiveOrdersChange]);

  const handleCancel = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('status', 'pending');
      if (error) throw error;
      fetchOrders();
    } catch {
      Alert.alert('Error', 'Could not cancel the order. Please try again.');
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('orders-screen')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `user_id=eq.${user?.id}`,
      }, () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

  const handleRefresh = () => { setRefreshing(true); fetchOrders(); };

  const currentOrders = (orders[activeTab] ?? []).map(o => ({ ...o, onCancel: handleCancel }));
  const activeBadge   = orders.active.length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={handleRefresh} style={s.refreshBtn} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={18} color={C.green} />
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabsBar}>
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
              <View style={s.badge}>
                <Text style={s.badgeText}>{activeBadge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={s.loaderText}>Loading orders…</Text>
        </View>
      ) : currentOrders.length === 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.green} />
          }
        >
          <FulfillmentBanner mode={fulfillmentMode} />
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
          {/* Banner at top of list */}
          <FulfillmentBanner mode={fulfillmentMode} />

          {currentOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              fulfillmentMode={fulfillmentMode}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default OrdersScreen;

// ── Screen Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    backgroundColor:   C.white,
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.textDark, letterSpacing: -0.5 },
  refreshBtn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tabsBar: {
    flexDirection:     'row',
    backgroundColor:   C.white,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingVertical:   12,
    marginRight:       24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive:      { borderBottomColor: C.green },
  tabLabel:       { fontSize: 13, fontWeight: '600', color: C.textLight },
  tabLabelActive: { color: C.green },
  badge: {
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    backgroundColor:   C.green,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 4,
  },
  badgeText:  { fontSize: 9, fontWeight: '800', color: C.white },
  loader:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loaderText: { fontSize: 13, color: C.textLight },
  body:       { padding: 14, paddingTop: 8 },
});