import { defineStore } from 'pinia'

export const useCreateQuestionnaireStore = defineStore('createQuestionnaire', {
  state: () => ({
    clicked: false,
  }),
  actions: {
    click() {
      this.$patch({ clicked: true })
    },
    unclick() {
      this.$reset()
    },
  },
})
