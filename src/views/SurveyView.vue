<script setup>
import { onMounted } from 'vue'
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
const choices = ref(new Array())
const isFull = ref(false)

const additionalQuestionAnswers = ref(new Array())

const route = useRoute()
const db = dbRef(useDatabase())
get(
  child(db, 'questionnaires/' + route.params.uid + '/' + route.params.qid)
).then((snapshot) => {
  if (snapshot.exists()) {
    questionnaire.value = snapshot.val()
    loaded.value = true

    choices.value = new Array(questionnaire.value.priorities)

    additionalQuestionAnswers.value = new Array(
      questionnaire.value.additionalQuestions.length
    )
    for (let i = 0; i < additionalQuestionAnswers.value.length; ++i) {
      additionalQuestionAnswers.value[i] = new Array(
        questionnaire.value.additionalQuestions[i].options.length
      )
      for (let j = 0; j < additionalQuestionAnswers.value[i].length; ++j) {
        additionalQuestionAnswers.value[i][j] = false
      }
    }

    get(child(db, 'answers/' + route.params.uid + '/' + route.params.qid)).then(
      (snapshot) => {
        const answers = snapshot.size
        const capacity = questionnaire.value.totalCapacity

        if (answers >= capacity) isFull.value = true
      }
    )
  }
})

function submit() {
  const error = useErrorStore()

  let individualChoices = new Set(choices.value)
  if (
    choices.value.indexOf(-1) !== -1 ||
    individualChoices.size !== questionnaire.value.priorities
  ) {
    // Not all priorities are set, show error and return
    error.showMessage(
      `Es müssen ${questionnaire.value.priorities} unterschiedliche Prioritäten ausgewählt werden.`
    )
    return
  }

  if (!(/\S/.test(name.value) && /\S/.test(institution.value))) {
    error.showMessage('Alle Eingabefelder müssen ausgefüllt werden.')
    return
  }

  for (let i = 0; i < additionalQuestionAnswers.value.length; ++i) {
    let filledOut = additionalQuestionAnswers.value[i].indexOf(true) !== -1
    if (questionnaire.value.additionalQuestions[i].required && !filledOut) {
      error.showMessage('Alle Fragen müssen beantwortet werden')
      return
    }
  }

  document.getElementById('submission-loader').setAttribute('open', true)

  const answersListRef = dbRef(
    useDatabase(),
    'answers/' + route.params.uid + '/' + route.params.qid
  )

  let submissionAnswer = {
    name: name.value,
    institution: institution.value,
    choices: choices.value,
  }

  if (additionalQuestionAnswers.value.length > 0)
    submissionAnswer.additionalQuestionAnswers = additionalQuestionAnswers.value

  const newAnswerRef = push(answersListRef)
  set(newAnswerRef, submissionAnswer)
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
  <article id="form-section" v-if="loaded && questionnaire.isOpen && !isFull">
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

      <section v-for="priority in questionnaire.priorities">
        <h5 style="margin-top=1em;">Priorität {{ priority }}</h5>
        <select v-model="choices[priority - 1]">
          <option value="-1" disabled selected>Gruppe auswählen</option>
          <option
            v-for="(workshop, index) in questionnaire.workshops"
            :value="index"
          >
            {{ workshop.name }}
          </option>
        </select>
      </section>

      <small style="padding-top: 3em">
        Wähle oben {{ questionnaire.priorities }}
        {{ questionnaire.workshopDescription }} aus, an denen du am liebsten
        teilnehmen würdest. Es wird versucht, deine Auswahl zu berücksichtigen.
        Je nach Anzahl verfügbarer Plätze, Prioritäten der anderen
        Teilnehmer:innen etc. kann es jedoch passieren, dass manche oder sogar
        gar keine deiner Wünsche berücksichtigt werden können. Du wirst von den
        Organisator:innen darüber informiert, welchen
        {{ questionnaire.workshopDescription }} du zugeteilt wurdest.
      </small>

      <section
        v-if="
          questionnaire.additionalQuestions &&
          questionnaire.additionalQuestions.length > 0
        "
      >
        <template
          v-for="(question, index) in questionnaire.additionalQuestions"
        >
          <h4>{{ question.question }}</h4>

          <fieldset>
            <label
              v-for="(option, optionIndex) in question.options"
              :for="question.question + option"
            >
              <input
                type="checkbox"
                :id="question.question + option"
                name="{{ question + option }}"
                v-model="additionalQuestionAnswers[index][optionIndex]"
              />
              {{ option }}
            </label>
          </fieldset>
        </template>
      </section>

      <footer style="margin-top: 2em">
        <button type="submit">Senden</button>
        <small>Auswahl kann nicht mehr verändert werden.</small>
      </footer>
    </form>
  </article>

  <article v-if="loaded && !questionnaire.isOpen">
    Diese Umfrage wurde bereits geschlossen.
  </article>

  <article v-if="loaded && questionnaire.isOpen && isFull">
    Diese Umfrage ist voll.
  </article>

  <dialog id="submission-loader">
    <article aria-busy="true">Auswahl wird gespeichert...</article>
  </dialog>
</template>

<style scoped>
h5 {
  margin-top: 1em;
  margin-bottom: 1em;
}

h4 {
  margin-top: 2em;
  margin-bottom: 0.5em;
}

fieldset label {
  margin-left: 0.5em;
}
</style>
