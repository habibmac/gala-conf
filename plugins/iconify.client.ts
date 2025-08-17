import heroIcons from '@iconify-json/heroicons/icons.json';
import lucideIcons from '@iconify-json/lucide/icons.json';
// Import icon sets
import radixIcons from '@iconify-json/radix-icons/icons.json';
import solarIcons from '@iconify-json/solar/icons.json';
import tablerIcons from '@iconify-json/tabler/icons.json';
import { addCollection } from '@iconify/vue';

export default defineNuxtPlugin(() => {
  // Add icon collections for offline use
  addCollection(radixIcons);
  addCollection(lucideIcons);
  addCollection(heroIcons);
  addCollection(tablerIcons);
  addCollection(solarIcons as any);
});
