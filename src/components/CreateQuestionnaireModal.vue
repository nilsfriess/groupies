<script setup>
import { onMounted, ref } from 'vue'
import { ref as dbRef, set, push, get } from 'firebase/database'
import { useCurrentUser, useDatabase } from 'vuefire'
import { useErrorStore } from '../stores/error'
import { useCreateQuestionnaireStore } from '../stores/createQuestionnaire'

const name = ref('')
const organisers = ref('')
const rounds = ref()
const workshops = ref(new Array())

const currentWorkshopName = ref('')
const currentWorkshopCapacity = ref()

const error = useErrorStore()
const createQuestionnaire = useCreateQuestionnaireStore()

function addWorkshop() {
  if (
    currentWorkshopCapacity.value === undefined ||
    currentWorkshopCapacity.value < 2
  ) {
    error.showMessage(
      'Ein Workshop muss mindestens zwei Teilnehmer:innen aufnehmen können.'
    )
    return
  }

  if (currentWorkshopName.value.length === 0) {
    error.showMessage('Name des Workshops darf nicht leer sein.')
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

function create() {
  if (name.value.length === 0) {
    error.showMessage('Name darf nicht leer sein.')
    return
  }

  if (workshops.value.length < 3) {
    error.showMessage('Es müssen mindestens drei Workshops erstellt werden.')
    return
  }

  if (!rounds.value || rounds.value < 1) rounds.value = 1

  const user = useCurrentUser()
  const organiserList = organisers.value
    .split(',')
    .map((email) => email.toLowerCase())
    .filter((email) => email !== user.value.email) // Remove creator of questionnaire if they try to add themself as organiser

  const db = useDatabase()

  const questListRef = dbRef(db, 'questionnaires/' + user.value.uid)
  const newQuestRef = push(questListRef)
  set(newQuestRef, {
    name: name.value,
    orgas: organiserList,
    rounds: rounds.value,
    workshops: workshops.value,
    isOpen: true,
    link: user.value.uid + '/' + newQuestRef.key,
    creator: user.value.email,
  })

  if (organiserList.length > 0) {
    for (let organiser of organiserList) {
      let organiserMailWithComma = organiser.replaceAll('.', ',')
      console.log(organiserMailWithComma)
      const sharedQuestionnairesRef = dbRef(
        db,
        'sharedQuestionnaires/' + organiserMailWithComma + '/' + user.value.uid
      )
      // const newSharedQuestionnaireRef = push(sharedQuestionnairesRef)
      get(sharedQuestionnairesRef).then((snapshot) => {
        let data = new Array()
        if (snapshot.exists()) {
          data = snapshot.val()
        }
        data.push(newQuestRef.key)
        set(sharedQuestionnairesRef, data)
      })
    }
  }

  createQuestionnaire.unclick()
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
        Umfrag einsehen können. Sie können die Umfrage
        <b>nicht bearbeiten und nicht abschließen</b>. Gib einfach die
        Email-Adressen ein, mehrere Adressen werden durch Kommas getrennt.
        <s
          >Weitere Organisator:innen können auch später noch hinzugefügt
          werden.</s
        >
      </small>
      <input
        type="number"
        id="questionnaire-rounds"
        name="rounds"
        placeholder="Runden"
        v-model.number="rounds"
        min="1"
      />
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
      </button>

      <footer style="text-align: left; !important">
        <button @click="create">Umfrage erstellen</button>
        <small
          >Nachdem die Umfrage erstellt wurde, können
          <b>keine Workshops mehr hinzugefügt oder gelöscht werden</b>.</small
        >
      </footer>
    </article>
  </dialog>
</template>

<style scoped>
#workshop-list a {
  float: right;
}
</style>
