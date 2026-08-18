// * State

let MOVIES = [];
let FILTER = {};
let SORT = null;
let CURRENT = null;

// * Constants

const SORTERS = {
  "isamert's rating": "rating",
  IMDb: "imdb_rating",
  Metascore: "metascore",
  "Added on": "created_at",
  Runtime: "runtime",
  Year: "year",
};

const FILTER_TYPES = [
  ["Genre", "genres"],
  ["Director", "directors"],
  ["Actor", "actors"],
  ["Status", "todo"],
  ["Country", "countries"],
  ["Tag", "tags"],
];

async function init() {
  await loadGlobals();
  draw(FILTER, SORT, MOVIES);
  if (CURRENT) {
    showMovieDetails(MOVIES.find((x) => x.imdb_id === CURRENT));
  }
}

async function loadGlobals() {
  const params = new URLSearchParams(window.location.search);

  CURRENT = params.get("id");
  FILTER = Object.fromEntries(FILTER_TYPES.map(x => [x[1], params.getAll(x[1])]))
  MOVIES = await fetch("assets/watchlist.json").then((response) =>
    response.json()
  );
  SORT = params.get("sort") ?? "rating";
}

// * JS Utils

function isString(x) {
  return typeof x === "string";
}

function isFunction(x) {
  return typeof x === "function";
}

function isEmpty(x) {
  return x == null || x.length == 0;
}

// * UI utils

function withDebounce(callback, delay) {
  let timeoutId;

  return function () {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback.apply(this, arguments);
    }, delay);
  };
}

// * UI Kit

function container(items, clazz) {
  const el = div(null, clazz);
  items?.forEach((x) => {
    el.appendChild(
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
  return el;
}

function div(text, clazz) {
  return el("div", text, clazz);
}

function h2(text, clazz) {
  return el("h2", text, clazz);
}

function a(text, href, clazz) {
  const x = el("a", text, clazz);
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
  const x = el("select", null, clazz);
  options.forEach((it) => x.add(isString(it) ? option(it) : it));
  return x;
}

function option(text, clazz) {
  const x = el("option", null, clazz);
  x.text = text;
  return x;
}

function img(src, clazz) {
  const x = el("img", null, clazz);
  x.src = src;
  return x;
}

function input(type, clazz) {
  const x = el("input", null, clazz);
  x.type = type;
  return x;
}

function button(text, onClick) {
  return el("button", text, {
    clazz: "filter-button",
    onclick: onClick,
  });
}

function el(type, text, clazz) {
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
        const shouldPrevent = !key.endsWith("!");
        let event = key.substring(2);
        if (!shouldPrevent) {
          event = event.slice(0, -1);
        }
        x.addEventListener(event, function (e) {
          if (shouldPrevent) {
            e.preventDefault();
          }
          val(e);
        });
      } else {
        x[key] = val;
      }
    });
  }
  return x;
}

function getRatingGlyph(rating) {
  if (rating <= 5) {
    return "☆";
  } else if (rating <= 7) {
    return "◐";
  }
  return "★";
}

// * Main UI

function drawProp(name, prop) {
  const self = a(prop, () => {
    draw(updateFilter({ [name]: prop }), SORT, MOVIES);
    const newElement = drawProp(name, prop);
    self.replaceWith(newElement);
  }, {
    clazz: FILTER[name]?.includes(prop) ? "selected-prop" : "normal-prop",
  });
  return self;
}

function drawProps(name, props) {
  return (props ?? [])
    .flatMap((prop) => [drawProp(name, prop)])
    .slice(0);
}

function drawFilters(filters, sortBy) {
  const root = container([], "filters-container");

  const activeFilters = container([], "active-filters");
  Object.entries(filters).forEach(([filter, values]) => {
    if (values.length > 0) {
      values.forEach((val) => {
        activeFilters.appendChild(
          container([
            div(val, "filter-tag-text"),
            div("×", {
              clazz: "filter-tag-remove",
              onclick: () =>
                draw(updateFilter({ [filter]: val }), SORT, MOVIES),
            }),
          ], "filter-tag"),
        );
      });
    }
  });

  const filterButtons = container(
    FILTER_TYPES.map((filter) =>
      button(filter[0], () => showFilterModal(filter[1]))
    ),
    "filter-buttons",
  );

  const sortCombo = select(Object.keys(SORTERS), {
    "onchange": (e) => {
      draw(FILTER, updateSort(SORTERS[e.target.value]), MOVIES);
    },
  });
  sortCombo.selectedIndex = Object.values(SORTERS).findIndex((x) =>
    x === sortBy
  );

  const sortContainer = container([
    div("⇅", "sort-glyph"),
    sortCombo,
  ], "sort-container");

  root.append(
    container([filterButtons, sortContainer], "filter-header"),
    activeFilters.children.length > 0 ? activeFilters : div(""),
  );

  return root;
}

