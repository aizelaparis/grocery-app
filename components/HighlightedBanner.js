import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { supabase } from '../api/db';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H            = 130;
const SLIDE_INTERVAL      = 4000;

const C = {
  green:      '#2E7D32',
  greenLight: '#4CAF50',
  greenFaded: '#E8F5E9',
  white:      '#FFFFFF',
  textDark:   '#1A2E1A',
  textLight:  '#8A9E88',
};

// ── Fetch top-ordered products ────────────────────────────────────
async function fetchHighlightedProducts() {
  const { data, error } = await supabase
    .from('order_items')
    .select('product_id, order_id');

  if (error || !data || data.length === 0) return [];

  // Build: { "7": Set{8,9,14,...}, "9": Set{8,9,11,...}, ... }
  const ordersPerProduct = {};
  data.forEach(({ product_id, order_id }) => {
    const key = String(product_id);
    if (!ordersPerProduct[key]) ordersPerProduct[key] = new Set();
    ordersPerProduct[key].add(order_id);
  });

  // Build a clean count lookup: { "7": 5, "9": 5, ... }
  const orderCountById = {};
  Object.entries(ordersPerProduct).forEach(([key, orderSet]) => {
    orderCountById[key] = orderSet.size;
  });

  // Sort product ids by order count descending
  const ranked = Object.entries(orderCountById)
    .sort((a, b) => b[1] - a[1]);

  // Keep products with > 2 orders; fall back to top-4 if fewer than 2 qualify
  let topIds = ranked
    .filter(([, count]) => count > 2)
    .map(([id]) => Number(id));

  if (topIds.length < 2) {
    topIds = ranked.slice(0, 4).map(([id]) => Number(id));
  }

  if (topIds.length === 0) return [];

  // Fetch full product rows
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, image_url, category, unit_price')
    .in('id', topIds);

  if (pErr || !products) return [];

  // Attach the correct orderCount to each product
  return products.map(p => ({
    ...p,
    orderCount: orderCountById[String(p.id)] ?? 0,
  }));
}

// ── Single slide ──────────────────────────────────────────────────
const BannerSlide = ({ product }) => (
  <View style={s.slide}>
    <View style={s.textCol}>
      <View style={s.tagPill}>
        <Text style={s.tagText}>🔥 Top Pick</Text>
      </View>
      <Text style={s.title} numberOfLines={2}>{product.name}</Text>
      <Text style={s.orderCount}>
        {product.orderCount} orders this week
      </Text>
    </View>

    <View style={s.imgWrap}>
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={s.img}
          resizeMode="contain"
        />
      ) : (
        <Text style={s.fallbackEmoji}>🛒</Text>
      )}
    </View>
  </View>
);

// ── Dot indicator ─────────────────────────────────────────────────
const Dots = ({ count, active }) => (
  <View style={s.dotsRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[s.dot, i === active && s.dotActive]} />
    ))}
  </View>
);

// ── Main component ────────────────────────────────────────────────
const HighlightedBanner = () => {
  const [products,    setProducts]    = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const scrollRef                     = useRef(null);
  const timerRef                      = useRef(null);
  const currentIndex                  = useRef(0);

  useEffect(() => {
    fetchHighlightedProducts()
      .then(data => setProducts(data))
      .catch(err => console.error('HighlightedBanner error:', err))
      .finally(() => setLoading(false));
  }, []);

  const looped = products.length > 0
    ? [...products, ...products, ...products]
    : [];
  const offset = products.length;

  // Silently jump to the middle copy once products load
  useEffect(() => {
    if (!products.length || !scrollRef.current) return;
    const bannerW = SCREEN_W - 36;
    scrollRef.current.scrollTo({ x: offset * bannerW, animated: false });
    currentIndex.current = offset;
    setActiveIndex(0);
  }, [products]);

  // Auto-advance timer
  useEffect(() => {
    if (!products.length) return;
    const bannerW = SCREEN_W - 36;

    timerRef.current = setInterval(() => {
      const next = currentIndex.current + 1;
      scrollRef.current?.scrollTo({ x: next * bannerW, animated: true });
      currentIndex.current = next;
      setActiveIndex((next - offset + products.length) % products.length);

      // Silently reset to middle copy when reaching the last copy
      if (next >= offset + products.length) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: offset * bannerW, animated: false });
          currentIndex.current = offset;
        }, 350);
      }
    }, SLIDE_INTERVAL);

    return () => clearInterval(timerRef.current);
  }, [products]);

  if (loading) {
    return (
      <View style={[s.container, s.placeholder]}>
        <Text style={s.loadingText}>Loading highlights…</Text>
      </View>
    );
  }

  if (!products.length) return null;

  const bannerW = SCREEN_W - 36;

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ width: bannerW }}
        contentContainerStyle={{ width: bannerW * looped.length }}
      >
        {looped.map((product, i) => (
          <View key={`${product.id}-${i}`} style={{ width: bannerW }}>
            <BannerSlide product={product} />
          </View>
        ))}
      </ScrollView>

      <Dots count={products.length} active={activeIndex} />
    </View>
  );
};

export default HighlightedBanner;

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    borderRadius:     18,
    backgroundColor:  C.green,
    overflow:         'hidden',
    marginBottom:     22,
  },
  placeholder: {
    height:         BANNER_H + 24,
    alignItems:     'center',
    justifyContent: 'center',
  },
  loadingText: {
    color:    'rgba(255,255,255,0.6)',
    fontSize: 13,
  },

  slide: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   18,
    paddingHorizontal: 22,
    height:            BANNER_H,
  },
  textCol: {
    flex:         1,
    gap:          4,
    paddingRight: 8,
  },

  tagPill: {
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderRadius:      20,
    alignSelf:         'flex-start',
    paddingHorizontal: 9,
    paddingVertical:   3,
    marginBottom:      2,
  },
  tagText: {
    fontSize:   11,
    color:      'rgba(255,255,255,0.92)',
    fontWeight: '600',
  },

  title: {
    fontSize:   16,
    fontWeight: '800',
    color:      C.white,
    lineHeight: 21,
  },
  orderCount: {
    fontSize:   11,
    color:      'rgba(255,255,255,0.72)',
    marginTop:  2,
    fontWeight: '500',
  },

  imgWrap: {
    width:           100,
    height:          95,
    borderRadius:    14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  img: {
    width:        '90%',
    height:       '90%',
    borderRadius: 12,
  },
  fallbackEmoji: {
    fontSize: 46,
  },

  dotsRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            5,
    paddingBottom:  10,
  },
  dot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: C.white,
    width:           16,
  },
});