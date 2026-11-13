/* Windsor Tracker — v6 interface layer (new.html only).
   It draws the v6 screens on top of the real tracker and reads/writes through the tracker's own functions
   (ticks -> the real checkboxes, plan -> computePlan(), moves -> moveItemToDate(), settings -> onSettingsChange()),
   so progress, cloud sync, Anki and the planner maths are exactly the same as on the main page. */
(function () {
  'use strict';
  var D = document, R = D.documentElement;
  var OFF = false; try { OFF = localStorage.getItem('w6_off') === '1'; } catch (e) {}
  if (OFF || (window.matchMedia && matchMedia('(max-width: 820px)').matches)) { addBackButton(); return; }

  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function px(h) { return h.replace(/class="([^"]*)"/g, function (_, c) { return 'class="' + c.split(/\s+/).filter(Boolean).map(function (x) { return x.indexOf('w6-') === 0 ? x : 'w6-' + x; }).join(' ') + '"'; }); }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
  function decode(s) { var t = D.createElement('textarea'); t.innerHTML = s; return t.value; }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var LETTER = { M: 1, Tu: 2, W: 3, Th: 4, F: 5, Sa: 6, Su: 0 };
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>';
  var TICKSVG = CHECK.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"');
  var ICON = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    planner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.5 2.9H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    classic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>'
  };
  var MODCOL = ['#38bdf8', '#34d399', '#ff5c85', '#a78bfa', '#fbbf24', '#2dd4bf', '#f472b6', '#a3e635'];

  /* ---------------- state ---------------- */
  var S = { view: 'today', tab: null, sub: null, filter: 'all', open: {}, closed: {}, exp: {}, anim: 0, legacyTab: null, legacySub: null };
  try { var sv = JSON.parse(localStorage.getItem('w6_nav') || '{}'); if (sv && sv.view) { S.view = sv.view; S.tab = sv.tab || null; S.sub = sv.sub || null; S.legacyTab = sv.legacyTab || null; S.legacySub = sv.legacySub || null; } } catch (e) {}
  function saveNav() { try { localStorage.setItem('w6_nav', JSON.stringify({ view: S.view, tab: S.tab, sub: S.sub, legacyTab: S.legacyTab, legacySub: S.legacySub })); } catch (e) {} }

  /* ---------------- tracker data ---------------- */
  function todayKey() { return fmtDate(startOfDay(new Date())); }
  function app() { return D.getElementById('app-content'); }
  function visibleTabs() {
    return $$('#app-content > .tabbar .tab-btn').filter(function (b) { return b.dataset.tab && getComputedStyle(b).display !== 'none'; });
  }
  function modFor(tab) { return (typeof MODULES !== 'undefined' ? MODULES : []).filter(function (m) { return m.tabId === tab; })[0] || null; }
  function tabLabel(tab) { var b = $('#app-content > .tabbar .tab-btn[data-tab="' + tab + '"]'); return b ? txt(b) : tab.toUpperCase(); }
  function trackedTables(root) { return $$('table', root).filter(function (t) { return t.querySelector('tbody tr[data-id]'); }); }
  function subsOf(tab) {
    var panel = D.getElementById('panel-' + tab); if (!panel) return [];
    var btns = $$('.module-subtab-btn', panel);
    if (!btns.length) { var tt = trackedTables(panel); return [{ sub: null, label: tabLabel(tab), el: panel, tables: tt, cards: false }]; }
    return btns.map(function (b) {
      var el = D.getElementById('sub-' + b.dataset.sub); var tt = el ? trackedTables(el) : [];
      var ok = tt.length === 1 && !/-bc-|blueprint/.test(tt[0].id || '');
      return { sub: b.dataset.sub, label: txt(b), el: el, tables: tt, cards: ok };
    });
  }
  function rowTitle(row) {
    var labs = ['Lecture', 'WUSOM Lecture', 'Blueprint Topic', 'Schedule Topic', 'Topic', 'Organism'];
    for (var i = 0; i < labs.length; i++) { var c = row.querySelector('td[data-label="' + labs[i] + '"]'); if (c && txt(c)) return txt(c); }
    var tds = row.querySelectorAll('td'); return tds[1] ? txt(tds[1]) : row.dataset.id;
  }
  function parseWhen(s) {
    s = String(s || '');
    var m = /(\d{1,2})\/(\d{1,2})/.exec(s), l = /^(M|Tu|W|Th|F|Sa|Su)\b/.exec(s.trim());
    if (m) { var y = 2026; var d = new Date(y, +m[1] - 1, +m[2]); return { date: d, dow: DOW[d.getDay()], day: d.getDate() }; }
    if (l) return { date: null, dow: DOW[LETTER[l[1]]], day: '–' };
    return null;
  }
  function liveCards(host) {
    if (typeof window.lvAnkiFlagged !== 'function') return null;
    var ids = $$('.lv-ak', host).filter(function (b) { return !b.closest('td.video-cell') && !(b.previousElementSibling && b.previousElementSibling.classList.contains('sketchy-path-link')); }).map(function (b) { return b.dataset.akid; });
    if (!ids.length) return null; var t = 0;
    for (var i = 0; i < ids.length; i++) { var v = window.lvAnkiFlagged(ids[i]); if (v === null) return null; t += v; }
    return t;
  }
  function subsOfRow(row) { try { return (typeof subRowsInView === 'function' ? subRowsInView(row) : subRowsOf(row.dataset.id)) || []; } catch (e) { return []; } }
  var BADGE_SEL = 'a.fa-link, a.hy-link, a.ky-note-link, a.lip-link, a.slides-link, a.mastery-link, a.c100-link, a.bcnotes-link, a.mehmsk-link, a.video-link.sketchy-path-link';
  function lectures(table) {
    var out = [], sec = '', secRange = '', notes = [], noteHead = '';
    $$('tbody tr', table).forEach(function (row) {
      if (row.classList.contains('section-row')) { var t = txt(row); var mm = /^(.*?)\s*(\((?:Wk|Week|Relevant)[^)]*\)|\(\s*Wk.*)$/.exec(t); sec = mm ? mm[1] : t; secRange = mm ? mm[2].replace(/^\(|\)$/g, '') : ''; noteHead = t; return; }
      if (row.classList.contains('novid-row')) { notes.push({ head: noteHead, text: txt(row) }); return; }
      if (!row.dataset.id || row.classList.contains('vid-group')) return;
      var cb = row.querySelector('td input[type="checkbox"]'); if (!cb) return;
      var L = { id: row.dataset.id, row: row, cb: cb, sec: sec, secRange: secRange, title: rowTitle(row), when: parseWhen(txt(row.querySelector('td[data-label="Date"]'))), chap: txt(row.querySelector('td.chapter')), cards: parseFloat(row.dataset.cards) || 0, vids: [] };
      var subs = row.classList.contains('has-subs') ? subsOfRow(row) : [];
      if (subs.length) {
        var tot = subs.reduce(function (a, r) { return a + (parseFloat(r.dataset.min) || 0); }, 0) || 1;
        subs.forEach(function (r) {
          var sk = r.querySelector('.sk-title'), a = r.querySelector('.sv-line .video-link, .sv-line .sv-nolink'), src = r.querySelector('.sv-src');
          var title = sk ? txt(sk) : (a ? (a.dataset.svLabel || a.textContent).replace(/^[^\w(]+/, '').replace(/\s+/g, ' ').trim() : L.title);
          var min = parseFloat(r.dataset.min) || 0, lc = liveCards(r), sc = src ? src.cloneNode(true) : null;
          if (sc) $$('.sv-course', sc).forEach(function (x) { x.textContent = x.textContent.trim() + ' '; });
          L.vids.push({ id: r.dataset.sid, el: r, cb: r.querySelector('input[type="checkbox"]'), title: title, src: sc ? txt(sc) : '', min: min, cards: lc !== null ? lc : Math.round(L.cards * min / tot), line: r.querySelector('.sv-line'), L: L });
        });
      } else {
        var tm = row.querySelector('td.time'); var min = tm ? (parseFloat(tm.dataset.min) || (typeof parseTimeText === 'function' ? parseTimeText(tm.textContent) : 0)) : 0;
        var va = row.querySelector('a.video-link:not(.sketchy-path-link), a.vid-link, a.video-repeat');
        var vc = row.querySelector('td[data-label="Pathoma Video"], td[data-label="Sketchy Video"], td[data-label="Bootcamp Video"], td[data-label="Video"]');
        var label = vc ? txt(vc).replace(/\s*\(same video[^)]*\)/i, '') : (va ? txt(va).replace(/^[^\w(]+/, '') : '');
        var lc2 = liveCards(row);
        if (min > 0 || va) L.vids.push({ id: row.dataset.id, el: row, cb: cb, title: label || L.title, src: vc ? (vc.dataset.label || '').replace(/ Video$/, '') : '', min: min, cards: lc2 !== null ? lc2 : L.cards, line: null, self: true, link: va, L: L });
        else L.gap = vc ? txt(vc) : '';
      }
      out.push(L);
    });
    out.notes = notes;
    return out;
  }
  function vDone(v) { return !!(v.cb && v.cb.checked); }
  function lDone(L) { return L.vids.length ? L.vids.every(vDone) : !!L.cb.checked; }
  function pctOf(vs) { var t = 0, d = 0; vs.forEach(function (v) { var m = v.min || 1; t += m; if (vDone(v)) d += m; }); return t ? Math.round(d / t * 100) : 0; }
  function minsLeft(vs) { return vs.filter(function (v) { return !vDone(v); }).reduce(function (a, v) { return a + (v.min || 0); }, 0); }
  function allVidsOfTab(tab) { var vs = []; subsOf(tab).forEach(function (s) { s.tables.forEach(function (t) { lectures(t).forEach(function (L) { vs = vs.concat(L.vids); }); }); }); return vs; }
  function itemEl(id) { return D.querySelector('#app-content .vid-sub[data-sid="' + cssEsc(id) + '"]') || D.querySelector('#app-content tr[data-id="' + cssEsc(id) + '"]'); }
  function elCb(el) { return el ? (el.classList.contains('vid-sub') ? el.querySelector('input[type="checkbox"]') : el.querySelector('td input[type="checkbox"]')) : null; }
  function primaryLink(el) {
    if (!el) return null;
    return el.querySelector('.sv-line a.video-link.sk-btn') || el.querySelector('.sv-line a.video-link') || el.querySelector('a.video-link:not(.sketchy-path-link)') || el.querySelector('a.vid-link');
  }
  function playEl(el) {
    var a = primaryLink(el); if (!a) { toast('No video link for this one'); return; }
    var oc = a.getAttribute('onclick'); if (oc) a.removeAttribute('onclick');
    try { a.click(); } finally { if (oc) a.setAttribute('onclick', oc); }
  }
  function plan() { try { return computePlan(); } catch (e) { console.warn('w6 plan', e); return null; } }
  function pm() { try { return plannerModule(); } catch (e) { return null; } }
  function tabOfTable(t) { var p = t.closest('.tab-panel'); return p ? p.id.replace(/^panel-/, '') : null; }
  function subOfTable(t) { var p = t.closest('.module-sub-panel'); return p ? p.id.replace(/^sub-/, '') : null; }
  function subjLabelForItem(it) { try { var info = PLANNER_SUBJECT_INFO[it.subject]; return info ? info.label : it.subject; } catch (e) { return it.subject || ''; } }
  function nextExam() {
    try {
      var tk = todayKey(), mod = getCurrentModule(tk, currentSemester);
      var up = EXAM_EVENTS.filter(function (e) { return e.modules && e.modules.indexOf(mod.id) >= 0 && e.date >= tk; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      var main = up.filter(function (e) { return /End Module|Summative/i.test(e.label); })[0] || up[0];
      if (!main) return null;
      return { label: main.label, days: Math.round((parseDateStr(main.date) - startOfDay(new Date())) / 864e5), date: main.date };
    } catch (e) { return null; }
  }
  function doneMinOn(day, P) {
    var log = {}; try { log = loadDoneLog(); } catch (e) {}
    var pool = P ? P.completedPool : [];
    return pool.filter(function (i) { var v = log[i.id] || (i.lecId && log[i.lecId]); return v && doneDay(v) === day; }).reduce(function (a, i) { return a + (i.min || 0); }, 0);
  }
  function doneItemsOn(day, P) {
    var log = {}; try { log = loadDoneLog(); } catch (e) {}
    return (P ? P.completedPool : []).filter(function (i) { var v = log[i.id] || (i.lecId && log[i.lecId]); return v && doneDay(v) === day; });
  }
  function streak(P) {
    var log = {}; try { log = loadDoneLog(); } catch (e) {}
    var days = {}; Object.keys(log).forEach(function (k) { if (log[k]) days[doneDay(log[k])] = 1; });
    var d = startOfDay(new Date()), n = 0; if (!days[fmtDate(d)]) d = addDays(d, -1);
    while (days[fmtDate(d)]) { n++; d = addDays(d, -1); }
    return n;
  }

  /* ---------------- skeleton ---------------- */
  var root = D.createElement('div'); root.id = 'w6';
  root.innerHTML = px(
    '<div class="app"><aside class="side">' +
    '<div class="brand"><div class="seal"></div><div><b>Windsor Tracker</b><span><i class="badge">FALL 2026</i> <em id="w6-sem"></em></span></div></div>' +
    '<button class="nav" data-go="today">' + ICON.today + '<span class="lbl">Today</span><kbd>1</kbd></button>' +
    '<button class="nav" data-go="planner">' + ICON.planner + '<span class="lbl">Planner</span><kbd>2</kbd></button>' +
    '<h6>Modules</h6><div id="w6-mods"></div><h6>More</h6><div id="w6-more"></div>' +
    '<div class="side-foot"><div class="credit">Created by <b>Maninder</b>. Independent study tool, not affiliated with or endorsed by the school.</div>' +
    '<div class="foot-row"><button class="sync" id="w6-sync" title="Cloud save"><i></i><span></span></button>' +
    '<button class="icon-btn" id="w6-theme" title="Dark / light">' + ICON.moon + '</button>' +
    '<button class="icon-btn" id="w6-settings" title="Settings">' + ICON.gear + '</button></div>' +
    '<button class="classic" id="w6-classic">' + ICON.classic + '<span>Switch to the classic layout</span></button></div>' +
    '</aside><div class="main"><div class="amb"><i></i><i></i><i></i></div>' +
    '<div class="top"><div class="crumb" id="w6-crumb"></div><div class="dock hide" id="w6-dock"></div>' +
    '<button class="search" id="w6-openPal">' + ICON.search + 'Search<kbd>⌘K</kbd></button><div class="exam-chip" id="w6-exam"></div></div>' +
    '<div class="scroll" id="w6-scroll"><div id="w6-view"></div></div></div></div>' +
    '<div class="scrim" id="w6-scrim"></div>' +
    '<aside class="drawer" id="w6-drawer"><h3>Adjust plan</h3>' +
    '<div class="field"><label>Study minutes per day <b id="w6-capV"></b></label><input type="range" id="w6-cap" min="30" max="360" step="5"></div>' +
    '<div class="field"><label>Review days before exam <b id="w6-revV"></b></label><input type="range" id="w6-rev" min="0" max="7" step="1"></div>' +
    '<p class="dhint">The calendar behind this panel updates as you drag. More options (exam date, Anki cards a day, freeze plan) are in the full planner.</p>' +
    '<button class="btn ghost" id="w6-fullPlanner">Open the full planner</button><button class="btn" id="w6-closeDrawer">Done</button></aside>' +
    '<div class="pal" id="w6-pal"><input id="w6-palIn" placeholder="Search lectures and videos…" autocomplete="off"><div class="pal-list" id="w6-palList"></div></div>' +
    '<div class="toast" id="w6-toast"></div><canvas id="w6-fx"></canvas><div class="cele" id="w6-cele"></div>'
  ) + '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="w6gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e4a4"/><stop offset=".55" stop-color="#e6bf62"/><stop offset="1" stop-color="#a8761f"/></linearGradient></defs></svg>';
  var V, SC;

  /* ---------------- helpers (visual) ---------------- */
  function ring(p, size, r, cls) { var c = 2 * Math.PI * r; return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + (size > 150 ? '<circle class="w6-tk" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + (r + 13) + '"/>' : '') + '<circle class="w6-tr" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '"/><circle class="w6-fg ' + (cls || '') + '" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + c * (1 - p / 100) + '"/></svg>'; }
  function countUp(el, to, suf) { var t0 = performance.now(), from = +el.dataset.v || 0; el.dataset.v = to; (function f(t) { var k = Math.min(1, (t - t0) / 800), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e) + (suf || ''); if (k < 1) requestAnimationFrame(f); })(t0); }
  function settle(instant) {
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      $$('#w6 [data-off]').forEach(function (e) { e.style.strokeDashoffset = e.dataset.off; });
      $$('#w6 [data-w]').forEach(function (e) { e.style.width = e.dataset.w; });
      $$('#w6 [data-h]').forEach(function (e) { e.style.height = e.dataset.h; });
      $$('#w6 [data-count]').forEach(function (e) { if (instant) { e.textContent = e.dataset.count + (e.dataset.suf || ''); e.dataset.v = e.dataset.count; } else countUp(e, +e.dataset.count, e.dataset.suf || ''); });
      moveInd();
    }); });
  }
  var toastT; function toast(msg, undo) { var t = $('#w6-toast'); t.innerHTML = esc(msg) + (undo ? '<button id="w6-undo">Undo</button>' : ''); t.classList.add('w6-on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('w6-on'); }, 2800); if (undo) $('#w6-undo').onclick = function () { undo(); t.classList.remove('w6-on'); }; }
  var fx, ctx, parts = [], raf = 0, GOLD = ['#e6bf62', '#f7e4a4', '#b5832a', '#fff6d6', '#d92f5a'];
  function fit() { if (!fx) return; var d = window.devicePixelRatio || 1; fx.width = innerWidth * d; fx.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  function confetti(x, y, n, pw) { if (!ctx || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return; n = n || 20; pw = pw || 1; for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, sp = (2 + Math.random() * 6) * pw; parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * pw, r: Math.random() * 6, vr: (Math.random() - .5) * .5, s: 4 + Math.random() * 6, c: GOLD[i % GOLD.length], l: 1, d: .011 + Math.random() * .013, sh: i % 3 }); } if (!raf) raf = requestAnimationFrame(tick); }
  function tick() { ctx.clearRect(0, 0, innerWidth, innerHeight); parts = parts.filter(function (p) { return p.l > 0; }); parts.forEach(function (p) { p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.l -= p.d; ctx.save(); ctx.globalAlpha = Math.max(0, p.l); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; if (p.sh === 0) ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); else if (p.sh === 1) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.4, 0, 7); ctx.fill(); } else ctx.fillRect(-p.s / 2, -1.1, p.s, 2.2); ctx.restore(); }); raf = parts.length ? requestAnimationFrame(tick) : 0; }
  function celebrate(title, sub) { var c = $('#w6-cele'); c.innerHTML = '<div><b>' + esc(title) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>'; c.classList.remove('w6-on'); void c.offsetWidth; c.classList.add('w6-on'); var w = innerWidth, h = innerHeight; [0, 200, 400].forEach(function (t, i) { setTimeout(function () { confetti(w * (.32 + .18 * i), h * .42, 70, 1.9); }, t); }); setTimeout(function () { confetti(40, h - 10, 70, 2.6); confetti(w - 40, h - 10, 70, 2.6); }, 150); }
  function fmtShort(ds) { var d = typeof ds === 'string' ? parseDateStr(ds) : ds; return MON[d.getMonth()] + ' ' + d.getDate(); }
  /* clone a real tracker control so it keeps working (inline handlers + the tracker's document-level handlers) */
  function cloneCtl(a) {
    var c = a.cloneNode(true); c.removeAttribute('id');
    if (!c.getAttribute('onclick') && (c.getAttribute('href') === '#' || !c.getAttribute('href')) && !c.classList.contains('lv-ak')) {
      c.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY })); });
    }
    return c;
  }

  /* ---------------- sidebar / top ---------------- */
  function modTabs() { return visibleTabs().map(function (b) { return b.dataset.tab; }).filter(function (t) { return ['overview', 'planner', 'schedule', 'admin'].indexOf(t) < 0; }); }
  function renderSide() {
    var html = '';
    modTabs().forEach(function (t, i) {
      var vs = allVidsOfTab(t), p = pctOf(vs), c = MODCOL[i % MODCOL.length];
      var on = (S.view === 'module' && S.tab === t) || (S.view === 'legacy' && S.legacyTab === t);
      html += '<button class="nav ' + (on ? 'on' : '') + '" data-mod="' + t + '"><i class="mod-dot" style="background:' + c + '"></i><span class="lbl">' + esc(tabLabel(t)) + '</span><span class="mod-pct">' + (vs.length ? p + '%' : '') + '</span><span class="mod-bar"><i style="background:' + c + '" data-w="' + p + '%"></i></span></button>';
    });
    $('#w6-mods').innerHTML = px(html);
    var more = '<button class="nav ' + (S.view === 'legacy' && S.legacyTab === 'schedule' ? 'on' : '') + '" data-legacy="schedule">' + ICON.list + '<span class="lbl">Class schedule</span></button>';
    if (visibleTabs().some(function (b) { return b.dataset.tab === 'admin'; })) more += '<button class="nav ' + (S.view === 'legacy' && S.legacyTab === 'admin' ? 'on' : '') + '" data-legacy="admin">' + ICON.admin + '<span class="lbl">Admin</span></button>';
    $('#w6-more').innerHTML = px(more);
    $$('#w6 .w6-side > .w6-nav[data-go]').forEach(function (b) { b.classList.toggle('w6-on', b.dataset.go === S.view); });
    $('#w6-sem').textContent = (typeof currentSemester !== 'undefined' ? currentSemester : '');
    renderSync();
  }
  function renderSync() {
    var st = $('#sync-status'), dot = $('#sync-dot'), b = $('#w6-sync'); if (!b) return;
    var signed = st && /signed in/i.test(st.textContent);
    b.querySelector('span').textContent = signed ? (/synced/i.test(st.textContent) ? 'Saved to the cloud' : 'Syncing…') : 'Not signed in';
    b.classList.toggle('w6-off', !signed); b.title = st ? st.textContent : '';
  }
  function crumb() {
    var c = '';
    if (S.view === 'today') c = 'Today';
    else if (S.view === 'planner') { var m = pm(); c = 'Planner' + (m ? ' <span>/ ' + esc(m.mod.short) + '</span>' : ''); }
    else if (S.view === 'module') { var sb = subsOf(S.tab).filter(function (s) { return s.sub === S.sub; })[0]; c = esc(tabLabel(S.tab)) + (sb && sb.sub ? ' <span>/ ' + esc(sb.label) + '</span>' : ''); }
    else if (S.view === 'legacy') { var lt = S.legacyTab === 'schedule' ? 'Class schedule' : S.legacyTab === 'planner' ? 'Planner' : tabLabel(S.legacyTab); var ls = S.legacySub ? subsOf(S.legacyTab).filter(function (s) { return s.sub === S.legacySub; })[0] : null; c = esc(lt) + (ls ? ' <span>/ ' + esc(ls.label) + '</span>' : (S.legacyTab === 'planner' ? ' <span>/ full planner</span>' : '')); }
    $('#w6-crumb').innerHTML = px(c);
    var ex = nextExam(), e = $('#w6-exam');
    if (ex) { e.style.display = ''; e.title = ex.label + ' · ' + fmtShort(ex.date); e.innerHTML = ex.days === 0 ? 'Exam <b>today</b>' : 'Exam in <b>' + ex.days + '</b> day' + (ex.days === 1 ? '' : 's'); } else e.style.display = 'none';
  }
  function nextUp(P) {
    if (!P) return null; var a = P.assignments[todayKey()];
    var list = (a ? a.items : []).filter(function (i) { return !i.checked; });
    if (!list.length) list = P.autoPool || [];
    return list[0] || null;
  }
  function renderDock(P) {
    var d = $('#w6-dock'), it = nextUp(P);
    if (!it || S.view === 'today') { d.classList.add('w6-hide'); return; }
    d.classList.remove('w6-hide');
    d.innerHTML = px('<button class="play" data-play="' + esc(it.id) + '" title="Play">' + PLAY + '</button><div class="dk" title="' + esc(it.video || it.title) + '"><small>Next up</small><b>' + esc(cleanVid(it)) + '</b></div><span class="mins">' + Math.round(it.min) + ' min</span><button class="cb" data-ck="' + esc(it.id) + '" title="Mark watched">' + CHECK + '</button>');
  }
  function cleanVid(it) { var v = String(it.video || it.title || '').replace(/^[^\w(]+/, ''); v = v.replace(/^(Sketchy|Pathoma|Bootcamp)\s*·\s*/, ''); return v || it.title; }

  /* ---------------- views ---------------- */
  var FOOT = '<div class="foot">Independent study tool for Windsor University School of Medicine students. Not affiliated with or endorsed by the school in any way.</div>';
  function vToday() {
    var P = plan(), M = pm(), tk = todayKey(), now = new Date();
    var hr = now.getHours(), greet = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
    if (!P || !M) return '<div class="view"><h1 class="greet">Good <span class="shine">' + greet + '</span></h1><div class="card empty"><b>No planner for this module yet</b>Open a module from the sidebar to see its lectures.</div></div>';
    var st = P.stats, a = P.assignments[tk], q = (a ? a.items : []).filter(function (i) { return !i.checked; }), label = 'Up next today';
    if (!a) { q = (P.autoPool || []).slice(0, 6); label = 'Coming up'; }
    var doneToday = a && a.doneToday ? a.doneToday.length : 0;
    var subs = (typeof plannerSubjects === 'function' ? plannerSubjects() : []);
    var totMin = 0, doneMin = 0; subs.forEach(function (s) { var b = P.bySubject[s.key]; if (b) { totMin += b.totalMin; doneMin += b.doneMin; } });
    var p = totMin ? Math.round(doneMin / totMin * 100) : 0;
    var remItems = (P.autoPool || []).concat(P.manualItems || []);
    var cardsLeft = remItems.reduce(function (x, i) { return x + (i.cards || 0); }, 0);
    var pill = st.paceClass === 'pace-behind' ? '<span class="pill warn">' + esc(cap1(st.paceStatus)) + '</span>' : st.paceClass === 'pace-ahead' ? '<span class="pill ok">' + esc(cap1(st.paceStatus)) + '</span>' : '<span class="pill ok">On track</span>';
    var sk = streak(P);
    var subjHtml = subs.map(function (s) { var b = P.bySubject[s.key] || { pct: 0, remMin: 0 }; var t = D.getElementById(s.table); var tab = t ? tabOfTable(t) : '', sub = t ? subOfTable(t) : ''; return '<div class="bar-row" data-open="' + tab + '|' + (sub || '') + '"><b>' + esc(s.label) + '</b><div class="bar"><i data-w="' + b.pct + '%"></i></div><em>' + (b.remMin ? Math.round(b.remMin) + ' min left' : 'done') + '</em></div>'; }).join('');
    // this week
    var mon = addDays(startOfDay(now), -((now.getDay() + 6) % 7)), wk = '', cap = P.settings.dailyCapacity;
    for (var i = 0; i < 7; i++) {
      var d = addDays(mon, i), k = fmtDate(d), m = 0, cls = '';
      if (k < tk) { m = doneMinOn(k, P); cls = m ? 'done' : ''; }
      else if (P.assignments[k] && P.assignments[k].type !== 'review') { m = Math.round(P.assignments[k].totalMin); cls = k === tk ? 'plan' : 'plan'; }
      else if (P.dp.reviewDates.indexOf(k) >= 0) { m = cap; cls = 'rev'; }
      wk += '<div class="' + cls + ' ' + (k === tk ? 'now' : '') + '"><small>' + (m ? Math.round(m) + 'm' : '') + '</small><i data-h="' + Math.min(100, m / Math.max(cap, 120) * 72) + 'px"></i>' + DOW[d.getDay()] + '</div>';
    }
    // at a glance
    var start = parseDateStr(M.mod.start), exam = P.dp.examDate, hf = addDays(start, -((start.getDay() + 6) % 7)), heat = '', ek = fmtDate(exam);
    var cells = Math.min(42, Math.ceil(((exam - hf) / 864e5 + 1) / 7) * 7);
    for (var j = 0; j < cells; j++) {
      var dd = addDays(hf, j), kk = fmtDate(dd), mm = 0, c = '';
      if (kk === ek) c = 'x'; else if (dd < start || dd > exam) c = 'o'; else if (kk < tk) mm = doneMinOn(kk, P); else if (P.assignments[kk]) mm = P.assignments[kk].totalMin;
      var lv = mm > 90 ? 4 : mm > 50 ? 3 : mm > 20 ? 2 : mm > 0 ? 1 : 0;
      heat += '<i class="' + c + ' ' + (kk >= tk && mm && c !== 'x' ? 'p' : 'l' + lv) + ' ' + (kk === tk ? 't' : '') + '" style="animation-delay:' + j * 18 + 'ms" title="' + MON[dd.getMonth()] + ' ' + dd.getDate() + (mm ? ' · ' + Math.round(mm) + ' min' : '') + '">' + (c === 'x' ? 'EXAM' : dd.getDate()) + '</i>';
    }
    var qhtml = q.length ? q.map(function (it, i) {
      return '<div class="q" style="--i:' + i + '" data-v="' + esc(it.id) + '"><button class="play" data-play="' + esc(it.id) + '" title="Play">' + PLAY + '</button><div class="grow"><div class="t">' + esc(cleanVid(it)) + '</div><div class="m"><i class="sd"></i>' + esc(subjLabelForItem(it)) + ' · ' + esc(it.title) + '</div></div><span class="mins">' + Math.round(it.min) + ' min' + (it.cards ? '<small>' + it.cards + ' cards</small>' : '') + '</span><button class="cb" data-ck="' + esc(it.id) + '" title="Mark watched">' + CHECK + '</button></div>';
    }).join('') : '<div class="empty"><b>' + (doneToday ? 'Today\'s list is done' : 'Nothing planned today') + '</b>' + (doneToday ? 'Start tomorrow\'s list early, or go do some Anki.' : 'Open the planner to see what\'s next.') + '</div>';
    var qMin = q.reduce(function (x, i) { return x + i.min; }, 0), qCards = q.reduce(function (x, i) { return x + (i.cards || 0); }, 0);
    return '<div class="view"><h1 class="greet">Good <span class="shine">' + greet + '</span></h1>' +
      '<p class="sub">' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()] + ', ' + MON[now.getMonth()] + ' ' + now.getDate() + ' · ' + esc(M.mod.short) + ' · ' + pill + (sk ? ' <span class="streak"><i>🔥</i>' + sk + '-day streak</span>' : '') + '</p>' +
      '<div class="today-grid"><div>' +
      '<div class="card hero"><h2>' + label + '</h2><div class="big">' + (q.length ? q.length + ' video' + (q.length > 1 ? 's' : '') + ' · <span data-count="' + Math.round(qMin) + '" data-suf=" min">0</span>' + (qCards ? ' · <span data-count="' + qCards + '" data-suf=" cards">0</span>' : '') : (doneToday ? 'All done for today' : 'A free day')) + '</div><div class="queue stagger" id="w6-queue">' + qhtml + '</div></div>' +
      '<div class="card week"><h3>This week</h3><div class="wk">' + wk + '</div></div></div>' +
      '<div><div class="card ring-card"><div class="ring gold">' + ring(p, 184, 70) + '<div class="lbl"><div><b data-count="' + p + '" data-suf="%">0</b><span>of ' + esc(M.mod.short) + '</span></div></div></div>' +
      '<div class="stats"><div class="stat"><b data-count="' + Math.round(st.totalRemainingMin) + '">0</b><span>minutes left</span></div>' + (cardsLeft ? '<div class="stat"><b data-count="' + Math.round(cardsLeft) + '">0</b><span>Anki cards left</span></div>' : '<div class="stat"><b data-count="' + (P.completedPool || []).length + '">0</b><span>videos watched</span></div>') + '<div class="stat"><b data-count="' + st.totalRemainingCount + '">0</b><span>videos left</span></div><div class="stat"><b data-count="' + Math.round(totMin / 60) + '" data-suf=" h">0</b><span>module total</span></div></div></div>' +
      '<div class="card subj"><h3>By subject</h3>' + subjHtml + '</div>' +
      '<div class="card subj"><h3>' + esc(M.mod.short) + ' at a glance</h3><div class="heat">' + heat + '</div><div class="legend" style="padding:0;margin-top:14px"><span><i style="background:linear-gradient(135deg,#f0d68a,#b5832a)"></i>Watched</span><span><i style="box-shadow:inset 0 0 0 1.5px var(--gold)"></i>Planned</span><span><i style="background:var(--text)"></i>Exam</span></div></div>' +
      '</div></div></div>';
  }
  function cap1(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  var CUR = {};   // lecture/video lookup for the current module view
  function lecCard(L, i) {
    var d = lDone(L), p = pctOf(L.vids), open = S.closed[L.id] ? false : (S.open[L.id] || (!d && L.vids.length > 0));
    var min = L.vids.reduce(function (a, v) { return a + (v.min || 0); }, 0), cards = L.vids.reduce(function (a, v) { return a + (v.cards || 0); }, 0) || L.cards;
    var meta = [(L.chap && !/^[—–-]+$/.test(L.chap)) ? L.chap : '', min ? Math.round(min) + ' min' : '', cards ? Math.round(cards) + ' cards' : ''].filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '<span class="badges" data-badges="' + esc(L.id) + '"></span>';
    var body = L.vids.length ? '<div class="vids">' + L.vids.map(function (v) {
      return '<div class="vid ' + (vDone(v) ? 'ck' : '') + '" data-v="' + esc(v.id) + '"><button class="cb" data-ck="' + esc(v.id) + '">' + CHECK + '</button><span class="nm">' + esc(v.title) + '</span><span class="acts2" data-acts="' + esc(v.id) + '"></span><span class="src">' + esc(v.src) + '</span>' + (v.cards ? '<span class="cards">' + Math.round(v.cards) + ' cards</span>' : '') + '<span class="mins">' + Math.round(v.min || 0) + ' min</span></div>';
    }).join('') + '</div>' : '<div class="novid">' + esc(L.gap || 'Class session — nothing to watch for this one.') + '<span class="acts2" data-acts="' + esc(L.id) + '#row"></span></div>';
    var date = L.when ? '<span class="date"><small>' + L.when.dow + '</small><b>' + L.when.day + '</b></span>' : '<span class="date"><small>&nbsp;</small><b>–</b></span>';
    var right = L.vids.length ? '<span class="mini">' + ring(p, 34, 14) + '<span class="tick">' + TICKSVG + '</span></span>' : '<button class="cb ' + (L.cb.checked ? 'on' : '') + '" data-ck="' + esc(L.id) + '" title="Mark done">' + CHECK + '</button>';
    return '<div class="card lec ' + (d ? 'done' : '') + ' ' + (open ? 'open' : '') + '" id="w6-L-' + esc(L.id) + '" style="--i:' + Math.min(i, 12) + '"><div class="lec-h" data-toggle="' + esc(L.id) + '">' + date + '<span class="grow"><div class="tt">' + esc(L.title) + '</div><div class="mt">' + meta + '</div></span>' + right + '<span class="chev">' + ICON.chev + '</span></div><div class="lec-b"><div>' + body + '</div></div></div>';
  }
  function vModule() {
    var subs = subsOf(S.tab); if (!subs.length) { S.view = 'today'; return vToday(); }
    var cur = subs.filter(function (s) { return s.sub === S.sub; })[0];
    if (!cur || !cur.cards) cur = subs.filter(function (s) { return s.cards; })[0];
    if (!cur) { showLegacy(S.tab, null); return ''; }
    S.sub = cur.sub;
    var mod = modFor(S.tab), table = cur.tables[0], lecs = lectures(table);
    CUR = { lecs: {}, vids: {} }; lecs.forEach(function (L) { CUR.lecs[L.id] = L; L.vids.forEach(function (v) { CUR.vids[v.id] = v; }); });
    var shown = lecs.filter(function (L) { return S.filter === 'all' || (S.filter === 'todo' ? !lDone(L) : lDone(L)); });
    var html = '', sec = null, secs = [], i = 0;
    shown.forEach(function (L) { if (L.sec !== sec) { sec = L.sec; secs.push(sec); html += '<div class="sec-title" id="w6-S-' + secs.length + '">' + esc(sec || 'Lectures') + (L.secRange ? '<em>' + esc(L.secRange) + '</em>' : '') + '</div>'; } html += lecCard(L, i++); });
    if (!shown.length) html = '<div class="card empty"><b>Nothing here</b>Try a different filter.</div>';
    if (lecs.notes && lecs.notes.length && S.filter !== 'done') html += '<div class="note">' + lecs.notes.map(function (n) { return esc(n.text); }).join('<br>') + '</div>';
    var allV = []; subs.forEach(function (s) { if (s.cards) lectures(s.tables[0]).forEach(function (L) { allV = allV.concat(L.vids); }); });
    var curV = []; lecs.forEach(function (L) { curV = curV.concat(L.vids); });
    var p = pctOf(curV), lm = minsLeft(curV), cl = curV.filter(function (v) { return !vDone(v); }).reduce(function (a, v) { return a + (v.cards || 0); }, 0);
    var tabs = subs.map(function (s) { var pp = s.cards ? pctOf([].concat.apply([], lectures(s.tables[0]).map(function (L) { return L.vids; }))) : null; return '<button data-sub="' + esc(s.sub || '') + '" class="' + (s.sub === cur.sub ? 'on' : '') + '">' + esc(s.label) + (pp !== null ? '<small>' + pp + '%</small>' : '<small class="ext">↗</small>') + '</button>'; }).join('');
    var h2 = D.querySelector('#panel-' + S.tab + ' > h2, #panel-' + S.tab + ' h2'), ht = h2 ? txt(h2) : '';
    var hm = /^[A-Z]+\d*\s*[—–-]\s*(.*?)\s*(?:\(([^)]*)\))?$/.exec(ht);
    var name = hm && hm[1] ? hm[1] : (mod ? decode(mod.name).replace(/^[A-Z]+\d+\s*[—-]\s*/, '') : '');
    var dates = hm && hm[2] ? hm[2].replace(/,\s*\d{4}$/, '').replace(/–/g, ' – ') : (mod ? fmtShort(mod.start) + ' – ' + fmtShort(mod.end) : '');
    return '<div class="view"><div class="card mod-head"><div><h1>' + esc(tabLabel(S.tab)) + '</h1><p>' + esc(name) + (dates ? ' · ' + dates : '') + '</p></div><div class="right"><b data-count="' + pctOf(allV) + '" data-suf="%">0</b><div style="color:var(--dim);font-size:13px">watched</div></div></div>' +
      '<div class="toolbar"><div class="tabs" id="w6-tabs"><span class="tab-ind" id="w6-ind"></span>' + tabs + '</div><div class="chips">' + [['all', 'All'], ['todo', 'To do'], ['done', 'Done']].map(function (x) { return '<button class="chip ' + (S.filter === x[0] ? 'on' : '') + '" data-filter="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '<button class="chip" data-classic="1" title="The original page for this subject: study guide, search, Mark all, Q bank links">Classic view ↗</button></div></div>' +
      '<div class="mod-grid"><div class="stagger">' + html + '</div><div class="rail"><div class="card" style="display:flex;gap:14px;align-items:center"><div class="ring" style="width:76px;height:76px">' + ring(p, 76, 32) + '<div class="lbl"><b style="font-size:17px" data-count="' + p + '" data-suf="%">0</b></div></div><div><b>' + esc(cur.label) + '</b><div style="color:var(--dim);font-size:13px">' + (lm ? Math.round(lm) + ' min left' : 'All watched') + (cl ? ' · ' + Math.round(cl) + ' cards' : '') + '</div></div></div>' +
      (secs.length > 1 ? '<div class="card"><h4>Jump to</h4>' + secs.map(function (s, k) { var sl = lecs.filter(function (L) { return L.sec === s; }); return '<button class="jump" data-jump="w6-S-' + (k + 1) + '"><span>' + esc(s || 'Lectures') + '</span><em>' + sl.filter(lDone).length + '/' + sl.length + '</em></button>'; }).join('') + '</div>' : '') + '</div></div></div>';
  }
  function fillModuleSlots() {
    $$('#w6 [data-badges]').forEach(function (slot) { var L = CUR.lecs[slot.dataset.badges]; if (!L) return; $$(BADGE_SEL, L.row).forEach(function (a) { if (a.classList.contains('sketchy-path-link')) { var c = cloneCtl(a); c.title = 'Optional Sketchy Pathology: ' + txt(a); c.textContent = '🧬 Sketchy Path'; slot.appendChild(c); } else slot.appendChild(cloneCtl(a)); }); });
    $$('#w6 [data-acts]').forEach(function (slot) {
      var id = slot.dataset.acts, rowMode = /#row$/.test(id); id = id.replace(/#row$/, '');
      var v = CUR.vids[id], wrap = D.createElement('div'); wrap.className = 'vid-sub w6x-acts';
      if (v && v.line) {
        var line = v.line.cloneNode(true);
        $$('.sv-check, .sv-src, .sk-title', line).forEach(function (x) { x.remove(); });
        $$('a.video-link:not(.sk-btn)', line).forEach(function (a) { a.textContent = '▶ Watch'; });
        $$('a, button.lv-ak', line).forEach(function (a) { if (!a.getAttribute('onclick') && (a.getAttribute('href') === '#' || !a.getAttribute('href')) && !a.classList.contains('lv-ak')) { var orig = null; var all = $$('a', v.line); var idx = $$('a', line).indexOf(a); orig = all[idx]; if (orig) a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); orig.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY })); }); } });
        wrap.appendChild(line);
      } else if (v && v.self && v.link) { var c = cloneCtl(v.link); c.textContent = '▶ Watch'; var ln = D.createElement('div'); ln.className = 'sv-line'; ln.appendChild(c); wrap.appendChild(ln); }
      else if (rowMode) { var L = CUR.lecs[id]; if (L) $$('a.ky-note-link, a.bcnotes-link', L.row).forEach(function (a) { wrap.appendChild(cloneCtl(a)); }); }
      if (wrap.childNodes.length) slot.appendChild(wrap);
    });
  }
  function vPlanner() {
    var P = plan(), M = pm();
    if (!P || !M) return '<div class="view"><h1>Planner</h1><div class="card empty"><b>No planner for this module</b><button class="btn" data-legacy="planner">Open the full planner</button></div></div>';
    var st = P.stats, dp = P.dp, tk = todayKey(), cap = P.settings.dailyCapacity, late = !st.paceSufficient;
    var remItems = (P.autoPool || []).concat(P.manualItems || []), cardsLeft = remItems.reduce(function (x, i) { return x + (i.cards || 0); }, 0);
    var start = parseDateStr(M.mod.start), exam = dp.examDate, ek = fmtDate(exam);
    var first = addDays(start, -((start.getDay() + 6) % 7)), last = addDays(exam, 6 - ((exam.getDay() + 6) % 7));
    var n = Math.round((last - first) / 864e5) + 1, cells = '', ov = {}; try { ov = loadManualOverrides(); } catch (e) {}
    for (var i = 0; i < n; i++) {
      var d = addDays(first, i), k = fmtDate(d), cls = '', ev = [], min = 0, cards = 0, drop = '';
      if (k === ek) { cls = 'exam'; ev = ['<div style="font-weight:800;font-size:13px;margin-top:6px">' + esc(M.mod.short) + ' exam</div>']; }
      else if (d < start || d > exam) cls = 'out';
      else if (k < tk) { var di = doneItemsOn(k, P); min = di.reduce(function (a, x) { return a + x.min; }, 0); cards = di.reduce(function (a, x) { return a + (x.cards || 0); }, 0); ev = di.map(function (x) { return '<div class="ev d" title="' + esc(cleanVid(x)) + '"><b>' + esc(cleanVid(x)) + '</b><span>' + Math.round(x.min) + ' min' + (x.cards ? ' · ' + x.cards + ' cards' : '') + '</span></div>'; }); }
      else if (P.assignments[k]) {
        var A = P.assignments[k]; drop = k;
        var its = A.items.filter(function (x) { return !x.checked; });
        var dn = (A.doneToday || []);
        min = its.reduce(function (a, x) { return a + x.min; }, 0) + dn.reduce(function (a, x) { return a + x.min; }, 0);
        cards = its.reduce(function (a, x) { return a + (x.cards || 0); }, 0) + dn.reduce(function (a, x) { return a + (x.cards || 0); }, 0);
        ev = dn.map(function (x) { return '<div class="ev d" title="Done: ' + esc(cleanVid(x)) + '"><b>✓ ' + esc(cleanVid(x)) + '</b><span>' + Math.round(x.min) + ' min' + (x.cards ? ' · ' + x.cards + ' cards' : '') + '</span></div>'; })
          .concat(its.map(function (x, j) { return '<div class="ev ' + (ov[x.id] ? 'moved' : '') + '" draggable="true" data-drag="' + esc(x.id) + '" title="' + esc(cleanVid(x)) + ' — drag to another day" style="animation-delay:' + j * 40 + 'ms"><b>' + esc(cleanVid(x)) + '</b><span>' + Math.round(x.min) + ' min' + (x.cards ? ' · ' + x.cards + ' cards' : '') + '</span></div>'; }));
        if (A.type === 'review') { cls = 'rev'; if (!ev.length) ev = ['<div style="font-size:12px;font-weight:700;color:var(--warn);margin-top:6px">Review day</div>']; }
      }
      else if (dp.reviewDates.indexOf(k) >= 0) { cls = 'rev'; ev = ['<div style="font-size:12px;font-weight:700;color:var(--warn);margin-top:6px">Review day</div>']; }
      if (k === tk) cls += ' today';
      var base = drop ? 6 : 3, mx = S.exp[k] ? 999 : base;
      var show = ev.slice(0, mx).join('') + (ev.length > base ? '<button class="ev more" data-more="' + k + '">' + (S.exp[k] ? 'Show less' : '+' + (ev.length - base) + ' more') + '</button>' : '');
      cells += '<div class="day ' + cls + '" ' + (drop ? 'data-day="' + drop + '"' : '') + '><div class="dn"><span>' + (d.getDate() === 1 || i === 0 ? MON[d.getMonth()] + ' ' : '') + d.getDate() + '</span></div>' + show + (min ? '<div class="tot">' + Math.round(min) + ' min' + (cards ? ' · ' + Math.round(cards) + ' cards' : '') + '</div>' : '') + (min && k >= tk && cls.indexOf('rev') < 0 ? '<div class="load"><i class="' + (min > cap ? 'over' : '') + '" data-w="' + Math.min(100, min / cap * 100) + '%"></i></div>' : '') + '</div>';
    }
    var need = (st.requiredDailyMin === Infinity || st.requiredDailyMin == null || !st.contentDaysCount) ? null : st.requiredDailyMin;
    var needR = need ? Math.ceil(need / 5) * 5 : null;
    var adv = late ? (need ? '<b>At ' + cap + ' min a day you need about ' + need + ' min a day.</b>' : '<b>No study days are left before your review days.</b>') + '<span>' + esc((P.warnings || [])[0] ? String(P.warnings[0]).replace(/<[^>]+>/g, '').slice(0, 220) : 'Raise your daily minutes or reduce review days so everything fits.') + '</span>' : '<b>You\'re ' + esc(st.paceStatus) + ' at ' + cap + ' min a day.</b><span>Everything fits before your review days start' + (st.planFinish ? ' — new content finishes ' + fmtShort(st.planFinish) : '') + '.</span>';
    var moved = Object.keys(ov).length;
    return '<div class="view"><h1>Planner</h1><p class="sub">' + Math.round(st.totalRemainingMin) + ' minutes of video' + (cardsLeft ? ' and ' + Math.round(cardsLeft) + ' Anki cards' : '') + ' left · ' + st.contentDaysCount + ' study day' + (st.contentDaysCount === 1 ? '' : 's') + ' · ' + dp.reviewDates.length + ' review day' + (dp.reviewDates.length === 1 ? '' : 's') + ' before the exam' + (M.isAuto ? '' : ' · <span class="pill mute">planning ' + esc(M.mod.short) + '</span>') + '</p>' +
      '<div class="card advice ' + (late ? 'late' : '') + '"><div class="grow">' + adv + '</div>' + (late && needR ? '<button class="btn acc" id="w6-fix" data-need="' + needR + '">Raise to ' + needR + ' min/day</button>' : '') + (moved ? '<button class="btn ghost" id="w6-resetMoves">Undo my moves</button>' : '') + '<button class="btn ghost" id="w6-openDrawer">Adjust plan</button></div>' +
      '<div class="card cal"><div class="cal-h">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="cal-g">' + cells + '</div>' +
      '<div class="legend"><span><i style="background:var(--gold)"></i>Watched</span><span><i style="background:var(--acc)"></i>Planned</span><span><i style="background:var(--warn)"></i>Review day</span><span><i style="background:var(--gold2);box-shadow:0 0 0 2px var(--gold)"></i>Moved by you</span><span class="hint">Tip: drag a video onto another day to move it · <button class="linkish" data-legacy="planner">full planner ↗</button></span></div></div></div>';
  }

  /* ---------------- render ---------------- */
  var lastP = null;
  function render(keep) {
    if (!V) return;
    var y = SC.scrollTop;
    R.classList.toggle('w6-legacy', S.view === 'legacy');
    if (S.view === 'legacy') { renderSide(); crumb(); renderDock(plan()); saveNav(); return; }
    var html = '';
    try { html = S.view === 'planner' ? vPlanner() : S.view === 'module' ? vModule() : vToday(); }
    catch (e) { console.error('w6 render', e); html = '<div class="view"><div class="card empty"><b>Something went wrong drawing this page</b>Use <b>Switch to the classic layout</b> in the sidebar. Everything you tick is still saved.</div></div>'; }
    if (S.view === 'legacy') return;   // vModule may have switched to a legacy page
    V.innerHTML = px(html + FOOT);
    if (S.view === 'module') fillModuleSlots();
    renderSide(); crumb(); lastP = plan(); renderDock(lastP);
    if (keep) { SC.scrollTop = y; $$('#w6 .w6-view, #w6 .w6-stagger > *, #w6 .w6-ev, #w6 .w6-heat i').forEach(function (e) { e.style.animation = 'none'; e.style.opacity = 1; }); }
    else SC.scrollTop = 0;
    settle(keep); saveNav();
  }
  var schedT = 0;
  function schedule() { clearTimeout(schedT); schedT = setTimeout(function () { if (S.anim > 0 || !V || !shown) { if (S.anim > 0) schedule(); return; } if (S.view === 'legacy') { renderSide(); return; } render(true); }, 260); }
  function moveInd() { var on = $('#w6-tabs button.w6-on'), ind = $('#w6-ind'); if (on && ind) { ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; } }
  function go(v, tab, sub) {
    if (S.view === 'legacy') leaveLegacy();
    S.view = v; if (tab !== undefined) S.tab = tab; if (sub !== undefined) S.sub = sub; render();
  }
  function showLegacy(tab, sub, classic) {
    S.view = 'legacy'; S.legacyTab = tab; S.legacySub = sub || null; S.legacyClassic = !!classic;
    R.classList.add('w6-legacy');
    try { switchTab(tab); if (sub) switchSubTab(sub); } catch (e) { console.warn(e); }
    window.scrollTo(0, 0); renderSide(); crumb(); saveNav();
  }
  function leaveLegacy() { R.classList.remove('w6-legacy'); window.scrollTo(0, 0); }

  /* ---------------- actions ---------------- */
  function toggleItem(id, btn) {
    var el = itemEl(id), cb = elCb(el);
    if (!cb) { toast('Couldn\'t find that video — try the classic view'); return; }
    var was = cb.checked, lecId = el.classList.contains('vid-sub') ? el.dataset.parent : el.dataset.id;
    var L0 = CUR.lecs && CUR.lecs[lecId], wasLecDone = L0 ? lDone(L0) : false;
    var P0 = lastP, todayLeft0 = P0 && P0.assignments[todayKey()] ? P0.assignments[todayKey()].items.filter(function (i) { return !i.checked; }).length : 0;
    S.anim++;
    try { cb.click(); } catch (e) { console.warn(e); }
    var undo = function () { var c = elCb(itemEl(id)); if (c && c.checked !== was) c.click(); schedule(); };
    if (!was && btn) { var r = btn.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); btn.classList.add('w6-on', 'w6-pop'); }
    var row = btn && btn.closest('.w6-q, .w6-vid');
    if (S.view === 'today' && !was && row && row.classList.contains('w6-q')) {
      setTimeout(function () { row.classList.add('w6-gone'); }, 260);
      if (todayLeft0 <= 1) setTimeout(function () { celebrate('Today\'s list is done', 'Start tomorrow early, or go do some Anki'); }, 450);
      setTimeout(function () { S.anim--; render(true); }, 760);
    } else if (S.view === 'module' && row) {
      row.classList.toggle('w6-ck', !was);
      var card = row.closest('.w6-lec');
      if (card && L0) {
        var fg = card.querySelector('.w6-mini .w6-fg'); if (fg) { var c = 2 * Math.PI * 14; fg.style.strokeDashoffset = c * (1 - pctOf(L0.vids) / 100); }
        var nowDone = lDone(L0); card.classList.toggle('w6-done', nowDone);
        if (nowDone && !wasLecDone) { var mr = card.querySelector('.w6-mini').getBoundingClientRect(); setTimeout(function () { confetti(mr.left + 17, mr.top + 17, 70, 1.6); }, 250); setTimeout(function () { card.classList.remove('w6-open'); delete S.open[L0.id]; }, 900); }
      }
      setTimeout(function () { renderSide(); }, 300);
      setTimeout(function () { S.anim--; render(true); }, 1400);
    } else if (S.view === 'module' && btn && btn.closest('.w6-lec-h')) {
      setTimeout(function () { S.anim--; render(true); }, 500);
    } else { setTimeout(function () { S.anim--; render(true); }, 300); }
    if (!was) {
      var L1 = CUR.lecs && CUR.lecs[lecId];
      var it = lastP && lastP.completedPool ? null : null;
      var leftMin = 0; try { var P1 = computePlan(); leftMin = Math.round(P1.stats.totalRemainingMin); } catch (e) {}
      toast(L1 && lDone(L1) && !wasLecDone ? 'Lecture finished — ' + L1.title : 'Done · ' + leftMin + ' min left in the plan', undo);
    }
  }
  function openDrawer(on) {
    $('#w6-drawer').classList.toggle('w6-on', on); $('#w6-scrim').classList.toggle('w6-on', on || $('#w6-pal').classList.contains('w6-on'));
    if (on) { var s = loadPlannerSettings(); $('#w6-cap').value = s.dailyCapacity; $('#w6-rev').value = s.reviewDays; $('#w6-capV').textContent = s.dailyCapacity + ' min'; $('#w6-revV').textContent = s.reviewDays; }
  }
  var setT = 0;
  function setPlan(cap, rev) {
    try { populateSettingsInputs(); } catch (e) {}
    var c = D.getElementById('set-capacity'), r = D.getElementById('set-reviewdays');
    if (!c || !r) { toast('Open the full planner to change this'); return; }
    if (cap != null) c.value = cap; if (rev != null) r.value = rev;
    onSettingsChange();
    clearTimeout(setT); setT = setTimeout(function () { render(true); }, 60);
  }

  /* ---------------- palette ---------------- */
  var res = [], sel = 0;
  function pal(on) { $('#w6-pal').classList.toggle('w6-on', on); $('#w6-scrim').classList.toggle('w6-on', on || $('#w6-drawer').classList.contains('w6-on')); if (on) { $('#w6-palIn').value = ''; search(); setTimeout(function () { $('#w6-palIn').focus(); }, 30); } }
  function palPool() {
    var pool = [{ t: 'Go to Today', s: 'action', act: function () { go('today'); } }, { t: 'Go to Planner', s: 'action', act: function () { go('planner'); } }, { t: 'Class schedule', s: 'action', act: function () { showLegacy('schedule'); } }, { t: 'Settings', s: 'action', act: function () { openSettings(); } }, { t: 'Toggle dark mode', s: 'action', act: function () { $('#w6-theme').click(); } }, { t: 'Adjust plan', s: 'action', act: function () { go('planner'); openDrawer(true); } }];
    modTabs().forEach(function (t) {
      subsOf(t).forEach(function (s) {
        if (!s.cards) { pool.push({ t: tabLabel(t) + ' · ' + s.label, s: 'page', act: function () { showLegacy(t, s.sub); } }); return; }
        lectures(s.tables[0]).forEach(function (L) {
          pool.push({ t: L.title, s: tabLabel(t) + ' · ' + s.label, L: L, tab: t, sub: s.sub });
          L.vids.forEach(function (v) { if (v.title && v.title !== L.title) pool.push({ t: v.title, s: tabLabel(t) + ' · ' + Math.round(v.min) + ' min', L: L, tab: t, sub: s.sub }); });
        });
      });
    });
    return pool;
  }
  function search() {
    var q = $('#w6-palIn').value.trim().toLowerCase(), pool = palPool();
    res = (q ? pool.filter(function (x) { return x.t.toLowerCase().indexOf(q) >= 0 || (x.s || '').toLowerCase().indexOf(q) >= 0; }) : pool.filter(function (x) { return x.act || (x.L && !lDone(x.L) && x.L.vids.length); })).slice(0, 9); sel = 0;
    var hl = function (t) { if (!q) return esc(t); var i = t.toLowerCase().indexOf(q); if (i < 0) return esc(t); return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
    $('#w6-palList').innerHTML = px(res.length ? res.map(function (x, i) { return '<button class="pr ' + (i === sel ? 'sel' : '') + '" data-pal="' + i + '"><span class="pt">' + hl(x.t) + '</span><em>' + esc(x.s) + '</em></button>'; }).join('') : '<div class="empty">No matches</div>');
  }
  function pick(i) {
    var x = res[i]; if (!x) return; pal(false);
    if (x.act) { x.act(); return; }
    S.filter = 'all'; S.open[x.L.id] = 1; delete S.closed[x.L.id]; go('module', x.tab, x.sub);
    setTimeout(function () { var c = D.getElementById('w6-L-' + x.L.id); if (c) { c.classList.add('w6-open'); c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.classList.add('w6-flash'); setTimeout(function () { c.classList.remove('w6-flash'); }, 1500); } }, 350);
  }
  function openSettings() { try { openSettingsModal(); } catch (e) { console.warn(e); } }

  /* ---------------- events ---------------- */
  function bind() {
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go],[data-mod],[data-legacy],[data-ck],[data-play],[data-toggle],[data-sub],[data-filter],[data-jump],[data-open],[data-pal],[data-more],[data-classic]');
      if (!t || !root.contains(t)) return;
      if (t.closest('.w6x-acts') || (e.target.closest('a, button.lv-ak') && e.target.closest('.w6-badges, .w6x-acts'))) return;
      if (t.dataset.go) go(t.dataset.go);
      else if (t.dataset.mod) { var subs = subsOf(t.dataset.mod); if (subs.some(function (s) { return s.cards; })) go('module', t.dataset.mod, S.tab === t.dataset.mod ? S.sub : null); else showLegacy(t.dataset.mod, null); }
      else if (t.dataset.legacy) showLegacy(t.dataset.legacy, null);
      else if (t.dataset.ck) { e.stopPropagation(); toggleItem(t.dataset.ck, t); }
      else if (t.dataset.play) playEl(itemEl(t.dataset.play));
      else if (t.dataset.toggle) { if (e.target.closest('a, button')) return; var c = t.closest('.w6-lec'); c.classList.toggle('w6-open'); var id = t.dataset.toggle; if (c.classList.contains('w6-open')) { S.open[id] = 1; delete S.closed[id]; } else { S.closed[id] = 1; delete S.open[id]; } }
      else if (t.dataset.sub !== undefined && t.closest('#w6-tabs')) { var sb = subsOf(S.tab).filter(function (s) { return (s.sub || '') === t.dataset.sub; })[0]; if (sb && !sb.cards) { showLegacy(S.tab, sb.sub); return; } S.sub = t.dataset.sub; S.filter = 'all'; $$('#w6-tabs button').forEach(function (b) { b.classList.toggle('w6-on', b === t); }); moveInd(); setTimeout(function () { render(); }, 180); }
      else if (t.dataset.filter) { S.filter = t.dataset.filter; render(); }
      else if (t.dataset.classic) showLegacy(S.tab, S.sub, true);
      else if (t.dataset.jump) { var j = D.getElementById(t.dataset.jump); if (j) j.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (t.dataset.open) { var pr = t.dataset.open.split('|'); S.filter = 'all'; go('module', pr[0], pr[1] || null); }
      else if (t.dataset.pal) pick(+t.dataset.pal);
      else if (t.dataset.more) { S.exp[t.dataset.more] = !S.exp[t.dataset.more]; render(true); }
    });
    V.addEventListener('click', function (e) {
      var id = e.target.closest('button') && e.target.closest('button').id;
      if (id === 'w6-fix') { setPlan(+e.target.closest('button').dataset.need, null); toast('Daily target is now ' + e.target.closest('button').dataset.need + ' min'); }
      else if (id === 'w6-openDrawer') openDrawer(true);
      else if (id === 'w6-resetMoves') { if (typeof clearAllManualOverrides === 'function') { var keep = window.confirm; try { window.confirm = function () { return true; }; clearAllManualOverrides(); } finally { window.confirm = keep; } render(true); toast('Back to the automatic plan'); } }
    });
    $('#w6-scrim').onclick = function () { openDrawer(false); pal(false); };
    $('#w6-closeDrawer').onclick = function () { openDrawer(false); };
    $('#w6-fullPlanner').onclick = function () { openDrawer(false); showLegacy('planner'); };
    $('#w6-cap').oninput = function () { $('#w6-capV').textContent = this.value + ' min'; setPlan(+this.value, null); };
    $('#w6-rev').oninput = function () { $('#w6-revV').textContent = this.value; setPlan(null, +this.value); };
    $('#w6-openPal').onclick = function () { pal(true); };
    $('#w6-palIn').oninput = search;
    $('#w6-palIn').onkeydown = function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!res.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; $$('#w6-palList > button').forEach(function (b, i) { b.classList.toggle('w6-sel', i === sel); }); } else if (e.key === 'Enter') pick(sel); };
    $('#w6-settings').onclick = openSettings;
    $('#w6-sync').onclick = function () { var st = $('#sync-status'); if (st && /signed in/i.test(st.textContent)) openSettings(); else { try { signInWithGoogle(); } catch (e) {} } };
    $('#w6-classic').onclick = function () { try { localStorage.setItem('w6_off', '1'); } catch (e) {} location.reload(); };
    $('#w6-theme').onclick = function (e) {
      var apply = function () { try { toggleTheme(); } catch (er) {} };
      if (!D.startViewTransition || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { apply(); return; }
      var r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, Rr = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      R.classList.add('theming'); var tr = D.startViewTransition(apply);
      tr.ready.then(function () { R.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + Rr + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }); }).catch(function () {});
      tr.finished.finally(function () { R.classList.remove('theming'); });
    };
    D.addEventListener('keydown', function (e) {
      if (!shown) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal(!$('#w6-pal').classList.contains('w6-on')); return; }
      if (e.key === 'Escape') { pal(false); openDrawer(false); return; }
      var tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ($$('.md-modal-overlay').some(function (o) { return getComputedStyle(o).display !== 'none'; })) return;
      if (e.key === '1') go('today'); else if (e.key === '2') go('planner'); else if (e.key === '/') { e.preventDefault(); pal(true); }
    });
    root.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.w6-card'); if (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      var t = $('#w6 .w6-ring-card'); if (t) { var rr = t.getBoundingClientRect(), inx = e.clientX > rr.left && e.clientX < rr.right && e.clientY > rr.top && e.clientY < rr.bottom; t.style.transform = inx ? 'perspective(900px) rotateY(' + ((e.clientX - rr.left) / rr.width - .5) * 12 + 'deg) rotateX(' + (-((e.clientY - rr.top) / rr.height - .5) * 12) + 'deg)' : ''; }
    });
    // planner drag & drop -> the tracker's own moveItemToDate()
    var dragId = null;
    V.addEventListener('dragstart', function (e) { var t = e.target.closest && e.target.closest('[data-drag]'); if (!t) return; dragId = t.dataset.drag; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {} setTimeout(function () { t.classList.add('w6-dragging'); }, 0); });
    V.addEventListener('dragend', function () { dragId = null; $$('#w6 .w6-dragging, #w6 .w6-drop').forEach(function (x) { x.classList.remove('w6-dragging', 'w6-drop'); }); });
    V.addEventListener('dragover', function (e) { var d = e.target.closest && e.target.closest('.w6-day[data-day]'); if (!d || !dragId) return; e.preventDefault(); $$('#w6 .w6-day.w6-drop').forEach(function (x) { if (x !== d) x.classList.remove('w6-drop'); }); d.classList.add('w6-drop'); });
    V.addEventListener('drop', function (e) {
      var d = e.target.closest && e.target.closest('.w6-day[data-day]'); if (!d || !dragId) return; e.preventDefault();
      var id = dragId, day = d.dataset.day, prev = (loadManualOverrides() || {})[id]; dragId = null;
      try { moveItemToDate(id, day); } catch (er) { console.warn(er); }
      render(true);
      var r2 = $('#w6 .w6-day[data-day="' + day + '"]'); if (r2) { var b = r2.getBoundingClientRect(); confetti(b.left + b.width / 2, b.top + 30, 14, .8); }
      toast('Moved to ' + fmtShort(day), function () { var o = loadManualOverrides(); if (prev) o[id] = prev; else delete o[id]; saveManualOverrides(o); try { renderPlanner(); } catch (er) {} render(true); });
    });
    addEventListener('resize', function () { fit(); moveInd(); });
    // on a page shown in its original form, the old subject tabs lead back to the new cards
    D.addEventListener('click', function (e) {
      if (!shown || S.view !== 'legacy' || S.legacyClassic) return;
      var b = e.target.closest && e.target.closest('#app-content .module-subtab-btn'); if (!b) return;
      var s2 = subsOf(S.legacyTab).filter(function (x) { return x.sub === b.dataset.sub; })[0];
      if (s2 && s2.cards) { e.preventDefault(); e.stopPropagation(); S.filter = 'all'; go('module', S.legacyTab, s2.sub); }
    }, true);
  }

  /* ---------------- hooks into the tracker ---------------- */
  function hook(name, after) { var f = window[name]; if (typeof f !== 'function' || f.__w6) return; var w = function () { var r = f.apply(this, arguments); try { after(); } catch (e) {} return r; }; w.__w6 = 1; window[name] = w; }
  var shown = false;
  function appVisible() { var a = app(); return !!a && a.style.display !== 'none' && !R.classList.contains('auth-pending') && getComputedStyle(D.getElementById('auth-gate') || D.body).display === 'none'; }
  function sync() {
    var v = appVisible();
    if (v && !shown) { shown = true; R.classList.add('w6-on'); root.style.display = ''; if (S.view === 'legacy' && S.legacyTab) showLegacy(S.legacyTab, S.legacySub); else render(); }
    else if (!v && shown) { shown = false; R.classList.remove('w6-on', 'w6-legacy'); root.style.display = 'none'; }
  }
  function start() {
    if (D.getElementById('w6')) return;
    root.style.display = 'none'; D.body.appendChild(root);
    V = D.getElementById('w6-view'); SC = D.getElementById('w6-scroll');
    fx = D.getElementById('w6-fx'); ctx = fx.getContext('2d'); fit();
    bind();
    hook('updateProgress', schedule); hook('switchSemester', function () { if (S.view === 'module' && modTabs().indexOf(S.tab) < 0) S.view = 'today'; schedule(); });
    hook('onSettingsChange', schedule);
    var mo = new MutationObserver(sync);
    mo.observe(R, { attributes: true, attributeFilter: ['class'] });
    var a = app(); if (a) mo.observe(a, { attributes: true, attributeFilter: ['style'] });
    var g = D.getElementById('auth-gate'); if (g) mo.observe(g, { attributes: true, attributeFilter: ['style'] });
    setInterval(function () { if (shown) renderSync(); }, 3000);
    sync(); setTimeout(sync, 800); setTimeout(sync, 2500);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); }); else setTimeout(start, 0);

  /* classic layout: a small button to come back to the new design */
  function addBackButton() {
    var mk = function () {
      if (D.getElementById('w6-back')) return;
      var b = D.createElement('button'); b.id = 'w6-back'; b.type = 'button'; b.textContent = '✨ New layout';
      b.title = 'Switch back to the new design';
      b.onclick = function () { try { localStorage.removeItem('w6_off'); } catch (e) {} location.reload(); };
      D.body.appendChild(b);
    };
    if (OFF) { if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', mk); else mk(); }
  }
})();
