// TrendWear bulutli boshqaruv platformasi — frontend SPA
// Backend manzili: nginx orqali "/api" yo'liga proxy qilinadi (bitta serverda).
const API = "/api";

const state = {
  token: localStorage.getItem("tw_token") || null,
  user: JSON.parse(localStorage.getItem("tw_user") || "null"),
  page: "dashboard",
  data: {},
};

// ---------- API helper ----------
async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  const res = await fetch(API + path, { ...opts, headers });
  if (res.status === 401) { logout(); throw new Error("Sessiya tugadi"); }
  if (!res.ok) {
    let msg = "Xatolik yuz berdi";
    try { msg = (await res.json()).detail || msg; } catch (e) {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

// ---------- Icons (inline SVG) ----------
const ICO = {
  dash: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  box: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  users: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  cart: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
  gauge: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
};

const root = document.getElementById("app");

// ============ AUTH VIEWS ============
function renderLogin() {
  root.innerHTML = `
  <div class="login-wrap">
    <div class="login-art">
      <div class="brand-mark"><span class="brand-dot"></span> TrendWear<span style="color:var(--muted);font-weight:400"> Cloud</span></div>
      <div>
        <div class="login-headline serif">Ulgurji savdoning<br><em>bulutli</em> markazi.</div>
        <p class="login-sub">ERP, CRM va WMS tizimlari yagona xavfsiz tarmoq ichida birlashtirilgan. VPC arxitekturasi, load balancing va auto-scaling bilan jihozlangan zamonaviy platforma.</p>
      </div>
      <div class="login-tags">
        <span class="tag-pill">VPC izolyatsiya</span>
        <span class="tag-pill">Load Balancer</span>
        <span class="tag-pill">Auto-scaling</span>
        <span class="tag-pill">Docker</span>
        <span class="tag-pill">CI/CD</span>
      </div>
    </div>
    <div class="login-form-col">
      <div class="login-card">
        <h2 class="serif">Xush kelibsiz</h2>
        <p class="lead">Boshqaruv paneliga kirish uchun tizimga ulaning.</p>
        <div class="field">
          <label>Email</label>
          <input id="email" type="email" value="admin@trendwear.uz" placeholder="email@trendwear.uz" />
        </div>
        <div class="field">
          <label>Parol</label>
          <input id="password" type="password" value="admin123" placeholder="••••••••" />
        </div>
        <button class="btn-primary" id="loginBtn">Tizimga kirish</button>
        <div class="error-msg" id="loginErr"></div>
        <div class="demo-hint">
          Demo hisob: <b>admin@trendwear.uz</b> / <b>admin123</b><br>
          yoki <b>manager@trendwear.uz</b> / <b>manager123</b>
        </div>
      </div>
    </div>
  </div>`;

  const doLogin = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const err = document.getElementById("loginErr");
    err.textContent = "";
    const btn = document.getElementById("loginBtn");
    btn.textContent = "Kirilmoqda..."; btn.disabled = true;
    try {
      const r = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      state.token = r.access_token; state.user = r.user;
      localStorage.setItem("tw_token", r.access_token);
      localStorage.setItem("tw_user", JSON.stringify(r.user));
      renderApp();
    } catch (e) {
      err.textContent = e.message;
      btn.textContent = "Tizimga kirish"; btn.disabled = false;
    }
  };
  document.getElementById("loginBtn").onclick = doLogin;
  document.getElementById("password").onkeydown = (e) => { if (e.key === "Enter") doLogin(); };
}

function logout() {
  state.token = null; state.user = null;
  localStorage.removeItem("tw_token"); localStorage.removeItem("tw_user");
  renderLogin();
}

// ============ APP SHELL ============
const NAV = [
  { id: "dashboard", label: "Boshqaruv paneli", ico: "dash" },
  { id: "products", label: "Ombor / Mahsulotlar", ico: "box" },
  { id: "customers", label: "Mijozlar (CRM)", ico: "users" },
  { id: "orders", label: "Buyurtmalar (ERP)", ico: "cart" },
  { id: "loadtest", label: "Yuklama testi", ico: "gauge" },
];

function renderApp() {
  const u = state.user;
  const initials = (u.full_name || "U").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  root.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand-mark"><span class="brand-dot"></span> TrendWear</div>
      ${NAV.map(n => `
        <button class="nav-item ${state.page === n.id ? "active" : ""}" data-nav="${n.id}">
          <span class="nav-ico">${ICO[n.ico]}</span> ${n.label}
        </button>`).join("")}
      <div class="sidebar-foot">
        <div class="user-chip">
          <div class="avatar">${initials}</div>
          <div class="meta"><b>${u.full_name}</b><span>${u.role}</span></div>
        </div>
        <button class="logout-btn" id="logoutBtn">Chiqish →</button>
      </div>
    </aside>
    <main class="main" id="main"></main>
  </div>`;

  root.querySelectorAll("[data-nav]").forEach(b => {
    b.onclick = () => { state.page = b.dataset.nav; renderApp(); };
  });
  document.getElementById("logoutBtn").onclick = logout;

  const pages = { dashboard: pageDashboard, products: pageProducts, customers: pageCustomers, orders: pageOrders, loadtest: pageLoadTest };
  pages[state.page]();
}

function pageHead(title, crumb, right = "") {
  return `<div class="page-head"><div><div class="crumb">${crumb}</div><h1 class="serif">${title}</h1></div><div>${right}</div></div>`;
}

function fmt(n) { return Number(n).toLocaleString("uz-UZ"); }
function money(n) { return fmt(Math.round(n)) + " so'm"; }

// ============ DASHBOARD ============
async function pageDashboard() {
  const m = document.getElementById("main");
  m.innerHTML = pageHead("Boshqaruv paneli", "TrendWear Cloud · Umumiy ko'rinish",
    `<span class="node-badge" id="nodeBadge"><span class="pulse"></span> ulanmoqda...</span>`);
  try {
    const [s, health] = await Promise.all([api("/dashboard"), api("/health")]);
    document.getElementById("nodeBadge").innerHTML =
      `<span class="pulse"></span> Faol node: <b style="color:var(--accent-soft);margin-left:4px">${health.server_id}</b>`;
    const cards = [
      { label: "Jami mahsulotlar", value: fmt(s.total_products), sub: "ombordagi turlar", cls: "" },
      { label: "Mijozlar (CRM)", value: fmt(s.total_customers), sub: "faol hamkorlar", cls: "" },
      { label: "Buyurtmalar (ERP)", value: fmt(s.total_orders), sub: "jami qayd etilgan", cls: "" },
      { label: "Umumiy aylanma", value: money(s.total_revenue), sub: "barcha buyurtmalar", cls: "" },
      { label: "Kam zaxira", value: fmt(s.low_stock_count), sub: "to'ldirish kerak", cls: s.low_stock_count ? "alert" : "" },
      { label: "Kutilayotgan", value: fmt(s.pending_orders), sub: "qayta ishlanmagan", cls: s.pending_orders ? "warn" : "" },
    ];
    m.innerHTML += `<div class="stat-grid">${cards.map((c, i) => `
      <div class="stat-card" style="animation-delay:${i * 60}ms">
        <div class="label">${c.label}</div>
        <div class="value ${c.cls}">${c.value}</div>
        <div class="sub">${c.sub}</div>
      </div>`).join("")}</div>`;

    const lowProducts = (await api("/products")).filter(p => p.stock <= p.reorder_level);
    m.innerHTML += `
      <div class="panel">
        <div class="panel-head"><h3 class="serif">Zaxirasi kam mahsulotlar</h3></div>
        ${lowProducts.length ? `<table><thead><tr><th>SKU</th><th>Mahsulot</th><th>Qoldiq</th><th>Min. daraja</th></tr></thead>
        <tbody>${lowProducts.map(p => `<tr><td class="mono">${p.sku}</td><td>${p.name}</td>
          <td class="stock-low mono">${p.stock}</td><td class="mono">${p.reorder_level}</td></tr>`).join("")}</tbody></table>`
        : `<div class="empty">Hamma mahsulotlar yetarli zaxirada ✓</div>`}
      </div>`;
  } catch (e) { m.innerHTML += `<div class="empty">${e.message}</div>`; }
}

// ============ PRODUCTS ============
async function pageProducts() {
  const m = document.getElementById("main");
  m.innerHTML = pageHead("Ombor / Mahsulotlar", "WMS · Inventarizatsiya",
    `<button class="btn-accent" id="addProd">+ Mahsulot qo'shish</button>`);
  document.getElementById("addProd").onclick = () => productModal();
  try {
    const [products, cats] = await Promise.all([api("/products"), api("/categories")]);
    state.data.categories = cats;
    const catName = id => (cats.find(c => c.id === id) || {}).name || "—";
    m.innerHTML += `<div class="panel"><table>
      <thead><tr><th>SKU</th><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Zaxira</th><th></th></tr></thead>
      <tbody>${products.map(p => `<tr>
        <td class="mono">${p.sku}</td>
        <td>${p.name}</td>
        <td style="color:var(--muted)">${catName(p.category_id)}</td>
        <td class="mono">${money(p.price)}</td>
        <td class="mono ${p.stock <= p.reorder_level ? "stock-low" : "stock-ok"}">${fmt(p.stock)}</td>
        <td><button class="btn-mini" data-del="${p.id}">o'chirish</button></td>
      </tr>`).join("")}</tbody></table></div>`;
    m.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) { await api(`/products/${b.dataset.del}`, { method: "DELETE" }); pageProducts(); }
    });
  } catch (e) { m.innerHTML += `<div class="empty">${e.message}</div>`; }
}

