'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('bib_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('bib_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1, size = null, color = null) => {
    setItems(prev => {
      const key = `${product.id}-${size}-${color}`;
      const existing = prev.find(i => `${i.id}-${i.size}-${i.color}` === key);
      if (existing) {
        return prev.map(i =>
          `${i.id}-${i.size}-${i.color}` === key
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...product, quantity, size, color, cartKey: key }];
    });
  };

  const removeItem = (cartKey) => {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) return removeItem(cartKey);
    setItems(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + (i.sale_price || i.price) * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
