<script setup>
import { TROOPS } from '@/constants/troops'
</script>

<template>
  <ul class="m-0 list-none border-y-[1.5px] border-ink p-0">
    <li
      v-for="troop in TROOPS"
      :key="troop.code"
      class="grid grid-cols-1 gap-1 border-line-soft py-4 text-left not-first:border-t sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-5"
    >
      <div class="min-w-0">
        <span class="text-base text-muted-2">{{ troop.number }}</span>
        <div class="text-[22px] leading-tight font-semibold text-ink">{{ troop.name }}</div>
      </div>
      <div class="sm:text-right">
        <div class="text-base text-muted-2">{{ troop.ages }}</div>
        <div class="text-[17px] leading-normal">{{ troop.meetings }}</div>
      </div>
    </li>
  </ul>
</template>
