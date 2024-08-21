<!-- layouts/secure.vue -->
<template>
  <div
    class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-200 dark:bg-slate-900"
  >
    <NavBar />
    <main>
      <slot />
    </main>
  </div>
</template>
