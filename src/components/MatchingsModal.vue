<script setup>
import { onMounted, ref, toRaw } from 'vue'
import { stableMatching } from '../utils/matching'
import { utils, writeFile } from 'xlsx'
import { useErrorStore } from '../stores/error'

const props = defineProps({
  answers: Array,
  questionnaire: Object,
})

const matchings = ref(new Array())
const additionalParticipants = ref(new Array())

function computeMatching() {
  let workshops = toRaw(props.questionnaire.workshops)
  let rounds = props.questionnaire.rounds
  let answers = toRaw(props.answers)
  let priorities = props.questionnaire.priorities

  let matchingResults = stableMatching(answers, workshops, rounds, priorities)

  matchings.value = matchingResults.workshops
  additionalParticipants.value = matchingResults.additionalParticipants
}

function answersForOption(questionIndex, optionIndex) {
  return props.answers.filter((answer) => {
    return answer.additionalQuestionAnswers[questionIndex][optionIndex]
  })
}

function download() {
  let table = new Array()
  for (let workshop of matchings.value) {
    table.push([
      workshop.name + ' (Max. ' + workshop.capacity + ' Teilnehmer:innen)',
    ])

    if (props.questionnaire.rounds === 1) {
      for (let participant of workshop.participants[0]) {
        let row = new Array()
        row.push(participant.name)
        row.push(participant.institution)
        table.push(row)
      }
    } else {
      for (let round = 0; round < workshop.participants.length; ++round) {
        table.push(['Runde' + (round + 1)])
        if (workshop.participants[round].length === 0) {
          table.push(['Keine Eintragung'])
        } else {
          for (let participant of workshop.participants[round]) {
            let row = new Array()
            row.push(participant.name)
            row.push(participant.institution)
            table.push(row)
          }
        }
      }
    }
    table.push([''])
  }

  if (additionalParticipants.value.length > 0) {
    table.push([''])
    table.push(['Nicht eingetragene Teilnehmer:innen'])
    for (let participant of additionalParticipants.value)
      table.push([
        participant.name,
        participant.institution,
        choices(participant),
      ])
  }

  let worksheet = utils.aoa_to_sheet(table)
  let workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, 'Zuteilungen (nach Workshops)')

  let matchingsByParticipant = matchings.value
    .map((w) => {
      // We're only considering the first round at the moment
      let participants = w.participants[0].map((p) => {
        p.workshop = w.name
        return p
      })
      return participants
    })
    .flat(2)
    .sort((p1, p2) => ('' + p1.name).localeCompare(p2.name))
    .map(Object.values)

  table = new Array()
  table.push(['Name', 'Institution', 'Zugeteilter Workshop'])
  table = table.concat(matchingsByParticipant)

  worksheet = utils.aoa_to_sheet(table)
  utils.book_append_sheet(workbook, worksheet, 'Zuteilung (nach Teilnehmenden)')

  if (
    props.questionnaire.additionalQuestions &&
    props.questionnaire.additionalQuestions.length > 0
  ) {
    table = new Array()
    table.push(['Antworten auf zusätzliche Fragen'])
    table.push([''])

    for (let i = 0; i < props.questionnaire.additionalQuestions.length; ++i) {
      let question = props.questionnaire.additionalQuestions[i]

      table.push([question.question])

      for (let j = 0; j < question.options.length; ++j) {
        let option = question.options[j]
        table.push([option])

        let answers = answersForOption(i, j)
        console.log(answers)
        if (answers.length > 0) {
          for (let k = 0; k < answers.length; ++k)
            table.push([answers[k].name, answers[k].institution])
          table.push([''])
        } else {
          table.push(['Keine Eintragungen für diese Option'])
        }
      }
    }

    worksheet = utils.aoa_to_sheet(table)
    utils.book_append_sheet(workbook, worksheet, 'Zusätzliche Fragen')
  }

  writeFile(workbook, props.questionnaire.name + '.xlsx')
}

const isMobile = () => screen.width <= 760

const choices = (answer) => {
  let workshops = toRaw(props.questionnaire.workshops)
  return answer.choices
    .map((index) => {
      return workshops[index].name
    })
    .join(', ')
}

