import { defineStore } from 'pinia'
import { useDatabase, useList } from 'vuefire'
import { get, child, ref } from '@firebase/database'
import { useCurrentUser } from 'vuefire'

export const useQuestionnairesStore = defineStore('questionnaires', {
  state: () => ({
    questionnaires: [],
    sharedQuestionnaires: [],
  }),
  actions: {
    load() {
      this.$reset()
      const user = useCurrentUser()
      const dbRef = ref(useDatabase())

      get(child(dbRef, `questionnaires/${user.value.uid}`)).then((snapshot) => {
        if (snapshot.exists()) {
          this.questionnaires = new Array()
          snapshot.forEach((item) => {
            this.questionnaires.push(item.val())
          })
        }
      })

      get(
        child(
          dbRef,
          `sharedQuestionnaires/${user.value.email.replaceAll('.', ',')}`
        )
      )
        .then((snapshot) => {
          if (snapshot.exists()) {
            for (let [uid, qids] of Object.entries(snapshot.val())) {
              for (let qid of qids) {
                let path = 'questionnaires/' + uid + '/' + qid
                this.sharedQuestionnaires = new Array()
                get(child(dbRef, path)).then((snapshot) => {
                  if (snapshot.exists())
                    this.sharedQuestionnaires.push(snapshot.val())
                })
              }
            }
          } else {
            this.sharedQuestionnaires = new Array()
          }
        })
        .catch((err) => {
          console.log(err)
        })
    },
  },
})
