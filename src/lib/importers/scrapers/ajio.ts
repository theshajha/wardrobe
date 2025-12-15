/**
 * Ajio Order Scraper
 * 
 * Works on: 
 * - Listing: https://www.ajio.com/my-account/orders
 * - Details: https://www.ajio.com/my-account/order-details?orderId=XXX
 * 
 * Ajio DOES NOT show product names on the listing page.
 * Users need to navigate to each order's detail page to scrape items.
 */

export const ajioScraper = `
  console.log('[Fitsomee] Starting Ajio scraper...');
  var isOrderDetailsPage=location.href.includes('order-details');
  console.log('[Fitsomee] Page type:',isOrderDetailsPage?'Order Details':'Order Listing');
  var w=document.createElement('div');
  w.id='fitsomee-widget';
  var css=document.createElement('style');
  css.textContent='#fitsomee-close:hover{background:#ffffff30!important}#fitsomee-scan:hover{transform:translateY(-2px);box-shadow:0 8px 25px #6366f199}';
  document.head.appendChild(css);
  w.innerHTML='<div style="position:fixed;bottom:20px;right:20px;z-index:999999;background:linear-gradient(135deg,#1a1a2e,#2d2d44);color:#fff;padding:16px;border-radius:12px;font-family:system-ui;box-shadow:0 10px 40px #00000066;width:320px;border:1px solid #6366f150"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #ffffff20"><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px">✨</div><div><div style="font-weight:700;font-size:15px">Fitsomee</div><div style="font-size:10px;opacity:0.7">Ajio</div></div></div><button id="fitsomee-close" style="background:#ffffff15;border:none;color:#fff;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:6px">✕</button></div><div id="fitsomee-status" style="font-size:13px;color:#fff;line-height:1.5;text-align:center;padding:10px;background:#ffffff10;border-radius:8px;margin-bottom:12px"></div><div style="display:flex;justify-content:center"><button id="fitsomee-scan" style="padding:10px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px #6366f166">Scan This Page</button></div></div>';
  document.body.appendChild(w);
  document.getElementById('fitsomee-status').textContent=isOrderDetailsPage?'Click Scan to import this order':'You are on the Ajio orders listing page';
  document.getElementById('fitsomee-close').onclick=function(){w.remove();css.remove()};
  document.getElementById('fitsomee-scan').onclick=function(){
    var btn=document.getElementById('fitsomee-scan');
    btn.textContent='Scanning...';
    btn.disabled=true;
    var items=[];
    if(isOrderDetailsPage){
      console.log('[Fitsomee] Scanning order details page...');
      
      // Find product image
      var img=document.querySelector('img[src*="medias"]');
      console.log('[Fitsomee] Image:',img?img.src.substring(0,60):'not found');
      
      // Product name - div.product-name-elipsis
      var nameEl=document.querySelector('.product-name-elipsis, .product-name, [class*="prod-name"]');
      var prodName=nameEl?nameEl.textContent.trim():'';
      console.log('[Fitsomee] Product name:',prodName);
      
      // Brand - usually first part of product name or separate element
      var brandEl=document.querySelector('.brand-name, [class*="brand"], .prod-brand');
      var brandName=brandEl?brandEl.textContent.trim():'';
      
      // If no brand element, try to extract from product name (first word is often brand)
      if(!brandName&&prodName){
        var words=prodName.split(' ');
        if(words.length>1&&words[0].length>2&&words[0].length<20){
          brandName=words[0];
          prodName=words.slice(1).join(' ').replace(/^[-\\s]+/,'').trim();
        }
      }
      console.log('[Fitsomee] Brand:',brandName);
      
      // Size - .size-box
      var sizeEl=document.querySelector('.size-box, .size-value, [class*="size"]');
      var size=sizeEl?sizeEl.textContent.trim().replace(/Size[:\\s]*/i,''):'';
      console.log('[Fitsomee] Size:',size);
      
      // Price - look for rupee symbol
      var priceEl=document.querySelector('[class*="price"], .prod-sp, .amount');
      var price=undefined;
      if(priceEl){
        var priceText=priceEl.textContent;
        var priceMatch=priceText.match(/₹?\\s*([\\d,\\.]+)/);
        if(priceMatch){
          price=parseFloat(priceMatch[1].replace(/,/g,''));
        }
      }
      if(!price){
        var bodyText=document.body.textContent;
        var priceMatch=bodyText.match(/₹\\s*([\\d,\\.]+)/);
        if(priceMatch)price=parseFloat(priceMatch[1].replace(/,/g,''));
      }
      console.log('[Fitsomee] Price:',price);
      
      // Delivery date - span.shipment-details
      var dateEl=document.querySelector('.shipment-details, [class*="delivery"], [class*="delivered"]');
      var orderDate=undefined;
      if(dateEl){
        var dateText=dateEl.textContent;
        var dateMatch=dateText.match(/(\\d{1,2}\\s+[A-Za-z]+)|([A-Za-z]+\\s+\\d{1,2})/);
        if(dateMatch){
          orderDate=dateMatch[0].trim();
        }
      }
      console.log('[Fitsomee] Date:',orderDate);
      
      // Add item if we have enough info
      if(img&&img.src&&(prodName||brandName)){
        items.push({
          imageUrl:img.src,
          name:prodName||brandName+' Product',
          brand:brandName||undefined,
          price:price,
          currency:price?'INR':undefined,
          size:size||undefined,
          orderDate:orderDate
        });
        console.log('[Fitsomee] Added item!');
      }else{
        console.log('[Fitsomee] Missing required info - img:',!!img,'name:',!!prodName,'brand:',!!brandName);
      }
    }else{
      console.log('[Fitsomee] On listing page - collecting order links...');
      var orderLinks=document.querySelectorAll('a[href*="order-details"]');
      console.log('[Fitsomee] Found',orderLinks.length,'order detail links');
      var uniqueUrls=[];
      orderLinks.forEach(function(link){
        var url=link.href;
        if(url&&!uniqueUrls.includes(url)&&!url.includes('exchange')){
          uniqueUrls.push(url);
        }
      });
      if(uniqueUrls.length>0){
        var statusEl=document.getElementById('fitsomee-status');
        statusEl.style.background='transparent';
        statusEl.innerHTML='<div style="background:#fbbf2420;border:1px solid #fbbf2450;border-radius:8px;padding:10px;margin-bottom:10px"><div style="color:#fbbf24;font-size:12px;font-weight:600">⚠️ One-by-One Import</div><div style="color:#ffffffcc;font-size:11px;margin-top:4px">Open each order to import</div></div><div style="text-align:center;margin-bottom:10px"><span style="font-size:24px">📦</span><div style="font-size:14px;font-weight:600;color:#4ade80;margin-top:2px">'+uniqueUrls.length+' orders</div></div><div style="background:#ffffff10;border-radius:8px;padding:10px"><div style="font-size:10px;color:#ffffff80;margin-bottom:6px">Click to open:</div><div id="fitsomee-links" style="max-height:100px;overflow-y:auto"></div></div>';
        var linksEl=document.getElementById('fitsomee-links');
        uniqueUrls.slice(0,8).forEach(function(url,i){
          var a=document.createElement('a');
          a.href=url;
          a.target='_blank';
          a.style.cssText='color:#fff;display:flex;align-items:center;padding:8px 10px;margin:3px 0;text-decoration:none;border-radius:6px;background:#6366f130;border:1px solid #6366f150;font-size:12px';
          a.innerHTML='<span style="background:#6366f1;color:#fff;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;margin-right:8px">'+(i+1)+'</span>Order '+(url.match(/orderId=([^&]+)/)||['',''])[1];
          linksEl.appendChild(a);
        });
        if(uniqueUrls.length>8){
          var moreDiv=document.createElement('div');
          moreDiv.style.cssText='color:#ffffff80;margin-top:6px;font-size:11px;text-align:center';
          moreDiv.textContent='+ '+(uniqueUrls.length-8)+' more';
          linksEl.appendChild(moreDiv);
        }
        btn.style.display='none';
        return;
      }
    }
    console.log('[Fitsomee] === SCAN COMPLETE ===');
    console.log('[Fitsomee] Items found:',items.length);
    var statusEl=document.getElementById('fitsomee-status');
    statusEl.style.background='transparent';
    if(items.length>0){
      statusEl.innerHTML='<div style="text-align:center;background:#ffffff10;border-radius:10px;padding:14px"><div style="font-size:32px;margin-bottom:6px">🎉</div><div style="font-size:15px;font-weight:700;color:#fff">Found '+items.length+' item'+(items.length>1?'s':'')+'!</div></div>';
      var copyBtn=document.createElement('button');
      copyBtn.id='fitsomee-copy';
      copyBtn.style.cssText='margin-top:12px;width:100%;padding:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;box-shadow:0 4px 12px #6366f166';
      copyBtn.textContent='Copy '+items.length+' Item'+(items.length>1?'s':'');
      statusEl.appendChild(copyBtn);
      copyBtn.onclick=function(){
        var data={version:'1.0',store:'ajio',scrapedAt:new Date().toISOString(),url:location.href,items:items};
        navigator.clipboard.writeText(JSON.stringify(data)).then(function(){
          copyBtn.textContent='✓ Copied!';
          copyBtn.style.background='#22c55e';
          setTimeout(function(){w.remove();css.remove()},2000);
        }).catch(function(e){
          console.log('[Fitsomee] Data:',JSON.stringify(data));
          alert('Check console');
        });
      };
    }else{
      statusEl.innerHTML='<div style="text-align:center;background:#ffffff10;border-radius:10px;padding:14px"><div style="font-size:32px;margin-bottom:6px">😕</div><div style="font-size:14px;color:#fff">No items found</div><div style="font-size:11px;color:#ffffffaa;margin-top:6px">Make sure you are on an order details page</div></div>';
    }
    btn.textContent='Scan Again';
    btn.disabled=false;
  };
`;

export const ajioInstructions = {
  orderUrl: 'https://www.ajio.com/my-account/orders',
  steps: [
    'Drag the "Fitsomee - Ajio" button below to your bookmarks bar',
    'Open AJIO in a new tab and log in to your account',
    'Go to your Orders page (My Account → My Orders)',
    'Click the "Fitsomee - Ajio" bookmark',
    'Click on individual order links shown by the widget',
    'On each order detail page, click the bookmark again to copy the item',
    'Come back here and paste each item (Ctrl+V / Cmd+V)',
  ],
  tips: [
    'Ajio listing page doesn\'t show product names - you\'ll need to import each order one by one',
    'The widget will show you clickable links to each order\'s detail page',
    'Each order detail page will let you copy that item',
  ],
};

