<script setup>
// Google sign-in button (the same action logs in and creates an account).
defineProps({
  label: { type: String, default: 'Přihlásit se Googlem' },
  disabled: { type: Boolean, default: false },
})
defineEmits(['click'])
</script>

<template>
  <button type="button" class="btn-outline w-full" :disabled="disabled" @click="$emit('click')">
    <svg viewBox="0 0 48 48" class="block size-[21px] flex-none" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v9.2h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.7 6c4.6-4.3 6.5-10.4 6.5-18.4z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.6a14.7 14.7 0 0 1 0-9.2l-7.9-6.2a24 24 0 0 0 0 21.6l7.9-6.2z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.5-2 15.6-5.6l-7.7-6c-2.1 1.4-4.9 2.4-7.9 2.4-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
    {{ label }}
  </button>
</template>