function showFilterModal(filterType) {
  const items = [
    ...new Set(MOVIES.flatMap((movie) => {
      const x = movie[filterType];
      return Array.isArray(x) ? x : [x];
    })),
  ].filter((x) => x != null).sort();

  const modal = container([], "modal");
  const modalContent = container([], "modal-content");

  const searchInput = input("text", {
    placeholder: `Search ${filterType}...`,
    clazz: "modal-search",
    oninput: withDebounce((e) => {
      const filtered = items.filter((x) =>
        x?.toLowerCase().includes(e.target.value.toLowerCase())
      );
      itemsContainer.innerHTML = "";
      itemsContainer.append(
        ...filtered.map((x) => createModalItem(filterType, x)),
      );
    }, 200),
  });

  const itemsContainer = container(
    items.map((x) => createModalItem(filterType, x)),
    "modal-items",
  );

  const closeBtn = div("×", {
    clazz: "modal-close",
    onclick: () => modal.remove(),
  });

  modalContent.append(
    closeBtn,
    h2(filterType.charAt(0).toUpperCase() + filterType.slice(1)),
    searchInput,
    itemsContainer,
  );

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function createModalItem(filterType, value) {
  const isSelected = FILTER[filterType]?.includes(value);
  return div(value, {
    clazz: isSelected ? "modal-item selected" : "modal-item",
    onclick: () => {
      draw(updateFilter({ [filterType]: value }), SORT, MOVIES);
      document.querySelector(".modal")?.remove();
    },
  });
}

function drawMovies(movies) {
  const movieRoot = container([], "movies-grid");

  const items = movies.map((movie, index) =>
    container([
      img(movie.image || "assets/placeholder.jpg", {
        clazz: "movie-poster-img",
        onerror: function () {
          this.src = "assets/placeholder.jpg";
        },
      }),
      movie.rating
        ? container([
          div(getRatingGlyph(movie.rating), "rating-glyph"),
          div(movie.rating, "movie-rating-value"),
        ], "movie-rating-badge")
        : div(""),
    ], {
      clazz: "movie-card",
      id: movie.id,
      onclick: () => showMovieDetails(movie),
      style: `animation-delay: ${index * 0.05}s`,
    })
  );

  movieRoot.append(...items);
  return movieRoot;
}

function showMovieDetails(movie) {
  CURRENT = movie.imdb_id;
  updateURLParam("id", CURRENT);

  const modal = container([], "modal movie-detail-modal");
  const modalContent = container([], "modal-content detail-content");
  const onClose = () => {
    modal.remove();
    updateURLParam("id", null);
    CURRENT = null;
  };

  const closeBtn = div("×", {
    clazz: "modal-close",
    onclick: onClose,
  });

  modalContent.append(
    closeBtn,
    container([
      img(movie.image, "detail-poster"),
      container([
        h2(movie.item),
        container([
          movie.rating
            ? container([
              div(getRatingGlyph(movie.rating), "rating-glyph"),
              div(movie.rating),
            ], "detail-rating")
            : null,
          movie.imdb_rating
            ? container(
              [div("IMDb", "rating-source"), div(movie.imdb_rating)],
              "detail-rating",
            )
            : null,
          movie.metascore
            ? container(
              [div("M", "rating-source"), div(movie.metascore)],
              "detail-rating",
            )
            : null,
        ], "detail-ratings"),
        container([
          div(`${movie.year || ""}`, "detail-meta-text"),
          div("·", "detail-meta-text"),
          div(`${movie.runtime || ""} min`, "detail-meta-text"),
          div("·", "detail-meta-text"),
          ...drawProps("genres", movie.genres),
        ], "detail-meta"),
        div(movie.plot || "No plot available", "detail-plot"),
        !isEmpty(movie.directors)
          ? container([
            div("Directors: ", "detail-label"),
            ...drawProps("directors", movie.directors),
          ], "detail-row")
          : null,
        !isEmpty(movie.actors)
          ? container([
            div("Cast: ", "detail-label"),
            ...drawProps("actors", movie.actors),
          ], "detail-row")
          : null,
        container([
          movie.created_at ? div(`Added ← ${movie.created_at}`) : null,
          movie.closed ? div(`Finished → ${movie.closed}`) : null,
        ], "detail-date"),
      ], "detail-info"),
    ], "detail-layout"),
  );

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      onClose();
    }
  });
}

