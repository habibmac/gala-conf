import { VueQrcodeReader } from 'vue-qrcode-reader';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('bar-code', VueQrcodeReader);
});
