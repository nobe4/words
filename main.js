/* global fetch history */
'use strict'

const api = 'https://api.datamuse.com/words?{1}={2}'
const types = {
  synonyms: 'rel_syn',
  antonyms: 'rel_ant',
  rhymes: 'rel_rhy'
}

// Define input listener for 'Enter' key.
const input = document.getElementById('search')
input.addEventListener('keydown', function onEvent (event) {
  if (event.key === 'Enter' && input.value) {
    search(input.value)
  }
})

window.addEventListener('popstate', function () {
  window.location.reload()
})

// Parse existing query parameters
const query = (new URL(window.location)).searchParams.get('q')
if (query) {
  input.value = query
  search(query)
}

// Add collapse toggles on titles.
Array.from(document.getElementsByTagName('h2')).forEach((e) => {
  e.addEventListener('click', function () {
    e.parentElement.classList.toggle('collapsed')
  })
})

// populate fills the list with the results
function populate (type, data) {
  var list = document.getElementById(type)
  list.innerHTML = '' // clear list

  for (var i = 0; i < data.length; i++) {
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(data[i].word))
    list.appendChild(li)

    // On click, copy text to the clipboard
    li.addEventListener('click', function () {
      (t => navigator.clipboard.writeText(t))(this.innerText)
      this.classList.add('copied')
      setTimeout(_ => {
        this.classList.remove('copied')
      }, 1000)
    })
    // On doubleclick, search for the term
    li.addEventListener('dblclick', function () {
      (t => { input.value = t; search(t) })(this.innerText)
    })
  }
}

// search runs a query against the api for each type.
function search (term) {
  // Push to history only on empty/new query.
  if (history.state == null || history.state.q !== term) {
    history.pushState({ q: term }, '', `?q=${term}`)
  }
  Object.keys(types).forEach(type => {
    var query = api.replace('{1}', types[type]).replace('{2}', term)
    fetch(query)
      .then(response => response.json())
      .then(data => populate(type, data))
  })
}
