import { createApp } from 'vue'
import { VueFire, VueFireAuth } from 'vuefire'
import { createPinia } from 'pinia'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faPeopleGroup,
  faSquare,
  faSquareMinus,
} from '@fortawesome/free-solid-svg-icons'

import { initializeApp } from 'firebase/app'

import App from './App.vue'
import router from './router'

import '@picocss/pico/css/pico.min.css'
import './assets/main.css'

const firebaseConfig = {
  apiKey: 'AIzaSyC-JTqHFFxuxWV0mQ0Ee3TMs29AI9lT_lU',
  authDomain: 'groupie-workshop.firebaseapp.com',
  projectId: 'groupie-workshop',
  storageBucket: 'groupie-workshop.appspot.com',
  messagingSenderId: '115029352636',
  appId: '1:115029352636:web:d45a552a530abf21b6f0b9',
  databaseURL:
    'https://groupie-workshop-default-rtdb.europe-west1.firebasedatabase.app/',
}

const firebaseApp = initializeApp(firebaseConfig)

library.add(faPeopleGroup)
library.add(faSquareMinus)

const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()],
})

app.mount('#app')
