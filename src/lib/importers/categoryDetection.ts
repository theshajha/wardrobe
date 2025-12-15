interface CategoryMatch {
  category: string;
  subcategory?: string;
  confidence: number;
}

const CATEGORY_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  subcategory?: string;
  priority: number;
}> = [
    { pattern: /\b(sneaker|trainer)s?\b/i, category: 'footwear', subcategory: 'Sneakers', priority: 10 },
    { pattern: /\b(running\s+shoe|sport\s+shoe)s?\b/i, category: 'footwear', subcategory: 'Sneakers', priority: 10 },
    { pattern: /\b(loafer)s?\b/i, category: 'footwear', subcategory: 'Loafers', priority: 10 },
    { pattern: /\b(boot)s?\b/i, category: 'footwear', subcategory: 'Boots', priority: 10 },
    { pattern: /\b(sandal|chappal|slipper|flip\s*flop)s?\b/i, category: 'footwear', subcategory: 'Sandals', priority: 10 },
    { pattern: /\b(heel|stiletto|pump)s?\b/i, category: 'footwear', subcategory: 'Heels', priority: 10 },
    { pattern: /\b(flat|ballet)s?\b/i, category: 'footwear', subcategory: 'Flats', priority: 9 },
    { pattern: /\b(oxford|derby|brogue)s?\b/i, category: 'footwear', subcategory: 'Formal Shoes', priority: 10 },
    { pattern: /\b(shoe|footwear)s?\b/i, category: 'footwear', priority: 5 },

    { pattern: /\b(t-?shirt|tee)s?\b/i, category: 'clothing', subcategory: 'T-Shirts', priority: 10 },
    { pattern: /\b(polo)s?\b/i, category: 'clothing', subcategory: 'Polo Shirts', priority: 10 },
    { pattern: /\b(shirt)s?\b/i, category: 'clothing', subcategory: 'Shirts', priority: 8 },
    { pattern: /\b(blouse)s?\b/i, category: 'clothing', subcategory: 'Blouses', priority: 10 },
    { pattern: /\b(top)s?\b/i, category: 'clothing', subcategory: 'Tops', priority: 6 },
    { pattern: /\b(tank\s*top|vest)s?\b/i, category: 'clothing', subcategory: 'Tank Tops', priority: 10 },
    { pattern: /\b(crop\s*top)s?\b/i, category: 'clothing', subcategory: 'Crop Tops', priority: 10 },
    { pattern: /\b(tunic)s?\b/i, category: 'clothing', subcategory: 'Tunics', priority: 10 },

    { pattern: /\b(jean|denim)s?\b/i, category: 'clothing', subcategory: 'Jeans', priority: 10 },
    { pattern: /\b(trouser|pant|chino)s?\b/i, category: 'clothing', subcategory: 'Trousers', priority: 9 },
    { pattern: /\b(short)s?\b/i, category: 'clothing', subcategory: 'Shorts', priority: 8 },
    { pattern: /\b(skirt)s?\b/i, category: 'clothing', subcategory: 'Skirts', priority: 10 },
    { pattern: /\b(legging|jegging)s?\b/i, category: 'clothing', subcategory: 'Leggings', priority: 10 },
    { pattern: /\b(jogger|track\s*pant|sweatpant)s?\b/i, category: 'clothing', subcategory: 'Joggers', priority: 10 },

    { pattern: /\b(dress|gown)es?\b/i, category: 'clothing', subcategory: 'Dresses', priority: 10 },
    { pattern: /\b(jumpsuit|romper|playsuit)s?\b/i, category: 'clothing', subcategory: 'Jumpsuits', priority: 10 },
    { pattern: /\b(suit|blazer)s?\b/i, category: 'clothing', subcategory: 'Suits', priority: 9 },
    { pattern: /\b(kurta|kurti)s?\b/i, category: 'clothing', subcategory: 'Kurtas', priority: 10 },
    { pattern: /\b(saree|sari)s?\b/i, category: 'clothing', subcategory: 'Sarees', priority: 10 },
    { pattern: /\b(lehenga|ghagra)s?\b/i, category: 'clothing', subcategory: 'Lehengas', priority: 10 },
    { pattern: /\b(salwar|churidar|palazzo)s?\b/i, category: 'clothing', subcategory: 'Ethnic Wear', priority: 10 },

    { pattern: /\b(jacket)s?\b/i, category: 'clothing', subcategory: 'Jackets', priority: 10 },
    { pattern: /\b(coat|overcoat|trench)s?\b/i, category: 'clothing', subcategory: 'Coats', priority: 10 },
    { pattern: /\b(hoodie|hoody|sweatshirt)s?\b/i, category: 'clothing', subcategory: 'Hoodies', priority: 10 },
    { pattern: /\b(sweater|pullover|cardigan|jumper)s?\b/i, category: 'clothing', subcategory: 'Sweaters', priority: 10 },
    { pattern: /\b(windbreaker|bomber|puffer)s?\b/i, category: 'clothing', subcategory: 'Jackets', priority: 10 },
    { pattern: /\b(shrug|shawl|poncho)s?\b/i, category: 'clothing', subcategory: 'Outerwear', priority: 9 },

    { pattern: /\b(underwear|brief|boxer)s?\b/i, category: 'clothing', subcategory: 'Innerwear', priority: 10 },
    { pattern: /\b(bra|lingerie|panty|panties)\b/i, category: 'clothing', subcategory: 'Innerwear', priority: 10 },
    { pattern: /\b(pajama|pyjama|nightwear|sleepwear|nightsuit)s?\b/i, category: 'clothing', subcategory: 'Sleepwear', priority: 10 },
    { pattern: /\b(robe|bathrobe)s?\b/i, category: 'clothing', subcategory: 'Sleepwear', priority: 10 },

    { pattern: /\b(sports?\s*bra)s?\b/i, category: 'clothing', subcategory: 'Activewear', priority: 10 },
    { pattern: /\b(tracksuit|gym\s*wear|activewear|athleisure)s?\b/i, category: 'clothing', subcategory: 'Activewear', priority: 10 },
    { pattern: /\b(yoga\s*pant|workout)s?\b/i, category: 'clothing', subcategory: 'Activewear', priority: 9 },

    { pattern: /\b(swimsuit|swimwear|bikini|swim\s*trunk)s?\b/i, category: 'clothing', subcategory: 'Swimwear', priority: 10 },

    { pattern: /\b(watch|smartwatch)es?\b/i, category: 'accessories', subcategory: 'Watches', priority: 10 },
    { pattern: /\b(sunglass|eyeglass|spectacle|frame)es?\b/i, category: 'accessories', subcategory: 'Eyewear', priority: 10 },
    { pattern: /\b(belt)s?\b/i, category: 'accessories', subcategory: 'Belts', priority: 10 },
    { pattern: /\b(wallet|purse|cardholder)s?\b/i, category: 'accessories', subcategory: 'Wallets', priority: 10 },
    { pattern: /\b(scarf|scarves|muffler|stole)s?\b/i, category: 'accessories', subcategory: 'Scarves', priority: 10 },
    { pattern: /\b(hat|cap|beanie)s?\b/i, category: 'accessories', subcategory: 'Hats', priority: 10 },
    { pattern: /\b(glove)s?\b/i, category: 'accessories', subcategory: 'Gloves', priority: 10 },
    { pattern: /\b(tie|bow\s*tie|necktie)s?\b/i, category: 'accessories', subcategory: 'Ties', priority: 10 },
    { pattern: /\b(jewelry|jewellery|necklace|bracelet|ring|earring|bangle)s?\b/i, category: 'accessories', subcategory: 'Jewelry', priority: 10 },
    { pattern: /\b(sock)s?\b/i, category: 'accessories', subcategory: 'Socks', priority: 10 },
    { pattern: /\b(cufflink|lapel\s*pin)s?\b/i, category: 'accessories', subcategory: 'Accessories', priority: 10 },

    { pattern: /\b(backpack|rucksack)s?\b/i, category: 'bags', subcategory: 'Backpacks', priority: 10 },
    { pattern: /\b(handbag|hand\s*bag|tote|clutch|satchel|hobo\s*bag)s?\b/i, category: 'bags', subcategory: 'Handbags', priority: 10 },
    { pattern: /\b(messenger\s*bag|crossbody|sling\s*bag)s?\b/i, category: 'bags', subcategory: 'Messenger Bags', priority: 10 },
    { pattern: /\b(duffel|duffle|gym\s*bag|sports\s*bag)s?\b/i, category: 'bags', subcategory: 'Duffel Bags', priority: 10 },
    { pattern: /\b(laptop\s*bag|briefcase|office\s*bag)s?\b/i, category: 'bags', subcategory: 'Laptop Bags', priority: 10 },
    { pattern: /\b(travel\s*bag|luggage|trolley|suitcase)s?\b/i, category: 'bags', subcategory: 'Travel Bags', priority: 10 },
    { pattern: /\b(bag)s?\b/i, category: 'bags', priority: 5 },

    { pattern: /\b(fitness\s*band|fitness\s*tracker)s?\b/i, category: 'gadgets', subcategory: 'Fitness Trackers', priority: 10 },
    { pattern: /\b(earbuds?|headphones?|airpods?)\b/i, category: 'gadgets', subcategory: 'Audio', priority: 10 },
  ];

