/*
 * Logique métier du panier — fonctions pures (testées avec `node --test`).
 * Utilisable dans le navigateur (window.Cart) et dans Node (module.exports).
 */
(function (global) {
  "use strict";

  const FREE_SHIPPING_THRESHOLD = 300; // DT
  const SHIPPING_COST = 7; // DT
  const MAX_QTY = 10;

  function clampQty(qty) {
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n < 1) return 0;
    return Math.min(n, MAX_QTY);
  }

  function addItem(cart, product, qty = 1) {
    const add = clampQty(qty);
    if (!product || !product.id || add === 0) return cart.slice();
    const existing = cart.find((line) => line.id === product.id);
    if (existing) {
      return cart.map((line) =>
        line.id === product.id ? { ...line, qty: Math.min(line.qty + add, MAX_QTY) } : line
      );
    }
    return [...cart, { id: product.id, name: product.name, price: product.price, qty: add }];
  }

  function updateQty(cart, id, qty) {
    const q = clampQty(qty);
    if (q === 0) return removeItem(cart, id);
    return cart.map((line) => (line.id === id ? { ...line, qty: q } : line));
  }

  function removeItem(cart, id) {
    return cart.filter((line) => line.id !== id);
  }

  function itemCount(cart) {
    return cart.reduce((sum, line) => sum + line.qty, 0);
  }

  function subtotal(cart) {
    // calcul en millimes pour éviter les erreurs d'arrondi flottant
    const millimes = cart.reduce((sum, line) => sum + Math.round(line.price * 1000) * line.qty, 0);
    return millimes / 1000;
  }

  function shipping(cart) {
    const sub = subtotal(cart);
    if (sub === 0 || sub >= FREE_SHIPPING_THRESHOLD) return 0;
    return SHIPPING_COST;
  }

  function total(cart) {
    return (Math.round(subtotal(cart) * 1000) + shipping(cart) * 1000) / 1000;
  }

  function formatPrice(amount) {
    return amount.toFixed(3).replace(".", ",") + " DT";
  }

  function filterProducts(products, { category = "all", shape = "all", maxPrice = Infinity } = {}) {
    return products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (shape === "all" || p.shape === shape) &&
        p.price <= maxPrice
    );
  }

  const api = {
    FREE_SHIPPING_THRESHOLD,
    SHIPPING_COST,
    MAX_QTY,
    addItem,
    updateQty,
    removeItem,
    itemCount,
    subtotal,
    shipping,
    total,
    formatPrice,
    filterProducts,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.Cart = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
