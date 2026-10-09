// Paste into the page (browser JS tool / DevTools console) on a running site.
// Returns every <img>, CSS background-image and inline <svg> with size and place.
(() => {
  const out = [];
  const seen = new Set();
  const add = (o) => { const k = o.t + o.src + (o.el || ""); if (!seen.has(k)) { seen.add(k); out.push(o); } };
  document.querySelectorAll("img").forEach((i) =>
    add({ t: "img", src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt }));
  document.querySelectorAll("*").forEach((e) => {
    const m = getComputedStyle(e).backgroundImage.match(/url\("?([^")]+)"?\)/g);
    (m || []).forEach((u) =>
      add({ t: "bg", src: u.replace(/^url\("?|"?\)$/g, ""), el: e.tagName + "." + String(e.className).slice(0, 40) }));
  });
  document.querySelectorAll("svg").forEach((s, i) => {
    const r = s.getBoundingClientRect();
    if (r.width > 24 && r.height > 24) // skip UI icons
      add({ t: "svg", src: "inline#" + i, w: Math.round(r.width), h: Math.round(r.height), el: s.parentElement.className });
  });
  return { title: document.title, count: out.length, assets: out };
})();
