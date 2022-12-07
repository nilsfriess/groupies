<script setup>
import { ref as dbRef, get, child, set, push } from '@firebase/database'
import { useRoute } from 'vue-router'
import { useDatabase } from 'vuefire'
import { ref } from 'vue'
import ErrorModal from '../components/ErrorModal.vue'
import { useErrorStore } from '../stores/error'

const questionnaire = ref({})
const loaded = ref(false)

// Form values
const name = ref('')
const institution = ref('')
const choices = ref([-1, -1, -1])

const route = useRoute()
const db = dbRef(useDatabase())
get(
  child(db, 'questionnaires/' + route.params.uid + '/' + route.params.qid)
).then((snapshot) => {
  if (snapshot.exists()) {
    questionnaire.value = snapshot.val()
    loaded.value = true
  }
})

function submit() {
  const error = useErrorStore()

  let individualChoices = new Set(choices.value)
  if (choices.value.indexOf(-1) !== -1 || individualChoices.size !== 3) {
    // Not all priorities are set, show error and return
    error.showMessage(
      'Es müssen drei unterschiedliche Prioritäten ausgewählt werden.'
    )
    return
  }

  if (!(/\S/.test(name.value) && /\S/.test(institution.value))) {
    error.showMessage('Alle Eingabefelder müssen ausgefüllt werden.')
    return
  }

  document.getElementById('submission-loader').setAttribute('open', true)

  const answersListRef = dbRef(
    useDatabase(),
    'answers/' + route.params.uid + '/' + route.params.qid
  )
  const newAnswerRef = push(answersListRef)
  set(newAnswerRef, {
    name: name.value,
    institution: institution.value,
    choices: choices.value,
  })
    .then(() => {
      document
        .querySelector('#submission-loader article')
        .removeAttribute('aria-busy')
      document.querySelector('#submission-loader article').innerHTML =
        'Auswahl gespeichert. Du kannst die Seite nun schließen.'
    })
    .catch((error) => {
      document.getElementById('submission-loader').hidden = true
      error.showMessageAndCode('Etwas ist schiefgelaufen', error.code)
    })
}
</script>

<template>
  <article id="loader" aria-busy="true" v-if="!loaded">
    Umfrage wird geladen...
  </article>
  <article id="form-section" v-if="loaded">
    <form @submit.prevent="submit">
      <h2 id="questionnaire-name">{{ questionnaire.name }}</h2>
      <label for="name">
        Name
        <input
          type="text"
          name="name"
          placeholder="Name"
          v-model="name"
          required
        />
      </label>

      <label for="institution">
        Institution
        <input
          type="text"
          name="institution"
          placeholder="Institution"
          v-model="institution"
          required
        />
      </label>

      <h5 style="margin-top=1em;">Priorität 1</h5>
      <select v-model="choices[0]">
        <option value="-1" disabled selected>Workshop auswählen</option>
        <option
          v-for="(workshop, index) in questionnaire.workshops"
          :value="index"
        >
          {{ workshop.name }}
        </option>
      </select>

      <h5>Priorität 2</h5>
      <select v-model="choices[1]">
        <option value="-1" disabled selected>Workshop auswählen</option>
        <option
          v-for="(workshop, index) in questionnaire.workshops"
          :value="index"
        >
          {{ workshop.name }}
        </option>
      </select>

      <h5>Priorität 3</h5>
      <select v-model="choices[2]">
        <option value="-1" disabled selected>Workshop auswählen</option>
        <option
          v-for="(workshop, index) in questionnaire.workshops"
          :value="index"
        >
          {{ workshop.name }}
        </option>
      </select>

      <small style="padding-top: 3em">
        Wähle oben die drei Workshops aus, an denen du am liebsten teilnehmen
        würdest. Es wird versucht, deine Auswahl zu berücksichtigen. Je nach
        Anzahl verfügbarer Plätze, Prioritäten der anderen Teilnehmer:innen etc.
        kann es jedoch passieren, dass manche oder sogar gar keine deiner
        Wünsche berücksichtigt werden können. Du wirst von den Organisator:innen
        darüber informiert, welchen Workshops du zugeteilt wurdest.
      </small>

      <footer>
        <button type="submit">Senden</button>
        <small>Auswahl kann nicht mehr verändert werden.</small>
      </footer>
    </form>
  </article>

  <dialog id="submission-loader">
    <article aria-busy="true">Auswahl wird gespeichert...</article>
  </dialog>
</template>

<style scoped>
h5 {
  margin-top: 1.5em;
  margin-bottom: 1em;
}
</style>
