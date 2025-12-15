export * from './bookmarklet';
export { generateConsoleScript } from './bookmarklet';
export * from './categoryDetection';
export * from './stores';
export * from './types';

import { COMMON_BRANDS, detectCategory, extractBrand, extractColor } from './categoryDetection';
import { getStoreById } from './stores';
import type { ClipboardImportData, ImportedItem, StoreId } from './types';

export function parseClipboardData(text: string): ClipboardImportData | null {
  try {
    const data = JSON.parse(text);

    // Validate structure
    if (!data.version || !data.store || !Array.isArray(data.items)) {
      return null;
    }

    // Validate it's from our bookmarklet
    if (data.version !== '1.0') {
      console.warn('Unknown import data version:', data.version);
    }

    return data as ClipboardImportData;
  } catch {
    return null;
  }
}

/**
 * Convert scraped data to ImportedItem with auto-detected fields
 */
export function processScrapedItems(data: ClipboardImportData): ImportedItem[] {
  return data.items.map((item, index) => {
    const categoryMatch = detectCategory(item.name);
    const color = item.color || extractColor(item.name);
    const brand = item.brand || extractBrand(item.name, COMMON_BRANDS);

    return {
      tempId: `import-${data.store}-${Date.now()}-${index}`,
      externalId: undefined,
      imageUrl: item.imageUrl,
      name: item.name,
      brand,
      price: item.price,
      currency: item.currency || 'INR',
      orderDate: item.orderDate,
      size: item.size,
      color,
      productUrl: item.productUrl,
      category: categoryMatch.category,
      subcategory: categoryMatch.subcategory,
      selected: true,
      status: 'pending',
    };
  });
}

export function checkForDuplicates(
  importedItems: ImportedItem[],
  existingItems: Array<{ name: string; brand?: string; id: string }>
): number[] {
  const duplicateIndices: number[] = [];

  importedItems.forEach((item, index) => {
    const normalizedName = normalizeString(item.name);
    const normalizedBrand = item.brand ? normalizeString(item.brand) : '';

    const isDuplicate = existingItems.some(existing => {
      const existingName = normalizeString(existing.name);
      const existingBrand = existing.brand ? normalizeString(existing.brand) : '';

      const brandsMatch = normalizedBrand === existingBrand;

      if (!brandsMatch && normalizedBrand && existingBrand) {
        return false;
      }

      if (existingName === normalizedName && brandsMatch) {
        return true;
      }

      if (brandsMatch && normalizedBrand) {
        const shorter = normalizedName.length < existingName.length ? normalizedName : existingName;
        const longer = normalizedName.length < existingName.length ? existingName : normalizedName;

        if (longer.includes(shorter) && shorter.length / longer.length > 0.8) {
          return true;
        }
      }

      return false;
    });

    if (isDuplicate) {
      duplicateIndices.push(index);
    }
  });

  return duplicateIndices;
}

export function validateStoreUrl(url: string, storeId: StoreId): boolean {
  const store = getStoreById(storeId);
  if (!store) return false;

  const storeDomains: Record<StoreId, string> = {
    myntra: 'myntra.com',
    ajio: 'ajio.com',
    amazon: 'amazon.in',
    flipkart: 'flipkart.com',
    hm: 'hm.com',
    zara: 'zara.com',
  };

  return url.includes(storeDomains[storeId]);
}

export async function compressImageIfNeeded(
  imageBlob: Blob,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<Blob> {
  if (imageBlob.size <= maxSizeBytes) {
    return imageBlob;
  }

  const bitmap = await createImageBitmap(imageBlob);
  const canvas = document.createElement('canvas');

  let { width, height } = bitmap;
  const maxDimension = 800;

  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return imageBlob;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);

  const qualities = [0.8, 0.6, 0.4, 0.2];

  for (const quality of qualities) {
    const compressed = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    if (compressed && compressed.size <= maxSizeBytes) {
      return compressed;
    }
  }

  return await new Promise<Blob>(resolve => {
    canvas.toBlob(blob => resolve(blob || imageBlob), 'image/jpeg', 0.2);
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function detectSizeType(sizeValue: string, category: string): { type: string; value: string } | undefined {
  if (!sizeValue) return undefined;

  const trimmedSize = sizeValue.trim();

  if (category === 'footwear') {
    if (/^\d+(\.\d+)?$/.test(trimmedSize)) {
      return { type: 'shoe', value: trimmedSize, system: 'us' };
    }
  }

  if (category === 'accessories') {
    if (/^\d+mm$/i.test(trimmedSize)) {
      return { type: 'watch', value: trimmedSize.replace(/mm$/i, '') };
    }
  }

  if (category === 'bags') {
    if (/^\d+L$/i.test(trimmedSize)) {
      return { type: 'dimensions', capacity: parseInt(trimmedSize) };
    }
  }

  if (/^[XS|S|M|L|XL|XXL|XXXL]+$/i.test(trimmedSize)) {
    return { type: 'letter', value: trimmedSize.toUpperCase() };
  }

  if (/^\d+$/.test(trimmedSize)) {
    const size = parseInt(trimmedSize);
    if (size >= 24 && size <= 60) {
      return { type: 'numeric', value: trimmedSize };
    }
    if (size >= 4 && size <= 20) {
      return { type: 'shoe', value: trimmedSize, system: 'us' };
    }
  }

  if (/^\d+x\d+$/i.test(trimmedSize)) {
    const [waist, inseam] = trimmedSize.split('x');
    return { type: 'waist-inseam', waist, inseam };
  }

  return { type: 'letter', value: trimmedSize };
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s-_]+/g, '')
    .replace(/[^\w]/g, '')
    .trim();
}

