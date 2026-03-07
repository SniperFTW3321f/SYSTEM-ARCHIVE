/* ══════════════════════════════════════════
   SYSTEM ARCHIVE — app.js
   ══════════════════════════════════════════ */

const DATA_URL = "./data/machines.json";

const CATEGORY_META = {
  cars:         { title: "Cars",         emoji: "🚗" },
  aircraft:     { title: "Aircraft",     emoji: "✈️" },
  airships:     { title: "Airships",     emoji: "🛸" },
  ships:        { title: "Ships",        emoji: "🚢" },
  military:     { title: "Military",     emoji: "⚔️" },
  trains:       { title: "Trains",       emoji: "🚂" },
  motorcycles:  { title: "Motorcycles",  emoji: "🏍️" },
  space:        { title: "Space",        emoji: "🚀" },
  construction: { title: "Construction", emoji: "🏗️" }
};

/* ─────────────────────────────────────────
   UTILS
───────────────────────────────────────── */
const qs  = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

const getParam = name => new URL(window.location.href).searchParams.get(name);

function safeText(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s || fallback;
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&",  "&amp;")
    .replaceAll("<",  "&lt;")
    .replaceAll(">",  "&gt;")
    .replaceAll('"',  "&quot;")
    .replaceAll("'",  "&#39;");
}

const normKey  = s => safeText(s, "").toLowerCase().trim();
const hasPhoto = m => Array.isArray(m.images) && m.images.length > 0 && safeText(m.images[0], "") !== "";

function categoryLabel(cat) {
  const meta = CATEGORY_META[cat];
  return meta ? `${meta.emoji} ${meta.title}` : cat;
}

/* ─────────────────────────────────────────
   IMAGE ERROR HANDLERS  (no inline JSON.stringify)
───────────────────────────────────────── */
window._cardImgError = function(img) {
  const media = img.closest(".card__media");
  if (!media) return;
  media.innerHTML = `
    <div class="placeholder">
      <div>
        <div class="placeholder__name">${img.dataset.name || ""}</div>
        <div class="placeholder__sub">${img.dataset.cat  || ""}</div>
      </div>
    </div>`;
};

