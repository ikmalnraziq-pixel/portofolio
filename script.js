/* Portofolio London Klasik. JavaScript murni, tanpa library.
   Isi situs dibaca dari window.PORTFOLIO (data.js). */
(function () {
  'use strict';
  var D = window.PORTFOLIO;
  if (!D) return;

  var doc = document, root = doc.documentElement, body = doc.body;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var firstPaint = true; // false setelah render pertama, agar render ulang dari admin tanpa animasi masuk
  var instant = root.classList.contains('no-intro');

  /* ---------- Util ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function arr(a) { return Array.isArray(a) ? a : []; }
  function cleanUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { new URL(u); return u; } catch (e) { return ''; }
  }
  function imgSrc(s) { s = String(s || ''); return /^(data:image\/|https?:\/\/|assets\/)/.test(s) ? s : ''; }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function hash(s) { // cyrb53, hanya untuk gerbang sederhana admin
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split('.'), last = ks.pop();
    var t = ks.reduce(function (a, k) { return a[k]; }, o);
    t[last] = v;
  }
  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var I = {
    sun: SVG + '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: SVG + '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    menu: SVG + '<path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: SVG + '<path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: SVG + '<path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    copy: SVG + '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    out: SVG + '<path d="M7 17L17 7M8 7h9v9"/></svg>',
    mail: SVG + '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    chat: SVG + '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    lock: SVG + '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    check: SVG + '<path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    tick: '<svg class="tick" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="24" d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  /* ---------- State (data.js + perubahan dari admin di peramban ini) ---------- */
  var KEY = 'rk_state';
  var S = clone(D);
  try {
    var sv = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (sv && sv.base === D.rev && sv.data) S = sv.data;
  } catch (e) {}
  S.profile = S.profile || {}; S.origin = S.origin || {}; S.social = S.social || {};
  S.achievements = arr(S.achievements); S.projects = arr(S.projects); S.tech = arr(S.tech);
  S.admin = S.admin || D.admin || {};

  /* ---------- Toast ---------- */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }
  function copyText(text, what) {
    function done() { toast((what || 'Teks') + ' disalin'); }
    function fallback() {
      var t = doc.createElement('textarea'); t.value = text; t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;left:-9999px;top:0'; body.appendChild(t); t.select();
      try { doc.execCommand('copy'); done(); } catch (e) { toast('Gagal menyalin, salin manual ya'); }
      body.removeChild(t);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  /* ---------- Potongan HTML bersama ---------- */
  function contohTag(f) { return f ? '<span class="tag gold">Contoh</span>' : ''; }
  function portrait(extra, eager) {
    var P = S.profile, custom = imgSrc(P.foto);
    var src = custom || 'assets/raziq.webp';
    var alt = custom ? 'Foto ' + (P.nama || '') : 'Ilustrasi karakter laki-laki berkacamata, bertopi flat cap, memakai mantel cokelat, rompi, dan dasi merah';
    return '<figure class="portrait"' + (extra || '') + '><div class="plate"><img src="' + esc(src) + '" alt="' + esc(alt) + '" width="720" height="960" decoding="async"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + '></div><figcaption><span>' + esc(P.fotoJenis || 'Ilustrasi') + '</span><span>' + esc(P.nama || '') + '</span></figcaption></figure>';
  }
  function firstName() { return String(S.profile.nama || '').trim().split(/\s+/)[0] || ''; }
  function waLink(text) { return 'https://wa.me/' + digits(S.profile.wa) + '?text=' + encodeURIComponent(text); }

  /* ---------- Hero ---------- */
  var typeT;
  function renderHero() {
    var P = S.profile, words = String(P.nama || '').trim().split(/\s+/).filter(Boolean), n = words.length;
    var h1 = words.map(function (w, i) { return '<span class="w" style="--i:' + (i + 1) + '">' + esc(w) + '</span>'; }).join(' ');
    var cv = cleanUrl(P.cv);
    $('#hero-grid').innerHTML =
      '<div class="copy">' +
        '<div class="board" style="--i:0"><span><i class="dot"></i>' + esc(P.status || 'Halo') + '</span><span>London <b class="tm" id="lon">--:--</b></span>' +
        (S.origin.kota ? '<span>' + esc(S.origin.kota) + '</span>' : '') + '</div>' +
        '<h1>' + h1 + '</h1>' +
        '<p class="role" style="--i:' + (n + 1) + '"><span class="sr">' + esc(P.peran || '') + '</span><span class="txt" aria-hidden="true"></span><i class="caret" aria-hidden="true"></i></p>' +
        '<p class="tagline" style="--i:' + (n + 2) + '">' + esc(P.tagline || '') + '</p>' +
        '<div class="cta" style="--i:' + (n + 3) + '"><a class="btn btn-primary" href="#projek">Lihat Projek</a><a class="btn btn-ghost" href="#kontak">Hubungi Saya</a>' +
        (cv ? '<a class="btn btn-soft" href="' + esc(cv) + '" target="_blank" rel="noopener noreferrer">Unduh CV</a>' : '') + '</div>' +
      '</div>' + portrait(' style="--i:2"', true);
    var txt = $('.role .txt'), full = String(P.peran || '');
    clearTimeout(typeT);
    if (instant || reduce || !firstPaint) { txt.textContent = full; return; }
    var i = 0, start = 1350 + (n + 1) * 90 + 150;
    typeT = setTimeout(function step() {
      i++; txt.textContent = full.slice(0, i);
      if (i < full.length) typeT = setTimeout(step, 55);
    }, start);
  }
  var lonFmt = null;
  try { lonFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }); } catch (e) {}
  function tickClock() {
    if (doc.hidden || !lonFmt) return;
    var el = $('#lon'); if (!el) return;
    var t = lonFmt.format(new Date()); if (el.textContent !== t) el.textContent = t;
  }

  /* ---------- Tentang ---------- */
  function renderAbout() {
    var P = S.profile, tones = ['', 'red', 'green', 'gold'];
    var paras = arr(P.tentang).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
    var chips = arr(P.minat).map(function (m, i) { return '<span class="tag ' + tones[i % 4] + '">' + esc(m) + '</span>'; }).join('');
    var vals = arr(P.nilai).map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('');
    var note = /ilustrasi/i.test(P.fotoJenis || 'Ilustrasi') ? '<p class="illus-note">Ini ilustrasi karakter, bukan foto asli.</p>' : '';
    $('#about-body').innerHTML =
      '<div class="about-grid">' +
        '<article class="card frame page rv">' + (P.contoh ? '<div style="margin-bottom:14px">' + contohTag(true) + '</div>' : '') + paras +
          (chips ? '<h3>Minat</h3><div class="chips">' + chips + '</div>' : '') +
          (vals ? '<h3>Pegangan</h3><ul class="values">' + vals + '</ul>' : '') + '</article>' +
        '<aside class="card side-card rv" style="--i:1">' + portrait('', false) + note + '</aside>' +
      '</div>';
  }

  /* ---------- Asal ---------- */
  function renderOrigin() {
    var O = S.origin, kota = String(O.kota || '');
    var short = kota.length > 18 ? kota.slice(0, 17) + '.' : kota;
    var grid = ''; for (var g = 40; g < 320; g += 40) grid += 'M' + g + ' 1V199'; for (var h = 40; h < 200; h += 40) grid += 'M1 ' + h + 'H319';
    $('#origin-body').innerHTML =
      '<div class="card frame ticket rv"><div class="info">' +
        '<div class="head"><span class="label">Tiket asal</span>' + contohTag(O.contoh) + '</div>' +
        '<div class="fields"><div><div class="label">Dari</div><div class="field-v">' + esc(kota || '-') + '</div></div>' +
        (O.daerah ? '<div><div class="label">Daerah</div><div class="field-v">' + esc(O.daerah) + '</div></div>' : '') +
        '<div><div class="label">Tujuan</div><div class="field-v">London</div></div></div>' +
        (O.cita ? '<div><div class="label">Cita-cita</div><div class="field-v sm">' + esc(O.cita) + '</div></div>' : '') +
        (O.alasan ? '<div><div class="label">Kenapa London</div><div class="field-v sm">' + esc(O.alasan) + '</div></div>' : '') +
      '</div><div class="map"><svg viewBox="0 0 320 200" role="img" aria-label="Rute sederhana dari ' + esc(kota) + ' ke London">' +
        '<rect class="map-frame" x="1" y="1" width="318" height="198" rx="6"/><path class="map-grid" d="' + grid + '"/>' +
        '<path class="map-route" d="M64 40Q160 8 250 150"/><circle class="map-dot r" cx="64" cy="40" r="5"/><circle class="map-dot" cx="250" cy="150" r="5"/>' +
        '<text class="map-txt" x="76" y="34">London</text><text class="map-txt" x="250" y="174" text-anchor="end">' + esc(short) + '</text></svg>' +
        '<span class="label">Peta sederhana, tidak berskala</span></div></div>';
  }

  /* ---------- Prestasi ---------- */
  function renderAch() {
    var list = S.achievements.slice().sort(function (a, b) { return (parseInt(b.tahun, 10) || 0) - (parseInt(a.tahun, 10) || 0); });
    if (!list.length) { $('#ach-body').innerHTML = '<div class="empty">Belum ada prestasi yang ditampilkan.</div>'; return; }
    $('#ach-body').innerHTML = '<ol class="timeline">' + list.map(function (a, i) {
      var im = imgSrc(a.foto);
      return '<li class="tl-item rv" style="--i:' + Math.min(i, 4) + '"><article class="card' + (im ? ' has-img' : '') + '"><div>' +
        '<div class="tl-top"><span class="year">' + esc(a.tahun) + '</span><span class="org">' + esc(a.penyelenggara) + '</span>' + contohTag(a.contoh) + '</div>' +
        '<h3>' + esc(a.judul) + '</h3>' + (a.deskripsi ? '<p>' + esc(a.deskripsi) + '</p>' : '') + '</div>' +
        (im ? '<div class="img"><img src="' + esc(im) + '" alt="Foto ' + esc(a.judul) + '" loading="lazy" decoding="async"></div>' : '') +
        '</article></li>';
    }).join('') + '</ol>';
  }

  /* ---------- Projek ---------- */
  var curCat = 'Semua';
  var phTone = { Web: '', Latihan: 'gold', Lomba: 'red' };
  function initials(s) { return String(s || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join(''); }
  function linkOut(href, label) { return '<a class="link" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + label + I.out + '</a>'; }
  function renderProj() {
    var ps = S.projects;
    if (!ps.length) { $('#proj-body').innerHTML = '<div class="empty">Belum ada projek yang ditampilkan.</div>'; return; }
    var pref = ['Web', 'Latihan', 'Lomba'], cats = [];
    pref.concat(ps.map(function (p) { return p.kategori; })).forEach(function (c) {
      if (c && cats.indexOf(c) < 0 && ps.some(function (p) { return p.kategori === c; })) cats.push(c);
    });
    if (curCat !== 'Semua' && cats.indexOf(curCat) < 0) curCat = 'Semua';
    var chips = ['Semua'].concat(cats).map(function (c) {
      var n = c === 'Semua' ? ps.length : ps.filter(function (p) { return p.kategori === c; }).length;
      return '<button class="chip" type="button" data-cat="' + esc(c) + '" aria-pressed="' + (c === curCat) + '">' + esc(c) + '<span class="n">' + n + '</span></button>';
    }).join('');
    var cards = ps.map(function (p, i) {
      var im = imgSrc(p.foto), tone = phTone[p.kategori] != null ? phTone[p.kategori] : 'green';
      var cover = im ? '<img src="' + esc(im) + '" alt="Tampilan ' + esc(p.nama) + '" loading="lazy" decoding="async">' :
        '<div class="ph ' + tone + '" aria-hidden="true"><span class="ini">' + esc(initials(p.nama)) + '</span><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="50"/><circle cx="55" cy="55" r="34"/><path d="M5 55H105M55 5V105"/></svg></div>';
      var demo = cleanUrl(p.demo), gh = cleanUrl(p.github);
      var hidden = curCat !== 'Semua' && p.kategori !== curCat;
      return '<article class="card pc rv' + (hidden ? ' off' : '') + '" data-cat="' + esc(p.kategori) + '" data-clean style="--i:' + Math.min(i, 5) + '">' +
        '<div class="cover">' + cover + '</div><div class="body">' +
        '<div class="meta"><span class="tag">' + esc(p.kategori) + '</span>' + contohTag(p.contoh) + '</div>' +
        '<h3>' + esc(p.nama) + '</h3><p class="desc">' + esc(p.deskripsi) + '</p>' +
        '<div class="tech">' + arr(p.teknologi).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="acts"><button class="btn btn-soft btn-sm" type="button" data-open="' + esc(p.id) + '" aria-label="Detail ' + esc(p.nama) + '">Detail</button>' +
        (demo ? linkOut(demo, 'Demo') : '') + (gh ? linkOut(gh, 'GitHub') : '') + '</div></div></article>';
    }).join('');
    $('#proj-body').innerHTML = '<div class="filters" role="group" aria-label="Filter kategori projek">' + chips + '</div><div class="pgrid" id="pgrid">' + cards + '</div>';
  }
  function applyFilter(cat) {
    curCat = cat;
    $$('.chip[data-cat]').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.cat === cat)); });
    var cards = $$('.pc');
    function off(c) { return cat !== 'Semua' && c.dataset.cat !== cat; }
    if (reduce || !cards[0] || !cards[0].animate) { cards.forEach(function (c) { c.classList.toggle('off', off(c)); }); return; }
    var first = new Map();
    cards.forEach(function (c) { if (!c.classList.contains('off')) first.set(c, c.getBoundingClientRect()); });
    cards.forEach(function (c) { c.classList.toggle('off', off(c)); });
    var ease = 'cubic-bezier(.22,1,.36,1)';
    cards.forEach(function (c) {
      if (c.classList.contains('off')) return;
      var f = first.get(c), l = c.getBoundingClientRect();
      if (f) {
        var dx = f.left - l.left, dy = f.top - l.top;
        if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 480, easing: ease });
      } else {
        c.animate([{ opacity: 0, transform: 'translateY(12px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: ease });
      }
    });
  }

  /* ---------- Modal projek ---------- */
  var modal = $('#modal'), sheet = $('#sheet'), modalOpener = null;
  function lock(on) { root.style.overflow = on ? 'hidden' : ''; }
  function openProject(id, btn) {
    var p = S.projects.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var im = imgSrc(p.foto), demo = cleanUrl(p.demo), gh = cleanUrl(p.github);
    sheet.innerHTML =
      '<button class="iconbtn x" type="button" data-close aria-label="Tutup">' + I.x + '</button>' +
      '<div class="chips"><span class="tag">' + esc(p.kategori) + '</span>' + contohTag(p.contoh) + '</div>' +
      '<h3 id="modal-title">' + esc(p.nama) + '</h3>' +
      (im ? '<div class="cover"><img src="' + esc(im) + '" alt="Tampilan ' + esc(p.nama) + '"></div>' : '') +
      '<div class="det"><p>' + esc(p.detail || p.deskripsi) + '</p></div>' +
      (arr(p.fitur).length ? '<h4>Fitur</h4><ul class="feat">' + p.fitur.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
      (arr(p.teknologi).length ? '<h4>Teknologi</h4><div class="chips">' + p.teknologi.map(function (t) { return '<span class="tag green">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      ((demo || gh) ? '<div class="acts">' + (demo ? '<a class="btn btn-primary" href="' + esc(demo) + '" target="_blank" rel="noopener noreferrer">Lihat demo</a>' : '') +
        (gh ? '<a class="btn btn-ghost" href="' + esc(gh) + '" target="_blank" rel="noopener noreferrer">GitHub</a>' : '') + '</div>' : '');
    modalOpener = btn || null;
    if (btn) { // animasi tumbuh dari tombol yang ditekan
      var b = btn.getBoundingClientRect(), s = sheet.getBoundingClientRect();
      sheet.style.setProperty('--ox', Math.round(b.left + b.width / 2 - s.left) + 'px');
      sheet.style.setProperty('--oy', Math.round(b.top + b.height / 2 - s.top) + 'px');
    }
    modal.classList.add('open'); lock(true); sheet.scrollTop = 0;
    var x = $('[data-close]', sheet); if (x) x.focus();
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open'); lock(false);
    if (modalOpener && doc.contains(modalOpener)) modalOpener.focus();
  }

  /* ---------- Tech ---------- */
  function renderTech() {
    var gs = S.tech;
    if (!gs.length) { $('#tech-body').innerHTML = '<div class="empty">Belum ada teknologi yang ditampilkan.</div>'; return; }
    $('#tech-body').innerHTML = '<div class="tgrid">' + gs.map(function (g, gi) {
      return '<article class="card tcard rv" style="--i:' + gi + '"><h3>' + esc(g.grup) + ' ' + contohTag(g.contoh) + '</h3>' +
        arr(g.items).map(function (it, i) {
          var lv = Math.max(0, Math.min(100, Number(it.level) || 0));
          return '<div class="skill"><div class="row"><span class="nm">' + esc(it.nama) + '</span><span class="pc2">' + lv + '%</span></div>' +
            '<div class="track" aria-hidden="true"><i class="fill" style="--lv:' + (lv / 100) + ';--i:' + i + '"></i></div></div>';
        }).join('') + '</article>';
    }).join('') + '</div>';
  }

  /* ---------- Kontak ---------- */
  function renderContact() {
    var P = S.profile, ep = cleanUrl(P.formEndpoint);
    var wa = digits(P.wa), waShow = P.waTampil || ('+' + wa);
    $('#contact-body').innerHTML =
      '<div class="cgrid"><div class="card frame cinfo rv">' +
        (P.email ? '<div class="crow"><div><div class="label">Email</div><div class="v">' + esc(P.email) + '</div></div><button class="btn btn-soft btn-sm" type="button" data-copy="' + esc(P.email) + '" data-what="Email" aria-label="Salin email">' + I.copy + 'Salin</button></div>' : '') +
        (wa ? '<div class="crow"><div><div class="label">WhatsApp</div><div class="v">' + esc(waShow) + '</div></div><button class="btn btn-soft btn-sm" type="button" data-copy="' + esc(waShow) + '" data-what="Nomor" aria-label="Salin nomor WhatsApp">' + I.copy + 'Salin</button></div>' : '') +
        (wa ? '<a class="btn btn-wa" href="' + esc(waLink('Halo ' + firstName() + ', saya melihat portofolio kamu.')) + '" target="_blank" rel="noopener noreferrer">' + I.chat + 'Chat via WhatsApp</a>' : '') +
        '<p class="note">' + (ep ? 'Pesan lewat form dikirim langsung ke email Ikmal.' : 'Pesan lewat form akan membuka aplikasi email kamu dengan isi yang sudah terisi.') + '</p></div>' +
      '<div class="card frame rv" style="--i:1"><form id="cform" novalidate>' +
        '<div class="f"><label for="f-nama">Nama</label><input class="in-ctl" id="f-nama" name="nama" autocomplete="name" maxlength="60" aria-describedby="e-nama"><div class="err" id="e-nama"></div></div>' +
        '<div class="f"><label for="f-email">Email kamu</label><input class="in-ctl" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="100" aria-describedby="e-email"><div class="err" id="e-email"></div></div>' +
        '<div class="f"><label for="f-subjek">Subjek</label><input class="in-ctl" id="f-subjek" name="subjek" maxlength="100" aria-describedby="e-subjek"><div class="err" id="e-subjek"></div></div>' +
        '<div class="f"><label for="f-pesan">Pesan</label><textarea class="in-ctl" id="f-pesan" name="pesan" maxlength="600" aria-describedby="e-pesan"></textarea><div class="fm"><div class="err" id="e-pesan"></div><span class="count" id="cnt">0/600</span></div></div>' +
        '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">' +
        '<div class="acts-row"><button class="btn btn-primary" type="submit" id="send" disabled>' + I.mail + 'Kirim pesan</button>' +
        (wa ? '<button class="btn btn-wa" type="button" id="send-wa" disabled>' + I.chat + 'Lewat WhatsApp</button>' : '') + '</div>' +
      '</form><div class="status" id="cstatus" role="status" hidden></div></div></div>';
    bindForm(ep);
  }
  function bindForm(endpoint) {
    var form = $('#cform'); if (!form) return;
    var touched = {}, f = {
      nama: $('#f-nama'), email: $('#f-email'), subjek: $('#f-subjek'), pesan: $('#f-pesan')
    };
    var rules = {
      nama: function (v) { return v.trim().length >= 2 ? '' : 'Tulis nama kamu, minimal 2 huruf.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Alamat email belum lengkap, contoh: nama@email.com.'; },
      subjek: function (v) { return v.trim().length >= 3 ? '' : 'Subjek minimal 3 huruf.'; },
      pesan: function (v) { return v.trim().length >= 10 ? '' : 'Pesan minimal 10 karakter, supaya maksudnya jelas.'; }
    };
    function check(k, show) {
      var msg = rules[k](f[k].value);
      if (show) { $('#e-' + k).textContent = msg; f[k].setAttribute('aria-invalid', msg ? 'true' : 'false'); }
      return !msg;
    }
    function refresh() {
      var all = true; Object.keys(rules).forEach(function (k) { if (!check(k, touched[k])) all = false; });
      $('#send').disabled = !all;
      var w = $('#send-wa'); if (w) w.disabled = !(rules.nama(f.nama.value) === '' && rules.pesan(f.pesan.value) === '');
      $('#cnt').textContent = f.pesan.value.length + '/600';
    }
    Object.keys(f).forEach(function (k) {
      f[k].addEventListener('input', refresh);
      f[k].addEventListener('blur', function () { touched[k] = true; refresh(); });
    });
    var status = $('#cstatus');
    function showStatus(html) { status.hidden = false; status.innerHTML = html; }
    function reset() { form.reset(); touched = {}; Object.keys(f).forEach(function (k) { $('#e-' + k).textContent = ''; f[k].removeAttribute('aria-invalid'); }); refresh(); }
    function mailto() {
      var P = S.profile, v = { n: f.nama.value.trim(), e: f.email.value.trim(), s: f.subjek.value.trim(), m: f.pesan.value.trim() };
      return 'mailto:' + P.email + '?subject=' + encodeURIComponent(v.s) + '&body=' + encodeURIComponent('Halo ' + firstName() + ',\n\n' + v.m + '\n\nSalam,\n' + v.n + '\n' + v.e);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      Object.keys(rules).forEach(function (k) { touched[k] = true; });
      refresh(); if ($('#send').disabled) return;
      if (form.elements._gotcha.value) return; // bot
      if (endpoint) {
        var btn = $('#send'); btn.disabled = true; btn.lastChild.textContent = 'Mengirim...';
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name: f.nama.value.trim(), email: f.email.value.trim(), subject: f.subjek.value.trim(), message: f.pesan.value.trim() }) })
          .then(function (r) { if (!r.ok) throw 0; showStatus(I.tick + ' <strong>Terkirim.</strong> Terima kasih, pesan kamu sudah masuk.'); reset(); })
          .catch(function () { showStatus('Pesan belum terkirim. Coba lagi, atau kirim lewat aplikasi email.<br><a class="btn btn-soft btn-sm" href="' + esc(mailto()) + '">Buka aplikasi email</a>'); })
          .then(function () { btn.lastChild.textContent = 'Kirim pesan'; refresh(); });
      } else {
        var href = mailto();
        showStatus(I.tick + ' <strong>Aplikasi email dibuka.</strong> Tekan Kirim di sana untuk mengirim pesan. Kalau tidak terbuka, <a href="' + esc(href) + '">tekan di sini</a>.');
        window.location.href = href; reset();
      }
    });
    var wb = $('#send-wa');
    if (wb) wb.addEventListener('click', function () {
      touched.nama = touched.pesan = true; refresh(); if (wb.disabled) return;
      window.open(waLink('Halo ' + firstName() + ', saya ' + f.nama.value.trim() + '.\n\n' + f.pesan.value.trim()), '_blank', 'noopener');
    });
  }

  /* ---------- Footer ---------- */
  function renderFoot() {
    var so = S.social, links = [['GitHub', so.github], ['LinkedIn', so.linkedin], ['Instagram', so.instagram]]
      .filter(function (x) { return cleanUrl(x[1]); })
      .map(function (x) { return '<a class="link" href="' + esc(cleanUrl(x[1])) + '" target="_blank" rel="noopener noreferrer">' + x[0] + I.out + '</a>'; }).join('');
    $('#foot-body').innerHTML = '<p class="small">&copy; ' + new Date().getFullYear() + ' ' + esc(S.profile.nama || '') + '. Dibuat dengan HTML, CSS, dan JavaScript.</p>' +
      (links ? '<div class="soc">' + links + '</div>' : '') +
      '<button class="admin-link" type="button" id="admin-open">' + I.lock + 'Admin</button>';
  }

  /* ---------- Render semua + reveal ---------- */
  var io = null;
  function setupIO() {
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; el.classList.add('in'); io.unobserve(el);
        if (el.hasAttribute('data-clean')) { // lepas kelas reveal agar transisi hover kartu normal
          var d = 700 + (parseInt(el.style.getPropertyValue('--i'), 10) || 0) * 80 + 150;
          setTimeout(function () { el.classList.remove('rv', 'in'); }, d);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  function observeAll() {
    $$('.rv:not(.in),.orn:not(.in)').forEach(function (el) {
      if (!io || instant) el.classList.add('in'); else io.observe(el);
    });
  }
  function renderAll() {
    renderHero(); renderAbout(); renderOrigin(); renderAch(); renderProj(); renderTech(); renderContact(); renderFoot();
    observeAll(); tickClock(); sizeIndicator();
    firstPaint = false;
  }

  /* ---------- Tema ---------- */
  var themeBtn = $('#theme'), themeMeta = $('meta[name="theme-color"]');
  var mqDark = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function effTheme() { return root.getAttribute('data-theme') || (mqDark && mqDark.matches ? 'dark' : 'light'); }
  function paintTheme() {
    var t = effTheme();
    themeBtn.innerHTML = t === 'dark' ? I.sun : I.moon;
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0E1626' : '#F4EFE6');
  }
  themeBtn.addEventListener('click', function () {
    var n = effTheme() === 'dark' ? 'light' : 'dark';
    root.classList.add('theming'); root.setAttribute('data-theme', n);
    try { localStorage.setItem('rk_theme', n); } catch (e) {}
    paintTheme(); setTimeout(function () { root.classList.remove('theming'); }, 700);
  });
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', paintTheme);

  /* ---------- Menu HP ---------- */
  var burger = $('#burger'), panel = $('#menu-panel'), mask = $('#menu-mask'), menuX = $('#menu-x');
  burger.innerHTML = I.menu; menuX.innerHTML = I.x; $('#backtop').innerHTML = I.up;
  function menuOpen() { return panel.classList.contains('open'); }
  function openMenu() { panel.classList.add('open'); mask.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); lock(true); menuX.focus(); }
  function closeMenu(restore) {
    if (!menuOpen()) return;
    panel.classList.remove('open'); mask.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); lock(false);
    if (restore) burger.focus();
  }
  burger.addEventListener('click', openMenu);
  menuX.addEventListener('click', function () { closeMenu(true); });
  mask.addEventListener('click', function () { closeMenu(false); });
  var tx = 0;
  panel.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  panel.addEventListener('touchend', function (e) { if (e.changedTouches[0].clientX - tx > 60) closeMenu(false); }, { passive: true });

  /* ---------- Scroll: progres, navbar, parallax, tombol atas ---------- */
  var nav = $('#nav'), prog = $('#progress'), backtop = $('#backtop'), far = $('.sky-far'), ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }
  function updateScroll() {
    ticking = false;
    var y = window.pageYOffset, max = root.scrollHeight - window.innerHeight;
    prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    nav.classList.toggle('scrolled', y > 10);
    backtop.classList.toggle('show', y > 700);
    if (far && !reduce && y < window.innerHeight * 1.5) far.style.transform = 'translateY(' + Math.min(60, y * 0.1).toFixed(1) + 'px)';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { onScroll(); sizeIndicator(); });
  backtop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Navigasi aktif + indikator ---------- */
  var links = $$('#navlinks a'), ind = $('#navind'), activeLink = null;
  function sizeIndicator() {
    if (!activeLink) { ind.style.transform = 'translateX(0) scaleX(0)'; return; }
    ind.style.transform = 'translateX(' + activeLink.offsetLeft + 'px) scaleX(' + (activeLink.offsetWidth / 100) + ')';
  }
  function setActive(id) {
    activeLink = null;
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      if (on) { a.setAttribute('aria-current', 'true'); activeLink = a; } else a.removeAttribute('aria-current');
    });
    sizeIndicator();
  }
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['beranda', 'tentang', 'asal', 'prestasi', 'projek', 'tech', 'kontak'].forEach(function (id) { var s = doc.getElementById(id); if (s) secIO.observe(s); });
  }

  /* ---------- Ripple ---------- */
  doc.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn,.chip');
    if (!b || b.disabled) return;
    var r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2, s = doc.createElement('span');
    s.className = 'ripple'; s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
    b.appendChild(s); s.addEventListener('animationend', function () { s.remove(); });
  });

  /* ---------- Klik bersama (anchor, salin, filter, detail) ---------- */
  doc.addEventListener('click', function (e) {
    var t = e.target, a = t.closest && t.closest('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1) {
      var id = a.getAttribute('href').slice(1), el = doc.getElementById(id);
      if (el) {
        e.preventDefault();
        if (a.classList.contains('mi')) closeMenu(false);
        if (id === 'beranda') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        else if (id === 'main') { el.focus({ preventScroll: true }); el.scrollIntoView(); }
        else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        try { history.replaceState(null, '', '#' + id); } catch (er) {}
      }
      return;
    }
    var c = t.closest && t.closest('[data-copy]'); if (c) { copyText(c.dataset.copy, c.dataset.what); return; }
    var ch = t.closest && t.closest('.chip[data-cat]'); if (ch) { applyFilter(ch.dataset.cat); return; }
    var op = t.closest && t.closest('[data-open]'); if (op) { openProject(op.dataset.open, op); return; }
    if (t.closest && t.closest('[data-close]')) { closeModal(); return; }
    if (t === modal) closeModal();
    if (t.id === 'admin-open' || (t.closest && t.closest('#admin-open'))) openLogin();
  });

  /* ============================================================
     Ruang admin
     Perubahan disimpan di peramban ini (localStorage). Agar tampil
     untuk semua pengunjung, ekspor data.js lalu ganti file di hosting.
     ============================================================ */
  var adminRoot = $('#admin-root'), isAdmin = false, tab = 'profil', openIds = {}, rerenderT, saveT;
  var TABS = [['profil', 'Profil'], ['asal', 'Asal'], ['prestasi', 'Prestasi'], ['projek', 'Projek'], ['tech', 'Tech'], ['sosial', 'Sosial'], ['data', 'Data']];

  function dirty() { return JSON.stringify(S) !== JSON.stringify(D); }
  function paintStatus() {
    var st = $('#ast'); if (!st) return;
    st.classList.toggle('dirty', dirty());
    st.lastChild.textContent = dirty() ? 'Belum diekspor ke data.js' : 'Sama dengan data.js';
  }
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify({ base: D.rev, data: S })); }
      catch (e) { toast('Penyimpanan peramban penuh. Kecilkan gambar atau ekspor data.js.'); }
      paintStatus();
    }, 300);
  }
  function touch() {
    persist(); clearTimeout(rerenderT);
    rerenderT = setTimeout(function () { instant = true; body.classList.add('instant'); renderAll(); }, 350);
  }

  function fld(label, path, o) {
    o = o || {}; var v = getPath(S, path), id = 'af-' + path.replace(/\./g, '-'), t = o.t || 'text', val, tag = 'input', attrs = '';
    if (t === 'lines') { val = arr(v).join('\n'); tag = 'textarea'; }
    else if (t === 'csv') { val = arr(v).join(', '); }
    else if (t === 'techlines') { val = arr(v).map(function (x) { return x.nama + ' | ' + x.level; }).join('\n'); tag = 'textarea'; }
    else if (t === 'area') { val = v == null ? '' : v; tag = 'textarea'; }
    else val = v == null ? '' : v;
    if (t === 'check') {
      return '<div class="af"><label class="row-ck"><input type="checkbox" data-p="' + path + '" data-t="check"' + (v ? ' checked' : '') + '> ' + esc(label) + '</label>' + (o.hint ? '<small>' + o.hint + '</small>' : '') + '</div>';
    }
    if (o.type) attrs += ' type="' + o.type + '"';
    if (o.sum) attrs += ' data-sum="1"';
    var ctl = tag === 'textarea' ? '<textarea class="in-ctl" id="' + id + '" data-p="' + path + '" data-t="' + t + '">' + esc(val) + '</textarea>'
      : '<input class="in-ctl" id="' + id + '" data-p="' + path + '" data-t="' + t + '" value="' + esc(val) + '"' + attrs + '>';
    if (tag === 'textarea' && o.sum) ctl = ctl.replace('<textarea', '<textarea data-sum="1"');
    return '<div class="af"><label for="' + id + '">' + esc(label) + '</label>' + ctl + (o.hint ? '<small>' + o.hint + '</small>' : '') + '</div>';
  }
  function imgField(label, path, hint) {
    var v = getPath(S, path), id = 'af-' + path.replace(/\./g, '-');
    return '<div class="af"><label>' + esc(label) + '</label><div class="pick"><div class="thumb">' + (v ? '<img src="' + esc(v) + '" alt="">' : 'Belum ada') + '</div>' +
      '<button class="btn btn-soft btn-sm" type="button" data-pick="' + id + '">Pilih gambar</button>' +
      '<input type="file" id="' + id + '" accept="image/*" data-img="' + path + '">' +
      (v ? '<button class="btn btn-soft btn-sm danger" type="button" data-imgrm="' + path + '">Hapus</button>' : '') + '</div>' +
      (v && String(v).indexOf('data:') === 0 ? '<div class="size">Sekitar ' + Math.round(String(v).length * 0.75 / 1024) + ' KB</div>' : '') + (hint ? '<small>' + hint + '</small>' : '') + '</div>';
  }
  function itemBox(listName, i, title, inner, id) {
    return '<details class="it" data-id="' + esc(id) + '"' + (openIds[id] ? ' open' : '') + '><summary><span class="t">' + esc(title || '(tanpa judul)') + '</span></summary><div class="in">' + inner +
      '<div class="it-acts"><button class="btn btn-soft btn-sm" type="button" data-act="up" data-list="' + listName + '" data-i="' + i + '">Naik</button>' +
      '<button class="btn btn-soft btn-sm" type="button" data-act="down" data-list="' + listName + '" data-i="' + i + '">Turun</button>' +
      '<button class="btn btn-soft btn-sm danger" type="button" data-act="del" data-list="' + listName + '" data-i="' + i + '">Hapus</button></div></div></details>';
  }
  function tabHTML() {
    var h = '';
    if (tab === 'profil') {
      h = '<h4>Identitas</h4>' + fld('Nama', 'profile.nama') + fld('Peran', 'profile.peran') + fld('Kalimat singkat', 'profile.tagline', { t: 'area' }) + fld('Status di papan hero', 'profile.status') +
        '<h4>Tentang</h4>' + fld('Cerita', 'profile.tentang', { t: 'lines', hint: 'Satu paragraf per baris.' }) + fld('Minat', 'profile.minat', { t: 'csv', hint: 'Pisahkan dengan koma.' }) + fld('Pegangan', 'profile.nilai', { t: 'lines', hint: 'Satu per baris.' }) +
        fld('Tandai teks Tentang sebagai contoh', 'profile.contoh', { t: 'check', hint: 'Matikan kalau sudah berisi data asli.' }) +
        '<h4>Gambar</h4>' + fld('Jenis gambar', 'profile.fotoJenis', { hint: 'Contoh: Ilustrasi atau Foto.' }) + imgField('Gambar profil', 'profile.foto', 'Kosong berarti memakai ilustrasi bawaan.') +
        '<h4>Kontak</h4>' + fld('Email', 'profile.email', { type: 'email' }) + fld('WhatsApp (format internasional)', 'profile.wa', { hint: 'Hanya angka, contoh 6285624850100.' }) + fld('Nomor yang ditampilkan', 'profile.waTampil') +
        fld('Tautan CV (PDF)', 'profile.cv', { hint: 'Kosong berarti tombol Unduh CV disembunyikan.' }) + fld('Alamat Formspree atau form endpoint', 'profile.formEndpoint', { hint: 'Kosong berarti form membuka aplikasi email (mailto).' });
    } else if (tab === 'asal') {
      h = fld('Kota atau negara asal', 'origin.kota') + fld('Daerah', 'origin.daerah') + fld('Cita-cita', 'origin.cita', { t: 'area' }) + fld('Kenapa London', 'origin.alasan', { t: 'area' }) + fld('Tandai sebagai contoh', 'origin.contoh', { t: 'check' });
    } else if (tab === 'prestasi') {
      h = '<div class="items">' + S.achievements.map(function (a, i) {
        var p = 'achievements.' + i + '.';
        return itemBox('achievements', i, a.judul, '<div class="af two"><div>' + fld('Tahun', p + 'tahun') + '</div><div>' + fld('Penyelenggara', p + 'penyelenggara') + '</div></div>' + fld('Judul', p + 'judul', { sum: true }) + fld('Deskripsi', p + 'deskripsi', { t: 'area' }) + imgField('Foto atau sertifikat', p + 'foto') + fld('Tandai sebagai contoh', p + 'contoh', { t: 'check' }), a.id);
      }).join('') + '</div><div class="it-acts" style="margin-top:14px"><button class="btn btn-primary btn-sm" type="button" data-act="add" data-list="achievements">Tambah prestasi</button></div>';
    } else if (tab === 'projek') {
      h = '<div class="items">' + S.projects.map(function (pr, i) {
        var p = 'projects.' + i + '.';
        return itemBox('projects', i, pr.nama, fld('Nama', p + 'nama', { sum: true }) + fld('Kategori', p + 'kategori', { hint: 'Web, Latihan, atau Lomba. Kategori lain juga bisa.' }) + fld('Deskripsi singkat', p + 'deskripsi', { t: 'area' }) + fld('Penjelasan lengkap', p + 'detail', { t: 'area' }) +
          fld('Fitur', p + 'fitur', { t: 'lines', hint: 'Satu per baris.' }) + fld('Teknologi', p + 'teknologi', { t: 'csv', hint: 'Pisahkan dengan koma.' }) + fld('Tautan demo', p + 'demo') + fld('Tautan GitHub', p + 'github') + imgField('Gambar sampul', p + 'foto') + fld('Tandai sebagai contoh', p + 'contoh', { t: 'check' }), pr.id);
      }).join('') + '</div><div class="it-acts" style="margin-top:14px"><button class="btn btn-primary btn-sm" type="button" data-act="add" data-list="projects">Tambah projek</button></div>';
    } else if (tab === 'tech') {
      h = '<div class="items">' + S.tech.map(function (g, i) {
        var p = 'tech.' + i + '.';
        return itemBox('tech', i, g.grup, fld('Nama grup', p + 'grup', { sum: true }) + fld('Isi grup', p + 'items', { t: 'techlines', hint: 'Satu per baris: Nama | tingkat 0 sampai 100.' }) + fld('Tandai sebagai contoh', p + 'contoh', { t: 'check' }), g.id);
      }).join('') + '</div><div class="it-acts" style="margin-top:14px"><button class="btn btn-primary btn-sm" type="button" data-act="add" data-list="tech">Tambah grup</button></div>';
    } else if (tab === 'sosial') {
      h = fld('GitHub', 'social.github', { hint: 'Tautan lengkap. Kosong berarti tidak ditampilkan.' }) + fld('LinkedIn', 'social.linkedin') + fld('Instagram', 'social.instagram');
    } else {
      h = '<h4>Simpan ke situs</h4><p class="note" style="margin-top:0">Perubahan tersimpan otomatis di peramban ini saja. Supaya tampil untuk semua pengunjung, ekspor data.js lalu ganti file data.js di hosting.</p>' +
        '<div class="it-acts"><button class="btn btn-primary btn-sm" type="button" data-act="export">Ekspor data.js</button><button class="btn btn-soft btn-sm danger" type="button" data-act="reset">Kembalikan ke data.js</button></div>' +
        '<p class="size" style="margin-top:12px">Ukuran data sekarang sekitar ' + Math.round(JSON.stringify(S).length / 1024) + ' KB. Gambar yang diunggah ikut tersimpan di dalamnya.</p>' +
        '<h4>Kode masuk</h4><div class="af"><label for="newpw">Kode baru</label><input class="in-ctl" id="newpw" type="password" autocomplete="new-password"><small>Kode ini hanya gerbang sederhana. Isi data.js tetap bisa dibaca siapa saja, jadi jangan dipakai untuk rahasia.</small></div>' +
        '<button class="btn btn-soft btn-sm" type="button" data-act="setpw">Simpan kode</button>';
    }
    return h;
  }
  function paintDrawer(keepScroll) {
    var sc = $('#dscroll'); if (!sc) return;
    var top = keepScroll ? sc.scrollTop : 0;
    sc.innerHTML = tabHTML(); sc.scrollTop = top;
    $$('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); });
  }

  function mountAdmin() {
    isAdmin = true; body.classList.add('is-admin');
    try { sessionStorage.setItem('rk_admin', '1'); } catch (e) {}
    adminRoot.innerHTML =
      '<div class="abar" role="region" aria-label="Ruang admin"><div class="st" id="ast"><i></i><span></span></div>' +
      '<button class="btn btn-soft btn-sm" type="button" id="a-edit">Edit isi</button><button class="btn btn-primary btn-sm" type="button" id="a-exp">Ekspor data.js</button><button class="btn btn-soft btn-sm" type="button" id="a-out">Keluar</button></div>' +
      '<div class="dwr" id="dwr"><div class="dw" role="dialog" aria-modal="true" aria-labelledby="dw-t"><header><h3 id="dw-t">Ruang admin</h3><button class="iconbtn" type="button" id="dw-x" aria-label="Tutup panel">' + I.x + '</button></header>' +
      '<div class="tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="scroll" id="dscroll"></div></div></div>' +
      '<div class="lg" id="lg"></div>';
    paintStatus(); paintDrawer(false);
  }
  function unmountAdmin() {
    isAdmin = false; body.classList.remove('is-admin'); adminRoot.innerHTML = '';
    try { sessionStorage.removeItem('rk_admin'); } catch (e) {}
  }
  function drawerOpen() { var d = $('#dwr'); return !!d && d.classList.contains('open'); }
  function openDrawer() { var d = $('#dwr'); if (!d) return; d.classList.add('open'); lock(true); $('#dw-x').focus(); }
  function closeDrawer() { var d = $('#dwr'); if (!d) return; d.classList.remove('open'); lock(false); var b = $('#a-edit'); if (b) b.focus(); }

  var loginReturn = null;
  function openLogin() {
    if (isAdmin) { openDrawer(); return; }
    if (!$('#lg')) adminRoot.innerHTML = '<div class="lg" id="lg"></div>';
    var lg = $('#lg'); loginReturn = doc.activeElement;
    lg.innerHTML = '<form class="box" id="lgform" role="dialog" aria-modal="true" aria-labelledby="lg-t"><button class="iconbtn x" type="button" id="lg-x" aria-label="Tutup">' + I.x + '</button>' +
      '<h3 id="lg-t">Masuk admin</h3><p class="note" style="margin:0 0 16px">Masukkan kode untuk mengubah isi situs.</p>' +
      '<div class="af"><label for="lg-pw">Kode</label><input class="in-ctl" id="lg-pw" type="password" autocomplete="current-password"></div><div class="msg" id="lg-msg" role="alert"></div>' +
      '<button class="btn btn-primary" style="width:100%" type="submit">Masuk</button></form>';
    requestAnimationFrame(function () { lg.classList.add('open'); $('#lg-pw').focus(); });
  }
  function closeLogin() {
    var lg = $('#lg'); if (!lg || !lg.classList.contains('open')) return;
    lg.classList.remove('open');
    setTimeout(function () { if (!isAdmin && $('#lg') === lg) adminRoot.innerHTML = ''; }, 350);
    if (loginReturn && doc.contains(loginReturn)) loginReturn.focus();
  }
  doc.addEventListener('submit', function (e) {
    if (e.target.id !== 'lgform') return;
    e.preventDefault();
    var pw = $('#lg-pw').value, want = (S.admin && S.admin.h) || (D.admin && D.admin.h);
    if (hash(pw) === want) {
      var ret = loginReturn; closeLogin(); mountAdmin(); loginReturn = ret; openDrawer(); toast('Masuk sebagai admin');
    } else { $('#lg-msg').textContent = 'Kode salah. Coba lagi.'; $('#lg-pw').select(); }
  });

  function exportData() {
    var out = clone(S); out.rev = (S.rev || 1) + 1;
    var txt = '/* Semua isi portofolio ada di sini. Ubah lewat ruang admin lalu ekspor, atau edit langsung.\n   Setiap kali isi berubah, naikkan angka "rev" agar perubahan lama di peramban tidak menimpa. */\nwindow.PORTFOLIO = ' + JSON.stringify(out, null, 2) + ';\n';
    var a = doc.createElement('a'), url = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' }));
    a.href = url; a.download = 'data.js'; body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('data.js diunduh. Ganti file lama di hosting.');
  }
  function compress(file, max, q) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var r = Math.min(1, max / Math.max(im.width, im.height)), c = doc.createElement('canvas');
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        var out = c.toDataURL('image/webp', q);
        if (out.indexOf('data:image/webp') !== 0) out = c.toDataURL('image/jpeg', q);
        URL.revokeObjectURL(url); res(out);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(); };
      im.src = url;
    });
  }
  function newId(p) { return p + Date.now().toString(36); }
  var templates = {
    achievements: function () { return { id: newId('a'), tahun: String(new Date().getFullYear()), judul: 'Prestasi baru', penyelenggara: '', deskripsi: '', foto: null, contoh: false }; },
    projects: function () { return { id: newId('p'), nama: 'Projek baru', kategori: 'Web', deskripsi: '', detail: '', fitur: [], teknologi: [], demo: '', github: '', foto: null, contoh: false }; },
    tech: function () { return { id: newId('g'), grup: 'Grup baru', items: [], contoh: false }; }
  };

  // Input di panel admin
  doc.addEventListener('input', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.p) return;
    var val, k = t.dataset.t;
    if (k === 'lines') val = t.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    else if (k === 'csv') val = t.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    else if (k === 'techlines') val = t.value.split('\n').map(function (l) {
      var p = l.split('|'), nm = p[0].trim(); if (!nm) return null;
      var lv = parseInt(p[1], 10); return { nama: nm, level: isNaN(lv) ? 50 : Math.max(0, Math.min(100, lv)) };
    }).filter(Boolean);
    else if (k === 'check') val = t.checked;
    else val = t.value;
    setPath(S, t.dataset.p, val);
    if (t.dataset.sum) { var d = t.closest('details'); if (d) d.querySelector('.t').textContent = val || '(tanpa judul)'; }
    touch();
  });
  doc.addEventListener('toggle', function (e) {
    var d = e.target; if (d.matches && d.matches('details.it')) openIds[d.dataset.id] = d.open;
  }, true);

  // Klik di panel admin
  doc.addEventListener('click', function (e) {
    var t = e.target, b;
    if (t.closest('#a-edit')) { openDrawer(); return; }
    if (t.closest('#a-exp')) { exportData(); return; }
    if (t.closest('#a-out')) { closeDrawer(); unmountAdmin(); toast('Keluar dari admin'); return; }
    if (t.closest('#dw-x')) { closeDrawer(); return; }
    if (t.closest('#lg-x') || t.id === 'lg') { closeLogin(); return; }
    if (t.id === 'dwr') { closeDrawer(); return; }
    if ((b = t.closest('.tabs button'))) { tab = b.dataset.tab; paintDrawer(false); return; }
    if ((b = t.closest('[data-pick]'))) { var inp = doc.getElementById(b.dataset.pick); if (inp) inp.click(); return; }
    if ((b = t.closest('[data-imgrm]'))) { setPath(S, b.dataset.imgrm, null); touch(); paintDrawer(true); return; }
    if ((b = t.closest('[data-act]'))) {
      var act = b.dataset.act, list = b.dataset.list, i = parseInt(b.dataset.i, 10);
      if (act === 'export') { exportData(); return; }
      if (act === 'setpw') {
        var v = $('#newpw').value; if (v.length < 4) { toast('Kode minimal 4 karakter'); return; }
        S.admin = { h: hash(v) }; $('#newpw').value = ''; persist(); toast('Kode diganti. Ekspor data.js agar berlaku di situs.'); return;
      }
      if (act === 'del' || act === 'reset') { // dua ketukan untuk konfirmasi
        if (!b.classList.contains('arm')) {
          b.classList.add('arm'); b.dataset.label = b.textContent; b.textContent = 'Yakin?';
          setTimeout(function () { if (b.isConnected) { b.classList.remove('arm'); b.textContent = b.dataset.label; } }, 3000); return;
        }
        if (act === 'reset') { try { localStorage.removeItem(KEY); } catch (er) {} S = clone(D); S.admin = S.admin || D.admin; instant = true; body.classList.add('instant'); renderAll(); paintDrawer(false); paintStatus(); toast('Kembali ke isi data.js'); return; }
        S[list].splice(i, 1); touch(); paintDrawer(true); return;
      }
      if (act === 'up' || act === 'down') {
        var j = act === 'up' ? i - 1 : i + 1, L = S[list];
        if (j < 0 || j >= L.length) return;
        var tmp = L[i]; L[i] = L[j]; L[j] = tmp; touch(); paintDrawer(true); return;
      }
      if (act === 'add') { var it = templates[list](); S[list].push(it); openIds[it.id] = true; touch(); paintDrawer(true); var sc = $('#dscroll'); sc.scrollTop = sc.scrollHeight; return; }
    }
  });
  doc.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.img || !t.files || !t.files[0]) return;
    var path = t.dataset.img;
    compress(t.files[0], 900, 0.82).then(function (url) { setPath(S, path, url); touch(); paintDrawer(true); toast('Gambar ditambahkan'); }, function () { toast('Gambar tidak bisa dibaca'); });
  });

  /* ---------- Keyboard: Esc dan jebakan fokus ---------- */
  function layer() {
    var lg = $('#lg'); if (lg && lg.classList.contains('open')) return { el: lg, close: closeLogin };
    if (modal.classList.contains('open')) return { el: sheet, close: closeModal };
    if (drawerOpen()) return { el: $('#dwr .dw'), close: closeDrawer };
    if (menuOpen()) return { el: panel, close: function () { closeMenu(true); } };
    return null;
  }
  doc.addEventListener('keydown', function (e) {
    var l = layer(); if (!l) return;
    if (e.key === 'Escape') { e.preventDefault(); l.close(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input:not([disabled]):not([type=file]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])', l.el)
      .filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!l.el.contains(doc.activeElement)) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Mulai ---------- */
  paintTheme(); setupIO(); renderAll(); updateScroll();
  setInterval(tickClock, 1000);
  if (!instant) setTimeout(function () { try { sessionStorage.setItem('rk_seen', '1'); } catch (e) {} }, 2100);
  try { if (sessionStorage.getItem('rk_admin') === '1') mountAdmin(); } catch (e) {}
  if (location.hash === '#admin') openLogin();
})();
