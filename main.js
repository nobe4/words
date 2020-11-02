/* global Vue fetch history */
'use strict'

const app = Vue.createApp({
  data () {
    return {
      searchTerm: '',
      columns: [
        { type: 'Synonyms', searchKey: 'rel_syn' },
        { type: 'Antonyms', searchKey: 'rel_ant' },
        { type: 'Rhymes', searchKey: 'rel_rhy' }
      ],
      definitionSearchKey: 'sp',
      definitions: ''
    }
  },
  methods: {
    searchDefinition () {
      fetch(`https://api.datamuse.com/words?sp=${this.searchTerm}&md=d`)
        .then(response => response.json())
        .then(results => {
          console.log(results)
          this.definitions = results[0].defs
        })
    },
    pushHistory () {
      if (history.state == null || history.state.q !== this.searchTerm) {
        history.pushState({ q: this.searchTerm }, '', `?q=${this.searchTerm}`)
      }
      this.searchDefinition()
    },
    searchForTerm (term) {
      this.searchTerm = term
      this.searchDefinition()
    }
  },
  created () {
    const query = (new URL(window.location)).searchParams.get('q')
    if (query) {
      this.searchTerm = query
    }
    this.searchDefinition()
    window.addEventListener('popstate', function () {
      window.location.reload()
    })
  }
})

app.component('item', {
  props: ['word', 'definitions'],
  emits: ['search-for-term'],
  data () {
    return {
      classObject: {
        copied: false
      }
    }
  },
  methods: {
    copyToClipboard () {
      navigator.clipboard.writeText(this.word)
      this.classObject.copied = true
      setTimeout(_ => { this.classObject.copied = false }, 1000)
    }
  },
  template: `<li
    :title="definitions"
    @click="copyToClipboard"
    @dblclick="$emit('search-for-term', this.word)"
    :class="classObject"
    >
    {{ word }}
  </li>`
})

app.component('column', {
  props: ['type', 'searchKey', 'searchTerm'],
  emits: ['search-for-term'],
  data () {
    return {
      classObject: {
        collapsed: false
      },
      orderByName: false,
      results: []
    }
  },
  methods: {
    toggleCollapse () {
      this.classObject.collapsed = !this.classObject.collapsed
    },
    invertOrder () {
      this.orderByName = !this.orderByName

      if (this.orderByName) {
        this.results.sort((a, b) => {
          const fa = a.word.toLowerCase()
          const fb = b.word.toLowerCase()

          if (fa < fb) return -1
          if (fa > fb) return 1
          return 0
        })
      } else {
        this.results.sort((a, b) => {
          return b.score - a.score
        })
      }
    },
    search () {
      if (this.searchTerm === '') return

      fetch(`https://api.datamuse.com/words?${this.searchKey}=${this.searchTerm}&md=d`)
        .then(response => response.json())
        // joins the definitions for better viewing
        .then(results => results.map(result => {
          if (result.defs) result.defs = result.defs.join('\n').replaceAll('\t', ':')
          return result
        }))
        .then(results => {
          this.results = results
        })
    },
    searchForTerm (term) {
      this.$emit('search-for-term', term)
    }
  },
  created () { this.search() },
  watch: {
    searchTerm () { this.search() }
  },
  template: `
    <div :id="type" :class="classObject" >
    <h2 @click="toggleCollapse">{{type}}
      <span @click.stop="invertOrder">
      &nbsp;
      <template v-if="orderByName"> ↑ </template>
      <template v-else> ↓ </template>
      &nbsp;
      </span>
    </h2>
    <ul>
      <item
        v-for="result in results"
        :definitions="result.defs"
        :word="result.word"
        @search-for-term="searchForTerm"
        >
      </item>
    </ul>
  </div>`
})

app.mount('#app')
