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
  ["Status", "to"],
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

function i(clazz) {
  return el("i", "", clazz);
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

function getStarForRating(rating) {
  if (rating <= 5) {
    return "star-o";
  } else if (rating > 5 && rating <= 7) {
    return "star-half-o";
  }
  return "star";
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
    i("fa fa-sort-amount-desc"),
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
      container([
        div(movie.item, "movie-card-title"),
        container([
          movie.rating
            ? container([
              i(`fa fa-${getStarForRating(movie.rating)}`),
              div(movie.rating, ""),
            ], "movie-rating")
            : div(""),
          movie.year ? div(movie.year, "movie-year") : div(""),
        ], "movie-card-meta"),
        movie.runtime ? div(`${movie.runtime} min`, "movie-runtime") : div(""),
        drawMovieTodo(movie),
      ], "movie-card-overlay"),
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

function drawMovieTodo(movie) {
  const todo = movie.todo;
  const statusClass = {
    "DONE": "status-done",
    "PROG": "status-progress",
    "WAIT": "status-waiting",
    "TODO": "status-todo",
  }[todo] || "";

  return div(
    todo === "DONE" ? "✓" : todo === "PROG" ? "▶" : todo === "WAIT" ? "⏸" : "○",
    `movie-status ${statusClass}`,
  );
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
              i(`fa fa-${getStarForRating(movie.rating)}`),
              div(movie.rating),
            ], "detail-rating")
            : null,
          movie.imdb_rating
            ? container(
              [i("fa fa-imdb"), div(movie.imdb_rating)],
              "detail-rating",
            )
            : null,
          movie.metascore
            ? container(
              [i("fa fa-ticket"), div(movie.metascore)],
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
style.innerHTML = `/* ========================================
   CSS Custom Properties
   ======================================== */
:root {
  /* Colors */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-light: #eef2ff;
  --color-primary-muted: #e0e7ff;

  --color-text: #111827;
  --color-text-secondary: #374151;
  --color-text-muted: #6b7280;
  --color-text-faint: #9ca3af;

  --color-bg: #fff;
  --color-bg-subtle: #f9fafb;
  --color-bg-muted: #f3f4f6;
  --color-bg-overlay: #fafafa;

  --color-border: #e5e5e5;
  --color-border-input: #d1d5db;

  --color-success: #059669;
  --color-warning: #d97706;
  --color-info: #7c3aed;

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
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 10px 20px rgba(0, 0, 0, 0.12);

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
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.filter-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.filter-button {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: border-color var(--transition-base), color var(--transition-base);
}

.filter-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.sort-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-container select {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
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
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
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

.movie-card-overlay {
  position: absolute;
  inset: auto 0 0;
  padding: var(--space-lg) var(--space-md) var(--space-md);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.5) 70%, transparent);
  color: #fff;
  transform: translateY(calc(100% - 50px));
  transition: transform var(--transition-base);
}

.movie-card:hover .movie-card-overlay {
  transform: translateY(0);
}

.movie-card-title {
  margin-bottom: 6px;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

.movie-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
  font-size: var(--text-xs);
  opacity: 0.85;
}

.movie-rating {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.movie-runtime {
  font-size: 11px;
  opacity: 0.75;
}

.movie-status {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.status-done { color: var(--color-success); }
.status-progress { color: var(--color-warning); }
.status-waiting { color: var(--color-primary); }
.status-todo { color: var(--color-info); }

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
  background: rgba(0, 0, 0, 0.6);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: var(--modal-width);
  max-height: 60vh;
  padding: var(--space-2xl);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  overflow-x: hidden;
}

.modal-close {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  color: var(--color-text-faint);
  font-size: var(--text-2xl);
  line-height: 1;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--color-text-secondary);
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
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  transition: border-color var(--transition-base);
}

.modal-search:focus {
  outline: none;
  border-color: var(--color-primary);
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
  background: var(--color-primary);
  color: #fff;
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

.detail-rating i {
  color: var(--color-primary);
  font-size: var(--text-lg);
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
  background: #c7d2fe;
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
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

.selected-prop:hover {
  background: var(--color-primary);
  color: #fff;
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
  background: #c1c1c1;
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
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

  .filter-buttons,
  .sort-container {
    justify-content: flex-start;
  }

  .movie-card-title {
    font-size: var(--text-sm);
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
