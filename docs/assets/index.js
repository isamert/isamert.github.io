// Umami is a privacy friendly analytics app. I self-host it so the
// data is not in the hands of greater evils.
if (location.port != 3000) {
  let script = document.createElement('script');
  script.src = 'https://u.isamert.net/u.js';
  script.setAttribute("defer", "true");
  script.setAttribute("data-website-id", "049cb414-45e0-4b83-a82c-2d19fd8827ce");
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  highlightCodeBlocks()
})

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
