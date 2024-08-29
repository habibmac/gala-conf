import VueQrcode from '@chenfengyuan/vue-qrcode';
import VueBarcode from '@chenfengyuan/vue-barcode';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('qr-code', VueQrcode);
    nuxtApp.vueApp.component('bar-code', VueBarcode);
});
