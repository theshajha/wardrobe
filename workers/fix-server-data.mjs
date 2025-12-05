// Fix script to update R2 data directly
// This will reconstruct imageRef from imageHash for all items

import { readFileSync, writeFileSync } from 'fs';

const username = 'theshajha';

async function fixServerData() {
  // Read current items.json
  const itemsPath = '/Users/shashankjha/Downloads/theshajha_items.json';
  const items = JSON.parse(readFileSync(itemsPath, 'utf8'));

  let fixed = 0;
  const fixedItems = [];

  // Fix items with imageHash but no imageRef
  for (const item of items) {
    if (item.imageHash && !item.imageRef) {
      item.imageRef = `${username}/images/${item.imageHash}`;
      item.imageSyncStatus = 'synced';
      fixed++;
      fixedItems.push(item.name);
      console.log(`Fixed: ${item.name}`);
    }
  }

  // Write fixed data
  const outputPath = '/Users/shashankjha/Downloads/theshajha_items_fixed.json';
  writeFileSync(outputPath, JSON.stringify(items, null, 2));

  console.log(`\n✅ Fixed ${fixed} items`);
  console.log(`Items fixed:`, fixedItems);
  console.log(`📄 Output: ${outputPath}`);
  console.log('\n👉 Now upload this file to R2 as: theshajha/items.json');
}

fixServerData();
