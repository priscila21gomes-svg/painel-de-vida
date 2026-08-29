// Polyfill for the window.storage API the app expects, backed by localStorage
// so the app works as a normal static site (no external backend required).
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { value };
    },
  };
}