window._mainImgError = function(img) {
  const wrap = img.parentElement;
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="placeholder" style="aspect-ratio:16/10;min-height:220px">
      <div>
        <div class="placeholder__name">${img.dataset.name || ""}</div>
        <div class="placeholder__sub">${img.dataset.cat  || ""}</div>
      </div>
    </div>`;
};

window._thumbError = function(img) {
  img.remove();
};

/* ─────────────────────────────────────────
   LOAD DATA
───────────────────────────────────────── */
async function loadMachines() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load machines.json (HTTP ${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("machines.json must be an array");
  return data.map(m => ({
    ...m,
    category:    normKey(m.category),
    subcategory: safeText(m.subcategory, "").trim(),
    year:        Number.isFinite(+m.year) ? +m.year : (m.year ?? null),
    images:      Array.isArray(m.images) ? m.images.filter(Boolean) : []
  }));
}

/* ─────────────────────────────────────────
   SEARCH / FILTER
───────────────────────────────────────── */
function matchesText(m, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = [
    m.name, m.manufacturer, m.country,
    m.category, m.subcategory,
    m.shortDescription, m.fullDescription
  ].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q);
}

/* ─────────────────────────────────────────
   CARD RENDER
───────────────────────────────────────── */
function renderPlaceholder(m) {
  return `
    <div class="placeholder">
      <div>
        <div class="placeholder__name">${esc(safeText(m.name))}</div>
        <div class="placeholder__sub">${esc(categoryLabel(m.category))}</div>
      </div>
    </div>`;
}

function renderCard(m) {
  const imgSrc = m.images?.[0] ?? "";
  const safeName = esc(safeText(m.name));
  const safeCat  = esc(categoryLabel(m.category));

  const media = imgSrc
    ? `<img
         src="${esc(imgSrc)}"
         alt="${safeName}"
         loading="lazy"
         decoding="async"
         data-name="${safeName}"
         data-cat="${safeCat}"
         onerror="_cardImgError(this)"
       />`
    : renderPlaceholder(m);

  return `
    <a class="card" href="./machine.html?id=${encodeURIComponent(m.id)}">
      <div class="card__media">${media}</div>
      <div class="card__body">
        <div class="card__title">${safeName}</div>
        <div class="card__meta">
          ${esc(safeText(m.manufacturer, ""))}
          ${m.year ? `&bull; ${esc(m.year)}` : ""}
        </div>
        <div class="card__desc">${esc(safeText(m.shortDescription, ""))}</div>
        <div class="chiprow">
          <span class="chip">${esc(safeText(m.category))}</span>
          ${m.subcategory
            ? `<span class="chip chip--muted">${esc(m.subcategory)}</span>`
            : ""}
        </div>
      </div>
    </a>`;
}

/* ─────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────── */
function renderHome(machines) {

  /* Category grid */
  const catGrid = qs("#categoryGrid");
  if (catGrid) {
    const counts = machines.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});

    catGrid.innerHTML = Object.keys(CATEGORY_META).map(k => {
      const meta  = CATEGORY_META[k];
      const count = counts[k] || 0;
      return `
        <a class="cat" href="./catalog.html?category=${encodeURIComponent(k)}">
          <div class="cat__emoji">${meta.emoji}</div>
          <div class="cat__title">${esc(meta.title)}</div>
          <div class="cat__count">${count} item${count === 1 ? "" : "s"}</div>
        </a>`;
    }).join("");
  }

  /* Stats bar */
  const statsEl = qs("#statsBar");
  if (statsEl) {
    const catUsed    = new Set(machines.map(m => m.category)).size;
    const countries  = new Set(machines.map(m => m.country).filter(Boolean)).size;
    const withPhotos = machines.filter(hasPhoto).length;

    statsEl.innerHTML = `
      <div class="stat">
        <div class="stat__num">${machines.length}</div>
        <div class="stat__label">Total machines</div>
      </div>
      <div class="stat">
        <div class="stat__num">${catUsed}</div>
        <div class="stat__label">Categories</div>
      </div>
      <div class="stat">
        <div class="stat__num">${countries}</div>
        <div class="stat__label">Countries</div>
      </div>
      <div class="stat">
        <div class="stat__num">${withPhotos}</div>
        <div class="stat__label">With photos</div>
      </div>`;
  }

  /* Newest grid */
  const newestEl = qs("#newestGrid");
  if (newestEl) {
    const sorted = [...machines].sort((a, b) => (b.year || 0) - (a.year || 0));
    newestEl.innerHTML = sorted.slice(0, 6).map(renderCard).join("");
  }
}

/* ─────────────────────────────────────────
   CATALOG PAGE
───────────────────────────────────────── */
function initCatalog(machines) {
  const grid = qs("#resultsGrid");
  if (!grid) return;

  const searchEl     = qs("#searchInput");
  const catEl        = qs("#categorySelect");
  const subEl        = qs("#subcategorySelect");
  const sortEl       = qs("#sortSelect");
  const onlyPhotosEl = qs("#onlyWithPhotos");
  const countEl      = qs("#resultsCount");

  /* Populate category dropdown */
  catEl.innerHTML =
    `<option value="">All categories</option>` +
    Object.keys(CATEGORY_META)
      .map(c => `<option value="${esc(c)}">${esc(categoryLabel(c))}</option>`)
      .join("");

  /* Auto-select from URL param */
  const urlCat = normKey(getParam("category") || "");
  if (urlCat) catEl.value = urlCat;

  function fillSubcats(category) {
    const subs = machines
      .filter(m => !category || m.category === category)
      .map(m => m.subcategory)
      .filter(Boolean);
    const uniq = Array.from(new Set(subs)).sort((a, b) => a.localeCompare(b));
    subEl.innerHTML =
      `<option value="">All subcategories</option>` +
      uniq.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  }

  fillSubcats(catEl.value);

  function apply() {
    const q          = safeText(searchEl?.value, "").trim();
    const c          = normKey(catEl?.value || "");
    const s          = safeText(subEl?.value, "").trim();
    const onlyPhotos = !!onlyPhotosEl?.checked;
    const sort       = safeText(sortEl?.value, "name_asc");

    let filtered = machines.filter(m => {
      if (c && m.category    !== c) return false;
      if (s && m.subcategory !== s) return false;
      if (onlyPhotos && !hasPhoto(m)) return false;
      return matchesText(m, q);
    });

    filtered.sort((a, b) => {
      const an = safeText(a.name), bn = safeText(b.name);
      const ay = a.year || 0,      by = b.year || 0;
      switch (sort) {
        case "name_desc": return bn.localeCompare(an);
        case "year_desc": return by - ay;
        case "year_asc":  return ay - by;
        default:          return an.localeCompare(bn);
      }
    });

    grid.innerHTML = filtered.length
      ? filtered.map(renderCard).join("")
      : `<div class="no-results">No machines found. Try a different search.</div>`;

    if (countEl)
      countEl.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
  }

  catEl.addEventListener("change", () => { fillSubcats(catEl.value); subEl.value = ""; apply(); });
  subEl?.addEventListener("change", apply);
  searchEl?.addEventListener("input", apply);
  sortEl?.addEventListener("change", apply);
  onlyPhotosEl?.addEventListener("change", apply);

  apply();
}

/* ─────────────────────────────────────────
   MACHINE DETAIL PAGE
───────────────────────────────────────── */
function renderSpecsTable(specs) {
  if (!specs || typeof specs !== "object" || !Object.keys(specs).length)
    return `<div class="muted">No specs yet.</div>`;

  const rows = Object.entries(specs).map(([k, v]) => `
    <tr>
      <th>${esc(String(k).replaceAll("_", " "))}</th>
      <td>${esc(safeText(v))}</td>
    </tr>`).join("");

  return `<table class="specs"><tbody>${rows}</tbody></table>`;
}

function initMachine(machines) {
  const root = qs("#machineRoot");
  if (!root) return;

  const id = getParam("id");
  const m  = machines.find(x => x.id === id);

  if (!m) {
    root.innerHTML = `
      <div class="panel">
        <h1>Not found</h1>
        <p class="muted">No machine with id: <code>${esc(safeText(id, "(missing)"))}</code></p>
        <div style="margin-top:14px">
          <a class="btn" href="./catalog.html">← Back to catalog</a>
        </div>
      </div>`;
    return;
  }

  document.title = `${safeText(m.name)} • SYSTEM ARCHIVE`;

  const imgs     = (m.images || []).filter(Boolean);
  const safeName = esc(safeText(m.name));
  const safeCat  = esc(categoryLabel(m.category));

  /* Gallery */
  const gallery = imgs.length
    ? `
      <div class="gallery">
        <div class="gallery__main-wrap">
          <img
            class="gallery__main"
            id="mainImg"
            src="${esc(imgs[0])}"
            alt="${safeName}"
            data-name="${safeName}"
            data-cat="${safeCat}"
            onerror="_mainImgError(this)"
          />
        </div>
        ${imgs.length > 1 ? `
          <div class="gallery__thumbs">
            ${imgs.map((src, i) => `
              <img
                class="thumb${i === 0 ? " active" : ""}"
                src="${esc(src)}"
                alt="thumb ${i + 1}"
                data-src="${esc(src)}"
                onerror="_thumbError(this)"
              />`).join("")}
          </div>` : ""}
      </div>`
    : `
      <div class="gallery">
        <div class="gallery__main-wrap">
          ${renderPlaceholder(m)}
        </div>
      </div>`;

  /* Sources */
  const sourcesHTML = (m.sources || []).length
    ? `<ul class="links">
        ${m.sources.map(s => `
          <li>
            <a href="${esc(safeText(s.url, "#"))}" target="_blank" rel="noreferrer">
              ${esc(safeText(s.title, "Source"))}
            </a>
          </li>`).join("")}
      </ul>`
    : `<div class="muted">No sources yet.</div>`;

  root.innerHTML = `
    <div class="panel">

      <div class="crumbs">
        <a href="./index.html">Home</a>
        <span>›</span>
        <a href="./catalog.html?category=${encodeURIComponent(m.category)}">
          ${esc(categoryLabel(m.category))}
        </a>
        ${m.subcategory ? `<span>›</span><span>${esc(m.subcategory)}</span>` : ""}
        <span>›</span>
        <span>${safeName}</span>
      </div>

      <div class="machine">

        <div>${gallery}</div>

        <div class="machine__info">
          <h1>${safeName}</h1>
          <div class="muted" style="margin-top:4px">
            ${esc(safeText(m.manufacturer, ""))}
            ${m.country ? `&bull; ${esc(m.country)}` : ""}
            ${m.year    ? `&bull; ${esc(m.year)}`    : ""}
          </div>

          <div class="chiprow" style="margin-top:10px">
            <span class="chip">${esc(safeText(m.category))}</span>
            ${m.subcategory
              ? `<span class="chip chip--muted">${esc(m.subcategory)}</span>`
              : ""}
          </div>

          <p style="margin-top:14px">
            ${esc(safeText(m.fullDescription, m.shortDescription || ""))}
          </p>

          <h2>Specifications</h2>
          ${renderSpecsTable(m.specs)}

          <h2>Sources</h2>
          ${sourcesHTML}

          <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn--ghost"
               href="./catalog.html?category=${encodeURIComponent(m.category)}">
              ← Back to ${esc(safeText(m.category))}
            </a>
            <a class="btn" href="./catalog.html">All catalog</a>
          </div>
        </div>

      </div>
    </div>`;

  /* Thumbnail click → swap main image */
  qsa(".thumb").forEach(t => {
    t.addEventListener("click", () => {
      const main = qs("#mainImg");
      if (!main) return;
      main.src = t.dataset.src;
      qsa(".thumb").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
    });
  });
}

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
async function boot() {
  try {
    const machines = await loadMachines();
    renderHome(machines);
    initCatalog(machines);
    initMachine(machines);
  } catch (err) {
    const el = qs("#fatalError");
    if (el) el.textContent = `⚠ ${err.message}`;
    console.error("[SYSTEM ARCHIVE]", err);
  }
}

boot();
