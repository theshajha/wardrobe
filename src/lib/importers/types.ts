export interface ImportedItem {
  tempId: string;

  externalId?: string;
  imageUrl: string;
  name: string;
  brand?: string;
  price?: number;
  currency?: string;
  orderDate?: string;
  size?: string;
  color?: string;
  productUrl?: string;

  category: string;
  subcategory?: string;

  selected: boolean;
  status: 'pending' | 'importing' | 'imported' | 'failed' | 'duplicate';
  error?: string;

  isDuplicate?: boolean;
  duplicateOf?: string;
}

export interface ImportSession {
  id: string;
  store: StoreId;
  scrapedAt: string;
  items: ImportedItem[];
  version: string;
}

export type StoreId = 'myntra' | 'ajio' | 'amazon' | 'flipkart' | 'hm' | 'zara';

export interface StoreConfig {
  id: StoreId;
  name: string;
  logo: string;
  orderHistoryUrl: string;
  color: string;
  selectors: StoreSelectors;
  enabled: boolean;
}

export interface StoreSelectors {
  orderContainer: string;
  productImage: string;
  productName: string;
  brandName?: string;
  price?: string;
  orderDate?: string;
  size?: string;
  color?: string;
  productLink?: string;
}

export interface ImportProgress {
  total: number;
  completed: number;
  failed: number;
  failedImages: number;
  current?: string;
}

export interface ClipboardImportData {
  version: '1.0';
  store: StoreId;
  scrapedAt: string;
  url: string;
  items: ScrapedItemData[];
}

export interface ScrapedItemData {
  imageUrl: string;
  name: string;
  brand?: string;
  price?: number;
  currency?: string;
  orderDate?: string;
  size?: string;
  color?: string;
  productUrl?: string;
}

