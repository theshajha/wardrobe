/**
 * Myntra Order Scraper
 * 
 * Works on: https://www.myntra.com/my/orders
 * 
 * Myntra shows product details directly on the order listing page.
 * 
 * DOM Structure insights:
 * - Product links contain: "BRAND ProductName Size: X"
 * - Brand name is typically in bold/first line
 * - Status like "Delivered", "Refund Credited" shown above each item
 * - Images have myntassets.com in their src
 * 
 * Filter logic:
 * - INCLUDE: Delivered items
 * - EXCLUDE: Refund, Refunded, Cancelled items
 * - MAYBE: Exchanged (currently included)
 */

export const myntraScraper = `
  console.log('[Fitsomee] Starting Myntra scraper...');
  var w=document.createElement('div');
  w.id='fitsomee-widget';
  var css=document.createElement('style');
  css.textContent='#fitsomee-close:hover{background:#ffffff40!important}#fitsomee-scan:hover{transform:translateY(-2px);box-shadow:0 8px 25px #00000055}';
  document.head.appendChild(css);
  w.innerHTML='<div style="position:fixed;bottom:20px;right:20px;z-index:999999;background:linear-gradient(135deg,#ff3f6c,#ff527b);color:#fff;padding:16px;border-radius:12px;font-family:system-ui;box-shadow:0 10px 40px #00000066;width:320px;border:1px solid #ff6b8a"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #ffffff30"><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px">✨</div><div><div style="font-weight:700;font-size:15px">Fitsomee</div><div style="font-size:10px;opacity:0.8">Myntra</div></div></div><button id="fitsomee-close" style="background:#ffffff20;border:none;color:#fff;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:6px">✕</button></div><div id="fitsomee-status" style="font-size:13px;color:#fff;line-height:1.5;text-align:center;padding:10px;background:#ffffff15;border-radius:8px;margin-bottom:12px">Click Scan to find your orders</div><div style="display:flex;justify-content:center"><button id="fitsomee-scan" style="padding:10px 28px;background:#fff;color:#ff3f6c;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px #00000033">Scan This Page</button></div></div>';
  document.body.appendChild(w);
  document.getElementById('fitsomee-close').onclick=function(){w.remove();css.remove()};
  document.getElementById('fitsomee-scan').onclick=function(){
    var btn=document.getElementById('fitsomee-scan');
    btn.textContent='Scanning...';
    btn.disabled=true;
    var items=[];
    var skipped={refund:0,noinfo:0,duplicate:0};
    console.log('[Fitsomee] Scanning for Myntra products...');
    
    // Find all product images
    var productImgs=document.querySelectorAll('img[src*="myntassets"]');
    console.log('[Fitsomee] Found',productImgs.length,'product images');
    
    productImgs.forEach(function(img,index){
      try{
        console.log('[Fitsomee] --- Processing image',index,'---');
        console.log('[Fitsomee] Image src:',img.src.substring(0,80)+'...');
        
        // Find the order card container (go up until we find a reasonable container)
        var container=img.closest('[class*="past-order"]')||img.closest('[class*="order-item"]')||img.closest('[class*="itemInfo"]');
        if(!container){
          // Fallback: go up 5 levels
          container=img.parentElement;
          for(var i=0;i<5&&container&&container.parentElement;i++){
            container=container.parentElement;
          }
        }
        if(!container){
          console.log('[Fitsomee] No container found, skipping');
          return;
        }
        
        var containerText=container.textContent||'';
        console.log('[Fitsomee] Container text (200 chars):',containerText.substring(0,200).replace(/\\s+/g,' '));
        
        // Check for refund/cancelled status - skip these items
        if(containerText.match(/refund|cancelled|cancel/i)){
          console.log('[Fitsomee] SKIPPED - Refund or cancelled item');
          skipped.refund++;
          return;
        }
        
        // The container text format is: "BRAND ProductNameSize: X" (concatenated)
        // Example: "Jack & Jones Men Self Design Mid-Rise ShortsSize: 32Style Exchange..."
        // Example: "MANGO MAN Comfort Non-Iron Casual Regular Fit ShirtSize: 41"
        
        // First, extract the product info part (before "Style Exchange" or "Return" etc)
        var productInfo=containerText.split(/Style Exchange|Size Exchange|Return|You can/)[0].trim();
        console.log('[Fitsomee] Product info:',productInfo);
        
        // Extract size first (format: "Size: X" or "Size:X")
        var sizeMatch=productInfo.match(/Size[:\\s]*([A-Z0-9]+)$/i);
        var size=sizeMatch?sizeMatch[1]:undefined;
        console.log('[Fitsomee] Size:',size);
        
        // Remove the size part to get brand + name
        var brandAndName=productInfo.replace(/Size[:\\s]*[A-Z0-9]+$/i,'').trim();
        console.log('[Fitsomee] Brand + Name:',brandAndName);
        
        // Now parse brand and name
        // Known brand patterns: "Jack & Jones", "MANGO MAN", "RARE RABBIT", "Mochi", etc.
        // Brands are typically: ALL CAPS, or Title Case, or have & in them
        var brand='';
        var name='';
        
        // Try to find brand - look for known patterns
        // Pattern 1: Multiple uppercase words at start (e.g., "RARE RABBIT", "MANGO MAN")
        var upperBrandMatch=brandAndName.match(/^([A-Z][A-Z\\s&]+?)\\s+(?:Men|Women|Unisex|Boys|Girls|Kids|Comfort|Self|Spread|Cotton|Slim|Regular|Casual)/i);
        if(upperBrandMatch){
          brand=upperBrandMatch[1].trim();
        }
        
        // Pattern 2: Title case with & (e.g., "Jack & Jones")
        if(!brand){
          var ampBrandMatch=brandAndName.match(/^([A-Z][a-z]+\\s*&\\s*[A-Z][a-z]+)/);
          if(ampBrandMatch){
            brand=ampBrandMatch[1].trim();
          }
        }
        
        // Pattern 3: Single capitalized word followed by space and more text (e.g., "Mochi Men...")
        if(!brand){
          var singleBrandMatch=brandAndName.match(/^([A-Z][a-z]+)\\s+(?:Men|Women|Unisex)/);
          if(singleBrandMatch){
            brand=singleBrandMatch[1].trim();
          }
        }
        
        // Pattern 4: First 2-3 words if they look like a brand
        if(!brand){
          var words=brandAndName.split(/\\s+/);
          if(words.length>=2){
            // Check if first word is capitalized
            if(words[0].match(/^[A-Z]/)){
              brand=words[0];
              // If second word is also caps or part of brand name
              if(words[1]&&words[1].match(/^[A-Z&]/)){
                brand+=' '+words[1];
              }
            }
          }
        }
        
        console.log('[Fitsomee] Brand:',brand);
        
        // Product name is what remains after removing brand
        if(brand&&brandAndName.toLowerCase().startsWith(brand.toLowerCase())){
          name=brandAndName.substring(brand.length).trim();
        }else{
          name=brandAndName;
        }
        console.log('[Fitsomee] Name:',name);
        
        // Extract price - look in container first, then go up to parent
        var price=undefined;
        var priceContainer=container;
        for(var p=0;p<3&&priceContainer&&!price;p++){
          var priceText=priceContainer.textContent||'';
          // Look for ₹ followed by numbers, Rs, or just standalone numbers in price-like elements
          var priceMatch=priceText.match(/(?:₹|Rs\\.?|INR)\\s*([\\d,]+)/i);
          if(priceMatch){
            price=parseInt(priceMatch[1].replace(/,/g,''));
          }
          priceContainer=priceContainer.parentElement;
        }
        // Also try finding price element specifically
        if(!price){
          var priceEl=container.querySelector('[class*="price"],[class*="amount"],[class*="cost"]');
          if(priceEl){
            var priceElMatch=priceEl.textContent.match(/([\\d,]+)/);
            if(priceElMatch){
              price=parseInt(priceElMatch[1].replace(/,/g,''));
            }
          }
        }
        console.log('[Fitsomee] Price:',price);
        
        // Extract order date - look for date patterns like "On Wed, 10 Dec" or "On Mon, 8 Dec"
        var orderDate=undefined;
        // Pattern: "On [Day], [Date] [Month]" e.g. "On Wed, 10 Dec"
        var datePatterns=[
          /On\\s+[A-Za-z]{3},?\\s+(\\d{1,2}\\s+[A-Za-z]{3,9})/i,
          /Delivered\\s+(?:on\\s+)?([A-Za-z]{3,9}\\s+\\d{1,2})/i,
          /Delivered\\s+(\\d{1,2}\\s+[A-Za-z]{3,9})/i,
          /(\\d{1,2}\\s+[A-Za-z]{3,9}(?:\\s+\\d{4})?)/
        ];
        for(var dp=0;dp<datePatterns.length&&!orderDate;dp++){
          var dm=containerText.match(datePatterns[dp]);
          if(dm){orderDate=dm[1].trim();}
        }
        if(orderDate){console.log('[Fitsomee] Order date:',orderDate);}
        
        // Validate and add item
        if(!name&&!brand){
          console.log('[Fitsomee] SKIPPED - No name or brand found');
          skipped.noinfo++;
          return;
        }
        
        var imageUrl=img.src.replace(/w_\\d+/,'w_480').replace(/q_\\d+/,'q_90').replace(/h_\\d+/,'h_640');
        var isDup=items.some(function(x){return x.imageUrl===imageUrl});
        if(isDup){
          console.log('[Fitsomee] SKIPPED - Duplicate image');
          skipped.duplicate++;
          return;
        }
        
        items.push({
          imageUrl:imageUrl,
          name:name||brand+' Product',
          brand:brand||undefined,
          price:price,
          currency:price?'INR':undefined,
          size:size,
          orderDate:orderDate
        });
        console.log('[Fitsomee] ADDED:',brand,'-',name);
        
      }catch(e){
        console.warn('[Fitsomee] Error processing item:',e);
      }
    });
    
    console.log('[Fitsomee] === SCAN COMPLETE ===');
    console.log('[Fitsomee] Items found:',items.length);
    console.log('[Fitsomee] Skipped - Refund/Cancel:',skipped.refund);
    console.log('[Fitsomee] Skipped - No info:',skipped.noinfo);
    console.log('[Fitsomee] Skipped - Duplicate:',skipped.duplicate);
    
    var statusEl=document.getElementById('fitsomee-status');
    statusEl.style.background='transparent';
    if(items.length>0){
      statusEl.innerHTML='<div style="text-align:center;background:#ffffff15;border-radius:10px;padding:14px"><div style="font-size:32px;margin-bottom:6px">🎉</div><div style="font-size:15px;font-weight:700;color:#fff">Found '+items.length+' items!</div></div>';
      if(skipped.refund>0){
        statusEl.innerHTML+='<div style="font-size:11px;color:#ffffffaa;margin-top:6px;text-align:center">Skipped '+skipped.refund+' refunded</div>';
      }
      var copyBtn=document.createElement('button');
      copyBtn.id='fitsomee-copy';
      copyBtn.style.cssText='margin-top:12px;width:100%;padding:10px;background:#fff;color:#ff3f6c;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;box-shadow:0 4px 12px #00000033';
      copyBtn.textContent='Copy '+items.length+' Items';
      statusEl.appendChild(copyBtn);
      copyBtn.onclick=function(){
        var data={version:'1.0',store:'myntra',scrapedAt:new Date().toISOString(),url:location.href,items:items};
        navigator.clipboard.writeText(JSON.stringify(data)).then(function(){
          copyBtn.textContent='✓ Copied!';
          copyBtn.style.background='#22c55e';
          copyBtn.style.color='#fff';
          setTimeout(function(){w.remove();css.remove()},2000);
        }).catch(function(e){
          console.log('[Fitsomee] Data:',JSON.stringify(data));
          alert('Check console');
        });
      };
    }else{
      statusEl.innerHTML='<div style="text-align:center;background:#ffffff15;border-radius:10px;padding:14px"><div style="font-size:32px;margin-bottom:6px">😕</div><div style="font-size:14px;color:#fff">No items found</div><div style="font-size:11px;color:#ffffffaa;margin-top:6px">Scroll to load more, then scan again</div></div>';
    }
    btn.textContent='Scan Again';
    btn.disabled=false;
  };
`;

export const myntraInstructions = {
  orderUrl: 'https://www.myntra.com/my/orders',
  steps: [
    'Drag the "Fitsomee - Myntra" button below to your bookmarks bar',
    'Open Myntra in a new tab and log in to your account',
    'Go to your Orders page (Account → Orders)',
    'Scroll down to load all orders you want to import',
    'Click the "Fitsomee - Myntra" bookmark',
    'Come back here and paste (Ctrl+V / Cmd+V)',
  ],
  tips: [
    'Make sure to scroll down to load more orders before clicking the bookmark',
    'You can filter orders on Myntra by date range before importing',
    'Only delivered orders with visible images will be imported',
  ],
};

