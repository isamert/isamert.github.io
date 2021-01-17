document.addEventListener('DOMContentLoaded', () => {
  addLinksToHeaders()
  highlightCodeBlocks()
})

function addLinksToHeaders() {
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    if (!h.hasAttribute('id')) {
      return
    }

    const a = document.createElement('a')
    a.setAttribute('href', '#' + h.id)
    a.classList.add('clear')
    h.parentNode.replaceChild(a, h)
    a.appendChild(h)
  })
}

function highlightCodeBlocks(_event) {
  let pageLang

  // Higlight all code blocks
  document.querySelectorAll('pre.src').forEach(block => {
    const lang = [...block.classList].find(x => x.startsWith('src-'))
    if (lang) {
      const currLang = lang.split('-')[1]
      if (currLang) {
        pageLang = currLang
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

// Simple, privacy friendly analytics
insights.init('GCMG1yjLS_qn7cS3');
insights.trackPages();
