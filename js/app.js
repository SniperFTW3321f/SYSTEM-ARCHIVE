/* ── CONFIG ── */
const DATA_URL = "./data/machines.json";

const CATEGORY_META = {
  cars:         { title: "Cars",          emoji: "🚗" },
  aircraft:     { title: "Aircraft",      emoji: "✈️" },
  airships:     { title: "Airships",      emoji: "🎈" },
  ships:        { title: "Ships",         emoji: "🚢" },
  military:     { title: "Military",      emoji: "🪖" },
  trains:       { title: "Trains",        emoji: "🚂" },
  motorcycles:  { title: "Motorcycles",   emoji: "🏍️" },
  space:        { title: "Space",         emoji: "🚀" },
  construction: { title: "Construction",  emoji: "🏗️" }
};

/* ── UTILS ── */
function qs(sel)  { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

function getParam(name) {
  return new URL(window.location.href).searchParams.get(name);
}

function safeText(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

/* ── DATA ── */
async function loadMachines() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load machines.json (HTTP ${res.status})`);
  return await res.json();
}

/* ── SEARCH ── */
function matchesText(machine, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = [
    machine.name,
    machine.manufacturer,
    machine.country,
    machine.category,
    machine.subcategory,
    machine.shortDescription,
    machine.fullDescription
  ].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q);
}

/* ── CARD ── */
function renderCard(machine) {
  const img = machine.images?.[0] ?? "";
  return `
    <a class="card" href="./machine.html?id=${encodeURIComponent(machine.id)}">
      <div class="card__media">
        ${img
          ? `<img src="${img}" alt="${safeText(machine.name)}" loading="lazy">`
          : `<div class="card__placeholder">No image</div>`
        }
      </div>
      <div class="card__body">
        <div class="card__title">${safeText(machine.name)}</div>
        <div class="card__meta">${safeText(machine.manufacturer)} &bull; ${safeText(machine.year)}</div>
        <div class="card__desc">${safeText(machine.shortDescription, "")}</div>
        <div class="chiprow">
          <span class="chip">${safeText(machine.category)}</span>
          ${machine.subcategory ? `<span class="chip chip--muted">${safeText(machine.subcategory)}</span>` : ""}
        </div>
      </div>
    </a>
  `;
}

/* ── HOME — category grid ── */
function renderHomeCategories(machines) {
  const el = qs("#categoryGrid");
  if (!el) return;

  const counts = machines.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  const keys = Object.keys(CATEGORY_META).filter(k => counts[k] > 0);

  el.innerHTML = keys.map(key => {
    const meta = CATEGORY_META[key];
    const count = counts[key] || 0;
    return `
      <a class="cat" href="./catalog.html?category=${encodeURIComponent(key)}">
        <div class="cat__emoji">${meta.emoji}</div>
        <div class="cat__title">${meta.title}</div>
        <div class="cat__count">${count} item${count !== 1 ? "s" : ""}</div>
      </a>
    `;
  }).join("");

  /* stats bar on home */
  const statsEl = qs("#statsBar");
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat"><div class="stat__num">${machines.length}</div><div class="stat__label">Total machines</div></div>
      <div class="stat"><div class="stat__num">${keys.length}</div><div class="stat__label">Categories</div></div>
      <div class="stat"><div class="stat__num">${new Set(machines.map(m => m.country).filter(Boolean)).size}</div><div class="stat__label">Countries</div></div>
    `;
  }
}

