<script setup>
import { ref } from 'vue'
import { useFirebaseAuth } from 'vuefire'
import { signInWithEmailAndPassword } from '@firebase/auth'
import { useErrorStore } from '../stores/error'
import router from '../router'

const email = ref('')
const password = ref('')

const error = useErrorStore()

function tryLogin() {
  const auth = useFirebaseAuth()
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      router.push({ name: 'overview' })
    })
    .catch((err) => {
      error.showMessageAndCode('Etwas ist schiefgelaufen', err.code)
    })
}
</script>

<template>
  <p>
    Falls du schon einen Account hast, kannst du dich hier anmelden. Um einen
    Account zu erstellen, klicke <router-link to="/register">hier</router-link>.
  </p>

  <form @submit.prevent="tryLogin">
    <label for="email">
      E-Mail
      <input
        type="email"
        name="email"
        placeholder="name@mail.com"
        v-model="email"
        required
      />
    </label>

    <label for="password">
      Passwort
      <input type="password" name="password" v-model="password" required />
    </label>

    <button type="submit" id="signup-button">Anmelden</button>
  </form>
</template>
