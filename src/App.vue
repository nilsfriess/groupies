<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import ErrorModal from './components/ErrorModal.vue'

import { useCurrentUser } from 'vuefire'

const user = useCurrentUser()
</script>

<template>
  <article aria-busy="true" v-if="user === undefined"></article>
  <header>
    <Navbar v-if="user !== undefined" />
  </header>

  <RouterView v-if="user !== undefined" />
  <ErrorModal></ErrorModal>
</template>

<style>
div#app {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 2 * var(--block-spacing-vertical));
}
</style>
