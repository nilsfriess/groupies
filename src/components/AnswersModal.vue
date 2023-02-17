<script setup>
const props = defineProps({
  answers: Array,
  workshops: Array,
  workshopDescription: String,
  additionalQuestions: Array,
})

const choices = (answer) => {
  return answer.choices
    .map((index) => {
      return props.workshops[index].name
    })
    .join(', ')
}

function answersForOption(questionIndex, optionIndex) {
  return props.answers.filter((answer) => {
    return answer.additionalQuestionAnswers[questionIndex][optionIndex]
  })
}

defineEmits(['close'])
</script>

<template>
  <dialog id="show-answers-dialog" open>
    <article>
      <header>
        <a
          href=""
          aria-label="Close"
          class="close"
          @click.prevent="$emit('close')"
        ></a>
        Erhaltene Antworten
      </header>
      <h4 v-if="additionalQuestions && additionalQuestions.length > 0">
        Eintragungen in {{ workshopDescription }}
      </h4>
      <figure>
        <table role="grid">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Institution</th>
              <th>{{ workshopDescription }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(answer, index) in answers">
              <td>{{ index + 1 }}</td>
              <td>{{ answer.name }}</td>
              <td>{{ answer.institution }}</td>
              <td>{{ choices(answer) }}</td>
            </tr>
          </tbody>
        </table>
      </figure>

      <section v-if="additionalQuestions && additionalQuestions.length > 0">
        <h4>Antworten auf zusätzliche Fragen</h4>
        <template v-for="(question, questionIndex) in additionalQuestions">
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
    </article>
  </dialog>
</template>

<style scoped>
.option {
  border-left: 1px solid var(--primary);
  padding-left: 1em;
  margin-bottom: 2em;
}
</style>
