import { FALLBACK_CATEGORY } from '../../config/constants.js';

/**
 * Keyword → category mapping used by the rule-based categorizer.
 * Order within the array does not matter; matching is scored by keyword length.
 */
export const CATEGORY_KEYWORDS = {
  'Food & Dining': [
    'lunch',
    'dinner',
    'breakfast',
    'brunch',
    'restaurant',
    'cafe',
    'coffee',
    'food',
    'snack',
    'snacks',
    'meal',
    'pizza',
    'burger',
    'biryani',
    'tea',
    'chai',
    'swiggy',
    'zomato',
    'dine',
    'eating',
    'eat',
    'thali',
    'dosa',
    'sandwich',
    'canteen',
    'buffet',
    'dessert',
    'ice cream',
  ],
  Groceries: [
    'grocery',
    'groceries',
    'vegetable',
    'vegetables',
    'veggies',
    'fruit',
    'fruits',
    'milk',
    'supermarket',
    'kirana',
    'bigbasket',
    'dmart',
    'provisions',
    'ration',
    'atta',
    'rice',
    'oil',
    'eggs',
    'bread',
    'market',
  ],
  'Travel & Fuel': [
    'petrol',
    'diesel',
    'fuel',
    'cng',
    'cab',
    'taxi',
    'uber',
    'ola',
    'train',
    'bus',
    'flight',
    'airfare',
    'ticket',
    'tickets',
    'toll',
    'parking',
    'auto',
    'metro',
    'travel',
    'trip',
    'commute',
    'tollgate',
    'rickshaw',
  ],
  'Rent & Housing': [
    'rent',
    'house',
    'housing',
    'apartment',
    'flat',
    'maintenance',
    'society',
    'mortgage',
    'landlord',
    'hostel',
    'pg',
    'lease',
  ],
  'Utilities & Bills': [
    'electricity',
    'electric',
    'power',
    'water',
    'gas',
    'internet',
    'wifi',
    'broadband',
    'mobile',
    'phone',
    'recharge',
    'bill',
    'bills',
    'utility',
    'dth',
    'cable',
    'postpaid',
    'prepaid',
    'cylinder',
  ],
  Shopping: [
    'shopping',
    'clothes',
    'clothing',
    'shoes',
    'footwear',
    'amazon',
    'flipkart',
    'myntra',
    'ajio',
    'shirt',
    'tshirt',
    'dress',
    'jeans',
    'electronics',
    'gadget',
    'mobile phone',
    'laptop',
    'headphones',
    'purchase',
    'dress',
  ],
  Healthcare: [
    'doctor',
    'medicine',
    'medicines',
    'hospital',
    'pharmacy',
    'medical',
    'health',
    'clinic',
    'dentist',
    'lab',
    'test',
    'surgery',
    'tablet',
    'consult',
    'diagnostic',
  ],
  Education: [
    'course',
    'school',
    'college',
    'tuition',
    'books',
    'book',
    'fees',
    'fee',
    'education',
    'exam',
    'udemy',
    'coursera',
    'class',
    'classes',
    'stationery',
    'coaching',
  ],
  Entertainment: [
    'movie',
    'cinema',
    'film',
    'game',
    'games',
    'gaming',
    'concert',
    'party',
    'entertainment',
    'amusement',
    'park',
    'outing',
    'playstation',
    'bowling',
  ],
  'Personal Care': [
    'salon',
    'haircut',
    'spa',
    'cosmetics',
    'beauty',
    'gym',
    'barber',
    'grooming',
    'massage',
    'skincare',
    'parlour',
    'parlor',
    'fitness',
  ],
  Subscriptions: [
    'subscription',
    'netflix',
    'spotify',
    'prime',
    'hotstar',
    'disney',
    'youtube premium',
    'membership',
    'annual plan',
    'monthly plan',
    'saas',
    'icloud',
    'google one',
  ],
  Salary: ['salary', 'wage', 'wages', 'payroll', 'stipend'],
  'Freelance Income': [
    'freelance',
    'project',
    'client',
    'consulting',
    'gig',
    'upwork',
    'fiverr',
    'invoice',
    'contract',
  ],
};

const INCOME_HINT_KEYWORDS = [
  'salary',
  'received',
  'receive',
  'income',
  'earned',
  'earn',
  'freelance',
  'refund',
  'refunded',
  'bonus',
  'credited',
  'credit',
  'got paid',
  'got',
  'cashback',
  'interest',
  'dividend',
  'reimbursement',
];

/**
 * Returns scored category matches for a piece of text.
 * @returns {{ category: string, score: number, matches: string[] }[]}
 */
export function scoreCategories(text) {
  const haystack = ` ${String(text || '').toLowerCase()} `;
  const results = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = [];
    let score = 0;
    for (const keyword of keywords) {
      const pattern = new RegExp(`(^|[^a-z])${escapeRegex(keyword)}([^a-z]|$)`, 'i');
      if (pattern.test(haystack)) {
        matches.push(keyword);
        score += keyword.length;
      }
    }
    if (score > 0) results.push({ category, score, matches });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function detectIncomeIntent(text) {
  const haystack = ` ${String(text || '').toLowerCase()} `;
  return INCOME_HINT_KEYWORDS.some((keyword) =>
    new RegExp(`(^|[^a-z])${escapeRegex(keyword)}([^a-z]|$)`, 'i').test(haystack)
  );
}

/**
 * Suggests a category name from free text. Falls back to "Other" when nothing
 * matches confidently.
 */
export function suggestCategoryName(text, { type = 'expense' } = {}) {
  const scored = scoreCategories(text);
  if (scored.length === 0) return { name: FALLBACK_CATEGORY, confidence: 'low', matches: [] };

  const best = scored[0];
  const confidence = best.score >= 8 ? 'high' : best.score >= 4 ? 'medium' : 'low';

  // Income hints should not be categorised as expense categories.
  if (type === 'income' && best.score < 4) {
    return { name: FALLBACK_CATEGORY, confidence: 'low', matches: best.matches };
  }

  return { name: best.category, confidence, matches: best.matches };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { scoreCategories, suggestCategoryName, detectIncomeIntent, CATEGORY_KEYWORDS };
