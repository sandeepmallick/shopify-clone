

// Utilities
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));
const money = (n) => `₹${Number(n).toFixed(2)}`;

// CROSS-PAGE: update cart count
function getCart(){
  try {
    return JSON.parse(localStorage.getItem('shopcart') || '[]');
  } catch(e){
    return [];
  }
}
function saveCart(cart){ localStorage.setItem('shopcart', JSON.stringify(cart)); }
function cartCount(){
  const c = getCart().reduce((acc,i)=>acc + Number(i.quantity),0);
  qsa('.cart-count').forEach(el => el.textContent = c);
}
cartCount();

// MOBILE MENU
qsa('.mobile-menu-btn').forEach(btn=>{
  btn.addEventListener('click', () => {
    const idx = btn.id.replace('mobileMenuBtn','');
    // find matching mobileNav by suffix or default
    const mobileNav = btn.closest('.site-header').querySelector('.mobile-nav');
    if (!mobileNav) return;
    mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
  });
});

// STICKY header: add shadow on scroll
const siteHeader = qs('#siteHeader');
window.addEventListener('scroll', () => {
  if(window.scrollY > 8) siteHeader.classList.add('scrolled');
  else siteHeader.classList.remove('scrolled');
});

// HERO slider
(function heroSlider(){
  const slider = qs('#heroSlider');
  if(!slider) return;
  const slides = qsa('.slide', slider);
  let idx = 0;
  const set = i => {
    slides.forEach((s,sI)=> s.classList.toggle('active', sI===i));
    slider.style.transform = `translateX(-${i*100}%)`;
    idx = i;
  };
  qs('#heroPrev')?.addEventListener('click', ()=> set((idx-1+slides.length)%slides.length));
  qs('#heroNext')?.addEventListener('click', ()=> set((idx+1)%slides.length));
  // auto
  setInterval(()=> set((idx+1)%slides.length), 6000);
})();

// PRODUCT THUMBS
(function productThumbs(){
  const gallery = qs('#productMainImage');
  const thumbs = qs('#productThumbs');
  if(!gallery || !thumbs) return;
  thumbs.addEventListener('click', (e)=>{
    const btn = e.target.closest('.thumb');
    if(!btn) return;
    qsa('.thumb', thumbs).forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const src = btn.getAttribute('data-src');
    const img = gallery.querySelector('img');
    img.src = src;
  });
})();

// QUANTITY controls on product page
(function qtyControls(){
  const qtyInput = qs('#quantity');
  if(!qtyInput) return;
  qs('#qtyMinus')?.addEventListener('click', ()=> {
    qtyInput.value = Math.max(1, Number(qtyInput.value)-1);
  });
  qs('#qtyPlus')?.addEventListener('click', ()=> {
    qtyInput.value = Math.max(1, Number(qtyInput.value)+1);
  });
})();

// ADD TO CART (buttons across site & product page)
(function addToCartButtons(){
  // animation: flying image
  function flyToCart(imgSrc, startRect){
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.position = 'fixed';
    img.style.left = `${startRect.left}px`;
    img.style.top = `${startRect.top}px`;
    img.style.width = `${startRect.width}px`;
    img.style.height = `${startRect.height}px`;
    img.style.borderRadius = '8px';
    img.style.zIndex = 9999;
    img.style.transition = 'all 700ms cubic-bezier(.2,.9,.2,1)';
    document.body.appendChild(img);
    const cartEl = qs('.cart-link') || document.body;
    const cartRect = cartEl.getBoundingClientRect();
    requestAnimationFrame(()=> {
      img.style.left = `${cartRect.left}px`;
      img.style.top = `${cartRect.top}px`;
      img.style.width = '24px';
      img.style.height = '24px';
      img.style.opacity = '0.4';
      img.style.transform = 'rotate(20deg)';
    });
    setTimeout(()=> img.remove(), 800);
  }

  function addItem(item){
    const cart = getCart();
    const found = cart.find(i=> i.id == item.id);
    if(found){
      found.quantity = Number(found.quantity) + Number(item.quantity);
    } else {
      cart.push(item);
    }
    saveCart(cart);
    cartCount();
  }

  // catch any .add-to-cart buttons
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.add-to-cart');
    if(!btn) return;
    e.preventDefault();

    // Read item data
    const id = btn.getAttribute('data-id') || btn.dataset.id;
    const title = btn.getAttribute('data-title') || btn.dataset.title;
    const price = Number(btn.getAttribute('data-price') || btn.dataset.price || 0);
    const image = btn.getAttribute('data-image') || btn.dataset.image || (btn.closest('.product-card')?.dataset.image);
    let quantity = 1;
    // if inside product form, read quantity input
    const form = btn.closest('.product-form');
    if(form){
      const q = form.querySelector('#quantity');
      if(q) quantity = Number(q.value);
    } else {
      const card = btn.closest('.product-card');
      if(card){
        // optional: support a data-qty on product card
        const q = card.querySelector('input[type="number"]');
        if(q) quantity = Number(q.value) || 1;
      }
    }

    const rect = (btn.closest('.product-card')?.querySelector('img') || btn.closest('.gallery')?.querySelector('img') || btn).getBoundingClientRect();
    if(image) flyToCart(image, rect);

    addItem({ id, title, price, image, quantity });
    // show simple toast
    showToast(`${quantity} × ${title} added to cart`);
  });

})();

