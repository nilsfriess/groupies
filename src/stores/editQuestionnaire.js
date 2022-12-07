import { defineStore } from 'pinia'

export const useEditQuestionnaireStore = defineStore('editQuestionnaire', {
  state: () => ({
    clicked: false,
    currentQuestionnaire: {},
  }),
  actions: {
    click(questionnaire) {
      this.$patch({
        clicked: true,
        currentQuestionnaire: questionnaire,
      })
    },
    unclick() {
      this.$reset()
    },
  },
})
