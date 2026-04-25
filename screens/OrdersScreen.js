import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  errorBg:    '#FFEBEE',
};

const TRACK_STEPS = ['Placed', 'Confirmed', 'Picked up', 'On the way', 'Delivered'];

// Set to empty arrays for empty state; populate when real data is available
const ORDERS = {
  active:    [],
  past:      [],
  cancelled: [],
};

const STATUS_STYLES = {
  delivered: { bg: C.greenFaded, text: C.green },
  transit:   { bg: C.accentBg,   text: C.accent },
  cancelled: { bg: C.errorBg,    text: C.error  },
};

const TABS = [
  { key: 'active',    label: 'Active'      },
  { key: 'past',      label: 'Past Orders' },
  { key: 'cancelled', label: 'Cancelled'   },
];

const EMPTY_STATES = {
  active: {
    icon:  '🛒',
    title: 'No active orders',
    sub:   "You don't have any orders in progress. Place an order and it'll appear here.",
  },
  past: {
    icon:  '📋',
    title: 'No past orders yet',
    sub:   "Your completed orders will show up here once you've shopped with us.",
  },
  cancelled: {
    icon:  '🚫',
    title: 'No cancelled orders',
    sub:   "You haven't cancelled any orders — keep it up!",
  },
};

/* ── Tracking Bar ───────────────────────────────────────── */
const TrackingBar = ({ step, eta }) => (
  <View style={t.wrap}>
    <View style={t.headerRow}>
      <MaterialIcons name="local-shipping" size={16} color={C.accent} />
      <Text style={t.eta}>
        Estimated arrival:{' '}
        <Text style={{ fontWeight: '800', color: C.accent }}>{eta}</Text>
      </Text>
    </View>
    <View style={t.stepsRow}>
      {TRACK_STEPS.map((label, i) => {
        const done    = i < step;
        const current = i === step - 1;
        const isLast  = i === TRACK_STEPS.length - 1;
        return (
          <React.Fragment key={label}>
            <View style={t.stepCol}>
              <View style={[t.dot, done && t.dotDone, current && t.dotCurrent]}>
                {done
                  ? <MaterialIcons name="check" size={10} color={C.white} />
                  : <View style={[t.dotInner, current && t.dotInnerCurrent]} />
                }
              </View>
              <Text style={[t.stepLbl, done && t.stepLblDone]}>{label}</Text>
            </View>
            {!isLast && <View style={[t.line, i < step - 1 && t.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  </View>
);

const t = StyleSheet.create({
  wrap: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         14,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     C.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  eta:       { fontSize: 12, color: C.textMid },
  stepsRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  stepCol:   { alignItems: 'center', gap: 5, flex: 0 },
  dot: {
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dotDone:         { backgroundColor: C.green },
  dotCurrent:      { backgroundColor: C.greenLight },
  dotInner:        { width: 8, height: 8, borderRadius: 4, backgroundColor: C.textLight },
  dotInnerCurrent: { backgroundColor: C.white },
  stepLbl:         { fontSize: 8, color: C.textLight, fontWeight: '500', textAlign: 'center', maxWidth: 42 },
  stepLblDone:     { color: C.green, fontWeight: '700' },
  line:            { flex: 1, height: 2, backgroundColor: C.border, marginTop: 9, marginHorizontal: 2 },
  lineDone:        { backgroundColor: C.green },
});

/* ── Empty State ────────────────────────────────────────── */
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
  wrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconBox:  {
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

/* ── Order Card ─────────────────────────────────────────── */
const OrderCard = ({ order }) => {
  const statusStyle  = STATUS_STYLES[order.statusType] ?? STATUS_STYLES.delivered;
  const showTracking = order.statusType === 'transit' && order.step > 0;

  return (
    <View style={oc.card}>
      {/* Top row */}
      <View style={oc.topRow}>
        <View>
          <Text style={oc.orderId}>{order.id}</Text>
          <Text style={oc.orderDate}>{order.date}</Text>
        </View>
        <View style={[oc.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[oc.statusText, { color: statusStyle.text }]}>{order.status}</Text>
        </View>
      </View>

      {showTracking && <TrackingBar step={order.step} eta={order.eta} />}

      {order.cancelReason && (
        <View style={oc.cancelBanner}>
          <MaterialIcons name="info-outline" size={14} color={C.error} />
          <Text style={oc.cancelText}>Reason: {order.cancelReason}</Text>
        </View>
      )}

      {/* Items */}
      <View style={oc.itemsRow}>
        {order.items.map((item, i) => (
          <View key={i} style={oc.itemChip}>
            <View style={oc.itemEmoji}>
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
            </View>
            <View>
              <Text style={oc.itemName}>{item.name}</Text>
              <Text style={oc.itemUnit}>{item.unit} × {item.qty}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={oc.divider} />

      {/* Footer */}
      <View style={oc.footer}>
        <View>
          <Text style={oc.totalLabel}>Order total</Text>
          <Text style={oc.totalVal}>₱{order.total}</Text>
        </View>
        <View style={oc.btnRow}>
          <TouchableOpacity
            style={oc.btnOutline}
            onPress={() => Alert.alert('Receipt', `Order ${order.id}\nTotal: ₱${order.total}\n\nReceipt would open here.`)}
            activeOpacity={0.7}
          >
            <Text style={oc.btnOutlineText}>Receipt</Text>
          </TouchableOpacity>

          {order.statusType === 'transit' && (
            <TouchableOpacity
              style={oc.btnFill}
              onPress={() => Alert.alert('Live Tracking', 'Opening live map tracker...')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="my-location" size={14} color={C.white} />
              <Text style={oc.btnFillText}>Track</Text>
            </TouchableOpacity>
          )}

          {(order.statusType === 'delivered' || order.statusType === 'cancelled') && (
            <TouchableOpacity
              style={oc.btnFill}
              onPress={() => Alert.alert('Reorder', 'All items have been added to your cart!')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="replay" size={14} color={C.white} />
              <Text style={oc.btnFillText}>Reorder</Text>
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
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   12,
  },
  orderId:    { fontSize: 13, fontWeight: '700', color: C.textDark },
  orderDate:  { fontSize: 11, color: C.textLight, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cancelBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: C.errorBg,
    borderRadius:    8,
    padding:         8,
    marginBottom:    10,
  },
  cancelText: { fontSize: 12, color: C.error, fontWeight: '500' },

  itemsRow: { flexDirection: 'column', gap: 8, marginBottom: 12 },
  itemChip: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemEmoji: {
    width:           42,
    height:          42,
    borderRadius:    10,
    backgroundColor: '#F2F2F2',
    alignItems:      'center',
    justifyContent:  'center',
  },
  itemName: { fontSize: 13, fontWeight: '600', color: C.textDark },
  itemUnit: { fontSize: 11, color: C.textLight },

  divider: { height: 1, backgroundColor: C.border, marginBottom: 12 },

  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, color: C.textLight },
  totalVal:   { fontSize: 18, fontWeight: '800', color: C.textDark },
  btnRow:     { flexDirection: 'row', gap: 8 },

  btnOutline: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      9,
    borderWidth:       1.5,
    borderColor:       C.border,
    backgroundColor:   C.white,
  },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: C.textMid },

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

/* ── Main Screen ────────────────────────────────────────── */
const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('active');
  const currentOrders = ORDERS[activeTab] ?? [];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>

        {/* Tabs */}
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
              {tab.key === 'active' && ORDERS.active.length > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeText}>{ORDERS.active.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {currentOrders.length === 0 ? (
        <EmptyState tabKey={activeTab} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
        >
          {currentOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default OrdersScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor:   C.white,
    paddingHorizontal: 18,
    paddingTop:        16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.textDark, marginBottom: 14 },

  tabsRow: { flexDirection: 'row' },
  tab: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingBottom:     12,
    paddingRight:      18,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive:      { borderBottomColor: C.green },
  tabLabel:       { fontSize: 13, fontWeight: '600', color: C.textLight },
  tabLabelActive: { color: C.green },

  tabBadge: {
    minWidth:          18,
    height:            18,
    borderRadius:      9,
    backgroundColor:   C.green,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },

  body: { padding: 14 },
});