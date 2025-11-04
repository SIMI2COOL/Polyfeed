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

  async function refresh(){
    const w = wallet.value.trim();
    let trades = [];
    if(w && w !== '0x...'){
      try{ trades = await pywebview.api.get_trades(w); }catch(e){ console.error(e); }
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

  // open market links in system browser via bridge
  tbody.addEventListener('click', (e)=>{
    const a = e.target.closest && e.target.closest('a.mkt');
    if(a){ e.preventDefault(); const url = a.getAttribute('data-url'); if(url){ try{ pywebview.api.open_url(url); }catch{} } }
  });

  const debounced = debounce(refresh, 300);
  wallet.addEventListener('input', debounced);
  copyBtn.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(addrEl.textContent.trim()); statusEl.textContent = 'Address copied to clipboard ✨'; }
    catch{ statusEl.textContent = addrEl.textContent.trim(); }
  });
  pasteBtn.addEventListener('click', async ()=>{ try{ wallet.value = await navigator.clipboard.readText(); refresh(); }catch{} });

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

    try{
      const users = await pywebview.api.get_popular_users();
      const list = (Array.isArray(users) && users.length) ? users : fallback;
      const withLocalAvatars = applyLocalAvatars(list);
      renderPopular(withLocalAvatars);
    }catch(e){
      console.error(e);
      renderPopular(applyLocalAvatars(fallback));
    }
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
        <span class="popular-avatar"><a class="popular-link" href="#" data-url="${u.url}"><img alt="${u.name}" src="${u.avatar}"/></a></span>
        <span class="popular-meta">
          <a class="popular-link" href="#" data-url="${u.url}"><span class="popular-name">${u.name}</span></a>
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

  // Interactions: set wallet on address click; open profile on avatar/name click
  if(popularList){
    popularList.addEventListener('click', (e)=>{
      const addrClick = e.target.closest && e.target.closest('.popular-addr');
      if(addrClick){
        const newAddr = addrClick.getAttribute('data-address');
        if(newAddr && wallet){ wallet.value = newAddr; scrollToTop(); refresh(); }
        return;
      }
      const a = e.target.closest && e.target.closest('a.popular-link');
      if(a){ e.preventDefault(); const url = a.getAttribute('data-url'); if(url){ try{ pywebview.api.open_url(url); }catch{} } }
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
        <span class="popular-avatar"><a class="popular-link" href="#" data-url="${u.url}"><img alt="${u.name}" src="${u.avatar}"/></a></span>
        <span class="popular-meta">
          <a class="popular-link" href="#" data-url="${u.url}"><span class="popular-name">${u.name}</span></a>
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
        <span class="popular-avatar"><a class="popular-link" href="#" data-url="${u.url}"><img alt="${u.name}" src="${u.avatar}"/></a></span>
        <span class="popular-meta">
          <a class="popular-link" href="#" data-url="${u.url}"><span class="popular-name">${u.name}</span></a>
          <span class="popular-addr" data-address="${u.address}">${u.address}</span>
        </span>`;
      sportsList.appendChild(li);
    }
  }

  // Interactions for bot lists (same behavior as popular)
  function attachListInteractions(listEl){
    if(!listEl) return;
    listEl.addEventListener('click', (e)=>{
      const addrClick = e.target.closest && e.target.closest('.popular-addr');
      if(addrClick){ const newAddr = addrClick.getAttribute('data-address'); if(newAddr && wallet){ wallet.value = newAddr; scrollToTop(); refresh(); } return; }
      const a = e.target.closest && e.target.closest('a.popular-link');
      if(a){ e.preventDefault(); const url = a.getAttribute('data-url'); if(url){ try{ pywebview.api.open_url(url); }catch{} } }
    });
  }
  attachListInteractions(cryptoList);
  attachListInteractions(sportsList);
  positionLeftPanels();
});


