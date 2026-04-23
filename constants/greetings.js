// ─── constants/greetings.js ──────────────────────────────────────────────────
// Rotating greetings that change each time the user opens the app.
// Greetings are warm, multilingual, and subtly nudge the user to shop.
// Usage: import { getGreeting } from '../constants/greetings';

const GREETINGS = [
  // Filipino / Tagalog
  { text: 'Kumusta ka?',         sub: 'Ready to stock up today?' },
  { text: 'Mabuhay! 🌿',        sub: 'Your groceries are waiting.' },
  { text: 'Magandang araw!',     sub: 'What\'s on your list today?' },

  // English — casual & warm
  { text: 'Hey there! 👋',       sub: 'Let\'s fill up that cart.' },
  { text: 'Welcome back!',       sub: 'Fresh picks are ready for you.' },
  { text: 'Good to see you! 😊', sub: 'Your favorites are just a tap away.' },
  { text: 'Hello, shopper!',     sub: 'Great deals are waiting inside.' },

  // Time-of-day aware (resolved at runtime in getGreeting)
  '__TIME__',

  // Motivating / playful
  { text: 'Let\'s go shopping! 🛒', sub: 'Deals you\'ll love, right here.' },
  { text: 'Fresh & ready! 🥦',      sub: 'Today\'s picks are looking great.' },
  { text: 'Savings await! 🎉',       sub: 'Check out this week\'s specials.' },
  { text: 'Craving something? 😋',   sub: 'We\'ve got exactly what you need.' },
];

const TIME_GREETINGS = () => {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return { text: 'Good morning! ☀️',   sub: 'Start your day with fresh groceries.' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon! 🌤️', sub: 'Midday shopping? Great idea.' };
  if (hour >= 17 && hour < 21) return { text: 'Good evening! 🌙',   sub: 'Dinner sorted? We can help.' };
  return { text: 'Up late? 🌛',                                        sub: 'Night owls shop smarter.' };
};

/**
 * Returns a greeting object { text, sub } that rotates on every app open.
 * Rotation is based on the day-of-year so it changes daily but stays
 * consistent within the same session.
 *
 * @returns {{ text: string, sub: string }}
 */
export const getGreeting = () => {
  const pool = GREETINGS.filter(g => g !== '__TIME__');
  const now  = new Date();
  // Use day-of-year + hour bracket (0–3) so it shifts ~4× per day
  const dayOfYear  = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86_400_000);
  const hourBracket = Math.floor(now.getHours() / 6); // 0–3
  const index      = (dayOfYear * 4 + hourBracket) % (pool.length + 1); // +1 to slot in TIME

  // Every ~(pool.length+1)th slot shows the time-based greeting
  if (index === pool.length) return TIME_GREETINGS();
  return pool[index];
};