// panels.js — cover layout geometry for Vice Coast Cover Studio.
//
// A cover is a collage of rectangular panels with a caption band along the
// bottom. Each layout preset returns panel rectangles as fractions of the
// cover size, so the same layout works at every post size. Crop maths lives
// here too: given a photo, a panel and a zoom/offset state, it returns the
// source rectangle that fills the panel without stretching.

(function (global) {
  'use strict';

  var CAPTION_BAND = 0.24; // fraction of height reserved for the title block
  var GUTTER = 0.012;      // fraction of width between panels

  var POST_SIZES = {
    square: { width: 1080, height: 1080, label: '1080 × 1080' },
    portrait: { width: 1080, height: 1350, label: '1080 × 1350' },
    wide: { width: 1920, height: 1080, label: '1920 × 1080' }
  };

  // Panel rectangles as {x, y, w, h} fractions of the photo area (the cover
  // minus the caption band). "classic" echoes the four-panel box-art grid.
  function layoutPanels(layoutName) {
    if (layoutName === 'hero') {
      return [
        { x: 0, y: 0, w: 0.62, h: 1 },
        { x: 0.62, y: 0, w: 0.38, h: 0.5 },
        { x: 0.62, y: 0.5, w: 0.38, h: 0.5 }
      ];
    }
    if (layoutName === 'triptych') {
      return [
        { x: 0, y: 0, w: 1 / 3, h: 1 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 1 }
      ];
    }
    return [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
    ];
  }

  // Convert fractional panels into pixel rectangles for a cover of w × h,
  // shrinking each panel by half the gutter on every side.
  function panelPixels(layoutName, coverW, coverH) {
    var photoH = coverH * (1 - CAPTION_BAND);
    var g = coverW * GUTTER;
    return layoutPanels(layoutName).map(function (p) {
      return {
        x: p.x * coverW + g / 2,
        y: p.y * photoH + g / 2,
        w: p.w * coverW - g,
        h: p.h * photoH - g
      };
    });
  }

  function captionBandPixels(coverW, coverH) {
    return { x: 0, y: coverH * (1 - CAPTION_BAND), w: coverW, h: coverH * CAPTION_BAND };
  }

  // Source rectangle that fills `panel` from `photo` at the given zoom
  // (1 = just fills) and centre offsets (fractions, 0..1). The rectangle is
  // clamped inside the photo so a drag can never show empty space.
  function cropRect(photo, panel, zoom, focusX, focusY) {
    var panelRatio = panel.w / panel.h;
    var photoRatio = photo.width / photo.height;
    var baseW;
    var baseH;
    if (photoRatio > panelRatio) {
      baseH = photo.height;
      baseW = photo.height * panelRatio;
    } else {
      baseW = photo.width;
      baseH = photo.width / panelRatio;
    }
    var sw = baseW / zoom;
    var sh = baseH / zoom;
    var cx = focusX * photo.width;
    var cy = focusY * photo.height;
    var sx = Math.min(Math.max(cx - sw / 2, 0), photo.width - sw);
    var sy = Math.min(Math.max(cy - sh / 2, 0), photo.height - sh);
    return { sx: sx, sy: sy, sw: sw, sh: sh };
  }

  // Which panel (index) contains a cover-space point, or -1.
  function panelAtPoint(panels, x, y) {
    for (var i = 0; i < panels.length; i += 1) {
      var p = panels[i];
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
    }
    return -1;
  }

  global.CoverPanels = {
    CAPTION_BAND: CAPTION_BAND,
    GUTTER: GUTTER,
    POST_SIZES: POST_SIZES,
    layoutPanels: layoutPanels,
    panelPixels: panelPixels,
    captionBandPixels: captionBandPixels,
    cropRect: cropRect,
    panelAtPoint: panelAtPoint
  };
})(window);
