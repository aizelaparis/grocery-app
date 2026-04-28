import React, { useRef, useEffect, useState } from 'react';
import {
  Animated, Dimensions, FlatList,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { sql } from '../api/db';
import { getCategoryMeta } from '../constants/categoryIcons';

const { width } = Dimensions.get('window');
const COLS      = 4;
const GAP       = 12;
const ITEM_SIZE = (width - 32 - GAP * (COLS - 1)) / COLS;

const C = {
  bg:      '#F7FAF5',
  white:   '#FFFFFF',
  dark:    '#1A2A14',
  mid:     '#3A4A30',
  muted:   '#8FA67A',
  border:  '#E2E6DA',
  green:   '#2E7D32',
  pill:    '#E8F5E9',
  pillTxt: '#2E7D32',
};

// ── Animated category tile ──────────────────────────────────────
const CategoryItem = ({ item, onPress, index }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:        1,
      duration:       350,
      delay:          index * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity:   anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    }}>
      <TouchableOpacity style={s.item} onPress={() => onPress(item)} activeOpacity={0.7}>
        <View style={[s.iconBox, { backgroundColor: item.bg }]}>
          <Text style={s.emoji}>{item.emoji}</Text>
        </View>
        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Featured card (top 2 most-stocked categories) ───────────────
const FeaturedCard = ({ item, onPress }) => (
  <TouchableOpacity style={s.featCard} onPress={() => onPress(item)} activeOpacity={0.75}>
    <View style={[s.featIcon, { backgroundColor: item.bg }]}>
      <Text style={s.featEmoji}>{item.emoji}</Text>
    </View>
    <View>
      <Text style={s.featName}>{item.name}</Text>
      <Text style={s.featCount}>{item.count}</Text>
    </View>
  </TouchableOpacity>
);

// ── Main Screen ─────────────────────────────────────────────────
const CategoryScreen = ({ navigation }) => {
  const [search,     setSearch]     = useState('');
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Join with products so we can count items per category
        const rows = await sql`
          SELECT
            c.id,
            c.name,
            COUNT(p.id) AS item_count
          FROM categories c
          LEFT JOIN products p ON p.category = c.name AND p.stock > 0
          WHERE c.status = 'active'
          GROUP BY c.id, c.name
          ORDER BY c.name ASC
        `;

        const mapped = rows.map(row => {
          const meta = getCategoryMeta(row.name);
          return {
            id:    String(row.id),
            name:  row.name,
            emoji: meta.emoji,
            bg:    meta.bg,
            count: `${row.item_count} item${row.item_count !== 1 ? 's' : ''}`,
          };
        });

        setCategories(mapped);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Top 2 by raw DB order (you can sort by item_count desc if preferred)
  const popular = categories.slice(0, 2);

  const handlePress = (category) => {
    console.log('Selected:', category.name);
    // navigation.navigate('ProductList', { category })
  };

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.title}>Browse</Text>
            <Text style={s.subtitle}>What are you looking for?</Text>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <MaterialIcons name="search" size={20} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: C.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={COLS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          ListHeaderComponent={
            !search ? (
              <>
                <Text style={s.sectionLabel}>POPULAR</Text>
                <View style={s.featRow}>
                  {popular.map(item => (
                    <FeaturedCard key={item.id} item={item} onPress={handlePress} />
                  ))}
                </View>
                <Text style={s.sectionLabel}>ALL CATEGORIES</Text>
              </>
            ) : null
          }
          renderItem={({ item, index }) => (
            <CategoryItem item={item} onPress={handlePress} index={index} />
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>No categories found.</Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
};

export default CategoryScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: 18,
    paddingTop:        16,
    paddingBottom:     12,
    backgroundColor:   C.bg,
  },
  headerTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   14,
  },
  title:    { fontSize: 22, fontWeight: '700', color: C.dark },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 2 },

  searchWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.white,
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       C.border,
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.dark, padding: 0 },

  sectionLabel: {
    fontSize:      10,
    fontWeight:    '600',
    letterSpacing: 1.5,
    color:         C.muted,
    marginBottom:  10,
    marginTop:     4,
  },

  featRow:  { flexDirection: 'row', gap: 10, marginBottom: 20 },
  featCard: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: C.white,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         12,
  },
  featIcon: {
    width:          38,
    height:         38,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  featEmoji: { fontSize: 20 },
  featName:  { fontSize: 13, fontWeight: '600', color: C.dark },
  featCount: { fontSize: 11, color: C.muted, marginTop: 1 },

  grid: { paddingHorizontal: 16, paddingBottom: 110 },
  row:  { justifyContent: 'space-between', marginBottom: 16 },

  item:    { width: ITEM_SIZE, alignItems: 'center', gap: 6 },
  iconBox: {
    width:          ITEM_SIZE,
    height:         ITEM_SIZE,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    'rgba(0,0,0,0.04)',
  },
  emoji: { fontSize: ITEM_SIZE * 0.42 },
  name:  {
    fontSize:   10,
    fontWeight: '500',
    color:      C.mid,
    textAlign:  'center',
    lineHeight: 14,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap:   { alignItems: 'center', marginTop: 40 },
  emptyText:   { fontSize: 14, color: C.muted },
});