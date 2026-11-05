// Tests unitaires du panier : node --test site/tests
const test = require("node:test");
const assert = require("node:assert/strict");
const Cart = require("../js/cart.js");

const RONDE = { id: "p1", name: "Ronde Écaille", price: 189, category: "vue", shape: "ronde" };
const AVIATEUR = { id: "p2", name: "Aviateur Or", price: 245.5, category: "soleil", shape: "aviateur" };

test("ajouter un produit crée une ligne", () => {
  const cart = Cart.addItem([], RONDE);
  assert.deepEqual(cart, [{ id: "p1", name: "Ronde Écaille", price: 189, qty: 1 }]);
});

test("ajouter deux fois le même produit incrémente la quantité", () => {
  const cart = Cart.addItem(Cart.addItem([], RONDE), RONDE, 2);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].qty, 3);
});

test("le panier d'origine n'est pas modifié (immutabilité)", () => {
  const original = Cart.addItem([], RONDE);
  Cart.addItem(original, RONDE);
  assert.equal(original[0].qty, 1);
});

test("la quantité est plafonnée à MAX_QTY", () => {
  const cart = Cart.addItem([], RONDE, 50);
  assert.equal(cart[0].qty, Cart.MAX_QTY);
});

test("quantité invalide ou produit absent : panier inchangé", () => {
  assert.deepEqual(Cart.addItem([], RONDE, 0), []);
  assert.deepEqual(Cart.addItem([], RONDE, "abc"), []);
  assert.deepEqual(Cart.addItem([], null), []);
});

test("updateQty à 0 supprime la ligne", () => {
  const cart = Cart.updateQty(Cart.addItem([], RONDE), "p1", 0);
  assert.deepEqual(cart, []);
});

test("removeItem supprime uniquement le produit ciblé", () => {
  const cart = Cart.removeItem(Cart.addItem(Cart.addItem([], RONDE), AVIATEUR), "p1");
  assert.deepEqual(cart.map((l) => l.id), ["p2"]);
});

test("itemCount et subtotal", () => {
  const cart = Cart.addItem(Cart.addItem([], RONDE, 2), AVIATEUR);
  assert.equal(Cart.itemCount(cart), 3);
  assert.equal(Cart.subtotal(cart), 623.5);
});

test("livraison payante sous le seuil, gratuite au-dessus", () => {
  const petit = Cart.addItem([], RONDE);
  assert.equal(Cart.shipping(petit), Cart.SHIPPING_COST);
  assert.equal(Cart.total(petit), 196);

  const gros = Cart.addItem([], RONDE, 2);
  assert.equal(Cart.shipping(gros), 0);
  assert.equal(Cart.total(gros), 378);
});

test("panier vide : pas de frais de livraison", () => {
  assert.equal(Cart.shipping([]), 0);
  assert.equal(Cart.total([]), 0);
});

test("formatPrice en dinars tunisiens", () => {
  assert.equal(Cart.formatPrice(245.5), "245,500 DT");
});

test("filterProducts par catégorie, forme et prix", () => {
  const products = [RONDE, AVIATEUR];
  assert.deepEqual(Cart.filterProducts(products, { category: "soleil" }), [AVIATEUR]);
  assert.deepEqual(Cart.filterProducts(products, { shape: "ronde" }), [RONDE]);
  assert.deepEqual(Cart.filterProducts(products, { maxPrice: 200 }), [RONDE]);
  assert.equal(Cart.filterProducts(products).length, 2);
});
