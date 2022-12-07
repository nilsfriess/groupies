import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', {
  state: () => ({
    message: '',
    code: '',
    visible: false,
  }),
  getters: {
    messageWithCode() {
      let messageString = ''
      if (Array.isArray(this.message)) {
        for (let line of this.message) {
          messageString += line
          messageString += '<br>'
        }
      }

      if (this.code) messageString += '<br><br> (Errorcode: ' + this.code + ')'

      return messageString
    },
  },
  actions: {
    showMessageAndCode(message, code) {
      this.message = message
      this.code = code
      this.show()
    },
    showMessage(message) {
      this.message = message
      this.code = null
      this.show()
    },
    show() {
      this.visible = true
    },
    hide() {
      this.visible = false
    },
  },
})
