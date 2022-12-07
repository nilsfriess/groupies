<script setup>
import { useErrorStore } from '../stores/error'

const error = useErrorStore()
</script>

<template>
  <dialog :open="error.visible">
    <article>
      <header>
        <a @click="error.hide()" aria-label="Close" class="close"></a>
        Fehler
      </header>
      <p v-html="error.messageWithCode"></p>
    </article>
  </dialog>
</template>
