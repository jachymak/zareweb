<script setup>
// How a new account gets access (SPEC §2.4, §4.8).
const steps = [
  'Založíš si účet a napíšeš, koho u nás máš.',
  'Správce ověří, že k nám patříš (třeba podle e-mailu rodiče ve skautISu), a propojí účet s tvými dětmi.',
  'Přijde ti e-mail — pak uvidíš docházku, akce i fotky.',
]
</script>

<template>
  <div class="rounded-lg bg-[#f6efdc] px-4 py-3.5">
    <p class="m-0 mb-2 text-[12.5px] tracking-widest text-[#8a7b5e] uppercase">Jak to funguje</p>
    <ol class="m-0 flex list-none flex-col gap-2 p-0">
      <li v-for="(step, i) in steps" :key="i" class="flex items-baseline gap-2.5">
        <span class="flex-none font-hand text-[20px] leading-none font-bold text-red">
          {{ i + 1 }}.
        </span>
        <span class="text-[15px] leading-normal text-text">{{ step }}</span>
      </li>
    </ol>
  </div>
</template>
