let MOVIES = [];
let FILTER = {};
let SORT = "rating";

const sorters = {
  "isamert's rating": "rating",
  "IMDb": "imdb_rating",
  "Metascore": "metascore",
};

async function init() {
  await loadGlobals();
  draw(FILTER, SORT, MOVIES);
  scrollToHashElement();
}

async function loadGlobals() {
  FILTER = JSON.parse(getURLParam("filter", "{}"));
  MOVIES = await fetch("assets/watchlist.json").then((response) =>
    response.json()
  );
}

function scrollToHashElement() {
  const hash = window.location.hash.substring(1);
  const x = hash && document.getElementById(hash);
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

function isEmpty(x) {
  return x == null || (x.length == 0);
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

function select(options, clazz) {
  const x = elem("select", null, clazz);
  options.forEach((it) => x.add(isString(it) ? option(it) : it));
  return x;
}

function option(text, clazz) {
  const x = elem("option", null, clazz);
  x.text = text;
  return x;
}

function img(src, clazz) {
  const x = elem("img", null, clazz);
  x.src = src;
  return x;
}

function input(type, clazz) {
  const x = elem("input", null, clazz);
  x.type = type;
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

function withDebounce(callback, delay) {
  let timeoutId;

  return function () {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback.apply(this, arguments);
    }, delay);
  };
}

function getStarForRating(rating) {
  if (rating <= 5) {
    return "star-o";
  } else if (rating > 5 && rating <= 7) {
    return "star-half-o";
  }
  return "star";
}

function drawProp(name, prop) {
  return a(prop, () => draw(updateFilter({ [name]: prop }), SORT, MOVIES), {
    clazz: FILTER[name]?.includes(prop) ? "selected-prop" : "normal-prop",
  });
}

function drawProps(name, props) {
  return (props ?? []).flatMap((prop) => [
    drawProp(name, prop),
    div(",", "comma"),
  ]).slice(0, -1);
}

function drawTodo(movie) {
  const todo = movie.todo;
  const [text, title] = (() => {
    if (todo === "DONE") {
      const when = movie.closed || movie.watched;
      return ["Watched", when];
    } else if (todo === "PROG") {
      return ["In progress"];
    } else if (todo === "WAIT") {
      return ["Waiting"];
    } else if (todo === "TODO") {
      return ["Will watch"];
    }
  })();
  return a(text, () => draw(updateFilter({ todo: movie.todo }), SORT, MOVIES), {
    clazz: "movie-todo",
    title,
  });
}

function drawFilterPopup({ show, x, y, items, parent, filter }) {
  let filterElems = container(
    items.map((x) => drawProp(filter, x)),
    "filter-popup",
  );
  const popup = container([
    input("text", {
      placeholder: "Filter...",
      oninput: withDebounce((e) => {
        const filteredElems = container(
          items.filter((x) => x?.toLowerCase().includes(e.target.value)).map((
            x,
          ) => drawProp(filter, x)),
          "filter-popup",
        );
        filterElems.replaceWith(filteredElems);
        filterElems = filteredElems;
      }, 300),
    }),
    filterElems,
  ], "filter-popup-outer");
  parent.append(popup);
  popup.style.display = show ? "block" : "none";
  if (show) {
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
  }

  // FIXME: This causes a memory leak but who cares
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target)) {
      popup.remove();
    }
  });
}

function drawFilters(filters) {
  const root = div("");
  const filtersRoot = div("", "filters");
  const items = Object.entries({
    todo: [],
    genres: [],
    directors: [],
    actors: [],
    tags: [],
    countries: [],
    ...filters,
  }).map((f) => {
    const [filter, val] = f;
    const onAdd = (e) => {
      const items = [
        ...new Set(MOVIES.flatMap((movie) => {
          const x = movie[filter];
          return Array.isArray(x) ? x : [x];
        })),
      ].filter((x) => !FILTER[filter]?.includes(x));
      drawFilterPopup({
        items,
        x: e.clientX,
        y: e.clientY,
        show: true,
        parent: filtersRoot,
        filter,
      });
      e.stopPropagation();
    };
    return container([
      div(`${filter}: `, "filter-title"),
      ...drawProps(filter, val),
      div("+", { clazz: "selected-prop", onclick: onAdd }),
    ], "filter-row");
  });
  filtersRoot.append(...items);
  root.append(filtersRoot);

  const sortCombo = select(Object.keys(sorters), {
    onchange: () => {
      SORT = sorters[sortCombo.value];
      draw(FILTER, SORT, MOVIES);
    },
  });
  root.append(
    container([div("Sort by:", "filter-title"), sortCombo], "sort-row"),
  );

  return root;
}

