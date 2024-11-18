<template>
  <Card
    class="bg-gradient-to-r from-rose-500 to-indigo-400 text-white"
  >
    <CardContent class="flex p-6 gap-4">
      <div class="text-4xl">🎉</div>
      <div class="">
        <h3 class="font-bold text-2xl">Congratulations!</h3>
        <p class="description"><slot>You have successfully completed the event.</slot></p>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 10px 40px -12px rgba(16, 24, 40, 0.1);
}
</style>
