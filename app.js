/* ============================================================
   Ethan van Oost — apps site
   Client-side auth (localStorage) + UI interactions.
   NOTE: This is front-end only. There is no server, so this is
   NOT real security — it only gates the page on this device.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- App catalog ---------- */
  const APPS = [
    {
      id: "cubelands",
      title: "Cubelands",
      tag: "Voxel sandbox",
      iconClass: "icon-cubelands",
      icon: "▦",
      desc: "Build, mine, and explore in an endless voxel world. Shape the terrain block by block in a sandbox made for creativity.",
      file: "downloads/CubelandsLauncher.exe",
      size: "138 KB",
      version: "1.0",
      updated: "Jun 2026",
      pills: ["Sandbox", "Voxel", "Launcher"],
      btn: "Download Launcher",
      features: [
        "Endless, procedurally generated voxel worlds",
        "Place and break blocks to build anything",
        "Creative and survival play styles",
        "Dynamic day/night cycle and lighting",
        "Smart launcher that manages game versions and updates",
      ],
    },
    {
      id: "filey",
      title: "Filey",
      tag: "Modern file explorer",
      iconClass: "icon-filey",
      icon: "🗂",
      desc: "A modern & easy file explorer for Windows. Browse, organize, and manage your files with a clean, fast interface.",
      file: "downloads/Filey.exe",
      size: "10.6 MB",
      version: "1.0",
      updated: "Jun 2026",
      pills: ["Productivity", "Tabs", "Fast"],
      btn: "Download",
      features: [
        "Tabbed browsing — multiple folders in one window",
        "Instant search to find files fast",
        "Clean, modern interface that stays out of your way",
        "Quick file preview without opening apps",
        "Drag & drop plus bulk move, copy and rename",
      ],
    },
    {
      id: "ytc",
      title: "Youtube Converter",
      tag: "Playlist & video converter",
      iconClass: "icon-ytc",
      icon: "▶",
      desc: "Convert playlists and videos into PNG (thumbnail), MP3 (sound only), MP4 (sound + video), and OGG (sound only).",
      file: "downloads/YoutubeConverter.exe",
      size: "59.5 MB",
      version: "1.0",
      updated: "Jun 2026",
      pills: ["MP3", "MP4", "OGG", "PNG"],
      btn: "Download",
      features: [
        "Convert whole playlists or single videos",
        "Export MP3 or OGG for audio-only",
        "Export MP4 for sound + video",
        "Grab the video thumbnail as a PNG",
        "Batch process many items at once",
      ],
    },
  ];

  /* ---------- Favorites ---------- */
  const FAVS_KEY = "evo_favs";
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch (e) { return []; }
  }
  function isFav(id) { return getFavs().includes(id); }
  function toggleFav(id) {
    const favs = getFavs();
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1); else favs.push(id);
    localStorage.setItem(FAVS_KEY, JSON.stringify(favs));
    return i < 0; // true when it is now a favorite
  }

  /* ---------- Download counts (shared across users on this device) ---------- */
  const DOWNLOADS_KEY = "evo_downloads";
  function getDownloads() {
    try { return JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || "{}"); } catch (e) { return {}; }
  }
  function dlCount(id) { return getDownloads()[id] || 0; }
  function bumpDownload(id) {
    const d = getDownloads();
    d[id] = (d[id] || 0) + 1;
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(d));
    return d[id];
  }
  function dlLabel(id) {
    const n = dlCount(id);
    return "⬇ " + n.toLocaleString() + (n === 1 ? " download" : " downloads");
  }

  // Parse a human size like "10.6 MB" into bytes, for sorting.
  function sizeToBytes(str) {
    const m = /([\d.]+)\s*(KB|MB|GB)/i.exec(str || "");
    if (!m) return 0;
    const unit = m[2].toUpperCase();
    const mult = unit === "GB" ? 1e9 : unit === "MB" ? 1e6 : 1e3;
    return parseFloat(m[1]) * mult;
  }

  /* ---------- Element refs ---------- */
  const $ = (s) => document.querySelector(s);
  const appScreen = $("#app");

  /* ---------- Theme ---------- */
  const THEME_KEY = "evo_theme";
  const themeToggle = $("#themeToggle");
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "☀" : "🌙";
    themeToggle.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => (t.hidden = true), 300);
    }, 2600);
  }

  /* ---------- Render app cards ---------- */
  const grid = $("#appsGrid");
  function renderCards(list) {
    grid.innerHTML = "";
    if (!list.length) {
      const msg = view.favOnly && !view.q
        ? "No favorites yet — tap the ★ on an app to save it here."
        : "No apps match your search.";
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:40px;">${msg}</p>`;
      return;
    }
    list.forEach((app) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <button class="fav-btn ${isFav(app.id) ? "on" : ""}" type="button" aria-label="Toggle favorite" aria-pressed="${isFav(app.id)}" title="Favorite">★</button>
        <div class="card-icon ${app.iconClass}">${app.icon}</div>
        <h2 class="card-title">${app.title}</h2>
        <p class="card-tag">${app.tag}</p>
        <p class="card-desc">${app.desc}</p>
        <div class="card-pills">${app.pills.map((p) => `<span class="pill">${p}</span>`).join("")}</div>
        <div class="card-meta-row"><span class="dl-count">${dlLabel(app.id)}</span></div>
        <div class="card-actions">
          <a class="download-btn" href="${app.file}" download>${app.btn}<span class="size">${app.size}</span></a>
          <button class="details-btn" type="button">Details</button>
        </div>`;
      const favBtn = card.querySelector(".fav-btn");
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const now = toggleFav(app.id);
        favBtn.classList.toggle("on", now);
        favBtn.setAttribute("aria-pressed", String(now));
        toast(now ? "★ Added to favorites" : "Removed from favorites");
        if (view.favOnly && !now) applyView(); // drop it from a favorites-only view
      });
      card.querySelector(".download-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        bumpDownload(app.id);
        card.querySelector(".dl-count").textContent = dlLabel(app.id);
        toast("Downloading " + app.title + "…");
      });
      card.querySelector(".details-btn").addEventListener("click", (e) => { e.stopPropagation(); openModal(app); });
      card.addEventListener("click", () => openModal(app));
      grid.appendChild(card);
    });
  }

  /* ---------- Filter + sort view state ---------- */
  const view = { q: "", sort: "featured", favOnly: false };
  function applyView() {
    let list = APPS.slice();
    if (view.q) {
      list = list.filter((a) =>
        (a.title + " " + a.tag + " " + a.desc + " " + a.pills.join(" ")).toLowerCase().includes(view.q)
      );
    }
    if (view.favOnly) list = list.filter((a) => isFav(a.id));
    switch (view.sort) {
      case "name": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "size-asc": list.sort((a, b) => sizeToBytes(a.size) - sizeToBytes(b.size)); break;
      case "size-desc": list.sort((a, b) => sizeToBytes(b.size) - sizeToBytes(a.size)); break;
      case "downloads": list.sort((a, b) => dlCount(b.id) - dlCount(a.id)); break;
    }
    renderCards(list);
  }
  applyView();

  /* ---------- Search ---------- */
  $("#search").addEventListener("input", (e) => {
    view.q = e.target.value.trim().toLowerCase();
    applyView();
  });

  /* ---------- Sort + favorites filter ---------- */
  $("#sort").addEventListener("change", (e) => {
    view.sort = e.target.value;
    applyView();
  });
  const favFilter = $("#favFilter");
  favFilter.addEventListener("click", () => {
    view.favOnly = !view.favOnly;
    favFilter.setAttribute("aria-pressed", String(view.favOnly));
    applyView();
  });

  /* ---------- Modal ---------- */
  const modal = $("#modal");
  function openModal(app) {
    $("#mIcon").textContent = app.icon;
    $("#mIcon").className = "modal-icon " + app.iconClass;
    $("#mTitle").textContent = app.title;
    $("#mTag").textContent = app.tag;
    $("#mDesc").textContent = app.desc;
    $("#mMeta").innerHTML = `
      <div class="meta-item"><b>Version</b><span>${app.version}</span></div>
      <div class="meta-item"><b>Size</b><span>${app.size}</span></div>
      <div class="meta-item"><b>Updated</b><span>${app.updated}</span></div>
      <div class="meta-item"><b>Downloads</b><span id="mDownloadCount">${dlCount(app.id).toLocaleString()}</span></div>`;
    $("#mFeatures").innerHTML = app.features.map((f) => `<li>${f}</li>`).join("");
    const dl = $("#mDownload");
    dl.href = app.file;
    dl.textContent = app.btn;
    dl.onclick = () => {
      bumpDownload(app.id);
      const c = $("#mDownloadCount");
      if (c) c.textContent = dlCount(app.id).toLocaleString();
      applyView(); // keep the card counts in sync behind the modal
      toast("Downloading " + app.title + "…");
    };
    modal.hidden = false;
  }
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => (modal.hidden = true)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.hidden = true;
    // "/" focuses search when the app is open and you're not already typing
    if (e.key === "/" && !appScreen.hidden && modal.hidden) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") {
        e.preventDefault();
        $("#search").focus();
      }
    }
  });

  /* ---------- Footer year ---------- */
  $("#year").textContent = "2026";
})();
