<script setup>
import { ref, onMounted } from 'vue'
import { useFirebaseAuth } from 'vuefire'
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from '@firebase/auth'
import { useErrorStore } from '../stores/error'
import router from '../router'

const email = ref('')
const password = ref('')

const passwordResetModalOpen = ref(false)
const emailSentModalOpen = ref(false)

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

function sendResetMail() {
  const auth = useFirebaseAuth()
  auth.languageCode = 'de'

  let actionCodeSettings = {
    url: 'https://groupie-workshop.web.app/login?email=' + email.value,
  }

  sendPasswordResetEmail(auth, email.value, actionCodeSettings)
    .then(() => {
      passwordResetModalOpen.value = false
      emailSentModalOpen.value = true
    })
    .catch((err) => {
      console.log(err)
      error.showMessageAndCode('Etwas ist schiefgelaufen', err.code)
    })
}

onMounted(() => {
  if (router.currentRoute.value.query.email)
    email.value = router.currentRoute.value.query.email
})
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
      <span class="flex">
        Passwort

        <a href="#" @click="passwordResetModalOpen = true"
          >Passwort vergessen</a
        >
      </span>
      <input type="password" name="password" v-model="password" required />
    </label>

    <button type="submit" id="signup-button">Anmelden</button>
  </form>

  <dialog v-if="passwordResetModalOpen" open>
    <article>
      <a
        href="#"
        aria-label="Close"
        class="close"
        data-target="modal-example"
        @click.prevent="passwordResetModalOpen = false"
      >
      </a>
      <h3>Passwort zurücksetzen</h3>
      Eine E-Mail mit einem Link, um dein Passwort zurückzusetzen, wird an
      folgende Adresse geschickt.
      <input
        type="email"
        name="email"
        placeholder="name@mail.com"
        v-model="email"
        required
      />
      <footer>
        <a
          href="#cancel"
          role="button"
          class="secondary"
          @click.prevent="passwordResetModalOpen = false"
        >
          Abbrechen
        </a>
        <a href="#" role="button" @click.prevent="sendResetMail()">
          E-Mail anfordern
        </a>
      </footer>
    </article>
  </dialog>

  <dialog v-if="emailSentModalOpen" open>
    <article>
      <a
        href="#"
        aria-label="Close"
        class="close"
        @click.prevent="emailSentModalOpen = false"
      >
      </a>
      E-Mail wurde verschickt.
    </article>
  </dialog>
</template>

<style scoped>
.flex {
  display: flex;
  justify-content: space-between;
}

dialog input[type='email'] {
  margin-top: 1em;
}
</style>
