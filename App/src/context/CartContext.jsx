'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setItems(JSON.parse(window.localStorage.getItem('hm_cart')) || []);
    } catch (error) {
      console.error('Impossible de charger le panier local.', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem('hm_cart', JSON.stringify(items));
  }, [items, loaded]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) }
            : i
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        final_price: product.final_price ?? product.price,
        discount_percent: product.discount_percent ?? 0,
        image_emoji: product.image_emoji,
        unit: product.unit,
        stock: product.stock,
        supermarket_name: product.supermarket_name,
        quantity: Math.min(qty, product.stock),
      }];
    });
  };

  const setQty = (id, quantity) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id
        ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
        : i))
    );

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const afterDiscount = items.reduce((s, i) => s + i.final_price * i.quantity, 0);
    const discount = subtotal - afterDiscount;
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { subtotal, discount, afterDiscount, count };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, totals }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
