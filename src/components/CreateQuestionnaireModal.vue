<script setup>
import { onMounted, ref } from 'vue'
import { ref as dbRef, set, push, get } from 'firebase/database'
import { useCurrentUser, useDatabase } from 'vuefire'

import { useErrorStore } from '../stores/error'
import { useCreateQuestionnaireStore } from '../stores/createQuestionnaire'
import { useQuestionnairesStore } from '../stores/questionnaires'

const name = ref('')
const organisers = ref('')
const rounds = ref()
const workshops = ref(new Array())
const groupName = ref('')
const priorities = ref()

const currentWorkshopName = ref('')
const currentWorkshopCapacity = ref()

const currentAdditionalQuestion = ref('')
const currentAdditionalQuestionOption = ref('')
const currentAdditionalQuestionOptions = ref(new Array())
const additionalQuestions = ref(new Array())
const currentAdditonalQuestionRequired = ref(true)
const warnAdditionalQuestionModalOpen = ref(false)

const error = useErrorStore()
const createQuestionnaire = useCreateQuestionnaireStore()
const questionnaireStore = useQuestionnairesStore()

function addWorkshop() {
  if (currentWorkshopName.value.length === 0) {
    error.showMessage('Name der Gruppe darf nicht leer sein.')
    return
  }

  if (
    currentWorkshopCapacity.value === undefined ||
    currentWorkshopCapacity.value < 2
  ) {
    error.showMessage(
      'Eine Gruppe muss mindestens zwei Teilnehmer:innen aufnehmen können.'
    )
    return
  }

  workshops.value.push({
    name: currentWorkshopName.value,
    capacity: currentWorkshopCapacity.value,
  })
  currentWorkshopName.value = ''
}

function removeWorkshop(index) {
  workshops.value.splice(index, 1)
}

function addOption() {
  currentAdditionalQuestionOptions.value.push(
    currentAdditionalQuestionOption.value
  )
  currentAdditionalQuestionOption.value = ''
}

function removeOption(index) {
  currentAdditionalQuestionOptions.value.splice(index, 1)
}

function addAdditionalQuestion() {
  if (currentAdditionalQuestion.value === '') {
    error.showMessage('Frage darf nicht leer sein')
    return
  }

  if (currentAdditionalQuestionOptions.value.length === 0) {
    error.showMessage(
      'Es müssen mindestens zwei Antwortmöglichkeiten hinzugefügt werden'
    )
    return
  }

  const question = {
    question: currentAdditionalQuestion.value,
    options: currentAdditionalQuestionOptions.value,
    required: currentAdditonalQuestionRequired.value,
  }
  additionalQuestions.value.push(question)

  currentAdditionalQuestion.value = ''
  currentAdditionalQuestionOption.value = ''
  currentAdditionalQuestionOptions.value = new Array()
  currentAdditonalQuestionRequired.value = true
}

function removeAdditionalQuestion(index) {
  additionalQuestions.value.splice(index, 1)
}

function create() {
  if (name.value.length === 0) {
    error.showMessage('Name darf nicht leer sein.')
    return
  }

  if (currentAdditionalQuestion.value !== '') {
    warnAdditionalQuestionModalOpen.value = true
    return
  }

  if (workshops.value.length < priorities.value) {
    error.showMessage(
      `Für ${priorities.value} Prioritäten müssen mindestens ${priorities.value} Gruppen erstellt werden.`
    )
    return
  }

  if (groupName.value.length === 0) groupName.value = 'Gruppen'

  if (!rounds.value || rounds.value < 1) rounds.value = 1

  const user = useCurrentUser()
  const organiserList = organisers.value
    .split(',')
    .filter((o) => o !== '')
    .map((email) => email.toLowerCase())
    .filter((email) => email !== user.value.email) // Remove creator of questionnaire if they try to add themself as organiser

  const db = useDatabase()

  const questListRef = dbRef(db, 'questionnaires/' + user.value.uid)
  push(questListRef)
    .then((ref) => {
      set(ref, {
        name: name.value,
        orgas: organiserList,
        rounds: rounds.value,
        priorities: priorities.value,
        workshopDescription: groupName.value,
        workshops: workshops.value,
        isOpen: true,
        link: user.value.uid + '/' + ref.key,
        creator: user.value.email,
        totalCapacity: workshops.value.reduce((sum, w) => w.capacity + sum, 0),
        additionalQuestions: additionalQuestions.value,
      })
        .then(() => {
          if (organiserList.length > 0) {
            for (let organiser of organiserList) {
              let organiserMailWithComma = organiser.replaceAll('.', ',')
              const sharedQuestionnairesRef = dbRef(
                db,
                'sharedQuestionnaires/' +
                  organiserMailWithComma +
                  '/' +
                  user.value.uid
              )
              // const newSharedQuestionnaireRef = push(sharedQuestionnairesRef)
              get(sharedQuestionnairesRef).then((snapshot) => {
                let data = new Array()
                if (snapshot.exists()) {
                  data = snapshot.val()
                }
                data.push(ref.key)
                set(sharedQuestionnairesRef, data)
              })
            }
          }

          createQuestionnaire.unclick()
          questionnaireStore.load()
        })
        .catch(console.log)
    })
    .catch(console.log)
}
</script>