// Toast
function showToast(msg, time=2000){
  let toast = qs('#siteToast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.style.position = 'fixed';
    toast.style.right = '16px';
    toast.style.bottom = '16px';
    toast.style.background = 'rgba(11, 11, 11, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '10px';
    toast.style.zIndex = 9999;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(()=> toast.style.opacity = '0', time);
}

// newsletter form (fake)
qs('#newsletterForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  showToast('Thanks — you are subscribed!');
  e.target.reset();
});

// CART PAGE RENDERING & ACTIONS
(function cartPage(){
  const cartContainer = qs('#cartContainer');
  const cartActions = qs('#cartActions');
  if(!cartContainer) return;
  const render = () => {
    const cart = getCart();
    cartContainer.innerHTML = '';
    if(cart.length === 0){
      cartContainer.innerHTML = '<p class="muted">Your cart is empty.</p>';
      cartActions.style.display = 'none';
      cartCount();
      return;
    }
    cartActions.style.display = 'flex';
    let subtotal = 0;
    cart.forEach(item => {
      subtotal += item.price * item.quantity;
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="meta">
          <h4 style="margin:0 0 6px">${item.title}</h4>
          <div class="muted">${money(item.price)} each</div>
          <div style="margin-top:8px;">
            <button class="qty-adjust" data-id="${item.id}" data-delta="-1">−</button>
            <span style="padding:0 8px" id="qty-${item.id}">${item.quantity}</span>
            <button class="qty-adjust" data-id="${item.id}" data-delta="1">+</button>
            <button class="remove-item" data-id="${item.id}" style="margin-left:12px;color:var(--muted)">Remove</button>
          </div>
        </div>
        <div style="min-width:120px;text-align:right">
          <div>${money(item.price * item.quantity)}</div>
        </div>
      `;
      cartContainer.appendChild(row);
    });
    qs('#cartSubtotal').textContent = money(subtotal);
    cartCount();
  };

  render();

  document.addEventListener('click', (e)=>{
    const adj = e.target.closest('.qty-adjust');
    if(adj){
      const id = adj.dataset.id;
      const delta = Number(adj.dataset.delta);
      const cart = getCart();
      const item = cart.find(i=> i.id == id);
      if(item){
        item.quantity = Math.max(0, Number(item.quantity) + delta);
        if(item.quantity === 0){
          const idx = cart.indexOf(item);
          cart.splice(idx,1);
        }
        saveCart(cart);
        render();
      }
    }
    const rem = e.target.closest('.remove-item');
    if(rem){
      const id = rem.dataset.id;
      let cart = getCart();
      cart = cart.filter(i => i.id != id);
      saveCart(cart);
      render();
    }
  });

  // Checkout button (fake)
  qs('#checkoutBtn')?.addEventListener('click', ()=>{
    alert('This is a demo checkout. Integrate with your payment/checkout.');
  });

})();

// On page load: read query param ?id= and pre-fill product page (basic)
(function populateProductFromQuery(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if(!id) return;
  // In demo we map id to example data
  const products = {
    '1': { title:'Lycra Saree', price:824.00, image:'image/YUGAVEERAA-Lycra-Solid-Regular-Saree-SDL527086690-1-666db.webp', desc:'Lycra Saree.' },
    '2': { title:'Everyday Hoodie', price:948.00, image:'image/m-ausk9420-ausk-original-imahg7xfhhfxcqyq.webp', desc:'Comfortable hoodie for everyday use.' },
    '3': { title:'Slim Jeans', price:1119.00, image:'image/-original-imaheybp3fxmf6zz.webp', desc:'Slim fit jeans.' },
    '4': { title:'Leather Belt', price:709.00, image:'image/38-mdl-leath-6-bl-sty-leath-6-bl-genuine-leather-belt-for-men-s-original-imahgf7jkmu5bg29.webp', desc:'Genuine leather belt.' }
  };
  const p = products[id];
  if(!p) return;
  const titleEl = qs('#productTitle');
  const priceEl = qs('#productPrice');
  const mainImg = qs('#productMainImage img');
  const thumbs = qsa('.thumb');
  if(titleEl) titleEl.textContent = p.title;
  if(priceEl) priceEl.textContent = money(p.price);
  if(mainImg) mainImg.src = p.image;
  thumbs.forEach((t, i) => {
    const img = t.querySelector('img');
    img.src = `https://via.placeholder.com/120x120?text=${i+1}`;
    t.dataset.src = p.image.replace('420x420','800x800');
  });

})();

// On DOM ready, update cart count & attach product form handler
document.addEventListener('DOMContentLoaded', ()=> {
  cartCount();

  // handle product-form submit to add to cart (if present)
  const productForm = qs('.product-form');
  productForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const btn = productForm.querySelector('.add-to-cart');
    if(!btn) return;
    const id = btn.dataset.id;
    const title = btn.dataset.title;
    const price = parseFloat(btn.dataset.price || '0');
    const image = btn.dataset.image;
    const qty = Number(productForm.querySelector('#quantity')?.value || 1);
    // add to localStorage cart
    const cart = getCart();
    const found = cart.find(i => i.id == id);
    if(found) found.quantity = Number(found.quantity) + qty;
    else cart.push({ id, title, price, image, quantity: qty });
    saveCart(cart);
    cartCount();
    showToast(`${qty} × ${title} added to cart`);
  });

});