function drawMovies(movies) {
  const movieRoot = document.createElement("div");
  const items = movies.map((movie) =>
    container(
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
                drawTodo(movie),
              ],
              "movie-info-row spaced",
            ),
            container(
              [
                movie.runtime,
                movie.runtime ? "|" : "",
                ...drawProps("genres", movie.genres),
              ],
              "movie-info-row",
            ),
            container(
              [
                movie.rating
                  ? i({
                    clazz: `fa fa-${getStarForRating(movie.rating)} movie-icon`,
                    title: "My rating",
                  })
                  : "",
                div(movie.rating, { title: "My Rating" }),
                movie.rating ? "|" : "",
                movie.imdb_rating
                  ? i({ clazz: "fa fa-imdb movie-icon", title: "IMDb rating" })
                  : "",
                div(movie.imdb_rating, { title: "IMDb Rating" }),
                movie.metascore
                  ? i({ clazz: "fa fa-ticket movie-icon", title: "Metascore" })
                  : "",
                div(movie.metascore, { title: "Metascore" }),
              ],
              "movie-info-row",
            ),
            div(movie.plot ?? "...", "movie-info-row"),
            container(
              [
                ...drawProps("directors", movie.directors),
                !isEmpty(movie.directors) ? "|" : "",
                ...drawProps("actors", movie.actors),
              ],
              "movie-info-row",
            ),
          ],
          "movie-info",
        ),
      ],
      { clazz: "movie", id: movie.id },
    )
  );

  movieRoot.append(...items);
  return movieRoot;
}

function draw(filters, sortBy, movies) {
  const root = document.getElementById("movie-list");
  root.innerHTML = "";

  const filteredMovies = movies
    .sort((a, b) => {
      if (sortBy) {
        if (a[sortBy] && b[sortBy]) {
          return b[sortBy] - a[sortBy];
        } else if (b[sortBy]) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .filter((movie) =>
      Object.entries(filters ?? {}).reduce((acc, pred) => {
        const [key, val] = pred;
        return acc && val.every((x) => (movie[key] ?? []).includes(x));
      }, true)
    );

  root.appendChild(drawFilters(filters));
  root.appendChild(drawMovies(filteredMovies));
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
  return FILTER;
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
.movie-todo {
  padding-left: 3px;
  padding-right: 3px;
}
.movie-plot {
}
.movie-info {
}
.movie-title {
  font-size: 1.3rem;
  cursor: pointer;
}
.comma {
  margin-right: 0.3rem;
}
.movie-icon {
  font-size: 1.5rem;
  margin-left: 0.3rem;
  margin-right: 0.3rem;
}
.spaced {
  justify-content: space-between;
}
.selected-prop {
  padding-left: 3px;
  padding-right: 3px;
  border: 2px solid;
  border-radius: 3px;
}
.selected-prop:hover {
  text-decoration: line-through;
}
.normal-prop {
  border: none;
}
.filters {
  margin-bottom: 1.3rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
}
.filter-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}
.sort-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;
  justify-content: flex-end;
}
.filter-title {
  text-transform: capitalize;
  font-weight: bold;
  margin-right: 0.3rem;
}
.filter-popup-outer {
  display: none;
  position: absolute;
  border: 1px solid;
  padding: 10px;
  background: white;
}
.filter-popup {
  max-height: 17rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex-wrap: none;
}
`;
document.head.appendChild(style);

init();