function draw(filters, sortBy, movies) {
  const root = document.getElementById("movie-list");
  root.innerHTML = "";

  const tryInt = (x) => parseInt();
  const filteredMovies = movies
    .toSorted((a, b) => {
      if (sortBy) {
        if (a[sortBy] && b[sortBy]) {
          const x = a[sortBy];
          const y = b[sortBy];
          if (isFinite(x) && isFinite(y)) {
            return y - x;
          } else if (x < y) {
            return 1;
          } else if (x > y) {
            return -1;
          }
          return 0;
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

  root.appendChild(drawFilters(filters, sortBy));
  root.appendChild(drawMovies(filteredMovies));
}

// * URL stuff

function updateURLParam(key, val) {
  const href = new URL(window.location.href);
  href.searchParams.delete(key);
  if (val) {
    if (Array.isArray(val)) {
      val.forEach((v) => href.searchParams.append(key, v));
    } else {
      href.searchParams.set(key, val);
    }
  }
  window.history.pushState({}, "", href);
}

function updateFilter(opts) {
  Object.entries(opts ?? {}).forEach((entry) => {
    const [key, val] = entry;
    const current = FILTER[key];
    const newVal = [
      ...new Set([
        ...(FILTER[key] ?? []).filter((x) => x !== val),
        ...(current?.includes(val) ? [] : [val]),
      ]),
    ];
    if (newVal != null && (!Array.isArray(newVal) || newVal.length > 0)) {
      FILTER[key] = newVal;
    } else {
      delete FILTER[key];
    }

    updateURLParam(key, FILTER[key]);
  });

  return FILTER;
}

function updateSort(sortBy) {
  SORT = sortBy;
  updateURLParam("sort", SORT);
  return SORT;
}

// * Style

const style = el("style");
style.innerHTML = `
:root {
  --color-primary: var(--accent);
  --color-primary-hover: var(--link-hover);
  --color-primary-light: rgb(var(--accent-rgb) / 0.12);
  --color-primary-muted: rgb(var(--accent-rgb) / 0.18);

  --color-text: var(--bright);
  --color-text-secondary: var(--text);
  --color-text-muted: var(--subtle);
  --color-text-faint: var(--muted);

  --color-bg: var(--bg);
  --color-bg-subtle: rgb(var(--accent-rgb) / 0.055);
  --color-bg-muted: var(--rule);
  --color-bg-overlay: var(--bg);

  --color-border: var(--rule);
  --color-border-input: var(--muted);

  --color-success: var(--syntax-addition);
  --color-warning: var(--syntax-variable);
  --color-info: var(--syntax-number);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;

  /* Typography */
  --text-xs: 0.75rem;
  --text-sm: 0.8125rem;
  --text-base: 0.875rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;

  --leading-tight: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgb(var(--accent-rgb) / 0.08);
  --shadow-md: 0 1px 3px rgb(var(--accent-rgb) / 0.14), 0 1px 2px rgb(var(--accent-rgb) / 0.08);
  --shadow-lg: 0 4px 12px rgb(var(--accent-rgb) / 0.16);
  --shadow-xl: 0 10px 20px rgb(var(--accent-rgb) / 0.2);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;

  /* Layout */
  --card-min-width: 180px;
  --modal-width: 480px;
  --modal-width-lg: 800px;
  --poster-width: 260px;
}

/* ========================================
   Base Layout
   ======================================== */
section:has(#movie-list) {
  max-width: 100%;
}

#movie-list {
  padding: var(--space-2xl);
  margin: 0;
}

/* ========================================
   Filters
   ======================================== */
.filters-container {
  position: relative;
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  background:
    linear-gradient(135deg, rgb(var(--accent-rgb) / 0.065), transparent 42%),
    linear-gradient(315deg, rgb(var(--coral-rgb) / 0.035), transparent 38%),
    var(--bg);
  border: 1px solid rgb(var(--accent-rgb) / 0.22);
  border-radius: var(--radius-lg);
  box-shadow:
    inset 0 1px rgb(var(--accent-rgb) / 0.08),
    0 8px 30px rgb(var(--accent-rgb) / 0.055);
}

.filters-container::before {
  content: "";
  position: absolute;
  top: -1px;
  right: 12%;
  left: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.55;
}

.filter-header {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.filter-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-xs);
  min-width: 0;
}

.filter-button {
  position: relative;
  padding: 7px 9px;
  color: var(--text);
  background: rgb(var(--accent-rgb) / 0.055);
  border: 1px solid rgb(var(--accent-rgb) / 0.32);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 10px rgb(var(--accent-rgb) / 0.035);
  font: var(--font-medium) var(--text-sm) var(--mono);
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    color var(--transition-base),
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-fast);
}

.filter-button:hover {
  color: var(--bright);
  background: rgb(var(--accent-rgb) / 0.13);
  border-color: var(--accent);
  box-shadow:
    inset 0 0 12px rgb(var(--accent-rgb) / 0.08),
    0 0 10px rgb(var(--accent-rgb) / 0.16);
  transform: translateY(-1px);
}

.filter-button:active {
  transform: translateY(0);
}

.filter-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.sort-container {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-xs);
}

.sort-container select {
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-sm);
  color-scheme: dark;
  font: var(--font-normal) var(--text-sm) var(--mono);
  cursor: pointer;
  transition: border-color var(--transition-base);
}

.sort-container select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Active Filters */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 10px;
  color: var(--bright);
  background: rgb(var(--accent-rgb) / 0.14);
  border: 1px solid rgb(var(--accent-rgb) / 0.48);
  border-radius: var(--radius-md);
  box-shadow:
    inset 0 0 10px rgb(var(--accent-rgb) / 0.07),
    0 0 8px rgb(var(--accent-rgb) / 0.1);
  font: var(--font-medium) var(--text-xs) var(--mono);
}

.filter-tag-remove {
  font-size: var(--text-base);
  line-height: 1;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.filter-tag-remove:hover {
  opacity: 1;
}

/* ========================================
   Movie Count
   ======================================== */
.movie-count {
  margin-bottom: var(--space-lg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-align: center;
}

/* ========================================
   Movies Grid
   ======================================== */
.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
  gap: var(--space-xl);
}

/* ========================================
   Movie Card
   ======================================== */
.movie-card {
  position: relative;
  aspect-ratio: 2 / 3;
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.movie-poster-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.movie-rating-badge {
  position: absolute;
  right: var(--space-sm);
  bottom: var(--space-sm);
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  color: var(--bright);
  background: color-mix(in srgb, var(--bg) 76%, transparent);
  border: 1px solid rgb(var(--accent-rgb) / 0.3);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--bg) 55%, transparent);
  font-family: var(--mono);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1;
  backdrop-filter: blur(5px);
}

.movie-rating-badge .rating-glyph {
  color: var(--coral);
  font-size: 0.9rem;
  line-height: 1;
  opacity: 1;
  transform: translateY(-1px);
}

.movie-rating-value {
  opacity: 0.92;
}

/* ========================================
   Modal Base
   ======================================== */
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  backdrop-filter: blur(5px);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: var(--modal-width);
  max-height: 60vh;
  padding: var(--space-2xl);
  background: color-mix(in srgb, var(--bg) 82%, var(--rule));
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  box-shadow:
    0 18px 60px color-mix(in srgb, var(--bg) 72%, transparent),
    0 0 24px rgb(var(--accent-rgb) / 0.16);
  overflow-y: auto;
  overflow-x: hidden;
}

.modal-close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--color-text-faint);
  font-size: 2.25rem;
  line-height: 1;
  cursor: pointer;
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.modal-close:hover {
  color: var(--color-primary);
  transform: scale(1.12);
}

.modal-content h2 {
  margin: 0 0 var(--space-xl);
  color: var(--color-text);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
}

.modal-search {
  width: 95%;
  margin-bottom: var(--space-md);
  padding: 10px var(--space-md);
  color: var(--color-text);
  caret-color: var(--color-primary);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  transition: border-color var(--transition-base), background var(--transition-base);
}

.modal-search::placeholder {
  color: var(--color-text-faint);
}

.modal-search:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-bg);
}

.modal-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.modal-item {
  padding: 10px var(--space-md);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.modal-item:hover {
  background: var(--color-bg-muted);
}

.modal-item.selected {
  color: var(--bright);
  background: rgb(var(--accent-rgb) / 0.14);
  border-color: rgb(var(--accent-rgb) / 0.48);
  box-shadow: inset 0 0 12px rgb(var(--accent-rgb) / 0.07);
}

/* ========================================
   Movie Detail Modal
   ======================================== */
.movie-detail-modal .modal-content {
  max-width: var(--modal-width-lg);
  padding: 0;
}

.detail-layout {
  display: flex;
  gap: var(--space-2xl);
  padding: var(--space-2xl);
}

.detail-poster {
  flex-shrink: 0;
  width: var(--poster-width);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.detail-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-md);
}

.detail-info h2 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
}

.detail-ratings {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.detail-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px var(--space-md);
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.detail-rating .rating-glyph,
.detail-rating .rating-source {
  color: var(--color-primary);
  font-size: var(--text-lg);
}

.detail-rating .rating-source {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.detail-plot {
  padding: var(--space-md);
  background: var(--color-bg-subtle);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: var(--text-base);
  line-height: 1.8;
}

.detail-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-semibold);
}

.detail-date {
  margin-top: auto;
  color: var(--color-text-faint);
  font-size: var(--text-xs);
}

/* ========================================
   Props & Tags
   ======================================== */
.detail-meta-text {
  display: inline-block;
  padding: var(--space-xs) 0;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  line-height: 1.4;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.detail-row a,
.normal-prop,
.selected-prop {
  display: inline-block;
  padding: var(--space-xs) 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  line-height: 1.4;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.detail-row a {
  background: var(--color-primary-muted);
  color: var(--color-primary-hover);
}

.detail-row a:hover {
  background: rgb(var(--accent-rgb) / 0.3);
}

.normal-prop {
  padding: var(--space-xs) 10px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
}

.normal-prop:hover {
  color: var(--color-primary);
}

.selected-prop {
  color: var(--bright);
  background: rgb(var(--accent-rgb) / 0.14);
  border: 1px solid rgb(var(--accent-rgb) / 0.48);
  box-shadow: inset 0 0 10px rgb(var(--accent-rgb) / 0.07);
}

.selected-prop:hover {
  color: var(--link-hover);
  background: rgb(var(--accent-rgb) / 0.22);
  border-color: var(--accent);
  box-shadow: 0 0 8px rgb(var(--accent-rgb) / 0.14);
  text-decoration: none;
}

// ========================================
   Scrollbar
   ======================================== //
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-muted);
}

::-webkit-scrollbar-thumb {
  background: var(--rule);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

// ========================================
   Responsive - Tablet
   ======================================== //
@media (max-width: 768px) {
  :root {
    --card-min-width: 140px;
    --poster-width: 100%;
  }

  #movie-list {
    padding: var(--space-lg);
  }

  .movies-grid {
    gap: var(--space-md);
  }

  .detail-layout {
    flex-direction: column;
    padding: var(--space-xl);
  }

  .detail-poster {
    max-width: 300px;
    margin: 0 auto;
  }

  .detail-info h2 {
    font-size: var(--text-xl);
  }
}

// ========================================
   Responsive - Mobile
   ======================================== //
@media (max-width: 480px) {
  #movie-list {
    padding: var(--space-md);
  }

  .filters-container {
    padding: var(--space-md);
  }

  .filter-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-buttons {
    flex-wrap: wrap;
  }

  .filter-buttons,
  .sort-container {
    justify-content: flex-start;
  }


  .modal-content {
    width: 95%;
    padding: var(--space-lg);
    border-radius: var(--radius-md);
  }

  .detail-layout {
    padding: var(--space-lg);
  }

  .detail-ratings {
    gap: var(--space-sm);
  }

  .detail-rating {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
  }
}
`;

void document.head.appendChild(style);

// * Main

void init();
