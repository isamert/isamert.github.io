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

// * Lights out!

const title = document.querySelector(".site-title");
const toc = document.querySelector("#table-of-contents h2");
let bangTimer;
let currentFrame = 0;
let grayedOut = false;

const clearAnimation = () => {
    currentFrame = 0;
    if (bangTimer) {
        clearInterval(bangTimer);
        bangTimer = null;
    }
};

title.addEventListener('mouseenter', event => {
  if (!grayedOut && !bangTimer) {
    bangTimer = setInterval(() => {
      currentFrame += 1;
      if (currentFrame == 14) {
        title.style.animation = "neon-flicker-dying 3s ease-in-out forwards";
      } else if (currentFrame == 44) /* 1.4 seconds neon-flicker + 3 seconds neon-flicker-dying */ {
        document.documentElement.style.filter = "grayscale(1)";

        // a very bad fall effect
        // title.style.transformOrigin = "left center";
        // title.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.7, 1)";
        // title.style.transform = "translate(0.3em, 1.4em) rotate(17deg)";

        title.style.setProperty("text-shadow", "none", "important");
        title.style.animation = "none";
        toc.style.setProperty("text-shadow", "none", "important");
        toc.style.animation = "none";

        grayedOut = true;
        clearAnimation();
      }
    }, 100);
  }
});

title.addEventListener('mouseleave', event => {
  title.style.animation = "";
  clearAnimation();
});