function productModal() {
  const cats = state.data.categories || [];
  showModal(`<h3 class="serif">Yangi mahsulot</h3>
    <div class="field"><label>SKU</label><input id="p_sku" placeholder="TW-2001"/></div>
    <div class="field"><label>Nomi</label><input id="p_name" placeholder="Mahsulot nomi"/></div>
    <div class="row">
      <div class="field"><label>Narx (so'm)</label><input id="p_price" type="number" value="100000"/></div>
      <div class="field"><label>Zaxira</label><input id="p_stock" type="number" value="100"/></div>
    </div>
    <div class="field"><label>Kategoriya</label><select id="p_cat">${cats.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select></div>
    `, async () => {
    await api("/products", { method: "POST", body: JSON.stringify({
      sku: val("p_sku"), name: val("p_name"),
      price: +val("p_price"), stock: +val("p_stock"),
      category_id: +val("p_cat"),
    })});
    closeModal(); pageProducts();
  });
}

// ============ CUSTOMERS ============
async function pageCustomers() {
  const m = document.getElementById("main");
  m.innerHTML = pageHead("Mijozlar", "CRM · Mijozlar bilan ishlash",
    `<button class="btn-accent" id="addCust">+ Mijoz qo'shish</button>`);
  document.getElementById("addCust").onclick = () => customerModal();
  try {
    const customers = await api("/customers");
    m.innerHTML += `<div class="panel"><table>
      <thead><tr><th>Kompaniya</th><th>Mas'ul shaxs</th><th>Telefon</th><th>Shahar</th><th></th></tr></thead>
      <tbody>${customers.map(c => `<tr>
        <td><b>${c.company_name}</b></td>
        <td>${c.contact_name || "—"}</td>
        <td class="mono">${c.phone || "—"}</td>
        <td style="color:var(--muted)">${c.city || "—"}</td>
        <td><button class="btn-mini" data-del="${c.id}">o'chirish</button></td>
      </tr>`).join("")}</tbody></table></div>`;
    m.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (confirm("Mijozni o'chirasizmi?")) { await api(`/customers/${b.dataset.del}`, { method: "DELETE" }); pageCustomers(); }
    });
  } catch (e) { m.innerHTML += `<div class="empty">${e.message}</div>`; }
}

