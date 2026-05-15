import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// ── How to use the app steps ──────────────────────────────
const HOW_TO_STEPS = [
  {
    icon: 'storefront',
    title: 'Browse Items',
    desc: 'Open the app and you\'ll see all available products. You can browse by category or scroll through everything.',
  },
  {
    icon: 'add-shopping-cart',
    title: 'Add to Cart',
    desc: 'Tap any item you want to buy, then tap "Add to Cart". You can adjust the quantity before adding.',
  },
  {
    icon: 'shopping-cart',
    title: 'Review Your Cart',
    desc: 'Go to the Cart tab to check your items. You can remove or update quantities there before placing your order.',
  },
  {
    icon: 'receipt-long',
    title: 'Place Your Order',
    desc: 'Tap "Place Order" in the Cart. Make sure your delivery address (your building or gate location) is set correctly.',
  },
  {
    icon: 'local-shipping',
    title: 'Wait for Delivery',
    desc: 'Once your order is confirmed, it will be brought to your location inside the camp. You\'ll see your order status under the Orders tab.',
  },
  {
    icon: 'check-circle',
    title: 'Receive Your Items',
    desc: 'When your order arrives, the status will update to Delivered. That\'s it — easy!',
  },
];

// ── FAQ items ─────────────────────────────────────────────
const FAQS = [
  {
    q: 'How do I set my delivery location?',
    a: 'Go to your Profile and tap "Delivery Address". Enter your building name or gate location so we know exactly where to bring your order.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Most orders are delivered within 15–30 minutes after confirmation, depending on the items and current orders being processed.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'You can cancel while the order is still "Pending". Once it\'s confirmed, please contact the store directly since it\'s already being prepared.',
  },
  {
    q: 'What if an item is out of stock?',
    a: 'Out-of-stock items won\'t show as available. If something runs out after you order, the store will reach out to you.',
  },
  {
    q: 'Can I order for someone else inside the camp?',
    a: 'Yes, just make sure to enter the correct delivery address (their building location) when placing the order.',
  },
];

// ── Contact info ──────────────────────────────────────────
const CONTACTS = [
  {
    icon: 'phone',
    label: 'Call the Store',
    value: '+63 912 372 4567',
    action: () => Linking.openURL('tel:+639123724567'),
    color: C.green,
  },
  {
    icon: 'email',
    label: 'Send an Email',
    value: 'riyajeff123@gmail.com',
    action: () => Linking.openURL('mailto:riyajeff123@gmail.com'),
    color: C.accent,
  },
];

