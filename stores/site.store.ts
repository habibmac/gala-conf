import { defineStore } from 'pinia';

export const useSiteStore = defineStore({
  actions: {
    setBlur() {
      this.blurred = true;
    },
    setLoading() {
      this.loading = true;
    },
    unsetBlur() {
      this.blurred = false;
    },
    unsetLoading() {
      this.loading = false;
    },
    updateDocTitle(title: string) {
      const docTitle = [title, this.name];
      const sep = title ? ' | ' : '';
      document.title = docTitle.join(sep);
    },
  },
  getters: {
    isConnected: state => state.connected,
    isLoading: state => state.loading,
  },
  id: 'site',
  state: () => ({
    blurred: false,
    cdnUrl: import.meta.env.VITE_CDN_URL,
    connected: true,
    loading: false,
    name: import.meta.env.VITE_APP_NAME,
  }),
});
