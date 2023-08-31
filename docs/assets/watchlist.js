let FILTER = {};
let MOVIES = [];

async function init() {
  let hash = window.location.hash.substring(1);
  if (hash === "") {
    hash = "{}";
  }

  FILTER = JSON.parse(decodeURIComponent(hash));
  MOVIES = await fetch("assets/watchlist.json").then((response) =>
    response.json()
  );

  updateFilter();
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
      })()
    );
  });
  return elem;
}

function div(text, clazz) {
  return elem("div", text, clazz);
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
  if (clazz) {
    x.classList.add(clazz);
  }
  return x;
}

async function draw(movies) {
  const root = document.getElementById("movie-list");
  root.innerHTML = "";

  movies.forEach((movie) => {
    const movieContainer = container(
      [
        img(movie.image, "poster"),
        container(
          [
            h2(movie.item, "title"),
            container(
              [
                movie.runtime,
                movie.runtime ? "|" : "",
                container(
                  movie.genres
                    ?.flatMap((genre) => [
                      a(genre, () => updateFilter({ genres: genre })),
                      div(",", "commasep"),
                    ])
                    .slice(0, -1),
                  "inline-children"
                ),
              ],
              "inline-children"
            ),
            container(
              [movie.rating, movie.rating ? "|" : "", movie.imdb_rating],
              "inline-children"
            ),
            div(movie.plot ?? "...", "movie-plot"),
            container(
              [
                container(
                  movie.directors
                    ?.flatMap((director) => [
                      a(director, () => updateFilter({ directors: director })),
                      div(",", "commasep"),
                    ])
                    .slice(0, -1),
                  "inline-children"
                ),
                movie.directors ? "|" : "",
                container(
                  movie.actors
                    ?.flatMap((actor) => [
                      a(actor, () => updateFilter({ actors: actor })),
                      div(",", "commasep"),
                    ])
                    .slice(0, -1),
                  "inline-children"
                ),
              ],
              "inline-children"
            ),
          ],
          "info"
        ),
      ],
      "movie"
    );

    root.appendChild(movieContainer);
  });
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

  window.location.hash = "#" + JSON.stringify(FILTER);
  draw(
    MOVIES.filter((movie) => {
      return (
        (FILTER.genres ?? []).every((x) => (movie.genres ?? []).includes(x)) &&
        (FILTER.actors ?? []).every((x) => (movie.actors ?? []).includes(x)) &&
        (FILTER.directors ?? []).every((x) =>
          (movie.directors ?? []).includes(x)
        )
      );
    })
  );
}

const style = elem("style");
style.innerHTML = `
.poster {
  float: left;
  max-width: 13rem;
  margin-right: 1rem;
}
.movie {
  overflow: auto;
  margin-bottom: 2rem;
}
.movie-plot {
  margin: 0.5rem;
}
.info {
  margin-left: 1rem;
}
.inline-children > div {
  display: inline-block;
}
.title {
  font-size: 1.3rem;
  margin-top: 0px;
}
.commasep {
  margin-right: 0.3rem;
}
`;
document.head.appendChild(style);

init();
