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
  highlightCodeBlocks();
  registerRefHandlers();
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

function registerRefHandlers() {
  document.querySelectorAll('.fn-ref').forEach(ref => {
    const noteId = ref.getAttribute("aria-describedby")
    const sidenote = document.querySelector(`#note-${noteId}`);
    ref.addEventListener('mouseenter', event => {
      sidenote.classList.add("highlighted");
    });
    ref.addEventListener('mouseleave', event => {
      sidenote.classList.remove("highlighted");
    });
  });

  document.querySelectorAll('.sidenote').forEach(sidenote => {
    const noteId = sidenote.getAttribute("id").split("-")[1];
    const ref = document.querySelector(`sup[aria-describedby='${noteId}']`)
    sidenote.addEventListener('mouseenter', event => {
      ref.classList.add("highlighted");
    });
    sidenote.addEventListener('mouseleave', event => {
      ref.classList.remove("highlighted");
    });
  })
}
