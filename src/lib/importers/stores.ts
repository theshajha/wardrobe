import type { StoreConfig, StoreId } from './types';

export const SUPPORTED_STORES: Record<StoreId, StoreConfig> = {
  myntra: {
    id: 'myntra',
    name: 'Myntra',
    logo: '🛍️',
    orderHistoryUrl: 'https://www.myntra.com/my/orders',
    color: '#ff3f6c',
    enabled: true,
    selectors: {
      orderContainer: '.order-item, .past-order-item, [class*="orderItem"]',
      productImage: 'img[class*="product"], img[class*="image"], .order-item img',
      productName: '[class*="productName"], [class*="product-name"], .order-item-name',
      brandName: '[class*="brandName"], [class*="brand-name"]',
      price: '[class*="price"], [class*="amount"]',
      orderDate: '[class*="date"], [class*="orderDate"]',
      size: '[class*="size"]',
      color: '[class*="color"]',
      productLink: 'a[href*="/buy/"]',
    },
  },

  ajio: {
    id: 'ajio',
    name: 'Ajio',
    logo: '👗',
    orderHistoryUrl: 'https://www.ajio.com/my-account/orders',
    color: '#3f51b5',
    enabled: true,
    selectors: {
      orderContainer: '.order-prod-details, [class*="order-item"], [class*="orderItem"]',
      productImage: 'img[class*="prod"], img[class*="product"], .order-prod-details img',
      productName: '[class*="prod-name"], [class*="productName"], [class*="product-name"]',
      brandName: '[class*="brand"], [class*="brandName"]',
      price: '[class*="price"], [class*="amount"]',
      orderDate: '[class*="date"]',
      size: '[class*="size"]',
      color: '[class*="color"]',
      productLink: 'a[href*="/p/"]',
    },
  },

  amazon: {
    id: 'amazon',
    name: 'Amazon Fashion',
    logo: '📦',
    orderHistoryUrl: 'https://www.amazon.in/gp/css/order-history',
    color: '#ff9900',
    enabled: false,
    selectors: {
      orderContainer: '.order-card',
      productImage: '.product-image img',
      productName: '.product-title',
      price: '.product-price',
      orderDate: '.order-date',
    },
  },

  flipkart: {
    id: 'flipkart',
    name: 'Flipkart Fashion',
    logo: '🛒',
    orderHistoryUrl: 'https://www.flipkart.com/account/orders',
    color: '#2874f0',
    enabled: false,
    selectors: {
      orderContainer: '.order-item',
      productImage: 'img[class*="product"]',
      productName: '[class*="product-name"]',
      price: '[class*="price"]',
      orderDate: '[class*="date"]',
    },
  },

  hm: {
    id: 'hm',
    name: 'H&M',
    logo: '👔',
    orderHistoryUrl: 'https://www2.hm.com/en_in/my-account/orders',
    color: '#e50010',
    enabled: false,
    selectors: {
      orderContainer: '.order-item',
      productImage: 'img.product-image',
      productName: '.product-name',
      price: '.product-price',
      orderDate: '.order-date',
    },
  },

  zara: {
    id: 'zara',
    name: 'Zara',
    logo: '🧥',
    orderHistoryUrl: 'https://www.zara.com/in/en/user/orders',
    color: '#000000',
    enabled: false,
    selectors: {
      orderContainer: '.order-item',
      productImage: 'img.product-image',
      productName: '.product-name',
      price: '.product-price',
      orderDate: '.order-date',
    },
  },
};

export const getEnabledStores = (): StoreConfig[] => {
  return Object.values(SUPPORTED_STORES).filter(store => store.enabled);
};

export const getStoreById = (id: StoreId): StoreConfig | undefined => {
  return SUPPORTED_STORES[id];
};

