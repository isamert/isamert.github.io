let MOVIES = [];
let FILTER = {};

async function init() {
  await loadGlobals();
  updateFilter();
  scrollToHashElement();
}

async function loadGlobals() {
  FILTER = JSON.parse(getURLParam("filter", "{}"));
  MOVIES = await fetch("assets/watchlist.json").then((response) =>
    response.json()
  );
}

function scrollToHashElement() {
  const x = document.getElementById(window.location.hash.substring(1));
  if (x) {
    window.scrollTo({
      top: x.getBoundingClientRect().top,
      behavior: "smooth",
    });
  }
}

function isString(x) {
  return typeof x === "string";
}

function isFunction(x) {
  return typeof x === "function";
}

function container(items, clazz) {
  const elem = div(null, clazz);
  items?.forEach((x) => {
    elem.appendChild(
      (() => {
        if (isString(x)) {
          return div(x);
        } else if (Array.isArray(x)) {
          return container(x);
        } else if (x == null) {
          return div("");
        } else {
          return x;
        }
      })(),
    );
  });
  return elem;
}

function div(text, clazz) {
  return elem("div", text, clazz);
}

function i(clazz) {
  return elem("i", "", clazz);
}

function h2(text, clazz) {
  return elem("h2", text, clazz);
}

function a(text, href, clazz) {
  const x = elem("a", text, clazz);
  if (isFunction(href)) {
    x.href = "#";
    x.addEventListener("click", function (e) {
      e.preventDefault();
      href();
    });
  } else {
    x.href = href;
  }
  return x;
}

function img(src, clazz) {
  const x = elem("img", null, clazz);
  x.src = src;
  return x;
}

function elem(type, text, clazz) {
  const x = document.createElement(type);
  if (text) {
    x.innerText = text;
  }
  if (clazz && isString(clazz)) {
    clazz.split(" ").forEach((c) => x.classList.add(c));
  } else if (clazz) {
    Object.entries(clazz).forEach((p) => {
      const [key, val] = p;
      if (key === "clazz") {
        val.split(" ").forEach((c) => x.classList.add(c));
      } else if (key.startsWith("on")) {
        console.log("Registering event listener :: " + key.substring(2));
        x.addEventListener(key.substring(2), function (e) {
          e.preventDefault();
          val(e);
        });
      } else {
        x[key] = val;
      }
    });
  }
  return x;
}

function getStarForRating(rating) {
  if (rating <= 5) {
    return "star-o";
  } else if (rating > 5 && rating <= 7) {
    return "star-half-o"
  }
  return "star";
}

async function draw(movies) {
  const root = document.getElementById("movie-list");
  root.innerHTML = "";

  movies.forEach((movie) => {
    const movieContainer = container(
      [
        img(movie.image, "movie-poster"),
        container(
          [
            container(
              [
                div(movie.item, {
                  clazz: "movie-title",
                  onclick: () => (window.location.hash = movie.id),
                }),
                a(movie.todo, () => updateFilter({ todo: movie.todo })),
              ],
              "movie-info-row",
            ),
            container(
              [
                movie.runtime,
                movie.runtime ? "|" : "",
                ...(movie.genres ?? []).flatMap((genre) => [
                  a(genre, () => updateFilter({ genres: genre })),
                  div(",", "comma"),
                ]).slice(0, -1),
              ],
              "movie-info-row",
            ),
            container(
              [
                movie.rating ? i({clazz: `fa fa-${getStarForRating(movie.rating)} movie-icon`, title: "My rating"}) : "",
                div(movie.rating, {title: "My Rating"}),
                movie.rating ? "|" : "",
                movie.imdb_rating ? i({clazz: "fa fa-imdb movie-icon", title: "IMDb rating"}) : "",
                div(movie.imdb_rating, {title: "IMDb Rating"}),
                movie.metascore ? i({clazz: "fa fa-ticket movie-icon", title: "Metascore"}) : "",
                div(movie.metascore, {title: "Metascore"}),
              ],
              "movie-info-row",
            ),
            div(movie.plot ?? "...", "movie-info-row"),
            container(
              [
                ...(movie.directors ?? []).flatMap((director) => [
                  a(director, () => updateFilter({ directors: director })),
                  div(", "),
                ]).slice(0, -1),
                movie.directors ? "|" : "",
                ...(movie.actors ?? []).flatMap((actor) => [
                  a(actor, () => updateFilter({ actors: actor })),
                  div(", ", "comma"),
                ]).slice(0, -1),
              ],
              "movie-info-row",
            ),
          ],
          "movie-info",
        ),
      ],
      { clazz: "movie", id: movie.id },
    );

    root.appendChild(movieContainer);
  });
}

function updateURLParam(key, val) {
  const href = new URL(window.location.href);
  href.searchParams.set(key, val);
  window.history.pushState({}, "", href);
}

function getURLParam(key, def) {
  const params = new URLSearchParams(window.location.search);
  if (params.has(key)) {
    return params.get(key);
  }
  return def;
}

function updateFilter(opts) {
  Object.entries(opts ?? {}).forEach((entry) => {
    const [key, val] = entry;
    const current = FILTER[key];
    FILTER[key] = [
      ...new Set([
        ...(FILTER[key] ?? []).filter((x) => x !== val),
        ...(current?.includes(val) ? [] : [val]),
      ]),
    ];
  });

  updateURLParam("filter", JSON.stringify(FILTER));
  draw(
    MOVIES.filter((movie) =>
      Object.entries(opts ?? {}).reduce((acc, pred) => {
        const [key, val] = pred;
        return acc && FILTER[key].every((x) => (movie[key] ?? []).includes(x));
      }, true)
    ),
  );
}

const style = elem("style");
style.innerHTML = `
.movie {
  overflow: auto;
  display: flex;
  flex-direction: row;
  margin-bottom: 2rem;
}
.movie-info-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}
.movie-poster {
  max-width: 13rem;
  margin-right: 1rem;
}
.movie-plot {
}
.movie-info {
}
.movie-title {
  font-size: 1.3rem;
}
.comma {
  margin-right: 0.3rem;
}
.movie-icon {
  font-size: 1.5rem;
  margin-left: 0.3rem;
  margin-right: 0.3rem;
}
`;
document.head.appendChild(style);

init();