function customerModal() {
  showModal(`<h3 class="serif">Yangi mijoz</h3>
    <div class="field"><label>Kompaniya nomi</label><input id="c_company" placeholder="Moda Savdo MChJ"/></div>
    <div class="field"><label>Mas'ul shaxs</label><input id="c_contact" placeholder="Ism Familiya"/></div>
    <div class="row">
      <div class="field"><label>Telefon</label><input id="c_phone" placeholder="+998 90 123 45 67"/></div>
      <div class="field"><label>Shahar</label><input id="c_city" placeholder="Toshkent"/></div>
    </div>
    <div class="field"><label>Email</label><input id="c_email" placeholder="info@company.uz"/></div>
    `, async () => {
    await api("/customers", { method: "POST", body: JSON.stringify({
      company_name: val("c_company"), contact_name: val("c_contact"),
      phone: val("c_phone"), city: val("c_city"), email: val("c_email"),
    })});
    closeModal(); pageCustomers();
  });
}

// ============ ORDERS ============
const STATUS_LABELS = { pending: "Kutilmoqda", processing: "Ishlanmoqda", shipped: "Jo'natildi", delivered: "Yetkazildi", cancelled: "Bekor qilindi" };

async function pageOrders() {
  const m = document.getElementById("main");
  m.innerHTML = pageHead("Buyurtmalar", "ERP · Buyurtmalarni qayta ishlash",
    `<button class="btn-accent" id="addOrder">+ Buyurtma yaratish</button>`);
  document.getElementById("addOrder").onclick = () => orderModal();
  try {
    const [orders, customers] = await Promise.all([api("/orders"), api("/customers")]);
    const custName = id => (customers.find(c => c.id === id) || {}).company_name || "—";
    m.innerHTML += `<div class="panel"><table>
      <thead><tr><th>№</th><th>Mijoz</th><th>Mahsulotlar</th><th>Summa</th><th>Holat</th></tr></thead>
      <tbody>${orders.map(o => `<tr>
        <td class="mono">#${o.id}</td>
        <td>${custName(o.customer_id)}</td>
        <td class="mono" style="color:var(--muted)">${o.items.length} ta</td>
        <td class="mono">${money(o.total_amount)}</td>
        <td><select class="status-sel" data-order="${o.id}">
          ${Object.keys(STATUS_LABELS).map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${STATUS_LABELS[s]}</option>`).join("")}
        </select></td>
      </tr>`).join("")}</tbody></table></div>`;
    m.querySelectorAll("[data-order]").forEach(sel => sel.onchange = async () => {
      await api(`/orders/${sel.dataset.order}/status`, { method: "PATCH", body: JSON.stringify({ status: sel.value }) });
    });
  } catch (e) { m.innerHTML += `<div class="empty">${e.message}</div>`; }
}

async function orderModal() {
  const [customers, products] = await Promise.all([api("/customers"), api("/products")]);
  if (!customers.length) { alert("Avval mijoz qo'shing"); return; }
  let rows = [{ pid: products[0]?.id, qty: 10 }];

  const bodyHtml = () => `<h3 class="serif">Yangi buyurtma</h3>
    <div class="field"><label>Mijoz</label><select id="o_cust">${customers.map(c => `<option value="${c.id}">${c.company_name}</option>`).join("")}</select></div>
    <label style="font-size:13px;color:var(--muted);display:block;margin-bottom:8px">Mahsulotlar</label>
    <div id="oi_rows">${rows.map((r, i) => `
      <div class="oi-row">
        <select data-pid="${i}">${products.map(p => `<option value="${p.id}" ${r.pid == p.id ? "selected" : ""}>${p.name} (${fmt(p.stock)} dona)</option>`).join("")}</select>
        <input type="number" data-qty="${i}" value="${r.qty}" min="1"/>
        <button class="btn-mini" data-rm="${i}">✕</button>
      </div>`).join("")}</div>
    <button class="btn-soft" id="addRow" style="margin-top:6px">+ Qator qo'shish</button>`;

  const save = async () => {
    const items = rows.map(r => ({ product_id: +r.pid, quantity: +r.qty }));
    await api("/orders", { method: "POST", body: JSON.stringify({ customer_id: +val("o_cust"), items }) });
    closeModal(); pageOrders();
  };

  const bindRows = () => {
    document.querySelectorAll("[data-pid]").forEach(s => s.onchange = () => rows[s.dataset.pid].pid = s.value);
    document.querySelectorAll("[data-qty]").forEach(s => s.onchange = () => rows[s.dataset.qty].qty = s.value);
    document.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
      if (rows.length > 1) { rows.splice(+b.dataset.rm, 1); rerender(); }
    });
    document.getElementById("addRow").onclick = () => { rows.push({ pid: products[0]?.id, qty: 10 }); rerender(); };
  };
  // Modal qobig'ini saqlab, faqat ichki kontentni yangilaydi
  const rerender = () => {
    const cust = document.getElementById("o_cust")?.value;
    const modalInner = document.querySelector(".modal");
    const actions = modalInner.querySelector(".modal-actions");
    [...modalInner.children].forEach(ch => { if (!ch.classList.contains("modal-actions")) ch.remove(); });
    actions.insertAdjacentHTML("beforebegin", bodyHtml());
    if (cust) document.getElementById("o_cust").value = cust;
    bindRows();
  };

  showModal(bodyHtml(), save);
  bindRows();
}

