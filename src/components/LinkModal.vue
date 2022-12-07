<script setup>
const props = defineProps({
  link: String,
})

function getFullUrl() {
  return window.location.origin + '/survey/' + props.link
}

function copyLink() {
  const linkField = document.createElement('input')
  linkField.value = getFullUrl()
  document.body.appendChild(linkField)
  linkField.select()
  linkField.setSelectionRange(0, 99999)
  navigator.clipboard.writeText(linkField.value)
  document.body.removeChild(linkField)
}

defineEmits(['close'])
</script>

<template>
  <dialog id="show-quest-link-dialog" open>
    <article>
      <header>
        <a aria-label="Close" class="close" @click="$emit('close')"></a>
        Link zur Umfrage
      </header>
      <p>
        Mit diesem Link können Teilnehmer:innen ihre Prioritäten angeben. Um
        Spam-Einträge zu verhinden, veröffentliche diesen Link nicht auf einer
        Webseite im Internet, sondern sende ihn den Teilnehmer:innen per Mail
        und bitte sie, ihn nicht weiterzuleiten.
      </p>

      <div style="text-align: center; margin-top: 3em">
        <kbd
          ><a
            class="quest-url"
            style="color: inherit !important"
            :href="getFullUrl()"
            target="_blank"
            rel="noopener noreferrer"
            >{{ getFullUrl() }}</a
          ></kbd
        >
      </div>
      <footer>
        <button @click="copyLink()">Link kopieren</button>
      </footer>
    </article>
  </dialog>
</template>
