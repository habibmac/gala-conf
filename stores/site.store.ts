import { defineStore } from 'pinia';

export const useSiteStore = defineStore({
  id: 'site',
  state: () => ({
    name: import.meta.env.VITE_APP_NAME,
    connected: true,
    loading: false,
    blurred: false,
    cdnUrl: import.meta.env.VITE_CDN_URL,
  }),
  getters: {
    isLoading: (state) => state.loading,
    isConnected: (state) => state.connected,
  },
  actions: {
    updateDocTitle(title: string) {
      const docTitle = [title, this.name];
      const sep = title ? ' | ' : '';
      document.title = docTitle.join(sep);
    },
    setLoading() {
      this.loading = true;
    },
    unsetLoading() {
      this.loading = false;
    },
    setBlur() {
      this.blurred = true;
    },
    unsetBlur() {
      this.blurred = false;
    },
  },
});