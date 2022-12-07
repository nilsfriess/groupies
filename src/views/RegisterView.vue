<script setup>
import { ref } from 'vue'
import { useFirebaseAuth } from 'vuefire'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@firebase/auth'
import { useErrorStore } from '../stores/error'
import router from '../router'

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')

const error = useErrorStore()

function trySignup() {
  if (!(email && password && passwordConfirm)) {
    error.showMessage('Alle Felder müssen ausgefüllt werden.')
    return
  }

  if (password.value !== passwordConfirm.value) {
    error.showMessage('Passwörter stimmen nicht überein')
    return
  }

  console.log(email.value)

  const auth = useFirebaseAuth()
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      router.push({ name: 'overview' })
    })
    .catch((err) => {
      const errorCode = err.code

      if (errorCode === 'auth/email-already-in-use')
        error.showMessage(
          'Es existiert bereits ein Konto mit dieser E-Mail Adresse.'
        )
      else if (errorCode == 'auth/weak-password')
        error.showMessage('Das Passwort ist zu schwach.')
      else error.showMessage('Ein Fehler ist aufgetreten')
    })
}
</script>

<template>
  <p>
    Um dich als Organisator:in zu registrieren, gib hier deine E-Mail Adresse
    und ein Passwort ein. Falls du bereits ein Konto hast, klicke
    <router-link to="/login">hier</router-link>. Falls du nur eine Umfrage
    ausfüllen willst, musst du dich nicht registrieren. Den Link zur Umfrage
    schicken dir die Organisator:innen.
  </p>
  <form @submit.prevent="trySignup">
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

    <label for="password-confirm">
      Passwort
      <input
        type="password"
        name="password-confirm"
        v-model="password"
        required
      />
    </label>

    <label for="password">
      Passwort wiederholen
      <input
        type="password"
        name="password-confirm"
        v-model="passwordConfirm"
        required
      />
    </label>

    <button type="submit" id="signup-button">Anmelden</button>
  </form>
</template>
