<script setup>
import { useCurrentUser } from 'vuefire'
import { useFirebaseAuth } from 'vuefire'
import { signOut } from '@firebase/auth'

import router from '../router'

import { useQuestionnairesStore } from '../stores/questionnaires'

import Questionnaire from '../components/Questionnaire.vue'
import Disclaimer from '../components/Disclaimer.vue'
import EditQuestionnaireModal from '../components/EditQuestionnaireModal.vue'
import CreateQuestionnaireModal from '../components/CreateQuestionnaireModal.vue'
import SharedQuestionnaire from '../components/SharedQuestionnaire.vue'

import { useCreateQuestionnaireStore } from '../stores/createQuestionnaire'
import { useEditQuestionnaireStore } from '../stores/editQuestionnaire'

const questionnaires = useQuestionnairesStore()
questionnaires.load()

const editQuestionnaireStore = useEditQuestionnaireStore()
const createQuestionnaireStore = useCreateQuestionnaireStore()

const user = useCurrentUser()

function logout() {
  const auth = useFirebaseAuth()
  signOut(auth).then(() => {
    router.push({ name: 'login' })
  })
}

const createQuestionnaire = useCreateQuestionnaireStore()
createQuestionnaire.$subscribe((_, state) => {
  if (state.clicked === false) {
    questionnaires.load()
  }
})
</script>

<template>
  <article
    v-if="
      questionnaires.questionnaires.length === 0 &&
      questionnaires.sharedQuestionnaires.length === 0
    "
  >
    Hier werden deine Umfragen angezeigt, sobald du welche erstellt hast.
  </article>

  <h3 v-if="questionnaires.questionnaires.length > 0">Eigene Umfragen</h3>
  <Questionnaire
    v-if="questionnaires.questionnaires.length > 0"
    v-for="questionnaire in questionnaires.questionnaires"
    :questionnaire="questionnaire"
    @questionnaire-changed="questionnaires.load()"
  ></Questionnaire>

  <h3 v-if="questionnaires.sharedQuestionnaires.length > 0" class="m-top">
    Mit dir geteilte Umfragen
  </h3>
  <SharedQuestionnaire
    v-if="questionnaires.sharedQuestionnaires.length > 0"
    v-for="questionnaire in questionnaires.sharedQuestionnaires"
    :questionnaire="questionnaire"
  ></SharedQuestionnaire>

  <EditQuestionnaireModal
    v-if="editQuestionnaireStore.clicked"
    @saved="questionnaires.load()"
  ></EditQuestionnaireModal>

  <CreateQuestionnaireModal v-if="createQuestionnaireStore.clicked">
  </CreateQuestionnaireModal>

  <footer v-if="user">
    <Disclaimer id="disclaimer"></Disclaimer>
    <div class="logout">
      <div class="user-email">
        Angemeldet als: <span id="user-email">{{ user.email }}</span>
      </div>
      <div class="logout-button">
        <a href="" @click.prevent="logout" role="button" class="secondary"
          >Ausloggen</a
        >
      </div>
    </div>
  </footer>
</template>

<style scoped>
div.logout {
  position: relative;
  display: flex;
  justify-content: space-between;
  margin-top: 4em;
}

div.logout .user-email {
  margin: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

div.logout .logout-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
}

#disclaimer {
  margin-top: 4em;
}

h3.m-top {
  margin-top: 3em;
}
</style>
