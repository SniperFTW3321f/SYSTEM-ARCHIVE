"use strict";

// ── DOM ──
const qInput      = document.getElementById("q");
const typeSelect  = document.getElementById("f-type");
const countrySelect=document.getElementById("f-country");
const eraSelect   = document.getElementById("f-era");
const statusSelect= document.getElementById("f-status");
const resetBtn    = document.getElementById("reset");
const chipsEl     = document.getElementById("chips");
const gridEl      = document.getElementById("grid");
const emptyEl     = document.getElementById("empty");
const countEl     = document.getElementById("count");

// ── STATE ──
const state = { all: [], q: "", type: "all", country: "all", era: "all", status: "all" };

// ── URL PARAMS ──
function readParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.get("q"))       state.q       = p.get("q");
  if (p.get("type"))    state.type    = p.get("type");
  if (p.get("country")) state.country = p.get("country");
  if (p.get("era"))     state.era     = p.get("era");
}

// ── HELPERS ──
function norm(s) { return String(s ?? "").toLowerCase().trim(); }
function unique(arr) { return Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>a.localeCompare(b)); }

function matches(item) {
  const q   = norm(state.q);
  const hay = norm([item.name, item.type, item.manufacturer, item.country, item.role, item.class, (item.tags||[]).join(" ")].join(" "));
  return (
    (!q                || hay.includes(q))                         &&
    (state.type    === "all" || item.type    === state.type)       &&
    (state.country === "all" || item.country === state.country)    &&
    (state.era     === "all" || item.era     === state.era)        &&
    (state.status  === "all" || item.status  === state.status)
  );
}

// ── PAGE META (title + heading) ──
function updateMeta() {
  const ICONS = {
    "Fighter Jet":"✈️","Cargo Plane":"📦","Passenger Plane":"🛫","Helicopter":"🚁",
    "Bomber":"💣","Attack Aircraft":"🎯","Ship":"🚢","Submarine":"🤿","Car":"🚗",
    "Tank":"🪖","APC / IFV":"🛡️","Train":"🚄","Rocket / Space":"🚀",
    "Drone / UAV":"🛸","Industrial":"⚙️","Motorcycle":"🏍️"
  };
  const DESCS = {
    "Fighter Jet":     "Air superiority and multirole combat aircraft from around the world.",
    "Cargo Plane":     "Strategic and tactical heavy-lift transport aircraft.",
    "Passenger Plane": "Commercial airliners from regional jets to wide-body giants.",
    "Helicopter":      "Attack, utility, and transport rotary-wing aircraft.",
    "Bomber":          "Strategic and tactical bomber aircraft.",
    "Attack Aircraft": "Close air support and ground-attack aircraft.",
    "Ship":            "Destroyers, carriers, battlecruisers and more.",
    "Submarine":       "Nuclear and diesel-electric submarines.",
    "Car":             "Hypercars, supercars and high-performance road machines.",
    "Tank":            "Main battle tanks from the Cold War to today.",
    "APC / IFV":       "Armored personnel carriers and infantry fighting vehicles.",
    "Train":           "High-speed rail and bullet trains.",
    "Rocket / Space":  "Launch vehicles and spacecraft.",
    "Drone / UAV":     "Unmanned aerial vehicles for ISR and strike missions.",
    "Industrial":      "Heavy machinery, mining equipment and industrial giants.",
    "Motorcycle":      "High-performance and racing motorcycles.",
  };

  const t    = state.type;
  const icon = ICONS[t] || "🗂";
  const lbl  = t === "all" ? "Full Catalog" : t;
  const desc = t === "all"
    ? "Browse all entries across every category, country, and era."
    : (DESCS[t] || "");

  document.getElementById("page-title").textContent       = `SYSTEM ARCHIVE — ${lbl}`;
  document.getElementById("page-heading").textContent     = t === "all" ? "Full Catalog" : `${icon} ${lbl}`;
  document.getElementById("page-desc").textContent        = desc;
  document.getElementById("breadcrumb-current").textContent = lbl;
  document.getElementById("results-heading").textContent  = t === "all" ? "All Machines" : lbl;
}

// ── RENDER ──
function render() {
  updateMeta();
  const filtered = state.all.filter(matches);
  countEl.textContent = `${filtered.length} / ${state.all.length} entries`;

  if (filtered.length === 0) {
    gridEl.innerHTML = "";
    emptyEl.hidden   = false;
    return;
  }
  emptyEl.hidden = true;

  gridEl.innerHTML = filtered.map((item, i) => `
    <article class="card" style="animation-delay:${Math.min(i,20) * 0.03}s">
      <div class="card__top">
        <div class="kicker">
          <span class="badge badge--type">${item.type}</span>
          <span class="badge badge--country">${item.country}</span>
          ${item.year ? `<span class="badge">${item.year}</span>` : ""}
        </div>
        <h3 class="card__title">${item.name}</h3>
        <p class="card__role">
          ${item.manufacturer ? `<strong>${item.manufacturer}</strong> &mdash; ` : ""}
          ${item.role || "&mdash;"}
        </p>
      </div>
      <div class="card__bottom">
        <div class="spec"><span>Status</span><strong>${item.status || "—"}</strong></div>
        <div class="spec"><span>Era</span><strong>${item.era || "—"}</strong></div>
        <div class="spec"><span>Class</span><strong>${item.class || "—"}</strong></div>
      </div>
    </article>
  `).join("");
}

// ── COUNTRY DROPDOWN ──
function fillCountries() {
  const countries = unique(state.all.map(x => x.country));
  countrySelect.innerHTML =
    `<option value="all">All countries</option>` +
    countries.map(c => `<option value="${c}">${c}</option>`).join("");
}

// ── SET TYPE (chip + select sync) ──
function setType(val) {
  state.type       = val;
  typeSelect.value = val;
  document.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("is-active", c.dataset.type === val);
  });
  render();
}

// ── INIT ──
async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();
  readParams();

  try {
    const res = await fetch("data/machines.json", { cache: "no-store" });
    state.all = await res.json();
  } catch {
    countEl.textContent = "⚠ Could not load data/machines.json";
    return;
  }

  fillCountries();

  // Apply URL params to form inputs
  qInput.value        = state.q;
  typeSelect.value    = state.type;
  countrySelect.value = state.country;
  eraSelect.value     = state.era;

  // Sync chips with URL type
  document.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("is-active", c.dataset.type === state.type);
  });

  render();

  // Events
  qInput.addEventListener("input",       e => { state.q       = e.target.value; render(); });
  typeSelect.addEventListener("change",  e => { setType(e.target.value); });
  countrySelect.addEventListener("change",e=>{ state.country  = e.target.value; render(); });
  eraSelect.addEventListener("change",   e => { state.era     = e.target.value; render(); });
  statusSelect.addEventListener("change",e => { state.status  = e.target.value; render(); });

  resetBtn.addEventListener("click", () => {
    state.q = ""; state.type = "all"; state.country = "all"; state.era = "all"; state.status = "all";
    qInput.value = ""; countrySelect.value = "all"; eraSelect.value = "all"; statusSelect.value = "all";
    setType("all");
    window.history.replaceState({}, "", "catalog.html");
  });

  chipsEl.addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (btn) setType(btn.dataset.type);
  });
}

init();
