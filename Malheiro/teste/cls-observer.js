/**
 * Malheiro CLS — observador de homologação. Leitura apenas.
 * Instalar no HTML/Cabeçalho APENAS durante testes.
 * Não altera CSS, imagens, prioridades, DOM ou o checkout.
 */
(function () {
  "use strict";
  if (window.MalheiroCLS) return;
  var entries = [];
  var samples = [];
  var MAX_ENTRIES = 80;
  var selectors = [
    "#cabecalho", ".abriga-menu", ".conteiner-principal",
    ".secao-banners", "#corpo", ".lista-one", ".lista-two",
    "#fm-categorias", ".videos-box", "#barraNewsletter", "#rodape"
  ];

  function snapshot(stage) {
    var data = { etapa: stage, tempoMs: Math.round(performance.now()), blocos: {} };
    selectors.forEach(function (s) {
      var el = document.querySelector(s);
      if (!el) return;
      var r = el.getBoundingClientRect();
      data.blocos[s] = {
        top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width),
        offsetTop: el.offsetTop
      };
    });
    var body = document.body;
    var header = document.querySelector("#cabecalho");
    data.geometria = {
      viewport: [window.innerWidth, window.innerHeight],
      bodyPaddingTop: body ? getComputedStyle(body).paddingTop : null,
      bodyPaddingTopInline: body ? body.style.paddingTop : null,
      headerPosition: header ? getComputedStyle(header).position : null,
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
      headerTop: header ? Math.round(header.getBoundingClientRect().top) : null,
      contentTop: document.querySelector(".conteiner-principal") ? Math.round(document.querySelector(".conteiner-principal").getBoundingClientRect().top) : null,
      carrosselOwl: !!document.querySelector(".listagem .owl-loaded"),
      categoriasMontadas: !!document.querySelector(".secao-banners + #fm-categorias")
    };
    samples.push(data);
    if (samples.length > 12) samples.shift();
    return data;
  }

  function clusters() {
    var sorted = entries.slice().sort(function (a, b) { return a.t - b.t; });
    var best = 0;
    for (var i = 0; i < sorted.length; i++) {
      var sum = sorted[i].value, previous = sorted[i].t;
      for (var j = i + 1; j < sorted.length; j++) {
        if (sorted[j].t - previous > 1000 || sorted[j].t - sorted[i].t > 5000) break;
        sum += sorted[j].value;
        previous = sorted[j].t;
      }
      best = Math.max(best, sum);
    }
    return +best.toFixed(5);
  }

  function report() {
    return { origem: location.pathname, clsSessao: clusters(),
      eventos: entries.slice(), snapshots: samples.slice() };
  }

  window.MalheiroCLS = { report: report, snapshot: snapshot };
  snapshot("inicio-script");

  if ("PerformanceObserver" in window) {
    try {
      var observer = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (event) {
          if (event.hadRecentInput) return;
          if (entries.length >= MAX_ENTRIES) entries.shift();
          entries.push({
            t: Math.round(event.startTime), value: +event.value.toFixed(6),
            elementos: (event.sources || []).map(function (s) {
              var el = s.node;
              var desc = el && el.nodeType === 1
                ? el.tagName.toLowerCase() + (el.id ? "#" + el.id : "")
                  + (typeof el.className === "string" && el.className.trim()
                    ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "")
                : "indisponível";
              return { seletor: desc,
                anterior: s.previousRect ? [Math.round(s.previousRect.y), Math.round(s.previousRect.height)] : null,
                atual: s.currentRect ? [Math.round(s.currentRect.y), Math.round(s.currentRect.height)] : null };
            })
          });
        });
      });
      observer.observe({ type: "layout-shift", buffered: true });
    } catch (e) { console.warn("[Malheiro CLS] Observer indisponível:", e.message); }
  }
  document.addEventListener("DOMContentLoaded", function () { snapshot("dom-ready"); }, { once: true });
  window.addEventListener("load", function () {
    snapshot("load");
    setTimeout(function () { snapshot("load+1200ms"); }, 1200);
    setTimeout(function () { snapshot("load+3500ms"); }, 3500);
    console.info("[Malheiro CLS] Para conferir, execute: MalheiroCLS.report()");
  }, { once: true });
})();
