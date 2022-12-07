<script setup>
const props = defineProps({
  answers: Array,
  workshops: Array,
})

const choices = (answer) => {
  return answer.choices
    .map((index) => {
      return props.workshops[index].name
    })
    .join(', ')
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
      <figure>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Institution</th>
              <th>Workshops</th>
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
    </article>
  </dialog>
</template>
