// studio.js — Vice Coast Cover Studio editor.
//
// Renders a multi-panel cover on a canvas: each panel shows one photo with
// its own crop (drag to move, scroll or slider to zoom), a colour grade is
// painted over the collage, and the caption band carries the title, subtitle
// and plate. Export re-renders at the chosen post size and downloads a PNG.
// Photos are read with FileReader/object URLs on this machine only.

(function () {
  'use strict';

  var P = window.CoverPanels;

  var canvas = document.getElementById('cover-canvas');
  var ctx = canvas.getContext('2d');

  var state = {
    layout: 'classic',
    size: 'square',
    grade: 'sunset',
    selected: 0,
    photos: [],        // every loaded image, in load order
    panels: []         // per-panel { photoIndex, zoom, focusX, focusY }
  };

  function freshPanel(photoIndex) {
    return { photoIndex: photoIndex, zoom: 1, focusX: 0.5, focusY: 0.5 };
  }

  function syncPanelCount() {
    var count = P.layoutPanels(state.layout).length;
    while (state.panels.length < count) {
      var idx = state.photos.length ? state.panels.length % state.photos.length : -1;
      state.panels.push(freshPanel(idx));
    }
    state.panels.length = count;
    if (state.selected >= count) state.selected = 0;
  }

  // ---------- colour grades ----------

  var GRADES = {
    sunset: { filter: 'saturate(1.35) contrast(1.08)', wash: ['#ff9a3d', '#ff5e7a', '#7a3cff'], alpha: 0.32 },
    neon: { filter: 'saturate(1.5) contrast(1.15) hue-rotate(-8deg)', wash: ['#00e5ff', '#ff2fb3', '#3d1bff'], alpha: 0.3 },
    clean: { filter: 'saturate(1.05) contrast(1.02)', wash: ['#ffffff', '#ffffff', '#ffffff'], alpha: 0 }
  };

  function paintGradeWash(c, w, h, grade) {
    if (!grade.alpha) return;
    var grad = c.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, grade.wash[0]);
    grad.addColorStop(0.55, grade.wash[1]);
    grad.addColorStop(1, grade.wash[2]);
    c.save();
    c.globalAlpha = grade.alpha;
    c.globalCompositeOperation = 'overlay';
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    c.restore();
  }

  function paintVignette(c, w, h) {
    var grad = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(10,4,24,0.38)');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  }

  // ---------- cover rendering ----------

  function drawPlaceholderPanel(c, rect, index) {
    var grad = c.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, '#ffb84d');
    grad.addColorStop(0.5, '#ff6b5e');
    grad.addColorStop(1, '#5b2a86');
    c.fillStyle = grad;
    c.fillRect(rect.x, rect.y, rect.w, rect.h);
    // simple sun + skyline silhouette so an empty cover still looks designed
    c.fillStyle = 'rgba(255,236,180,0.9)';
    c.beginPath();
    c.arc(rect.x + rect.w * 0.72, rect.y + rect.h * 0.34, rect.h * 0.16, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(20,10,40,0.85)';
    var base = rect.y + rect.h;
    var towers = [0.42, 0.62, 0.5, 0.74, 0.55];
    for (var i = 0; i < towers.length; i += 1) {
      var tw = rect.w / towers.length;
      c.fillRect(rect.x + i * tw + 2, base - rect.h * towers[i], tw - 4, rect.h * towers[i]);
    }
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.font = '700 ' + Math.max(15, rect.h * 0.07) + 'px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('Panel ' + (index + 1) + ' — add a photo', rect.x + rect.w / 2, rect.y + rect.h * 0.16);
  }

  function drawPhotoPanel(c, rect, panel, grade) {
    var photo = state.photos[panel.photoIndex];
    if (!photo) return false;
    var crop = P.cropRect(photo, rect, panel.zoom, panel.focusX, panel.focusY);
    c.save();
    c.beginPath();
    c.rect(rect.x, rect.y, rect.w, rect.h);
    c.clip();
    c.filter = grade.filter;
    c.drawImage(photo, crop.sx, crop.sy, crop.sw, crop.sh, rect.x, rect.y, rect.w, rect.h);
    c.filter = 'none';
    c.restore();
    return true;
  }

  function drawCaptionBand(c, coverW, coverH) {
    var band = P.captionBandPixels(coverW, coverH);
    var grad = c.createLinearGradient(0, band.y, 0, coverH);
    grad.addColorStop(0, '#1d1136');
    grad.addColorStop(1, '#0d0721');
    c.fillStyle = grad;
    c.fillRect(band.x, band.y, band.w, band.h);
    c.fillStyle = '#ffb84d';
    c.fillRect(0, band.y, coverW, Math.max(3, coverH * 0.006));

    var title = (document.getElementById('caption-title').value || 'UNTITLED').toUpperCase();
    var sub = (document.getElementById('caption-sub').value || '').toUpperCase();
    var plate = (document.getElementById('caption-plate').value || 'VI').toUpperCase();

    var titleSize = band.h * 0.34;
    c.textAlign = 'center';
    c.font = 'italic 900 ' + titleSize + 'px "Arial Black", "Segoe UI", sans-serif';
    while (titleSize > 10 && c.measureText(title).width > coverW * 0.86) {
      titleSize -= 4;
      c.font = 'italic 900 ' + titleSize + 'px "Arial Black", "Segoe UI", sans-serif';
    }
    c.fillStyle = '#ff6b5e';
    c.fillText(title, coverW / 2 + titleSize * 0.03, band.y + band.h * 0.52 + titleSize * 0.03);
    c.fillStyle = '#fff7ea';
    c.fillText(title, coverW / 2, band.y + band.h * 0.52);

    if (sub) {
      c.font = '700 ' + band.h * 0.13 + 'px "Segoe UI", sans-serif';
      c.fillStyle = '#2fd4c4';
      c.fillText(sub.split('').join(' '), coverW / 2, band.y + band.h * 0.78);
    }

    // plate badge, top-right of the band
    var plateW = band.h * 0.62;
    var plateH = band.h * 0.4;
    var px = coverW - plateW - band.h * 0.16;
    var py = band.y + band.h * 0.14;
    c.fillStyle = '#ffb84d';
    c.beginPath();
    c.roundRect(px, py, plateW, plateH, plateH * 0.18);
    c.fill();
    c.font = '900 ' + plateH * 0.62 + 'px "Arial Black", sans-serif';
    c.fillStyle = '#241239';
    c.fillText(plate, px + plateW / 2, py + plateH * 0.72);
  }

  function renderCover(c, coverW, coverH, showSelection) {
    syncPanelCount();
    var grade = GRADES[state.grade];
    c.fillStyle = '#0d0721';
    c.fillRect(0, 0, coverW, coverH);
    var rects = P.panelPixels(state.layout, coverW, coverH);
    rects.forEach(function (rect, i) {
      if (!drawPhotoPanel(c, rect, state.panels[i], grade)) drawPlaceholderPanel(c, rect, i);
    });
    var band = P.captionBandPixels(coverW, coverH);
    paintGradeWash(c, coverW, band.y, grade);
    paintVignette(c, coverW, band.y);
    drawCaptionBand(c, coverW, coverH);
    if (showSelection && rects[state.selected]) {
      var r = rects[state.selected];
      c.strokeStyle = '#2fd4c4';
      c.lineWidth = Math.max(3, coverW * 0.004);
      c.strokeRect(r.x, r.y, r.w, r.h);
    }
  }

  function renderPreview() {
    var size = P.POST_SIZES[state.size];
    canvas.width = size.width;
    canvas.height = size.height;
    renderCover(ctx, size.width, size.height, true);
    updatePanelStatus();
  }

  // ---------- photos ----------

  function loadImageFile(file, done) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () { done(img); };
    img.src = url;
  }

  function addPhotos(files) {
    var list = Array.prototype.slice.call(files);
    if (!list.length) return;
    var pending = list.length;
    list.forEach(function (file) {
      loadImageFile(file, function (img) {
        state.photos.push(img);
        pending -= 1;
        if (pending === 0) {
          fillAllPanels();
          renderPreview();
        }
      });
    });
  }

  function fillAllPanels() {
    if (!state.photos.length) return;
    syncPanelCount();
    state.panels.forEach(function (panel, i) {
      panel.photoIndex = i % state.photos.length;
    });
  }

  function loadSamplePhotos() {
    var names = ['samples/boulevard.jpg', 'samples/pier.jpg'];
    var loaded = 0;
    names.forEach(function (src) {
      var img = new Image();
      img.onload = function () {
        state.photos.push(img);
        loaded += 1;
        if (loaded === names.length) {
          fillAllPanels();
          renderPreview();
        }
      };
      img.src = src;
    });
  }

  // ---------- interaction ----------

  function canvasPoint(event) {
    var box = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - box.left) * (canvas.width / box.width),
      y: (event.clientY - box.top) * (canvas.height / box.height)
    };
  }

  var drag = null;

  canvas.addEventListener('pointerdown', function (event) {
    var pt = canvasPoint(event);
    var rects = P.panelPixels(state.layout, canvas.width, canvas.height);
    var hit = P.panelAtPoint(rects, pt.x, pt.y);
    if (hit < 0) return;
    state.selected = hit;
    var panel = state.panels[hit];
    drag = { x: pt.x, y: pt.y, focusX: panel.focusX, focusY: panel.focusY, rect: rects[hit] };
    canvas.setPointerCapture(event.pointerId);
    document.getElementById('panel-zoom').value = String(Math.round(panel.zoom * 100));
    renderPreview();
  });

  canvas.addEventListener('pointermove', function (event) {
    if (!drag) return;
    var pt = canvasPoint(event);
    var panel = state.panels[state.selected];
    var photo = state.photos[panel.photoIndex];
    if (!photo) return;
    var crop = P.cropRect(photo, drag.rect, panel.zoom, 0.5, 0.5);
    panel.focusX = Math.min(1, Math.max(0, drag.focusX - ((pt.x - drag.x) / drag.rect.w) * (crop.sw / photo.width)));
    panel.focusY = Math.min(1, Math.max(0, drag.focusY - ((pt.y - drag.y) / drag.rect.h) * (crop.sh / photo.height)));
    renderPreview();
  });

  canvas.addEventListener('pointerup', function () { drag = null; });

  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    var pt = canvasPoint(event);
    var rects = P.panelPixels(state.layout, canvas.width, canvas.height);
    var hit = P.panelAtPoint(rects, pt.x, pt.y);
    if (hit < 0) return;
    state.selected = hit;
    var panel = state.panels[hit];
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * (event.deltaY < 0 ? 1.08 : 0.92)));
    document.getElementById('panel-zoom').value = String(Math.round(panel.zoom * 100));
    renderPreview();
  }, { passive: false });

  // ---------- controls ----------

  function wireChipRow(rowId, attr, apply) {
    var row = document.getElementById(rowId);
    row.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-' + attr + ']');
      if (!btn) return;
      row.querySelectorAll('.chip').forEach(function (chip) { chip.classList.remove('is-on'); });
      btn.classList.add('is-on');
      apply(btn.getAttribute('data-' + attr));
      renderPreview();
    });
  }

  function captionSummary() {
    var title = document.getElementById('caption-title').value.trim();
    return title ? '“' + title.toUpperCase() + '”' : 'untitled cover';
  }

  function updatePanelStatus() {
    var el = document.getElementById('panel-status');
    if (!state.photos.length) {
      el.textContent = 'No photo yet — add photos or use the samples.';
      return;
    }
    el.textContent = 'Panel ' + (state.selected + 1) + ' of ' + state.panels.length +
      ' · ' + state.photos.length + ' photo(s) loaded · zoom ' +
      Math.round(state.panels[state.selected].zoom * 100) + '% · ' + captionSummary();
  }

  function exportCoverPng() {
    var size = P.POST_SIZES[state.size];
    var out = document.createElement('canvas');
    out.width = size.width;
    out.height = size.height;
    renderCover(out.getContext('2d'), size.width, size.height, false);
    out.toBlob(function (blob) {
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'vice-coast-cover-' + size.width + 'x' + size.height + '.png';
      link.click();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 4000);
    }, 'image/png');
  }

  function initStudio() {
    wireChipRow('layout-row', 'layout', function (v) { state.layout = v; syncPanelCount(); });
    wireChipRow('size-row', 'size', function (v) { state.size = v; });
    wireChipRow('grade-row', 'grade', function (v) { state.grade = v; });

    document.getElementById('photo-input').addEventListener('change', function (e) { addPhotos(e.target.files); });
    document.getElementById('sample-btn').addEventListener('click', loadSamplePhotos);
    document.getElementById('export-btn').addEventListener('click', exportCoverPng);
    document.getElementById('fill-all-btn').addEventListener('click', function () { fillAllPanels(); renderPreview(); });
    document.getElementById('panel-photo-btn').addEventListener('click', function () {
      document.getElementById('panel-photo-input').click();
    });
    document.getElementById('panel-photo-input').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      loadImageFile(file, function (img) {
        state.photos.push(img);
        state.panels[state.selected].photoIndex = state.photos.length - 1;
        renderPreview();
      });
    });
    document.getElementById('panel-zoom').addEventListener('input', function (e) {
      state.panels[state.selected].zoom = Number(e.target.value) / 100;
      renderPreview();
    });
    ['caption-title', 'caption-sub', 'caption-plate'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', renderPreview);
    });

    // Screenshot/test hooks: ?sample=1 loads samples, ?caption=.. sets title.
    var query = new URLSearchParams(window.location.search);
    if (query.get('caption')) document.getElementById('caption-title').value = query.get('caption');
    if (query.get('layout')) state.layout = query.get('layout');
    if (query.get('grade')) state.grade = query.get('grade');
    if (query.get('size')) state.size = query.get('size');
    renderPreview();
    if (query.get('sample') === '1') loadSamplePhotos();
  }

  initStudio();
})();