<template>
  <dialog open>
    <article>
      <header>
        <a
          href=""
          aria-label="Close"
          class="close"
          @click.prevent="createQuestionnaire.unclick()"
        ></a>
        Neue Umfrage erstellen
      </header>
      <h4>Allgemeines</h4>
      <input
        type="text"
        id="questionnaire-name"
        name="name"
        placeholder="Name der Umfrage"
        v-model.trim="name"
      />
      <input
        type="text"
        id="questionnaire-orga"
        name="orga"
        placeholder="Weitere Organisator:innen"
        multiple
        v-model.trim="organisers"
      />
      <small>
        Hier kannst du weitere Organisator:innen hinzufügen, die den Status der
        Umfrage einsehen können. Sie können die Umfrage
        <b>nicht bearbeiten und nicht abschließen</b>. Gib einfach die
        Email-Adressen ein, mehrere Adressen werden durch Kommas getrennt.
        Weitere Organisator:innen können auch später noch hinzugefügt werden.
      </small>

      <input
        type="number"
        id="questionnaire-priorities"
        name="priorities"
        placeholder="Prioritäten"
        v-model.number="priorities"
        min="1"
      />
      <small>
        Hier kannst du angeben, wievele Prioritäten die Teilnehmer:innen angeben
        können.
      </small>

      <input
        type="number"
        id="questionnaire-rounds"
        name="rounds"
        placeholder="Runden"
        v-model.number="rounds"
        min="1"
        disabled
      />
      <small>
        Hier kannst du angeben, wie oft die unten erstellten
        {{ groupName == '' ? 'Gruppen' : groupName }} angeboten werden. Wenn die
        Teilnehmer:innen also beispielsweise an zwei (verschiedenen) der unten
        erstellten {{ groupName == '' ? 'Gruppen' : groupName }} teilnehmen
        können, dann gebe hier 2 ein. Falls die
        {{ groupName == '' ? 'Gruppen' : groupName }} nur einmal angeboten
        werden, dann lasse dieses Feld einfach leer oder gebe 1 ein.
      </small>

      <h4>{{ groupName == '' ? 'Gruppen' : groupName }}</h4>
      <input
        type="text"
        id="group-name"
        name="group-name"
        placeholder="Bezeichnung der Gruppen"
        v-model.trim="groupName"
      />
      <small
        >Erstellst du eine Umfrage für Workshops, dann gebe hier
        <i>Workshops</i> ein, erstellst du eine Umfrage für Führungen, gebe hier
        <i>Führungen</i>
        ein. Natürlich kannst du auch andere Bezeichnungen eingeben; achte
        darauf, dass sie im Plural formuliert sind.
      </small>
      <ul id="workshop-list">
        <li v-if="workshops.length === 0">
          <em
            >Erstellte {{ groupName == '' ? 'Gruppen' : groupName }} werden hier
            angezeigt</em
          >
        </li>
        <li v-else v-for="(workshop, index) in workshops">
          {{ workshop.name }} (Max. {{ workshop.capacity }} Teilnehmer:innen)
          <a class="contrast" href="" @click.prevent="removeWorkshop(index)"
            ><font-awesome-icon icon="fa-solid fa-square-minus"
          /></a>
        </li>
      </ul>
      <div>
        <input
          type="text"
          placeholder="Name der Gruppe"
          v-model.trim="currentWorkshopName"
          v-on:keyup.enter="addWorkshop()"
        />
        <input
          type="number"
          placeholder="Max. Teilnehmer:innen"
          v-model.number="currentWorkshopCapacity"
        />
      </div>
      <button class="outline" @click="addWorkshop()">Hinzufügen</button>

      <h4 style="margin-bottom: 1em">Zusätzliche Abfragen</h4>
      <small class="explanation"
        >Hier können weitere Multiple-Choice-Fragen hinzugefügt werden, um
        zusätzliche Informationen bei den Teilnehmer:innen einzuholen.</small
      >
      <ul id="additional-questions-list">
        <li v-if="additionalQuestions.length === 0">
          <em>Zusätzliche Fragen werden hier angezeigt</em>
        </li>
        <li v-else v-for="(question, index) in additionalQuestions">
          {{ question.question }} ({{ question.options.join(', ') }})
          <a
            class="contrast"
            href=""
            @click.prevent="removeAdditionalQuestion(index)"
            ><font-awesome-icon icon="fa-solid fa-square-minus"
          /></a>
        </li>
      </ul>

      <input
        type="text"
        placeholder="Frage"
        v-model.trim="currentAdditionalQuestion"
      />

      <div class="flex">
        <input
          type="text"
          id="option"
          placeholder="Option"
          required
          v-model="currentAdditionalQuestionOption"
          v-on:keyup.enter="addOption()"
        />

        <button @click="addOption()" class="primary outline">+</button>
      </div>
      <ul
        v-if="currentAdditionalQuestionOptions.length > 0"
        id="additional-questions-options-list"
      >
        <li v-for="(option, index) in currentAdditionalQuestionOptions">
          {{ option }}
          <a class="contrast" href="" @click.prevent="removeOption(index)"
            ><font-awesome-icon icon="fa-solid fa-square-minus"
          /></a>
        </li>
      </ul>
      <fieldset>
        <label for="additionalQuestionRequired">
          <input
            type="checkbox"
            id="additionalQuestionRequired"
            name="additionalQuestionRequired"
            role="switch"
            checked
            v-model="currentAdditonalQuestionRequired"
          />
          Frage muss beantwortet werden
        </label>
      </fieldset>
      <button class="outline" @click="addAdditionalQuestion()">
        Frage hinzufügen
      </button>

      <footer style="text-align: left; !important">
        <button @click="create">Umfrage erstellen</button>
        <small
          >Nachdem die Umfrage erstellt wurde, können
          <b
            >keine {{ groupName == '' ? 'Gruppen' : groupName }} mehr
            hinzugefügt oder gelöscht werden</b
          >.</small
        >
      </footer>
    </article>
  </dialog>

  <dialog open v-if="warnAdditionalQuestionModalOpen">
    <article>
      <header>
        <a
          href=""
          aria-label="Close"
          class="close"
          @click.prevent="warnAdditionalQuestionModalOpen = false"
        ></a>
        Achtung
      </header>
      Es wurde eine zusätzliche Frage eingegebeben, aber noch nicht hinzugefügt.
      Klicke auf 'Frage hinzufügen', um die Frage hinzuzufügen.
    </article>
  </dialog>
</template>

<style scoped>
#workshop-list a,
#additional-questions-list a,
#additional-questions-options-list a {
  float: right;
}

#additional-questions-options-list {
  margin-left: 0.5em;
}

li {
  list-style: inside;
}

.explanation {
  display: block;
  width: 100%;
  margin-bottom: var(--spacing);
  color: var(--muted-color);
}

.flex {
  display: flex;
  gap: 1em;
}

.flex button {
  flex: 5;
}

h4 {
  margin-top: 3em;
}

h4:first-of-type {
  margin-top: 0;
}
</style>