export function detectCategory(productName: string): CategoryMatch {
  const normalizedName = productName.toLowerCase().trim();

  // Find all matching patterns
  const matches: Array<{ pattern: typeof CATEGORY_PATTERNS[0]; matchIndex: number }> = [];

  for (const pattern of CATEGORY_PATTERNS) {
    const match = normalizedName.match(pattern.pattern);
    if (match) {
      matches.push({
        pattern,
        matchIndex: match.index || 0,
      });
    }
  }

  if (matches.length === 0) {
    return {
      category: 'clothing',
      confidence: 0.3,
    };
  }

  matches.sort((a, b) => {
    if (b.pattern.priority !== a.pattern.priority) {
      return b.pattern.priority - a.pattern.priority;
    }
    return a.matchIndex - b.matchIndex;
  });

  const bestMatch = matches[0];

  return {
    category: bestMatch.pattern.category,
    subcategory: bestMatch.pattern.subcategory,
    confidence: bestMatch.pattern.priority / 10,
  };
}

export function extractColor(productName: string): string | undefined {
  const colors = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'brown', 'grey', 'gray', 'navy', 'beige', 'cream', 'maroon', 'olive', 'teal',
    'coral', 'burgundy', 'tan', 'khaki', 'charcoal', 'ivory', 'lavender', 'mint',
    'peach', 'rose', 'rust', 'salmon', 'turquoise', 'mustard', 'mauve', 'indigo',
    'multi', 'multicolor', 'printed', 'floral', 'striped', 'checked', 'plaid',
  ];

  const normalizedName = productName.toLowerCase();

  for (const color of colors) {
    if (normalizedName.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }

  return undefined;
}

export function extractBrand(productName: string, knownBrands: string[]): string | undefined {
  const normalizedName = productName.toLowerCase();

  for (const brand of knownBrands) {
    if (normalizedName.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return undefined;
}

export const COMMON_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour', 'New Balance', 'Skechers',
  'Levi\'s', 'Lee', 'Wrangler', 'Pepe Jeans', 'US Polo', 'Tommy Hilfiger',
  'Calvin Klein', 'Gap', 'H&M', 'Zara', 'Mango', 'Forever 21',
  'Allen Solly', 'Van Heusen', 'Louis Philippe', 'Peter England', 'Arrow',
  'Raymond', 'Park Avenue', 'Blackberrys', 'Indian Terrain', 'Woodland',
  'Bata', 'Liberty', 'Paragon', 'Action', 'Red Tape', 'Hush Puppies',
  'FabIndia', 'Biba', 'W', 'Aurelia', 'Global Desi', 'Libas',
  'Roadster', 'HRX', 'Bewakoof', 'The Souled Store', 'Bombay Shaving',
  'Boat', 'Noise', 'Fire-Boltt', 'Fastrack', 'Titan', 'Sonata',
];

