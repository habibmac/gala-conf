<template>
  <div class="m-auto mt-16 max-w-2xl">
    <div class="px-4 text-center">
      <div
        class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800"
      >
        <svg class="h-6 w-5 fill-current" viewBox="0 0 20 24">
          <path
            class="text-slate-500 dark:text-slate-600"
            d="M10 10.562l9-5-8.514-4.73a1 1 0 00-.972 0L1 5.562l9 5z"
          ></path>
          <path
            class="text-slate-300 dark:text-slate-400"
            d="M9 12.294l-9-5v10.412a1 1 0 00.514.874L9 23.294v-11z"
          ></path>
          <path
            class="text-slate-400 dark:text-slate-500"
            d="M11 12.294v11l8.486-4.714a1 1 0 00.514-.874V7.295l-9 4.999z"
          ></path>
        </svg>
      </div>
      <h2 class="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-100">Insights</h2>
      <div class="mb-6">Create some insights to help you understand your data better.</div>
      <button class="btn bg-indigo-500 text-white hover:bg-indigo-600">
        <svg class="h-4 w-4 shrink-0 fill-current opacity-50" viewBox="0 0 16 16">
          <path
            d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z"
          ></path>
        </svg>
        <span class="ml-2">Create your first insight</span>
      </button>
    </div>
  </div>
</template>