// ============ LOAD TEST (auto-scaling / load balancing namoyishi) ============
async function pageLoadTest() {
  const m = document.getElementById("main");
  m.innerHTML = pageHead("Yuklama testi", "Infratuzilma · Load Balancing & Auto-scaling",
    `<span class="node-badge"><span class="pulse"></span> Live</span>`);
  m.innerHTML += `
  <div class="panel"><div style="padding:22px">
    <p style="color:var(--muted);line-height:1.6;margin-bottom:18px">
      Quyidagi test ketma-ket so'rovlarni yuboradi. Nginx load balancer ularni ishlab turgan
      backend nodelar (konteynerlar) orasida taqsimlaydi. Har bir so'rovga qaysi <b>node</b>
      javob berganini real vaqtda kuzating — bu auto-scaling muhitida yuk muvozanatini ko'rsatadi.
    </p>
    <div class="lt-grid">
      <div class="lt-controls">
        <div class="field"><label>So'rovlar soni</label><input id="lt_count" type="number" value="40" min="1" max="200" style="width:100%;padding:11px 13px;border-radius:10px;background:var(--panel-2);border:1px solid var(--border);color:var(--text)"/></div>
        <button class="btn-accent" id="lt_run">Testni boshlash ▶</button>
        <div class="node-tally" id="lt_tally"></div>
      </div>
      <div>
        <div class="lt-log" id="lt_log"><div style="color:var(--muted)">Natijalar shu yerda ko'rinadi...</div></div>
      </div>
    </div>
  </div></div>`;

  document.getElementById("lt_run").onclick = async () => {
    const count = Math.min(+document.getElementById("lt_count").value || 20, 200);
    const log = document.getElementById("lt_log");
    const tallyEl = document.getElementById("lt_tally");
    const btn = document.getElementById("lt_run");
    log.innerHTML = ""; const tally = {};
    btn.disabled = true; btn.textContent = "Bajarilmoqda...";
    for (let i = 1; i <= count; i++) {
      try {
        const r = await api(`/load-test/300000`);
        tally[r.served_by] = (tally[r.served_by] || 0) + 1;
        const line = document.createElement("div");
        line.className = "line";
        line.innerHTML = `<span style="color:var(--muted)">#${String(i).padStart(3, "0")}</span> javob berdi → <span class="node-tag">${r.served_by}</span> <span style="color:var(--muted)">(${r.hostname.slice(0, 12)})</span>`;
        log.appendChild(line); log.scrollTop = log.scrollHeight;
      } catch (e) {
        const line = document.createElement("div"); line.className = "line";
        line.innerHTML = `<span style="color:var(--red)">#${i} xato: ${e.message}</span>`;
        log.appendChild(line);
      }
      // tally ko'rsatkichini yangilash
      const total = Object.values(tally).reduce((a, b) => a + b, 0);
      tallyEl.innerHTML = Object.entries(tally).sort().map(([node, n]) => `
        <div class="node-pill"><div class="n">${n}</div><div class="l">${node}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(n / total * 100).toFixed(0)}%"></div></div></div>`).join("");
    }
    btn.disabled = false; btn.textContent = "Testni boshlash ▶";
  };
}

// ============ MODAL HELPERS ============
function showModal(inner, onSave) {
  const bg = document.createElement("div");
  bg.className = "modal-bg"; bg.id = "modalBg";
  bg.innerHTML = `<div class="modal">${inner}
    <div class="modal-actions">
      <button class="btn-soft" id="m_cancel">Bekor qilish</button>
      <button class="btn-accent" id="m_save">Saqlash</button>
    </div></div>`;
  document.body.appendChild(bg);
  bg.onclick = (e) => { if (e.target === bg) closeModal(); };
  bindModalActions(onSave);
}
function bindModalActions(onSave) {
  document.getElementById("m_cancel").onclick = closeModal;
  document.getElementById("m_save").onclick = async () => {
    const btn = document.getElementById("m_save");
    btn.textContent = "Saqlanmoqda..."; btn.disabled = true;
    try { await onSave(); }
    catch (e) { alert(e.message); btn.textContent = "Saqlash"; btn.disabled = false; }
  };
}
function closeModal() { const b = document.getElementById("modalBg"); if (b) b.remove(); }
function val(id) { return document.getElementById(id).value.trim(); }

// ============ BOOT ============
if (state.token && state.user) renderApp();
else renderLogin();
