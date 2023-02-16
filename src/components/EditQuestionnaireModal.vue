<script setup>
// import { ref } from 'vue'
// import { ref as dbRef, set, push } from 'firebase/database'
// import { useCurrentUser, useDatabase } from 'vuefire'
// import { useErrorStore } from '../stores/error'
import { ref, update, remove, set, get, equalTo } from '@firebase/database'
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

  for (let organiser of orgasBefore) {
    if (
      !editQuestionnaireStore.currentQuestionnaire.orgas.includes(organiser)
    ) {
      orgasToDelete.push(organiser)
    }
  }

  if (editQuestionnaireStore.currentQuestionnaire.orgas)
    for (let organiser of editQuestionnaireStore.currentQuestionnaire.orgas) {
      if (!orgasBefore.includes(organiser)) {
        orgasToAdd.push(organiser)
      }
    }

  orgasToAdd = orgasToAdd.filter((o) => o !== '')
  orgasToDelete = orgasToDelete.filter((o) => o !== '')

  for (let organiser of orgasToDelete) {
    let organiserMailWithComma = organiser.replaceAll('.', ',')
    const db = useDatabase()

    const link = editQuestionnaireStore.currentQuestionnaire.link.split('/')
    const creatorID = link[0]
    const questionnaireID = link[1]

    const delPath =
      'sharedQuestionnaires/' + organiserMailWithComma + '/' + creatorID
    remove(ref(db, delPath), equalTo(questionnaireID))
      .then(() => {
        console.log('deleted')
      })
      .catch((err) => console.log(err))
  }

  for (let organiser of orgasToAdd) {
    let organiserMailWithComma = organiser.replaceAll('.', ',')
    const db = useDatabase()

    const link = editQuestionnaireStore.currentQuestionnaire.link.split('/')
    const creatorID = link[0]
    const questionnaireID = link[1]

    const sharedQuestionnairesRef = ref(
      db,
      'sharedQuestionnaires/' + organiserMailWithComma + '/' + creatorID
    )
    get(sharedQuestionnairesRef).then((snapshot) => {
      let data = new Array()
      if (snapshot.exists()) {
        data = snapshot.val()
      }
      data.push(questionnaireID)
      set(sharedQuestionnairesRef, data)
        .then(() => {
          console.log('added')
        })
        .catch((err) => console.log(err))
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
      const answersDeletPath =
        'answers/' + editQuestionnaireStore.currentQuestionnaire.link
      remove(ref(db, answersDeletPath))
        .then(() => {
          emit('saved')
          editQuestionnaireStore.unclick()
        })
        .catch((err) => {
          const error = useErrorStore()
          if (err.code === 'PERMISSION_DENIED')
            error.showMessage('Keine Berechtigung.')
          else
            error.showMessageAndCode('Das hat leider nicht geklappt', err.code)
        })
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
  updated[updatePath].isOpen = false
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