const emit = defineEmits(['close'])

onMounted(() => {
  const error = useErrorStore()
  if (!props.answers || props.answers.length === 0) {
    error.showMessage('Noch keine Antworten erhalten')
    emit('close')
    return
  }

  // let availablePlaces = props.questionnaire.workshops
  //   .map((item) => item.capacity)
  //   .reduce((a, b) => a + b)

  // if (availablePlaces < props.answers.length) {
  //   error.showMessage([
  //     'Es sind nicht genügend Plätze für die angemeldeten Teilnehmer:innen verfügbar.',
  //     '',
  //     'Erhaltene Antworten: ' + props.answers.length,
  //     'Verfügbare Plätze: ' + availablePlaces,
  //   ])
  //   emit('close')
  //   return
  // }

  computeMatching()
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
          @click.prevent="$emit('close')"
        ></a>
        Erzeugte Zuteilungen
      </header>
      <section v-for="matching in matchings">
        <h5>{{ matching.name }}</h5>
        <template v-if="matching.participants.length === 1">
          <figure v-if="matching.participants[0].length > 0">
            <table role="grid">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Institution</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(answer, index) in matching.participants[0]">
                  <td>{{ index + 1 }}</td>
                  <td>{{ answer.name }}</td>
                  <td>{{ answer.institution }}</td>
                </tr>
              </tbody>
            </table>
          </figure>
          <p v-else>Keine Eintragung.</p>
        </template>
        <template v-else v-for="(participants, index) in matching.participants">
          <h6>Runde {{ index + 1 }}</h6>
          <figure v-if="participants.length > 0">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Institution</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(answer, index) in participants">
                  <td>{{ index + 1 }}</td>
                  <td>{{ answer.name }}</td>
                  <td>{{ answer.institution }}</td>
                </tr>
              </tbody>
            </table>
          </figure>
          <p v-else>Keine Eintragung.</p>
        </template>
        <!-- <template v-for="(roundParticipants, index) in matching.participants">
          {{ index }}
        </template> -->
      </section>

      <template v-if="additionalParticipants.length > 0">
        <h4>Nicht eingetragene Teilnehmer:innen</h4>
        <p class="mb2">
          Diese Teilnehmer:innen haben sich angemeldet, nachdem alle Gruppen
          schon voll waren.
        </p>
        <figure>
          <table role="grid">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Institution</th>
                <th>Prioritäten</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(answer, index) in additionalParticipants">
                <td>{{ index + 1 }}</td>
                <td>{{ answer.name }}</td>
                <td>{{ answer.institution }}</td>
                <td>{{ choices(answer) }}</td>
              </tr>
            </tbody>
          </table>
        </figure>
      </template>

      <section
        v-if="
          questionnaire.additionalQuestions &&
          questionnaire.additionalQuestions.length > 0
        "
      >
        <h4>Antworten auf zusätzliche Fragen</h4>
        <template
          v-for="(question, questionIndex) in questionnaire.additionalQuestions"
        >
          <h5>{{ question.question }}</h5>
          <div v-for="(option, optionIndex) in question.options" class="option">
            <b>
              {{ option }}
            </b>
            <table
              v-if="answersForOption(questionIndex, optionIndex).length > 0"
              role="grid"
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Institution</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(answer, answerIndex) in answersForOption(
                    questionIndex,
                    optionIndex
                  )"
                >
                  <td>{{ answerIndex + 1 }}</td>
                  <td>{{ answer.name }}</td>
                  <td>{{ answer.institution }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else>Keine Eintragungen für diese Option.</p>
          </div>
        </template>
      </section>

      <footer>
        <button @click="download()">Herunterladen</button>
        <small v-if="isMobile()"
          >Auf manchen mobilen Geräten funktioniert der Download der Zuteilungen
          nicht.</small
        >
      </footer>
    </article>
  </dialog>
</template>

<style scoped>
.option {
  border-left: 1px solid var(--primary);
  padding-left: 1em;
  margin-bottom: 2em;
}

footer {
  text-align: left;
}

.mb2 {
  margin-bottom: 2em;
}
</style>
