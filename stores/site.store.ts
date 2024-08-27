import { defineStore } from 'pinia';
import { useLocalStorage } from "#imports";

export const useSiteStore = defineStore({
    id: 'site',
    state: () => ({
        name: import.meta.env.VITE_APP_NAME,
        connected: true,
        loading: false,
        blurred: false,
        itemPerPage: 10,
        cdnUrl: import.meta.env.VITE_CDN_URL,
        sidebarExpanded: false,
    }),
    getters: {
        isLoading: (state) => state.loading,
        isConnected: (state) => state.connected,
        isSidebarExpanded: (state) => state.sidebarExpanded,
    },
    actions: {
        updateDocTitle(title: string) {
            const docTitle = [title, this.name];
            const sep = title ? ' | ' : '';
            document.title = docTitle.join(sep);
        },
        setItemPerPage(perPage: number) {
            useLocalStorage('itemPerPage', perPage);
            this.itemPerPage = perPage;
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
        initSidebarExpanded() {
            const storedExpanded = useLocalStorage('sidebar-expanded', false);
            this.setSidebarExpanded(storedExpanded.value);
        },
        toggleSidebarExpanded() {
            if(this.sidebarExpanded) {
                this.setSidebarExpanded(false);
            } else {
                this.setSidebarExpanded(true);
            }
        },
        setSidebarExpanded(value: boolean) {
            this.sidebarExpanded = value || false;
            useLocalStorage('sidebar-expanded', this.sidebarExpanded);

            const bodyElement = document.querySelector('body');
            if (bodyElement) {
                if (value) {
                    bodyElement.classList.add('sidebar-expanded');
                } else {
                    bodyElement.classList.remove('sidebar-expanded');
                }
            }
        },
    },
});
