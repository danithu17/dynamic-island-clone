// Shelf Storage Service for Aura Island
// Manages saved files, links, and text items. Persisted in localStorage and synchronized.

const STORAGE_KEY = "aura_shelf_items";

class ShelfStorage {
  constructor() {
    this.listeners = new Set();
    this.items = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Failed to load shelf items from localStorage:", err);
    }
    return [];
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch (err) {
      console.warn("Failed to persist shelf items:", err);
    }
    this.notify();
  }

  getItems() {
    return [...this.items];
  }

  addItem(item) {
    if (!item) return null;

    const id = item.id || `shelf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newItem = {
      id,
      name: item.name || "Untitled Item",
      path: item.path || "",
      size: item.size || 0,
      type: item.type || "file",
      isUrl: Boolean(item.isUrl),
      addedAt: item.addedAt || Date.now(),
      target: item.target || "shelf", // "shelf" | "mail" | "phone"
    };

    // Prevent direct duplicates by path
    if (newItem.path) {
      this.items = this.items.filter((existing) => existing.path !== newItem.path);
    }

    this.items.unshift(newItem);
    this.save();
    return newItem;
  }

  removeItem(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.save();
  }

  clearShelf() {
    this.items = [];
    this.save();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getItems());
    return () => this.listeners.delete(callback);
  }

  notify() {
    const current = this.getItems();
    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        console.error("Error notifying shelf listener:", err);
      }
    }
  }
}

export const shelfStorage = new ShelfStorage();
