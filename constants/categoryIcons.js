// constants/categoryIcons.js
// Maps DB category names to emoji + background color

const CATEGORY_META = {
  Beverages:    { emoji: '🥤', bg: '#E3F2FD' },
  Biscuits:     { emoji: '🍪', bg: '#FFF3E0' },
  'Canned Goods': { emoji: '🫙', bg: '#F9FBE7' },
  Dairy:        { emoji: '🥛', bg: '#E3F2FD' },
  Meat:         { emoji: '🍗', bg: '#FFF8E1' },
  Noodles:      { emoji: '🍜', bg: '#FFF3E0' },
  Snacks:       { emoji: '🍿', bg: '#FFF9C4' },
  Condiments:   { emoji: '🫒', bg: '#E8F5E9' },
  Bread:        { emoji: '🍞', bg: '#E8F5E9' },
  Frozen:       { emoji: '🍦', bg: '#EDE7F6' },
  // fallback for any future categories
  default:      { emoji: '🛒', bg: '#F3F4F6' },
};

export const getCategoryMeta = (name) =>
  CATEGORY_META[name] ?? CATEGORY_META.default;