/* Interface de la boutique : catalogue, filtres, panier (localStorage). */
(function () {
  "use strict";

  const PRODUCTS = [
    { id: "iris-01", name: "Sidi Bou", category: "vue", shape: "ronde", material: "Acétate écaille", price: 189, color: "#8b5a2b", isNew: true },
    { id: "iris-02", name: "Carthage", category: "vue", shape: "carree", material: "Acétate noir mat", price: 215, color: "#1f2937" },
    { id: "iris-03", name: "Kerkennah", category: "soleil", shape: "aviateur", material: "Métal doré", price: 265, color: "#b8860b", lens: "#3f6e5a" },
    { id: "iris-04", name: "Djerba", category: "soleil", shape: "papillon", material: "Acétate bordeaux", price: 239, color: "#7f1d3a", lens: "#4b2e2e", isNew: true },
    { id: "iris-05", name: "Medina", category: "vue", shape: "papillon", material: "Acétate cristal rose", price: 175, color: "#d9a3b5" },
    { id: "iris-06", name: "Tabarka", category: "soleil", shape: "ronde", material: "Métal argent", price: 199, color: "#9ca3af", lens: "#1e3a5f" },
    { id: "iris-07", name: "Monastir", category: "vue", shape: "aviateur", material: "Titane gris", price: 349, color: "#4b5563" },
    { id: "iris-08", name: "Hammamet", category: "soleil", shape: "carree", material: "Acétate havane", price: 289, color: "#6b3e1f", lens: "#2d2d2d" },
    { id: "iris-09", name: "Kairouan", category: "vue", shape: "carree", material: "Acétate bleu nuit", price: 159, color: "#1e3a8a" },
  ];

  const STORAGE_KEY = "iris-cart";
  const $ = (sel) => document.querySelector(sel);

  let cart = loadCart();

  // ---------------------------------------------------------------- SVG
  const SVG_NS = "http://www.w3.org/2000/svg";
  const LENS_PATHS = {
    ronde: (cx) => `M${cx - 22},40 a22,22 0 1,0 44,0 a22,22 0 1,0 -44,0`,
    carree: (cx) => `M${cx - 24},22 h48 q4,0 4,4 v24 q0,10 -10,10 h-36 q-10,0 -10,-10 v-24 q0,-4 4,-4z`,
    aviateur: (cx) => `M${cx - 24},24 q24,-6 48,0 q2,20 -10,32 q-14,10 -28,0 q-12,-12 -10,-32z`,
    papillon: (cx) => `M${cx - 26},28 q26,-14 52,-6 q0,26 -18,34 q-22,6 -30,-8 q-4,-10 -4,-20z`,
  };

  function glassesSvg(p, size = 180) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 180 80");
    svg.setAttribute("width", size);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Monture ${p.name}`);

    const lensFill = p.lens || "rgba(186,230,253,0.35)";
    [52, 128].forEach((cx, i) => {
      const d = LENS_PATHS[p.shape](cx);
      const lens = document.createElementNS(SVG_NS, "path");
      // verre droit en miroir pour les formes asymétriques
      if (i === 1 && p.shape === "papillon") lens.setAttribute("transform", "translate(256,0) scale(-1,1)");
      lens.setAttribute("d", d);
      lens.setAttribute("fill", lensFill);
      lens.setAttribute("stroke", p.color);
      lens.setAttribute("stroke-width", p.shape === "aviateur" || p.material.startsWith("Métal") || p.material.startsWith("Titane") ? 3 : 6);
      svg.appendChild(lens);
    });

    const bridge = document.createElementNS(SVG_NS, "path");
    bridge.setAttribute("d", "M76,34 q14,-10 28,0");
    bridge.setAttribute("fill", "none");
    bridge.setAttribute("stroke", p.color);
    bridge.setAttribute("stroke-width", 4);
    svg.appendChild(bridge);

    ["M28,30 L6,24", "M152,30 L174,24"].forEach((d) => {
      const temple = document.createElementNS(SVG_NS, "path");
      temple.setAttribute("d", d);
      temple.setAttribute("stroke", p.color);
      temple.setAttribute("stroke-width", 4);
      temple.setAttribute("stroke-linecap", "round");
      svg.appendChild(temple);
    });
    return svg;
  }

  // ---------------------------------------------------------------- Catalogue
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function productCard(p) {
    const card = el("article", "card");
    const visual = el("div", `visual ${p.category}`);
    visual.appendChild(glassesSvg(p));
    if (p.isNew) visual.appendChild(el("span", "tag", "Nouveau"));
    card.appendChild(visual);

    const body = el("div", "card-body");
    body.appendChild(el("p", "meta", `${p.category === "vue" ? "Lunettes de vue" : "Lunettes de soleil"} · ${p.material}`));
    body.appendChild(el("h3", null, p.name));
    const foot = el("div", "card-foot");
    foot.appendChild(el("span", "price", Cart.formatPrice(p.price)));
    const btn = el("button", "btn btn-small", "Ajouter");
    btn.type = "button";
    btn.addEventListener("click", () => {
      cart = Cart.addItem(cart, p);
      saveCart();
      renderCart();
      toast(`${p.name} ajoutée au panier`);
    });
    foot.appendChild(btn);
    body.appendChild(foot);
    card.appendChild(body);
    return card;
  }

  function currentFilters() {
    const form = $("#filters");
    return {
      category: form.category.value,
      shape: form.shape.value,
      maxPrice: Number(form.maxPrice.value),
    };
  }

  function renderCatalogue() {
    const filters = currentFilters();
    $("#price-out").textContent = `${filters.maxPrice} DT`;
    const list = Cart.filterProducts(PRODUCTS, filters);
    const grid = $("#product-grid");
    grid.replaceChildren(...list.map(productCard));
    if (list.length === 0) grid.appendChild(el("p", "empty", "Aucune monture ne correspond à vos critères."));
    $("#result-count").textContent = `${list.length} monture${list.length > 1 ? "s" : ""}`;
  }

  // ---------------------------------------------------------------- Panier
  function loadCart() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function cartLine(line) {
    const li = el("li", "line");
    const info = el("div");
    info.appendChild(el("strong", null, line.name));
    info.appendChild(el("span", "muted", Cart.formatPrice(line.price)));
    li.appendChild(info);

    const qty = el("div", "qty");
    const minus = el("button", "icon-btn", "−");
    minus.setAttribute("aria-label", `Retirer un ${line.name}`);
    minus.addEventListener("click", () => changeQty(line.id, line.qty - 1));
    const plus = el("button", "icon-btn", "+");
    plus.setAttribute("aria-label", `Ajouter un ${line.name}`);
    plus.disabled = line.qty >= Cart.MAX_QTY;
    plus.addEventListener("click", () => changeQty(line.id, line.qty + 1));
    qty.append(minus, el("span", null, String(line.qty)), plus);
    li.appendChild(qty);
    return li;
  }

  function changeQty(id, qty) {
    cart = Cart.updateQty(cart, id, qty);
    saveCart();
    renderCart();
  }

  function renderCart() {
    $("#cart-count").textContent = Cart.itemCount(cart);
    $("#cart-lines").replaceChildren(...cart.map(cartLine));
    const empty = cart.length === 0;
    $("#cart-empty").hidden = !empty;
    $("#cart-summary").hidden = empty;
    if (empty) return;

    const sub = Cart.subtotal(cart);
    const ship = Cart.shipping(cart);
    $("#cart-subtotal").textContent = Cart.formatPrice(sub);
    $("#cart-shipping").textContent = ship === 0 ? "Offerte" : Cart.formatPrice(ship);
    $("#cart-total").textContent = Cart.formatPrice(Cart.total(cart));
    $("#shipping-hint").textContent =
      ship === 0
        ? "🎉 Livraison offerte !"
        : `Plus que ${Cart.formatPrice(Cart.FREE_SHIPPING_THRESHOLD - sub)} pour la livraison offerte`;
  }

  function toggleDrawer(open) {
    $("#drawer").classList.toggle("open", open);
    $("#drawer").setAttribute("aria-hidden", String(!open));
    $("#overlay").hidden = !open;
  }

  let toastTimer;
  function toast(message) {
    const t = $("#toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------------------------------------------------------------- Init
  document.addEventListener("DOMContentLoaded", () => {
    $("#hero-visual").appendChild(glassesSvg(PRODUCTS[2], 420));
    $("#filters").addEventListener("input", renderCatalogue);
    $("#cart-open").addEventListener("click", () => toggleDrawer(true));
    $("#cart-close").addEventListener("click", () => toggleDrawer(false));
    $("#overlay").addEventListener("click", () => toggleDrawer(false));
    document.addEventListener("keydown", (e) => e.key === "Escape" && toggleDrawer(false));

    $("#checkout").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = e.target.name.value.trim();
      cart = [];
      saveCart();
      renderCart();
      e.target.reset();
      toggleDrawer(false);
      toast(`Merci ${name} ! Commande réservée, nous vous appelons pour le retrait.`);
    });

    renderCatalogue();
    renderCart();
  });
})();
