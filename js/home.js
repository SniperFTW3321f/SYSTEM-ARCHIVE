"use strict";

const CATEGORIES = [
  { type: "Fighter Jet",      icon: "✈️",  name: "Fighter Jets"      },
  { type: "Cargo Plane",      icon: "📦",  name: "Cargo Planes"      },
  { type: "Passenger Plane",  icon: "🛫",  name: "Passenger Planes"  },
  { type: "Helicopter",       icon: "🚁",  name: "Helicopters"       },
  { type: "Bomber",           icon: "💣",  name: "Bombers"           },
  { type: "Attack Aircraft",  icon: "🎯",  name: "Attack Aircraft"   },
  { type: "Ship",             icon: "🚢",  name: "Ships"             },
  { type: "Submarine",        icon: "🤿",  name: "Submarines"        },
  { type: "Tank",             icon: "🪖",  name: "Tanks"             },
  { type: "APC / IFV",        icon: "🛡️",  name: "APC / IFV"        },
  { type: "Train",            icon: "🚄",  name: "Trains"            },
  { type: "Rocket / Space",   icon: "🚀",  name: "Rockets & Space"   },
  { type: "Drone / UAV",      icon: "🛸",  name: "Drones / UAV"      },
  { type: "Car",              icon: "🚗",  name: "Cars"              },
  { type: "Industrial",       icon: "⚙️",  name: "Industrial"        },
  { type: "Motorcycle",       icon: "🏍️",  name: "Motorcycles"       },
];

async function initHome() {
  document.getElementById("year").textContent = new Date().getFullYear();

  let data = [];
  try {
    const res = await fetch("data/machines.json", { cache: "no-store" });
    data = await res.json();
  } catch {
    document.getElementById("cat-grid").innerHTML = "<p style='color:var(--muted);padding:16px'>Failed to load data.</p>";
    return;
  }

  // Stats
  const countByType = {};
  const countries   = new Set();
  const eras        = new Set();

  data.forEach(item => {
    countByType[item.type] = (countByType[item.type] || 0) + 1;
    if (item.country) countries.add(item.country);
    if (item.era)     eras.add(item.era);
  });

  document.getElementById("stat-total").textContent     = data.length;
  document.getElementById("stat-cats").textContent      = Object.keys(countByType).length;
  document.getElementById("stat-countries").textContent = countries.size;
  document.getElementById("stat-eras").textContent      = eras.size;

  // Category cards
  const grid = document.getElementById("cat-grid");
  grid.innerHTML = CATEGORIES.map(cat => {
    const count = countByType[cat.type] || 0;
    if (count === 0) return "";
    const url = `catalog.html?type=${encodeURIComponent(cat.type)}`;
    return `
      <a class="cat-card" href="${url}">
        <div class="cat-card__icon">${cat.icon}</div>
        <div class="cat-card__name">${cat.name}</div>
        <div class="cat-card__count">${count} entr${count === 1 ? "y" : "ies"}</div>
      </a>
    `;
  }).join("");
}

initHome();
