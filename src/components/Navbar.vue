<script setup>
import { useRoute } from 'vue-router'
import { useCurrentUser } from 'vuefire'
import { useCreateQuestionnaireStore } from '../stores/createQuestionnaire'

const user = useCurrentUser()
const route = useRoute()
const createQuestionnaire = useCreateQuestionnaireStore()
</script>

<template>
  <nav>
    <ul>
      <li>
        <router-link to="/" class="contrast">
          <font-awesome-icon icon="fa-solid fa-people-group" />
          <strong> Groupies</strong>
        </router-link>
      </li>
    </ul>
    <ul v-if="!user">
      <li><router-link to="/register">Registrieren</router-link></li>
      <li><router-link to="/login">Login</router-link></li>
    </ul>
    <ul v-if="route.name == 'overview'" class="create-button">
      <button @click="createQuestionnaire.click()">Neue Umfrage</button>
    </ul>
  </nav>
</template>

<style scoped>
nav {
  margin-bottom: 4em;
}

strong {
  padding-left: 12px;
}

ul.create-button {
  margin-top: 1em;
  margin-right: 0;
}
</style>
