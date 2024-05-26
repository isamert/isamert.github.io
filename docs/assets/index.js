document.addEventListener('DOMContentLoaded', () => {
  addLinksToHeaders()
  highlightCodeBlocks()
})

function addLinksToHeaders() {
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    if (!h.hasAttribute('id')) {
      return
    }

    wrap(h, elem('a', {
      class: 'clear',
      href: '#' + h.id,
    }))
  })
}

function highlightCodeBlocks(_event) {
  // Disable auto-lang detection
  hljs.configure({languages: []})

  let pageLang

  // Higlight all code blocks
  document.querySelectorAll('pre.src').forEach(block => {
    const lang = [...block.classList].find(x => x.startsWith('src-'))
    if (lang) {
      const currLang = lang.split('-')[1]
      if (currLang) {
        pageLang = currLang.replace(/elisp/g, 'lisp')
        block.classList.add(pageLang)
      }
    }
    hljs.highlightBlock(block)
  })

  // Highlight all inline code blocks
  document.querySelectorAll('code').forEach(block => {
    if (pageLang) {
      block.classList.add(pageLang)
    }
    hljs.highlightBlock(block)
  })
}

//
// Utils
//

function wrap(elem, wrapper) {
  elem.parentNode.replaceChild(wrapper, elem)
  wrapper.appendChild(elem)
}

function elem(type, attrs) {
  const e = document.createElement(type)
  Object.keys(attrs).forEach(attr => {
    if (attr !== 'children') {
      e.setAttribute(attr, attrs[attr])
    }
  })

  if (attrs.children) {
    attrs.children.forEach(child => e.appendChild(child))
  }

  return e
}
