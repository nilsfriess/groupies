<script setup>
import { ref as dbRef, get, child, update } from '@firebase/database'
import { onMounted, ref, defineProps, computed, toRaw } from 'vue'
import { useDatabase } from 'vuefire'

import AnswersModal from './AnswersModal.vue'
import LinkModal from './LinkModal.vue'
import MatchingsModal from './MatchingsModal.vue'

const props = defineProps({
  questionnaire: Object,
})

defineEmits(['questionnaireChanged'])

const answers = ref(new Array())
const answersModalVisible = ref(false)
const linkModalVisible = ref(false)
const matchingsModalVisible = ref(false)

const numAnswers = computed(() => {
  return answers.value.length
})

const updateAnswers = () => {
  const db = dbRef(useDatabase())

  get(child(db, 'answers/' + props.questionnaire.link)).then((answer) => {
    if (answer.exists()) {
      answers.value = Object.values(answer.val())
    } else {
      answers.value = new Array()
    }
  })
}

onMounted(() => {
  updateAnswers()
})
</script>

<template>
  <div>
    <details>
      <summary>
        {{ questionnaire.name }}
      </summary>
      <p style="display: flex; justify-content: space-between">
        <span>Ausgefüllte Umfragen:</span>
        <span v-if="numAnswers > 0">
          <strong>{{ numAnswers }}&nbsp;</strong>
          (<a href="" @click.prevent="answersModalVisible = true">anzeigen</a>)
        </span>
        <span v-else>
          <strong>keine</strong>
        </span>
      </p>
      <div class="grid">
        <button
          class="outline"
          @click="linkModalVisible = true"
          :disabled="!questionnaire.isOpen"
        >
          Link zur Umfrage anzeigen
        </button>
      </div>
      <button
        class="contrast"
        @click="matchingsModalVisible = true"
        :disabled="!answers || answers.length === 0"
      >
        Zuteilung anzeigen
      </button>
      <span class="shared">
        <small>Geteilt von: {{ questionnaire.creator }}</small>
      </span>
    </details>
  </div>

  <AnswersModal
    :answers="answers"
    :workshops="questionnaire.workshops"
    :workshopDescription="questionnaire.workshopDescription"
    :additionalQuestions="questionnaire.additionalQuestions"
    v-if="answersModalVisible"
    @close="answersModalVisible = false"
  ></AnswersModal>

  <LinkModal
    :link="questionnaire.link"
    v-if="linkModalVisible"
    @close="linkModalVisible = false"
  ></LinkModal>

  <MatchingsModal
    v-if="matchingsModalVisible"
    @close="matchingsModalVisible = false"
    :questionnaire="questionnaire"
    :answers="answers"
  ></MatchingsModal>
</template>

<style scoped>
details .shared {
  display: block;
  margin-top: 1em;
  margin-bottom: 2em;
}
</style>

<!-- <summary style="font-size: 120%;">Testumfrage</summary>
                      
                      </p><div class="grid"><button class="outline">Link zur Umfrage anzeigen</button><button class="outline">Umfrage abschließen</button></div> -->
.
