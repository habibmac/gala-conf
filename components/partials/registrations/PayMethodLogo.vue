<script setup lang="ts">
defineProps<{
  payMethod: string;
}>();
</script>
<template>
  <svg
    v-if="payMethod === 'Credit Card'"
    class="shrink-0"
    width="32"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient x1="1.829%" y1="100%" x2="100%" y2="2.925%" id="c1-a">
        <stop stop-color="#475569" offset="0%"></stop>
        <stop stop-color="#1E293B" offset="100%"></stop>
        <stop stop-color="#9FA1FF" offset="100%"></stop>
      </linearGradient>
    </defs>
    <g fill="none" fill-rule="evenodd">
      <rect fill="url(#c1-a)" width="32" height="24" rx="3"></rect>
      <ellipse
        fill="#E61C24"
        fill-rule="nonzero"
        cx="12.522"
        cy="12"
        rx="5.565"
        ry="5.647"
      ></ellipse>
      <ellipse
        fill="#F99F1B"
        fill-rule="nonzero"
        cx="19.432"
        cy="12"
        rx="5.565"
        ry="5.647"
      ></ellipse>
      <path
        d="M15.977 7.578A5.667 5.667 0 0 0 13.867 12c0 1.724.777 3.353 2.11 4.422A5.667 5.667 0 0 0 18.087 12a5.667 5.667 0 0 0-2.11-4.422Z"
        fill="#F26622"
        fill-rule="nonzero"
      ></path>
    </g>
  </svg>
  <svg
    v-else-if="payMethod === 'QRIS'"
    class="shrink-0 fill-slate-700 dark:fill-slate-300"
    width="52"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 300 110.71"
  >
    <g id="Layer_1-2" data-name="Layer 1">
      <path
        d="M287.71 67.86V39.29H240.09v-9.53h47.62V10.71h-76.19v47.62H259.14v9.53h-47.62v19.05h76.19V67.86zM182.95 10.71H202V86.9h-19.05zM97.24 10.71v19.05h57.14v9.53H97.24v47.62h19.04V58.62l28.58 28.29h28.57l-29.81-28.58H173.43V10.71H97.24zM40.09 58.33h19v-19h-19Zm4.77-14.28h9.52v9.52h-9.52Z"
        class="cls-1"
      />
      <path
        d="M30.57 10.71H13.9a2.41 2.41 0 0 0-1.68.7 2.38 2.38 0 0 0-.7 1.69v71.42a2.38 2.38 0 0 0 .7 1.69 2.4 2.4 0 0 0 1.68.69h45.24v-19H30.57ZM85.33 10.71H40.09v19.05h28.58v28.57h19V13.1a2.41 2.41 0 0 0-.67-1.69 2.44 2.44 0 0 0-1.67-.7ZM68.67 67.86h19.05v42.86H68.67z"
        class="cls-1"
      />
      <path
        d="M38.1 0H2.38A2.39 2.39 0 0 0 0 2.38V38.1h4.76v-31a2.39 2.39 0 0 1 2.38-2.34h31ZM295.24 61.9v31a2.39 2.39 0 0 1-2.38 2.38h-31V100h35.72a2.39 2.39 0 0 0 2.42-2.38V61.9Z"
        class="cls-1"
      />
    </g>
  </svg>
</template>