/* ── CATALOG — filters + grid ── */
function initCatalog(machines) {
  const grid     = qs("#resultsGrid");
  if (!grid) return;

  const searchEl  = qs("#searchInput");
  const catEl     = qs("#categorySelect");
  const subEl     = qs("#subcategorySelect");
  const countEl   = qs("#resultsCount");
  const sortEl    = qs("#sortSelect");

  /* populate category dropdown */
  const allCategories = Array.from(new Set(machines.map(m => m.category))).sort();
  catEl.innerHTML = `<option value="">All categories</option>` +
    allCategories.map(c => {
      const meta = CATEGORY_META[c];
      const label = meta ? `${meta.emoji} ${meta.title}` : c;
      return `<option value="${c}">${label}</option>`;
    }).join("");

  /* auto-select from URL param */
  const urlCat = getParam("category") || "";
  if (urlCat) catEl.value = urlCat;

  fillSubcategories(catEl.value);

  function fillSubcategories(category) {
    const subs = machines
      .filter(m => !category || m.category === category)
      .map(m => m.subcategory)
      .filter(Boolean);
    const unique = Array.from(new Set(subs)).sort();
    subEl.innerHTML = `<option value="">All subcategories</option>` +
      unique.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  function apply() {
    const q   = (searchEl?.value || "").trim();
    const c   = catEl?.value || "";
    const s   = subEl?.value || "";
    const srt = sortEl?.value || "name_asc";

    let filtered = machines.filter(m => {
      if (c && m.category    !== c) return false;
      if (s && m.subcategory !== s) return false;
      return matchesText(m, q);
    });

    /* sort */
    filtered.sort((a, b) => {
      switch (srt) {
        case "name_asc":  return safeText(a.name).localeCompare(safeText(b.name));
        case "name_desc": return safeText(b.name).localeCompare(safeText(a.name));
        case "year_asc":  return (a.year || 0) - (b.year || 0);
        case "year_desc": return (b.year || 0) - (a.year || 0);
        default: return 0;
      }
    });

    grid.innerHTML = filtered.length
      ? filtered.map(renderCard).join("")
      : `<div class="no-results">No machines found. Try a different search.</div>`;

    if (countEl) countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`;
  }

  catEl.addEventListener("change", () => {
    fillSubcategories(catEl.value);
    subEl.value = "";
    apply();
  });
  subEl?.addEventListener("change", apply);
  searchEl?.addEventListener("input", apply);
  sortEl?.addEventListener("change", apply);

  apply();
}

/* ── MACHINE — detail page ── */
function renderSpecsTable(specs) {
  if (!specs || typeof specs !== "object" || !Object.keys(specs).length) {
    return `<p class="muted">No specs available.</p>`;
  }
  const rows = Object.entries(specs).map(([k, v]) =>
    `<tr>
      <th>${safeText(k).replaceAll("_", " ")}</th>
      <td>${safeText(v)}</td>
    </tr>`
  ).join("");
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
        <h1>Machine not found</h1>
        <p class="muted">No machine with id: <code>${safeText(id, "(missing)")}</code></p>
        <a class="btn" href="./catalog.html" style="margin-top:14px">← Back to catalog</a>
      </div>
    `;
    return;
  }

  /* update page title */
  document.title = `${safeText(m.name)} • SYSTEM ARCHIVE`;

  /* images gallery */
  const imgs = (m.images || []).filter(Boolean);
  const galleryHTML = imgs.length
    ? `<div class="gallery">
        <img class="gallery__main" id="mainImg" src="${imgs[0]}" alt="${safeText(m.name)}">
        ${imgs.length > 1
          ? `<div class="gallery__thumbs">
              ${imgs.map((src, i) =>
                `<img class="thumb${i === 0 ? " active" : ""}" src="${src}" alt="image ${i+1}" data-src="${src}">`
              ).join("")}
            </div>`
          : ""}
      </div>`
    : `<div class="card__placeholder" style="height:300px;border-radius:14px;border:1px solid var(--line)">No image</div>`;

  /* sources */
  const sourcesHTML = (m.sources || []).length
    ? `<ul class="links">${(m.sources).map(s =>
        `<li><a href="${safeText(s.url,"#")}" target="_blank" rel="noreferrer">${safeText(s.title,"Source")}</a></li>`
      ).join("")}</ul>`
    : `<p class="muted">No sources yet.</p>`;

  root.innerHTML = `
    <div class="panel">
      <div class="crumbs">
        <a href="./index.html">Home</a>
        <span>›</span>
        <a href="./catalog.html?category=${encodeURIComponent(m.category)}">${safeText(m.category)}</a>
        <span>›</span>
        ${m.subcategory ? `<a href="./catalog.html?category=${encodeURIComponent(m.category)}">${safeText(m.subcategory)}</a><span>›</span>` : ""}
        <span>${safeText(m.name)}</span>
      </div>

      <div class="machine">
        <div class="machine__media">${galleryHTML}</div>

        <div class="machine__info">
          <h1>${safeText(m.name)}</h1>
          <div class="muted" style="margin-top:4px">
            ${safeText(m.manufacturer)} &bull; ${safeText(m.country)} &bull; ${safeText(m.year)}
          </div>

          <div class="chiprow">
            <span class="chip">${safeText(m.category)}</span>
            ${m.subcategory ? `<span class="chip chip--muted">${safeText(m.subcategory)}</span>` : ""}
          </div>

          <p style="margin-top:14px">${safeText(m.fullDescription, safeText(m.shortDescription, ""))}</p>

          <h2>Specifications</h2>
          ${renderSpecsTable(m.specs)}

          <h2>Sources</h2>
          ${sourcesHTML}

          <div style="margin-top:20px">
            <a class="btn" href="./catalog.html?category=${encodeURIComponent(m.category)}">← Back to ${safeText(m.category)}</a>
          </div>
        </div>
      </div>
    </div>
  `;

  /* thumbnail click → swap main image */
  qsa(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      qs("#mainImg").src = thumb.dataset.src;
      qsa(".thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
}

/* ── BOOT ── */
async function boot() {
  try {
    const machines = await loadMachines();
    renderHomeCategories(machines);
    initCatalog(machines);
    initMachine(machines);
  } catch (err) {
    const el = qs("#fatalError");
    if (el) el.textContent = `⚠ ${err.message}`;
    console.error(err);
  }
}

boot();
