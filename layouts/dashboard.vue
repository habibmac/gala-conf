<template>
  <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
    <NavBar />
    <main class="grow">
      <slot />
    </main>
  </div>
</template>
