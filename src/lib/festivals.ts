/**
 * Indian Festival Calendar & Utilities
 * Used for the Festival Countdown widget and occasion-based outfit suggestions
 */

export interface Festival {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  emoji: string;
  occasionId: string;
  description: string;
  outfitTips: string;
  region?: string; // For regional festivals
  colors?: string[]; // Traditional/recommended colors
}

// 2025 Indian Festival Calendar
export const FESTIVALS_2025: Festival[] = [
  // January
  {
    id: 'new-year-2025',
    name: 'New Year',
    date: '2025-01-01',
    emoji: '🎉',
    occasionId: 'party',
    description: 'Ring in the new year in style',
    outfitTips: 'Glamorous party wear, sequins, metallics',
    colors: ['gold', 'silver', 'black'],
  },
  {
    id: 'lohri',
    name: 'Lohri',
    date: '2025-01-13',
    emoji: '🔥',
    occasionId: 'puja',
    description: 'Bonfire festival celebrating harvest',
    outfitTips: 'Traditional Punjabi attire, phulkari dupattas',
    region: 'Punjab',
    colors: ['orange', 'yellow', 'red'],
  },
  {
    id: 'pongal',
    name: 'Pongal',
    date: '2025-01-14',
    emoji: '🍚',
    occasionId: 'puja',
    description: 'Tamil harvest festival',
    outfitTips: 'Traditional silk sarees, veshti',
    region: 'Tamil Nadu',
    colors: ['yellow', 'orange', 'green'],
  },
  {
    id: 'makar-sankranti',
    name: 'Makar Sankranti',
    date: '2025-01-14',
    emoji: '🪁',
    occasionId: 'puja',
    description: 'Kite flying and harvest celebration',
    outfitTips: 'Black and dark colors (traditional), comfortable ethnic wear',
    colors: ['black', 'dark blue', 'maroon'],
  },
  {
    id: 'republic-day',
    name: 'Republic Day',
    date: '2025-01-26',
    emoji: '🇮🇳',
    occasionId: 'formal',
    description: 'Celebrate India\'s constitution',
    outfitTips: 'Tricolor inspired outfits, formal ethnic wear',
    colors: ['saffron', 'white', 'green'],
  },
  
  // February
  {
    id: 'vasant-panchami',
    name: 'Vasant Panchami',
    date: '2025-02-02',
    emoji: '🌼',
    occasionId: 'puja',
    description: 'Festival of spring and Goddess Saraswati',
    outfitTips: 'Yellow is mandatory! Traditional yellow sarees or kurtas',
    colors: ['yellow', 'mustard', 'gold'],
  },
  
  // March
  {
    id: 'maha-shivratri',
    name: 'Maha Shivratri',
    date: '2025-02-26',
    emoji: '🕉️',
    occasionId: 'puja',
    description: 'Night of Lord Shiva',
    outfitTips: 'White or light colored traditional wear',
    colors: ['white', 'light blue', 'purple'],
  },
  {
    id: 'holi',
    name: 'Holi',
    date: '2025-03-14',
    emoji: '🎨',
    occasionId: 'holi',
    description: 'Festival of colors and spring',
    outfitTips: 'White clothes (they\'ll get colorful!), old comfortable clothes you don\'t mind staining',
    colors: ['white', 'any color'],
  },
  
  // April
  {
    id: 'ugadi',
    name: 'Ugadi / Gudi Padwa',
    date: '2025-03-30',
    emoji: '🌅',
    occasionId: 'puja',
    description: 'Telugu and Maharashtrian New Year',
    outfitTips: 'New traditional clothes, bright colors',
    region: 'Maharashtra, Andhra, Karnataka',
    colors: ['red', 'yellow', 'green'],
  },
  {
    id: 'baisakhi',
    name: 'Baisakhi',
    date: '2025-04-13',
    emoji: '🌾',
    occasionId: 'puja',
    description: 'Punjabi harvest festival',
    outfitTips: 'Colorful Punjabi suits, phulkari, bright turbans',
    region: 'Punjab',
    colors: ['yellow', 'orange', 'green'],
  },
  {
    id: 'bihu',
    name: 'Bihu',
    date: '2025-04-14',
    emoji: '🎭',
    occasionId: 'casual',
    description: 'Assamese New Year',
    outfitTips: 'Traditional Mekhela Chador, Gamosa',
    region: 'Assam',
    colors: ['red', 'gold', 'white'],
  },
  
  // May
  {
    id: 'buddha-purnima',
    name: 'Buddha Purnima',
    date: '2025-05-12',
    emoji: '🙏',
    occasionId: 'puja',
    description: 'Birth of Buddha',
    outfitTips: 'White or light colored clothes, simple and elegant',
    colors: ['white', 'cream', 'light yellow'],
  },
  
  // June-July
  {
    id: 'eid-ul-adha',
    name: 'Eid ul-Adha',
    date: '2025-06-07',
    emoji: '🌙',
    occasionId: 'eid',
    description: 'Festival of sacrifice',
    outfitTips: 'New ethnic wear, sherwanis, elegant kurtas, anarkalis',
    colors: ['white', 'green', 'gold'],
  },
  {
    id: 'rath-yatra',
    name: 'Rath Yatra',
    date: '2025-06-27',
    emoji: '🛕',
    occasionId: 'puja',
    description: 'Chariot festival in Puri',
    outfitTips: 'Traditional Odia attire, white and yellow',
    region: 'Odisha',
    colors: ['yellow', 'red', 'white'],
  },
  
  // August
  {
    id: 'raksha-bandhan',
    name: 'Raksha Bandhan',
    date: '2025-08-09',
    emoji: '🎀',
    occasionId: 'puja',
    description: 'Brother-sister bond celebration',
    outfitTips: 'Traditional ethnic wear, matching sibling outfits are trending!',
    colors: ['any festive color'],
  },
  {
    id: 'independence-day',
    name: 'Independence Day',
    date: '2025-08-15',
    emoji: '🇮🇳',
    occasionId: 'formal',
    description: 'India\'s freedom celebration',
    outfitTips: 'Tricolor inspired outfits, white kurtas with tricolor accents',
    colors: ['saffron', 'white', 'green'],
  },
  {
    id: 'janmashtami',
    name: 'Janmashtami',
    date: '2025-08-16',
    emoji: '🦚',
    occasionId: 'puja',
    description: 'Birth of Lord Krishna',
    outfitTips: 'Yellow and peacock blue, Krishna-inspired accessories',
    colors: ['yellow', 'peacock blue', 'gold'],
  },
  {
    id: 'ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    date: '2025-08-27',
    emoji: '🐘',
    occasionId: 'ganesh-chaturthi',
    description: 'Festival of Lord Ganesha',
    outfitTips: 'Traditional ethnic wear, yellow, orange and red preferred',
    colors: ['orange', 'red', 'yellow'],
  },
  
  // September
  {
    id: 'onam',
    name: 'Onam',
    date: '2025-09-05',
    emoji: '🌸',
    occasionId: 'onam',
    description: 'Kerala\'s harvest festival',
    outfitTips: 'Traditional Kerala sarees (kasavu), mundu and shirt',
    region: 'Kerala',
    colors: ['white', 'gold', 'cream'],
  },
  {
    id: 'navratri-start',
    name: 'Navratri Begins',
    date: '2025-09-22',
    emoji: '🩰',
    occasionId: 'navratri',
    description: '9 nights of dance and devotion',
    outfitTips: 'Chaniya choli for Garba, follow the color of each day',
    colors: ['varies by day - yellow, green, grey, orange, white, red, blue, pink, purple'],
  },
  {
    id: 'durga-puja',
    name: 'Durga Puja',
    date: '2025-09-29',
    emoji: '🙏',
    occasionId: 'puja',
    description: 'Bengal\'s biggest celebration',
    outfitTips: 'Red and white sarees (laal paar), traditional Bengali attire',
    region: 'Bengal',
    colors: ['red', 'white', 'gold'],
  },
  
  // October
  {
    id: 'dussehra',
    name: 'Dussehra / Vijayadashami',
    date: '2025-10-02',
    emoji: '🏹',
    occasionId: 'puja',
    description: 'Victory of good over evil',
    outfitTips: 'Festive ethnic wear, bright colors',
    colors: ['red', 'yellow', 'orange'],
  },
  {
    id: 'karwa-chauth',
    name: 'Karwa Chauth',
    date: '2025-10-10',
    emoji: '🌙',
    occasionId: 'formal',
    description: 'Festival for married couples',
    outfitTips: 'Red sarees/lehengas, bridal-like traditional wear',
    colors: ['red', 'maroon', 'pink'],
  },
  {
    id: 'diwali',
    name: 'Diwali',
    date: '2025-10-20',
    emoji: '🪔',
    occasionId: 'diwali',
    description: 'Festival of lights',
    outfitTips: 'Your best ethnic wear! New clothes are traditional, gold and jewel tones are popular',
    colors: ['gold', 'red', 'maroon', 'purple', 'pink'],
  },
  {
    id: 'bhai-dooj',
    name: 'Bhai Dooj',
    date: '2025-10-23',
    emoji: '👫',
    occasionId: 'puja',
    description: 'Celebrating brother-sister bond',
    outfitTips: 'Traditional ethnic wear, coordinated sibling outfits',
    colors: ['festive colors'],
  },
  
  // November
  {
    id: 'chhath-puja',
    name: 'Chhath Puja',
    date: '2025-10-26',
    emoji: '🌅',
    occasionId: 'puja',
    description: 'Sun worship festival',
    outfitTips: 'Yellow and red sarees, simple traditional wear',
    region: 'Bihar, Jharkhand',
    colors: ['yellow', 'red', 'orange'],
  },
  {
    id: 'guru-nanak-jayanti',
    name: 'Guru Nanak Jayanti',
    date: '2025-11-05',
    emoji: '🙏',
    occasionId: 'puja',
    description: 'Birthday of Guru Nanak',
    outfitTips: 'Simple, elegant traditional wear. White or light colors',
    colors: ['white', 'cream', 'light blue'],
  },
  
  // December
  {
    id: 'christmas',
    name: 'Christmas',
    date: '2025-12-25',
    emoji: '🎄',
    occasionId: 'christmas',
    description: 'Celebrate the festive season',
    outfitTips: 'Red, green, white combinations. Sparkly party wear for evening',
    colors: ['red', 'green', 'white', 'gold'],
  },
  {
    id: 'new-year-eve',
    name: 'New Year\'s Eve',
    date: '2025-12-31',
    emoji: '🥂',
    occasionId: 'party',
    description: 'Welcome 2026!',
    outfitTips: 'Glam party wear, sequins, metallics, statement pieces',
    colors: ['gold', 'silver', 'black', 'red'],
  },
];

/**
 * Get the next upcoming festival
 */
export function getNextFestival(): Festival | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcoming = FESTIVALS_2025
    .filter(f => new Date(f.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return upcoming[0] || null;
}

/**
 * Get festivals within a date range
 */
export function getFestivalsInRange(startDate: Date, endDate: Date): Festival[] {
  return FESTIVALS_2025.filter(f => {
    const date = new Date(f.date);
    return date >= startDate && date <= endDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get festivals coming up in the next N days
 */
export function getUpcomingFestivals(days: number = 30): Festival[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  
  return getFestivalsInRange(today, endDate);
}

/**
 * Get days until a festival
 */
export function getDaysUntilFestival(festival: Festival): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const festivalDate = new Date(festival.date);
  festivalDate.setHours(0, 0, 0, 0);
  
  const diffTime = festivalDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get a festival by its ID
 */
export function getFestivalById(id: string): Festival | undefined {
  return FESTIVALS_2025.find(f => f.id === id);
}

/**
 * Get festivals by occasion type
 */
export function getFestivalsByOccasion(occasionId: string): Festival[] {
  return FESTIVALS_2025.filter(f => f.occasionId === occasionId);
}