/* ── Main Screen ─────────────────────────────────────────── */
const HelpAndSupportScreen = ({ navigation }) => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq(prev => (prev === index ? null : index));
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Help & Support</Text>
          <Text style={s.headerSub}>We're here to help you</Text>
        </View>
        <View style={s.headerIcon}>
          <MaterialIcons name="support-agent" size={26} color={C.white} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── About Pamili ── */}
        <View style={s.aboutCard}>
          <MaterialIcons name="info-outline" size={20} color={C.green} style={{ marginBottom: 8 }} />
          <Text style={s.aboutTitle}>What is Pamili?</Text>
          <Text style={s.aboutText}>
            Pamili is your camp's very own mini-mart app. It lets you order groceries and everyday items
            right from your phone — and we'll bring it straight to your building inside the naval camp.
            No need to go out. Just order, wait, and receive.
          </Text>
        </View>

        {/* ── How to Use ── */}
        <SectionHeader icon="menu-book" title="How to Use the App" />
        <View style={s.stepsCard}>
          {HOW_TO_STEPS.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepLeft}>
                <View style={s.stepNumCircle}>
                  <Text style={s.stepNum}>{i + 1}</Text>
                </View>
                {i < HOW_TO_STEPS.length - 1 && <View style={s.stepLine} />}
              </View>
              <View style={s.stepContent}>
                <View style={s.stepIconWrap}>
                  <MaterialIcons name={step.icon} size={16} color={C.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── FAQ ── */}
        <SectionHeader icon="quiz" title="Common Questions" />
        <View style={s.faqCard}>
          {FAQS.map((item, i) => (
            <View key={i}>
              <TouchableOpacity
                style={s.faqRow}
                onPress={() => toggleFaq(i)}
                activeOpacity={0.7}
              >
                <Text style={s.faqQ}>{item.q}</Text>
                <MaterialIcons
                  name={openFaq === i ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color={C.textLight}
                />
              </TouchableOpacity>
              {openFaq === i && (
                <View style={s.faqAnswer}>
                  <Text style={s.faqA}>{item.a}</Text>
                </View>
              )}
              {i < FAQS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        {/* ── Contact Us ── */}
        <SectionHeader icon="headset-mic" title="Talk to Us" />
        <View style={s.contactsWrap}>
          {CONTACTS.map((c, i) => (
            <TouchableOpacity key={i} style={s.contactCard} onPress={c.action} activeOpacity={0.8}>
              <View style={[s.contactIconWrap, { backgroundColor: c.color + '22' }]}>
                <MaterialIcons name={c.icon} size={22} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactLabel}>{c.label}</Text>
                <Text style={[s.contactValue, { color: c.color }]}>{c.value}</Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={C.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Store Hours ── */}
        <SectionHeader icon="access-time" title="Store Hours" />
        <View style={s.hoursCard}>
          <HoursRow day="Monday – Friday" time="7:00 AM – 9:00 PM" />
          <View style={s.divider} />
          <HoursRow day="Saturday" time="8:00 AM – 8:00 PM" />
          <View style={s.divider} />
          <HoursRow day="Sunday" time="9:00 AM – 6:00 PM" />
        </View>

        <Text style={s.footer}>Pamili v1.0.0 · Naval Camp Mini-Mart</Text>
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */

const SectionHeader = ({ icon, title }) => (
  <View style={sh.wrap}>
    <View style={sh.iconWrap}>
      <MaterialIcons name={icon} size={15} color={C.green} />
    </View>
    <Text style={sh.title}>{title}</Text>
  </View>
);

const HoursRow = ({ day, time }) => (
  <View style={hr.row}>
    <Text style={hr.day}>{day}</Text>
    <Text style={hr.time}>{time}</Text>
  </View>
);

/* ── StyleSheets ─────────────────────────────────────────── */

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingTop: 16 },

  header: {
    backgroundColor:    C.green,
    paddingTop:         52,
    paddingBottom:      20,
    paddingHorizontal:  20,
    flexDirection:      'row',
    alignItems:         'center',
    gap:                14,
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.white },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  headerIcon: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // About card
  aboutCard: {
    backgroundColor:   C.white,
    marginHorizontal:  18,
    marginBottom:      20,
    borderRadius:      16,
    padding:           18,
    elevation:         3,
    shadowColor:       C.green,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.08,
    shadowRadius:      8,
    alignItems:        'flex-start',
  },
  aboutTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 6 },
  aboutText:  { fontSize: 13, color: C.textMid, lineHeight: 20 },

  // Steps
  stepsCard: {
    backgroundColor:  C.white,
    marginHorizontal: 18,
    marginBottom:     20,
    borderRadius:     16,
    padding:          16,
    elevation:        3,
    shadowColor:      C.green,
    shadowOffset:     { width: 0, height: 3 },
    shadowOpacity:    0.08,
    shadowRadius:     8,
  },
  stepRow: {
    flexDirection: 'row',
    gap:           12,
    minHeight:     68,
  },
  stepLeft: {
    alignItems:  'center',
    width:       24,
  },
  stepNumCircle: {
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: C.green,
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepNum: { fontSize: 11, fontWeight: '800', color: C.white },
  stepLine: {
    flex:            1,
    width:           2,
    backgroundColor: C.border,
    marginTop:       4,
    marginBottom:    0,
  },
  stepContent: {
    flex:          1,
    flexDirection: 'row',
    gap:           10,
    paddingBottom: 16,
  },
  stepIconWrap: {
    width:           30,
    height:          30,
    borderRadius:    8,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       0,
  },
  stepTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 3 },
  stepDesc:  { fontSize: 12, color: C.textMid, lineHeight: 18 },

  // FAQ
  faqCard: {
    backgroundColor:  C.white,
    marginHorizontal: 18,
    marginBottom:     20,
    borderRadius:     16,
    overflow:         'hidden',
    elevation:        3,
    shadowColor:      C.green,
    shadowOffset:     { width: 0, height: 3 },
    shadowOpacity:    0.08,
    shadowRadius:     8,
  },
  faqRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    gap:               10,
  },
  faqQ:      { flex: 1, fontSize: 13, fontWeight: '600', color: C.textDark },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom:     14,
    paddingTop:        0,
    backgroundColor:   C.greenFaded,
  },
  faqA: { fontSize: 13, color: C.textMid, lineHeight: 20 },

  divider: {
    height:          1,
    backgroundColor: C.border,
    marginHorizontal: 16,
  },

  // Contacts
  contactsWrap: {
    marginHorizontal: 18,
    marginBottom:     20,
    gap:              10,
  },
  contactCard: {
    backgroundColor:   C.white,
    borderRadius:      14,
    padding:           14,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    elevation:         3,
    shadowColor:       C.green,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.08,
    shadowRadius:      8,
  },
  contactIconWrap: {
    width:           44,
    height:          44,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
  },
  contactLabel: { fontSize: 11, color: C.textLight, fontWeight: '500', marginBottom: 2 },
  contactValue: { fontSize: 13, fontWeight: '700' },

  // Hours
  hoursCard: {
    backgroundColor:  C.white,
    marginHorizontal: 18,
    marginBottom:     20,
    borderRadius:     16,
    overflow:         'hidden',
    elevation:        3,
    shadowColor:      C.green,
    shadowOffset:     { width: 0, height: 3 },
    shadowOpacity:    0.08,
    shadowRadius:     8,
  },

  footer: {
    textAlign:    'center',
    fontSize:     11,
    color:        C.textLight,
    marginBottom: 6,
    marginTop:    4,
  },
});

const sh = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    marginHorizontal:  22,
    marginBottom:      10,
  },
  iconWrap: {
    width:           24,
    height:          24,
    borderRadius:    7,
    backgroundColor: C.greenFaded,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title: {
    fontSize:      11,
    fontWeight:    '700',
    color:         C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

const hr = StyleSheet.create({
  row: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   13,
  },
  day:  { fontSize: 13, fontWeight: '600', color: C.textDark },
  time: { fontSize: 13, color: C.green, fontWeight: '700' },
});

export default HelpAndSupportScreen;