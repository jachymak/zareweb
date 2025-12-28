<script setup>
</script>

<template>
  <div class="m-4 grid gap-4 sm:grid-cols-12">
    <div
      class="min-h-[100px] rounded-lg bg-orange-500 shadow sm:col-span-2"
    >
    </div>

    <div
      class="min-h-[100px] rounded-lg bg-teal-500 shadow sm:col-span-8"
    >
      <div class="p-4">
        <p>
          <h1>ADMIN</h1>
        </p>
        <div class="mt-6 flex max-w-md gap-x-4">
          <label for="email-address" class="sr-only">Email address</label>
          <input id="email-address" type="email" name="email" required placeholder="Enter your email" autocomplete="email" class="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
          <button type="submit" class="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Subscribe</button>
        </div>
      </div>

    </div>

    <div class="min-h-[100px] rounded-lg bg-red-500 shadow sm:col-span-2">

    </div>
  </div>
</template>

<style scoped></style>
