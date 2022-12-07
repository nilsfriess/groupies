<script setup>
// import { ref } from 'vue'
// import { ref as dbRef, set, push } from 'firebase/database'
// import { useCurrentUser, useDatabase } from 'vuefire'
// import { useErrorStore } from '../stores/error'
import { ref, update, remove, set } from '@firebase/database'
import { onMounted } from 'vue'
import { useDatabase } from 'vuefire'
import { useEditQuestionnaireStore } from '../stores/editQuestionnaire'
import { useErrorStore } from '../stores/error'

const editQuestionnaireStore = useEditQuestionnaireStore()

let orgasBefore = []

const emit = defineEmits(['saved'])

function orgasToArray() {
  if (
    typeof editQuestionnaireStore.currentQuestionnaire.orgas === 'string' ||
    editQuestionnaireStore.currentQuestionnaire.orgas instanceof String
  ) {
    editQuestionnaireStore.currentQuestionnaire.orgas =
      editQuestionnaireStore.currentQuestionnaire.orgas.split(',')
  }
}

function addNewOrgas() {
  let orgasToAdd = new Array()
  let orgasToDelete = new Array()

  console.log(orgasBefore)

  for (let organiser of orgasBefore) {
    if (
      !editQuestionnaireStore.currentQuestionnaire.orgas.includes(organiser)
    ) {
      orgasToDelete.push(organiser)
    }
  }

  for (let organiser of editQuestionnaireStore.currentQuestionnaire.orgas) {
    if (!orgasBefore.includes(organiser)) {
      orgasToAdd.push(organiser)
    }
  }

  for (let organiser of orgasToDelete) {
    let organiserMailWithComma = organiser.replaceAll('.', ',')
    const db = useDatabase()
    const delPath =
      'sharedQuestionnaires/' +
      organiserMailWithComma +
      '/' +
      editQuestionnaireStore.currentQuestionnaire.link
    remove(ref(db, delPath))
      .then(() => {
        console.log('ok')
      })
      .catch((err) => {
        console.error(err)
      })
  }
}

function save() {
  orgasToArray()
  addNewOrgas()

  const db = useDatabase()
  const updatePath =
    'questionnaires/' + editQuestionnaireStore.currentQuestionnaire.link
  const updated = {}
  updated[updatePath] = editQuestionnaireStore.currentQuestionnaire
  update(ref(db), updated)
    .then(() => {
      emit('saved')
      editQuestionnaireStore.unclick()
    })
    .catch((err) => {
      const error = useErrorStore()
      if (err.code === 'PERMISSION_DENIED')
        error.showMessage('Keine Berechtigung.')
      else error.showMessageAndCode('Das hat leider nicht geklappt', err.code)
    })
}

function deleteQuestionnaire() {
  orgasToArray()

  const db = useDatabase()
  const deletePath =
    'questionnaires/' + editQuestionnaireStore.currentQuestionnaire.link
  remove(ref(db, deletePath))
    .then(() => {
      emit('saved')
      editQuestionnaireStore.unclick()
    })
    .catch((err) => {
      const error = useErrorStore()
      if (err.code === 'PERMISSION_DENIED')
        error.showMessage('Keine Berechtigung.')
      else error.showMessageAndCode('Das hat leider nicht geklappt', err.code)
    })
}

const closeQuestionnaire = () => {
  orgasToArray()

  const db = ref(useDatabase())

  const updatePath =
    'questionnaires/' + editQuestionnaireStore.currentQuestionnaire.link
  const updated = {}
  updated[updatePath] = editQuestionnaireStore.currentQuestionnaire
  update(db, updated)
    .then(() => {
      emit('saved')
      editQuestionnaireStore.unclick()
      editQuestionnaireStore.currentQuestionnaire.isOpen = false
    })
    .catch((err) => {
      const error = useErrorStore()
      if (err.code === 'PERMISSION_DENIED')
        error.showMessage('Keine Berechtigung.')
      else error.showMessageAndCode('Das hat leider nicht geklappt', err.code)
    })
}

onMounted(() => {
  if (editQuestionnaireStore.currentQuestionnaire.orgas)
    orgasBefore = Object.values(
      editQuestionnaireStore.currentQuestionnaire.orgas
    )
})
</script>

<template>
  <dialog open>
    <article>
      <header>
        <a
          href=""
          aria-label="Close"
          class="close"
          @click.prevent="editQuestionnaireStore.unclick()"
        ></a>
        Umfrage bearbeiten
      </header>
      <button
        class="secondary"
        @click="closeQuestionnaire()"
        :disabled="!editQuestionnaireStore.currentQuestionnaire.isOpen"
      >
        Umfrage abschließen
      </button>
      <button class="danger" @click="deleteQuestionnaire()">
        Umfrage löschen
      </button>
      <small>Kann nicht rückgängig gemacht werden.</small>
      <details>
        <summary>Eigenschaften bearbeiten</summary>
        <label for="name">
          Name
          <input
            type="text"
            id="questionnaire-name"
            name="name"
            placeholder="Name der Umfrage"
            v-model.trim="editQuestionnaireStore.currentQuestionnaire.name"
            :disabled="!editQuestionnaireStore.currentQuestionnaire.isOpen"
          />
        </label>
        <label for="orga">
          Weitere Organisator:innen
          <input
            disabled
            type="text"
            name="orga"
            multiple
            v-model.trim="editQuestionnaireStore.currentQuestionnaire.orgas"
            :disabled="!editQuestionnaireStore.currentQuestionnaire.isOpen"
          />
        </label>
        <label for="rounds">
          Runden
          <input
            type="number"
            name="rounds"
            v-model.number="editQuestionnaireStore.currentQuestionnaire.rounds"
            :disabled="!editQuestionnaireStore.currentQuestionnaire.isOpen"
            min="1"
          />
        </label>
      </details>
      <!--
      
      <small>
        Hier kannst du weitere Organisator:innen hinzufügen, die auch Zugriff
        auf diese Umfrage bekommen, also den Status einsehen oder die Umfrage
        abschließen können. Gib einfach die Email-Adressen ein, mehrere Adressen
        werden durch Kommas getrennt. Weitere Organisator:innen können auch
        später noch hinzugefügt werden.
      </small>
      
      <small>
        Hier kannst du angeben, wie oft die unten erstellten Workshops angeboten
        werden. Wenn die Teilnehmer:innen also beispielsweise an zwei
        (verschiedenen) der unten erstellten Workshops teilnehmen können, dann
        gebe hier 2 ein. Falls die Workshops nur einmal angeboten werden, dann
        lasse dieses Feld einfach leer oder gebe 1 ein.
      </small>

      <h4>Workshops</h4>
      <ul id="workshop-list">
        <li v-if="workshops.length === 0">
          <em>Erstellte Workshops werden hier angezeigt</em>
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
          placeholder="Name des Workshops"
          v-model.trim="currentWorkshopName"
        />
        <input
          type="number"
          placeholder="Max. Teilnehmer:innen"
          v-model.number="currentWorkshopCapacity"
        />
      </div>
      <button class="outline" @click="addWorkshop()">
        Workshop hinzufügen
      </button> -->

      <footer>
        <button @click="save()">Änderungen speichern</button>
      </footer>
    </article>
  </dialog>
</template>

<style scoped>
#workshop-list a {
  float: right;
}

article {
  min-width: 70vw;
}

details {
  margin-top: 3em;
}

.danger {
  --background-color: var(--del-color);
  --border-color: var(--del-color);
  --color: var(-secondary-inverse);
}
</style>
