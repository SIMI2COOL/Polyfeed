function debounce(fn, ms){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); } }

document.addEventListener('DOMContentLoaded', () => {
  const wallet = document.getElementById('wallet');
  const statusEl = document.getElementById('status');
  const tbody = document.querySelector('#trades tbody');
  const copyBtn = document.getElementById('copy');
  const pasteBtn = document.getElementById('paste');
  const addrEl = document.getElementById('addr');
  const donationAside = document.querySelector('.donation-side');
  const popularAside = document.querySelector('.popular-side');
  const popularList = document.getElementById('popular-list');
  const cryptoAside = document.querySelector('.crypto-side');
  const cryptoList = document.getElementById('crypto-list');
  const sportsAside = document.querySelector('.sports-side');
  const sportsList = document.getElementById('sports-list');
  const creatorLink = document.querySelector('.creator-link');
  const favForm = document.getElementById('favorites-form');
  const favName = document.getElementById('fav-name');
  const favAddress = document.getElementById('fav-address');
  const favList = document.getElementById('favorites-list');
  const favSaveCurrent = document.getElementById('fav-save-current');

  async function getTradesBrowser(walletAddr){
    if(!walletAddr || walletAddr === '0x...') return [];
    const params = new URLSearchParams({
      user: walletAddr,
      type: 'TRADE',
      limit: '20',
      sortBy: 'TIMESTAMP',
      sortDirection: 'DESC',
    });
    const url = `https://data-api.polymarket.com/activity?${params.toString()}`;
    try{
      const resp = await fetch(url, { headers: { 'accept': 'application/json' } });
      if(!resp.ok) return [];
      return await resp.json();
    }catch(err){
      console.error(err);
      return [];
    }
  }

  async function refresh(){
    const w = wallet.value.trim();
    let trades = [];
    if(w && w !== '0x...'){
      try{ trades = await getTradesBrowser(w); }catch(e){ console.error(e); }
    }
    render(trades);
  }

  function render(trades){
    tbody.innerHTML = '';
    if(!trades || trades.length === 0){ statusEl.textContent = 'No data – enter a wallet'; return; }
    statusEl.textContent = `${trades.length} recent trades – refreshing…`;
    for(const t of trades){
      const tr = document.createElement('tr');
      const ts = new Date(t.timestamp * 1000);
      const time = ts.toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const title = (t.title || 'Unknown Market');
      const outcome = (t.outcome || 'N/A');
      const price = `$${Number(t.price).toFixed(2)}`;
      const size = `${Number(t.size).toFixed(2)} shares`;
      const side = t.side === 'BUY' ? '<span class="side buy">BUY</span>' : '<span class="side sell">SELL</span>';
      const guessUrl = t.url || t.market_url || (t.slug ? `https://polymarket.com/event/${t.slug}` : `https://polymarket.com/search?q=${encodeURIComponent(title)}`);
      tr.innerHTML = `
        <td>${time}</td>
        <td><a href="#" class="mkt" data-url="${guessUrl}">${title}</a></td>
        <td>${outcome}</td>
        <td class="num">${price}</td>
        <td class="num">${size}</td>
        <td>${side}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  // links now use normal browser navigation via href/target

  const debounced = debounce(refresh, 300);
  wallet.addEventListener('input', debounced);
  copyBtn.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(addrEl.textContent.trim()); statusEl.textContent = 'Address copied to clipboard ✨'; }
    catch{ statusEl.textContent = addrEl.textContent.trim(); }
  });
  pasteBtn.addEventListener('click', async ()=>{ try{ wallet.value = await navigator.clipboard.readText(); refresh(); }catch{} });

  // creator link uses direct href in HTML

  setInterval(refresh, 1000);

  // Custom cursor removed – using default system cursor

  // Magnetic buttons removed for normal cursor behavior

  // ---------------- Popular users panel ----------------
  async function loadPopular(){
    const fallback = [
      { name: 'Euan', address: '0xdd225a03cd7ed89e3931906c67c75ab31cf89ef1', handle: 'Euan' },
      { name: 'Car', address: '0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b', handle: 'Car' },
      { name: '25usdc', address: '0x75e765216a57942d738d880ffcda854d9f869080', handle: '25usdc' },
      { name: 'Dropper', address: '0x6bab41a0dc40d6dd4c1a915b8c01969479fd1292', handle: 'Dropper' },
      { name: 'gopfan2', address: '0xf2f6af4f27ec2dcf4072095ab804016e14cd5817', handle: 'gopfan2' },
      { name: 'wokerjoesleeper', address: '0x63d43bbb87f85af03b8f2f9e2fad7b54334fa2f1', handle: 'wokerjoesleeper' },
      { name: 'cigarettes', address: '0xd218e474776403a330142299f7796e8ba32eb5c9', handle: 'cigarettes' },
    ].map(u => ({
      ...u,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.address}`,
      url: `https://polymarket.com/@${u.handle || u.name}`,
    }));
    renderPopular(applyLocalAvatars(fallback));
    positionLeftPanels();
  }

  function applyLocalAvatars(users){
    const local = {
      'euan': 'assets/avatars/Euan.png',
      'car': 'assets/avatars/Car.png',
      '25usdc': 'assets/avatars/25usdc.png',
      'dropper': 'assets/avatars/Dropper.png',
      'gopfan2': 'assets/avatars/gopfan2.png',
      // wokerjoesleeper, cigarettes: no profile pictures provided
    };
    return users.map(u => {
      const key = String(u.handle || u.name || '').toLowerCase();
      if(local[key]){ u.avatar = local[key]; }
      return u;
    });
  }

  function renderPopular(users){
    if(!popularList) return;
    popularList.innerHTML = '';
    for(const u of users){
      const li = document.createElement('li');
      li.className = 'popular-item';
      li.innerHTML = `
        <span class="popular-avatar"><a class="popular-link" href="${u.url}" target="_blank" rel="noopener noreferrer"><img alt="${u.name}" src="${u.avatar}"/></a></span>
        <span class="popular-meta">
          <a class="popular-link" href="${u.url}" target="_blank" rel="noopener noreferrer"><span class="popular-name">${u.name}</span></a>
          <span class="popular-addr" data-address="${u.address}">${u.address}</span>
        </span>`;
      popularList.appendChild(li);
      try{
        const imgEl = li.querySelector('img');
        const orig = String(u.avatar || '');
        const identi = `https://api.dicebear.com/7.x/identicon/svg?seed=${u.address}`;
        imgEl.onerror = ()=>{
          const cur = imgEl.getAttribute('src') || '';
          if(orig.startsWith('assets/avatars/')){
            if(cur.endsWith('.png')){ imgEl.src = orig.replace(/\.png$/i, '.jpg'); return; }
            if(cur.endsWith('.jpg')){ imgEl.src = orig.replace(/\.(png|jpg)$/i, '.jpeg'); return; }
          }
          imgEl.onerror = null; imgEl.src = identi;
        };
        console.log('Popular user', u.name, u.address, 'avatar:', u.avatar);
      }catch{}
    }
    try{ if(statusEl) statusEl.textContent = `${users.length} popular users loaded`; }catch{}
  }

  function positionLeftPanels(){
    if(!donationAside) return;
    // Compute absolute document positions so Popular/Crypto/Sports scroll with the page
    let top = window.scrollY + donationAside.getBoundingClientRect().top + donationAside.offsetHeight + 18;
    if(popularAside){ popularAside.style.top = `${top}px`; top += popularAside.offsetHeight + 18; }
    if(cryptoAside){ cryptoAside.style.top = `${top}px`; top += cryptoAside.offsetHeight + 18; }
    if(sportsAside){ sportsAside.style.top = `${top}px`; top += sportsAside.offsetHeight + 18; }
    // Ensure the main header matches donation panel height for a uniform top row
    const headerEl = document.querySelector('header.shell.glass');
    if(headerEl){
      // Make the header's total box height match the donation panel height
      try{
        const cs = getComputedStyle(headerEl);
        const padY = (parseFloat(cs.paddingTop)||0) + (parseFloat(cs.paddingBottom)||0);
        const borderY = (parseFloat(cs.borderTopWidth)||0) + (parseFloat(cs.borderBottomWidth)||0);
        const contentMin = Math.max(0, donationAside.offsetHeight - padY - borderY);
        headerEl.style.minHeight = `${contentMin}px`;
      }catch{
        headerEl.style.minHeight = `${donationAside.offsetHeight}px`;
      }
    }
    // Match main panel min-height to the total height of the left stack
    const mainEl = document.querySelector('main.shell.glass');
    if(mainEl){
      const mainTopAbs = window.scrollY + mainEl.getBoundingClientRect().top;
      const desired = Math.max(0, top - mainTopAbs);
      mainEl.style.minHeight = `${desired}px`;
    }
  }

  function scrollToTop(){
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch{ window.scrollTo(0,0); }
  }

  // Interaction: set wallet on address click
  if(popularList){
    popularList.addEventListener('click', (e)=>{
      const addrClick = e.target.closest && e.target.closest('.popular-addr');
      if(addrClick){
        const newAddr = addrClick.getAttribute('data-address');
        if(newAddr && wallet){ wallet.value = newAddr; scrollToTop(); refresh(); }
      }
    });
  }

  // Reposition on resize
  window.addEventListener('resize', debounce(positionLeftPanels, 150));

  loadPopular();
  // Populate Crypto bots
  if(cryptoList){
    const cryptoUsers = [
      { name:'aespakarina', handle:'aespakarina', address:'0xca85f4b9e472b542e1df039594eeaebb6d466bf2', url:'https://polymarket.com/@aespakarina', avatar:'assets/avatars/aespekarina.png' },
      { name:'YellowLemon', handle:'YellowLemon', address:'0x4a62a624074b4eb137e04f674a6c28cc0462ab5c', url:'https://polymarket.com/@YellowLemon', avatar:'assets/avatars/yellowlemon.png' },
      { name:'gabagool22', handle:'gabagool22', address:'0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d', url:'https://polymarket.com/@gabagool22' },
    ].map(u => ({ ...u, avatar: u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.address}` }));
    cryptoList.innerHTML = '';
    for(const u of cryptoUsers){
      const li = document.createElement('li');
      li.className = 'bot-item';
      li.innerHTML = `
        <span class="popular-avatar"><a class="popular-link" href="${u.url}" target="_blank" rel="noopener noreferrer"><img alt="${u.name}" src="${u.avatar}"/></a></span>
        <span class="popular-meta">
          <a class="popular-link" href="${u.url}" target="_blank" rel="noopener noreferrer"><span class="popular-name">${u.name}</span></a>
          <span class="popular-addr" data-address="${u.address}">${u.address}</span>
        </span>`;
      cryptoList.appendChild(li);
    }
  }

  // Populate Sports bots
  if(sportsList){
    const sportsUsers = [
      { name:'RN1', handle:'RN1', address:'0x2005d16a84ceefa912d4e380cd32e7ff827875ea', url:'https://polymarket.com/profile/0x2005d16a84ceefa912d4e380cd32e7ff827875ea', avatar:'assets/avatars/RN1.png' },
      { name:'3bpatgs', handle:'3bpatgs', address:'0x212954857f5efc138748c33d032a93bf95974222', url:'https://polymarket.com/@3bpatgs' },
      { name:'swisstony', handle:'swisstony', address:'0x204f72f35326db932158cba6adff0b9a1da95e14', url:'https://polymarket.com/@swisstony' },
      { name:'Finubar', handle:'Finubar', address:'0x900c83447eb74c3f29f17658e848e2715ca41d7a', url:'https://polymarket.com/@Finubar' },
    ].map(u => ({ ...u, avatar: u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.address}` }));
    sportsList.innerHTML = '';
    for(const u of sportsUsers){
      const li = document.createElement('li');
      li.className = 'bot-item';
      li.innerHTML = `
        <span class="popular-avatar"><a class="popular-link" href="${u.url}" target="_blank" rel="noopener noreferrer"><img alt="${u.name}" src="${u.avatar}"/></a></span>
        <span class="popular-meta">
          <a class="popular-link" href="${u.url}" target="_blank" rel="noopener noreferrer"><span class="popular-name">${u.name}</span></a>
          <span class="popular-addr" data-address="${u.address}">${u.address}</span>
        </span>`;
      sportsList.appendChild(li);
    }
  }

  // Interactions for bot lists: allow address click to set wallet
  function attachAddrInteraction(listEl){
    if(!listEl) return;
    listEl.addEventListener('click', (e)=>{
      const addrClick = e.target.closest && e.target.closest('.popular-addr');
      if(addrClick){ const newAddr = addrClick.getAttribute('data-address'); if(newAddr && wallet){ wallet.value = newAddr; scrollToTop(); refresh(); } }
    });
  }
  attachAddrInteraction(cryptoList);
  attachAddrInteraction(sportsList);
  positionLeftPanels();

  // ---------------- Favorites (right sidebar) ----------------
  const FAV_KEY = 'polyfeed:favorites';
  function loadFavorites(){
    try{
      const raw = localStorage.getItem(FAV_KEY);
      const items = raw ? JSON.parse(raw) : [];
      const dropper = '0x6bab41a0dc40d6dd4c1a915b8c01969479fd1292';
      const filtered = Array.isArray(items)
        ? items.filter(x => String(x.address || '').toLowerCase() !== dropper)
        : [];
      if(filtered.length !== (Array.isArray(items) ? items.length : 0)){
        try{ localStorage.setItem(FAV_KEY, JSON.stringify(filtered)); }catch{}
      }
      return filtered;
    }catch{ return []; }
  }
  function saveFavorites(items){
    try{ localStorage.setItem(FAV_KEY, JSON.stringify(items)); }
    catch{}
  }
  function normalizeAddr(a){ return (a || '').trim(); }
  function normalizeHandle(h){
    const raw = String(h || '').replace(/^@+/, '').trim();
    if(!raw) return '';
    // Do NOT treat hex addresses as handles
    if(/^0x[0-9a-fA-F]{40}$/.test(raw)) return '';
    // Accept typical handle chars only
    if(!/^[A-Za-z0-9_]{1,32}$/.test(raw)) return '';
    return raw;
  }
  function extractAddress(input){
    const raw = String(input || '').trim();
    if(!raw) return '';
    const urlMatch = raw.match(/polymarket\.com\/(?:profile\/)?(0x[0-9a-fA-F]{40})/);
    if(urlMatch) return urlMatch[1];
    const hexMatch = raw.match(/^(0x[0-9a-fA-F]{40})$/);
    if(hexMatch) return hexMatch[1];
    return '';
  }
  async function resolveHandleFromAddress(address){
    const addr = normalizeAddr(address);
    if(!addr) return '';
    try{
      const resp = await fetch(`https://polymarket.com/${addr}`, { redirect: 'follow' });
      const finalUrl = resp && resp.url ? resp.url : '';
      const m = finalUrl.match(/\/@(\w+)/);
      if(m && m[1]) return m[1];
    }catch{}
    return '';
  }
  async function resolveHandleAndUpdate(address){
    const handle = await resolveHandleFromAddress(address);
    if(!handle) return;
    const items = loadFavorites();
    const idx = items.findIndex(x => String(x.address).toLowerCase() === String(address).toLowerCase());
    if(idx >= 0){
      items[idx].handle = handle;
      items[idx].name = `@${handle}`;
      saveFavorites(items);
      renderFavorites();
    }
  }
  function addFavorite(name, address){
    const addr = normalizeAddr(address);
    if(!addr) return;
    const items = loadFavorites();
    const existingIdx = items.findIndex(x => String(x.address).toLowerCase() === addr.toLowerCase());
    const handle = normalizeHandle(name);
    const entry = handle
      ? { name: handle, handle, address: addr }
      : { name: (name || '').trim() || addr, address: addr };
    if(existingIdx >= 0){ items[existingIdx] = entry; }
    else { items.unshift(entry); }
    saveFavorites(items);
    renderFavorites();
    // Attempt to auto-resolve @handle from address and update silently
    resolveHandleAndUpdate(addr);
  }
  function removeFavorite(address){
    const addr = normalizeAddr(address);
    const items = loadFavorites().filter(x => String(x.address).toLowerCase() !== addr.toLowerCase());
    saveFavorites(items);
    renderFavorites();
  }
  function setWalletAndRefresh(addr){
    if(wallet){ wallet.value = addr; scrollToTop(); refresh(); }
  }
  function renderFavorites(){
    if(!favList) return;
    const items = loadFavorites();
    favList.innerHTML = '';
    for(const f of items){
      const li = document.createElement('li');
      li.className = 'favorite-item';
      const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(f.address)}`;
      const handle = f.handle || (String(f.name||'').startsWith('@') ? String(f.name).slice(1) : '');
      const displayName = handle ? handle : ((f.name || '').replace(/^@+/, '') || f.address);
      const profileUrl = handle ? `https://polymarket.com/@${handle}` : `https://polymarket.com/${f.address}`;
      li.innerHTML = `
        <span class="favorite-avatar"><img alt="${displayName}" src="${avatar}"/></span>
        <span class="favorite-meta">
          <a class="favorite-name-link" href="${profileUrl}" target="_blank" rel="noopener noreferrer"><span class="favorite-name">${displayName}</span></a>
          <span class="favorite-addr-row">
            <span class="favorite-addr" data-address="${f.address}">${f.address}</span>
            <button class="fav-edit" data-address="${f.address}" aria-label="Edit name">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM18.37 3.29l2.34 2.34c.39.39.39 1.03 0 1.42L19.1 8.66l-3.75-3.75 1.62-1.62c.39-.39 1.03-.39 1.42 0z"/></svg>
            </button>
          </span>
        </span>
        <button class="fav-close fav-remove" data-address="${f.address}" aria-label="Remove favorite">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"/></svg>
        </button>`;
      favList.appendChild(li);
    }
  }
  if(favForm){
    favForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const n = (favName && favName.value || '').trim();
      const a = extractAddress((favAddress && favAddress.value) || '');
      if(!a){ if(statusEl) statusEl.textContent = 'Enter an address to add to favorites'; return; }
      addFavorite(n, a);
      try{ if(favName) favName.value = ''; if(favAddress) favAddress.value = ''; }catch{}
    });
  }
  if(favSaveCurrent){
    favSaveCurrent.addEventListener('click', async ()=>{
      const a = extractAddress(wallet && wallet.value);
      if(!a){ if(statusEl) statusEl.textContent = 'Enter a valid wallet to save'; return; }
      const handle = await resolveHandleFromAddress(a);
      const nameForSave = handle ? handle : `${a.slice(0,6)}…${a.slice(-4)}`;
      addFavorite(nameForSave, a);
      if(statusEl) statusEl.textContent = 'Saved to favorites';
    });
  }
  if(favList){
    favList.addEventListener('click', (e)=>{
      const editBtn = e.target.closest && e.target.closest('.fav-edit');
      if(editBtn){
        const addr = editBtn.getAttribute('data-address');
        const items = loadFavorites();
        const idx = items.findIndex(x => String(x.address).toLowerCase() === String(addr).toLowerCase());
        if(idx >= 0){
          const cur = items[idx].name || '';
          let res = null;
          try{ res = window.prompt('Edit name (@username or custom label)', cur.replace(/^@/, '')); }catch{}
          if(res === null){ return; } // cancelled: keep previous value unchanged
          const next = String(res);
          const handle = normalizeHandle(next);
          if(handle){ items[idx].handle = handle; items[idx].name = handle; }
          else {
            const trimmed = next.trim();
            if(trimmed){ items[idx].handle = undefined; items[idx].name = trimmed; }
            // if empty input, keep previous value
          }
          saveFavorites(items);
          renderFavorites();
        }
        return;
      }
      const remBtn = e.target.closest && e.target.closest('.fav-remove');
      if(remBtn){ const a = remBtn.getAttribute('data-address'); if(a){ removeFavorite(a); } return; }
      const addrElFav = e.target.closest && e.target.closest('.favorite-addr');
      const a = (addrElFav && addrElFav.getAttribute('data-address'));
      if(a){ setWalletAndRefresh(a); }
    });
  }
  renderFavorites();
});


