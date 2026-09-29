// RunnerCard Studio - Core Application Logic
// Pure Vector SVG Assets + Equal-Height Equal-Weight Typography + Clean Unobstructed Preview
(function() {
  'use strict';

  // --- State ---
  const state = {
    image: null,
    imageLoaded: false,
    imgOffsetX: 0,
    imgOffsetY: 0,
    imgScale: 1.0,
    dist: '5.03',
    time: '23:27',
    pace: "4'40\"",
    heartRate: '152',
    calories: '368',
    template: 'nrc', // 'nrc' (bottom stats) or 'route' (NRC route mode)
    logo: 'nike',
    ratio: '1:1',
    vignette: 0,
    exportFormat: 'jpeg',
    sampleIndex: 2,
    // Real Route State
    routePoints: [],
    routeDist: '5.12',
    routeLocation: '上海市, 中国',
    routeX: 60,
    routeY: 380,
    routeScale: 1.0
  };

  // 100% Pure Transparent Background Vector SVGs
  const assets = {
    swoosh: new Image(),
    stopwatch: new Image(),
    gauge: new Image()
  };

  assets.swoosh.src = 'assets/swoosh.svg';
  assets.stopwatch.src = 'assets/stopwatch.svg';
  assets.gauge.src = 'assets/gauge.svg';

  // DOM Elements
  const canvas = document.getElementById('renderCanvas');
  const ctx = canvas.getContext('2d');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const fileInput = document.getElementById('fileInput');
  const emptyState = document.getElementById('emptyState');
  const inputDist = document.getElementById('inputDist');
  const inputTime = document.getElementById('inputTime');
  const inputPace = document.getElementById('inputPace');
  const inputHeartRate = document.getElementById('inputHeartRate');
  const inputCalories = document.getElementById('inputCalories');
  const scaleSlider = document.getElementById('scaleSlider');
  const scaleVal = document.getElementById('scaleVal');
  const btnResetView = document.getElementById('btnResetView');
  const vignetteSlider = document.getElementById('vignetteSlider');
  const vignetteVal = document.getElementById('vignetteVal');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const helpModal = document.getElementById('helpModal');
  const saveModal = document.getElementById('saveModal');
  const saveImgPreview = document.getElementById('saveImgPreview');
  const saveImgSizeInfo = document.getElementById('saveImgSizeInfo');
  const btnNativeShare = document.getElementById('btnNativeShare');
  const btnDirectDownload = document.getElementById('btnDirectDownload');
  const btnCloseSaveModal = document.getElementById('btnCloseSaveModal');

  // Mode & Route DOM Elements
  const btnModeBottom = document.getElementById('btnModeBottom');
  const btnModeRoute = document.getElementById('btnModeRoute');
  const panelBottomData = document.getElementById('panelBottomData');
  const panelRouteData = document.getElementById('panelRouteData');
  const gpxFileInput = document.getElementById('gpxFileInput');
  const btnSelectGPX = document.getElementById('btnSelectGPX');
  const btnClearGPX = document.getElementById('btnClearGPX');
  const gpxStatusTag = document.getElementById('gpxStatusTag');
  const gpxInfoBanner = document.getElementById('gpxInfoBanner');
  const inputRouteDist = document.getElementById('inputRouteDist');
  const inputRouteLocation = document.getElementById('inputRouteLocation');
  const routeXSlider = document.getElementById('routeXSlider');
  const routeXVal = document.getElementById('routeXVal');
  const routeYSlider = document.getElementById('routeYSlider');
  const routeYVal = document.getElementById('routeYVal');
  const routeScaleSlider = document.getElementById('routeScaleSlider');
  const routeScaleVal = document.getElementById('routeScaleVal');
  const btnResetRoutePos = document.getElementById('btnResetRoutePos');

  let currentExportBlob = null;
  let currentExportFileName = '';

  // --- Toast Helper ---
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // --- Auto Pace Calculation ---
  function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const str = String(timeStr).trim();
    if (!str.includes(':')) {
      const num = parseFloat(str);
      return isNaN(num) ? 0 : Math.round(num);
    }
    const parts = str.split(':').map(Number);
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    } else if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }
    return 0;
  }

  function formatPace(totalSeconds, distanceKm) {
    if (!distanceKm || distanceKm <= 0 || !totalSeconds || totalSeconds <= 0) return state.pace;
    const paceSeconds = Math.round(totalSeconds / distanceKm);
    const m = Math.floor(paceSeconds / 60);
    const s = paceSeconds % 60;
    const sStr = s < 10 ? '0' + s : s;
    return `${m}'${sStr}"`;
  }

  function updatePaceFromInputs() {
    const distNum = parseFloat(inputDist.value);
    const sec = parseTimeToSeconds(inputTime.value);
    if (distNum > 0 && sec > 0) {
      const calculated = formatPace(sec, distNum);
      inputPace.value = calculated;
      state.pace = calculated;
    }
    state.dist = inputDist.value.trim();
    state.time = inputTime.value.trim();
    render();
  }

  // --- Aspect Ratio & Canvas Resizing ---
  function updateCanvasDimensions() {
    let width = 1024;
    let height = 1024;

    if (state.ratio === '3:4') {
      height = 1365;
    } else if (state.ratio === '9:16') {
      width = 1080;
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;

    if (canvasWrapper) {
      if (state.ratio === '1:1') {
        canvasWrapper.style.aspectRatio = '1 / 1';
      } else if (state.ratio === '3:4') {
        canvasWrapper.style.aspectRatio = '3 / 4';
      } else if (state.ratio === '9:16') {
        canvasWrapper.style.aspectRatio = '9 / 16';
      }
    }
    render();
  }

  // --- Canvas Rendering Engine ---
  function render() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background Image
    if (state.image && state.imageLoaded) {
      emptyState.style.display = 'none';

      const img = state.image;
      const imgAspect = img.width / img.height;
      const canvasAspect = w / h;

      let drawWidth, drawHeight;
      if (imgAspect > canvasAspect) {
        drawHeight = h;
        drawWidth = h * imgAspect;
      } else {
        drawWidth = w;
        drawHeight = w / imgAspect;
      }

      drawWidth *= state.imgScale;
      drawHeight *= state.imgScale;

      const drawX = (w - drawWidth) / 2 + state.imgOffsetX;
      const drawY = (h - drawHeight) / 2 + state.imgOffsetY;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } else {
      emptyState.style.display = 'flex';
      ctx.fillStyle = '#121216';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Anti-Glare Vignette (Only drawn if slider > 0)
    if (state.vignette > 0) {
      const gradH = Math.min(220, h * 0.25);
      const grad = ctx.createLinearGradient(0, h - gradH, 0, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, `rgba(0,0,0,${state.vignette * 0.45})`);
      grad.addColorStop(1, `rgba(0,0,0,${state.vignette})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, h - gradH, w, gradH);
    }

    // 3. Render Top Right Logo
    renderLogo(w, h);

    // 4. Render Layout by Template
    if (state.template === 'route') {
      renderTemplateRoute(w, h);
    } else if (state.template === 'nrc') {
      renderTemplateNRC(w, h);
    } else if (state.template === 'apple') {
      renderTemplateApple(w, h);
    } else if (state.template === 'editorial') {
      renderTemplateEditorial(w, h);
    } else if (state.template === 'xiangshan') {
      renderTemplateXiangshan(w, h);
    }

    ctx.restore();
  }

  // --- Top Right Logo Renderer ---
  // Clean pure white SVG, ZERO shadow, ZERO background halo
  function renderLogo(w, h) {
    if (state.logo === 'none') return;

    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (state.logo === 'nike') {
      if (assets.swoosh.complete && assets.swoosh.naturalWidth > 0) {
        const logoW = 141;
        const logoH = 50;
        const logoX = w - logoW - 65;
        const logoY = 66;
        ctx.drawImage(assets.swoosh, logoX, logoY, logoW, logoH);
      }
    } else if (state.logo === 'apple_rings') {
      drawAppleActivityRings(w - 110, 95, 34);
    } else if (state.logo === 'apple_runner') {
      drawAppleRunnerIcon(w - 100, 90, 36);
    }
    ctx.restore();
  }

  // Apple Activity Rings Drawing (Neon Red/Green/Blue)
  function drawAppleActivityRings(cx, cy, radius) {
    const rings = [
      { r: radius, color: '#fa114f', prog: 0.85, width: 7 },
      { r: radius - 9, color: '#a8ff00', prog: 1.15, width: 7 },
      { r: radius - 18, color: '#00f5d4', prog: 0.75, width: 7 }
    ];

    rings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = ring.width;
      ctx.stroke();

      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * ring.prog;
      ctx.arc(cx, cy, ring.r, startAngle, endAngle);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  }

  // Apple Runner Silhouette Icon
  function drawAppleRunnerIcon(cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#a8ff00';
    ctx.beginPath();
    ctx.arc(0, -size * 0.45, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#a8ff00';
    ctx.lineCap = 'round';
    ctx.moveTo(-2, -size * 0.25);
    ctx.lineTo(2, size * 0.1);
    ctx.lineTo(-size * 0.35, size * 0.45);
    ctx.moveTo(2, size * 0.1);
    ctx.lineTo(size * 0.3, size * 0.2);
    ctx.lineTo(size * 0.2, size * 0.5);
    ctx.moveTo(0, -size * 0.15);
    ctx.lineTo(size * 0.35, -size * 0.05);
    ctx.moveTo(0, -size * 0.15);
    ctx.lineTo(-size * 0.3, -size * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  // ==========================================
  // TEMPLATE 1: NRC Classic (1:1 像素级复刻)
  // ==========================================
  function renderTemplateNRC(w, h) {
    const numFont = 'bold 64px "NRCFont", "Rubik", -apple-system, sans-serif';
    const baselineY = h - 60; // Exact NRC bottom baseline: 1024 - 60 = 964
    const iconY = baselineY - 48; // Aligns stopwatch and gauge with digits: 964 - 48 = 916

    // --- A. Draw Clean Transparent SVGs (ZERO SHADOW, ZERO GREY BOX) ---
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 1. Left Stopwatch SVG (44 x 49, x = 59, y = 914)
    const swX = 59;
    const swW = 44;
    const swH = 49;
    if (assets.stopwatch.complete && assets.stopwatch.naturalWidth > 0) {
      ctx.drawImage(assets.stopwatch, swX, iconY, swW, swH);
    }

    // 3. Right Speedometer Gauge SVG (48 x 48, x = paceStartX - 48 - 18)
    ctx.font = numFont;
    const paceText = state.pace;
    const paceWidth = ctx.measureText(paceText).width;
    const rightMargin = 60;
    const paceEndX = w - rightMargin;
    const paceStartX = paceEndX - paceWidth;

    const gaugeW = 48;
    const gaugeH = 48;
    const gaugeX = paceStartX - gaugeW - 18;
    if (assets.gauge.complete && assets.gauge.naturalWidth > 0) {
      ctx.drawImage(assets.gauge, gaugeX, iconY, gaugeW, gaugeH);
    }
    ctx.restore();

    // --- B. Draw Text (With authentic subtle text shadow) ---
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'alphabetic';

    // 1. Duration text (x = 124, matches NRC)
    ctx.font = numFont;
    ctx.textAlign = 'left';
    ctx.fillText(state.time, swX + swW + 21, baselineY);

    // 2. Center: Distance + "公里" (100% 平齐等高 + 纯净自然字重)
    ctx.font = numFont;
    const distNumText = state.dist;
    const numMetrics = ctx.measureText(distNumText);
    const numAscent = numMetrics.actualBoundingBoxAscent || 52;
    const numDescent = numMetrics.actualBoundingBoxDescent || 2;
    const numHeight = numAscent + numDescent;
    const distNumWidth = numMetrics.width;

    // Calculate matching Chinese font size
    let cnFontSize = Math.round(numHeight * 0.96);
    ctx.font = `700 ${cnFontSize}px "PingFang SC", "Hiragino Sans GB", "SF Pro Text", sans-serif`;
    let cnMetrics = ctx.measureText(' 公里');
    let cnH = cnMetrics.actualBoundingBoxAscent + cnMetrics.actualBoundingBoxDescent;
    if (cnH > 0 && Math.abs(cnH - numHeight) > 1) {
      cnFontSize = Math.round(cnFontSize * (numHeight / cnH));
      ctx.font = `700 ${cnFontSize}px "PingFang SC", "Hiragino Sans GB", "SF Pro Text", sans-serif`;
      cnMetrics = ctx.measureText(' 公里');
    }

    // Align Chinese baseline so Chinese Top == Number Top & Bottom == Number Bottom!
    const baselineY_cn = (baselineY - numAscent) + (cnMetrics.actualBoundingBoxAscent || (numAscent * 0.9));
    const unitWidth = cnMetrics.width;
    const totalCenterWidth = distNumWidth + unitWidth;
    const startCenterX = (w - totalCenterWidth) / 2;

    // Draw Number
    ctx.font = numFont;
    ctx.textAlign = 'left';
    ctx.fillText(distNumText, startCenterX, baselineY);

    // Draw "公里" - Flat, elegant, crisp sans-serif matching NRC
    ctx.save();
    ctx.font = `700 ${cnFontSize}px "PingFang SC", "Hiragino Sans GB", "SF Pro Text", sans-serif`;
    ctx.fillText(' 公里', startCenterX + distNumWidth, baselineY_cn);
    ctx.restore();

    // 3. Pace text
    ctx.font = numFont;
    ctx.textAlign = 'left';
    ctx.fillText(paceText, paceStartX, baselineY);

    ctx.restore();
  }

  // ==========================================
  // TEMPLATE 2: Apple Fitness Edition (苹果健身款)
  // ==========================================
  function renderTemplateApple(w, h) {
    const numFont = '700 58px "SF Pro Rounded", "DIN Alternate", -apple-system, sans-serif';
    const baselineY = h - 90;
    const iconY = baselineY - 44;

    // Clean transparent SVGs
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    if (assets.stopwatch.complete) {
      ctx.drawImage(assets.stopwatch, 60, iconY, 44, 44);
    }
    ctx.restore();

    // Text
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'alphabetic';

    ctx.font = numFont;
    ctx.textAlign = 'left';
    ctx.fillText(state.time, 60 + 44 + 16, baselineY);

    const distText = `${state.dist} 公里`;
    ctx.textAlign = 'center';
    ctx.fillText(distText, w / 2, baselineY);

    const paceWidth = ctx.measureText(state.pace).width;
    const paceStartX = w - 60 - paceWidth;
    ctx.textAlign = 'left';
    ctx.fillText(state.pace, paceStartX, baselineY);

    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    if (assets.gauge.complete) {
      ctx.drawImage(assets.gauge, paceStartX - 16 - 44, iconY, 44, 44);
    }
    ctx.restore();

    // Row 2: Frosted Apple Fitness Capsule
    const capsuleW = 340;
    const capsuleH = 40;
    const capsuleX = (w - capsuleW) / 2;
    const capsuleY = h - 65;

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(capsuleX, capsuleY, capsuleW, capsuleH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 18px "SF Pro Text", -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `❤️ ${state.heartRate || 152} BPM   ·   🔥 ${state.calories || 368} KCAL`,
      w / 2,
      capsuleY + capsuleH / 2
    );
    ctx.restore();

    ctx.restore();
  }

  // ==========================================
  // TEMPLATE 3: Minimal Editorial (极简杂志晨光)
  // ==========================================
  function renderTemplateEditorial(w, h) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    ctx.font = '700 20px "Barlow Condensed", -apple-system, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.textAlign = 'left';
    ctx.fillText(`${dateStr} · 06:15 AM · MORNING RUN`, 60, 80);

    const bottomY = h - 70;
    ctx.font = '900 76px "Barlow Condensed", "Impact", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(state.dist, 60, bottomY);

    ctx.font = '700 28px "PingFang SC", sans-serif';
    ctx.fillText('KM', 60 + ctx.measureText(state.dist).width + 10, bottomY);

    ctx.font = '600 24px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${state.time}   |   AVG PACE: ${state.pace}`, w - 60, bottomY - 10);

    ctx.beginPath();
    ctx.moveTo(60, bottomY - 95);
    ctx.lineTo(w - 60, bottomY - 95);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.stroke();

    ctx.restore();
  }

  // ==========================================
  // TEMPLATE 4: Road to 象山半马 (备赛冲刺款)
  // ==========================================
  function renderTemplateXiangshan(w, h) {
    ctx.save();
    renderTemplateNRC(w, h);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1.5;

    const badgeW = 480;
    const badgeH = 38;
    const badgeX = 50;
    const badgeY = 60;

    ctx.fillStyle = 'rgba(255, 94, 30, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px "PingFang SC", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏃 2026 象山半马备战 · 目标 1:40:00 (配速 4\'44")', badgeX + badgeW / 2, badgeY + badgeH / 2);

    ctx.restore();
  }

  // ==========================================
  // TEMPLATE: NRC Real GPS Route Mode (1:1 官方复刻)
  // ==========================================
  function parseGpxOrTcx(text) {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      let pts = [];

      // 1. Try standard GPX <trkpt>
      const trkpts = xml.querySelectorAll('trkpt');
      if (trkpts.length > 0) {
        trkpts.forEach(p => {
          const lat = parseFloat(p.getAttribute('lat'));
          const lon = parseFloat(p.getAttribute('lon'));
          if (!isNaN(lat) && !isNaN(lon)) pts.push({ lat, lon });
        });
      }

      // 2. Try Garmin / Coros / TCX <Trackpoint>
      if (pts.length === 0) {
        const trackpoints = xml.querySelectorAll('Trackpoint');
        trackpoints.forEach(p => {
          const latEl = p.querySelector('LatitudeDegrees');
          const lonEl = p.querySelector('LongitudeDegrees');
          if (latEl && lonEl) {
            const lat = parseFloat(latEl.textContent);
            const lon = parseFloat(lonEl.textContent);
            if (!isNaN(lat) && !isNaN(lon)) pts.push({ lat, lon });
          }
        });
      }

      // 3. Fallback: <wpt> or <rtept>
      if (pts.length === 0) {
        const wpts = xml.querySelectorAll('wpt, rtept');
        wpts.forEach(p => {
          const lat = parseFloat(p.getAttribute('lat'));
          const lon = parseFloat(p.getAttribute('lon'));
          if (!isNaN(lat) && !isNaN(lon)) pts.push({ lat, lon });
        });
      }

      return pts;
    } catch (err) {
      console.error('GPX parse error:', err);
      return [];
    }
  }

  function calculateRouteDistance(points) {
    if (!points || points.length < 2) return 0;
    let totalKm = 0;
    const R = 6371; // Earth radius km
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const dLat = (p2.lat - p1.lat) * Math.PI / 180;
      const dLon = (p2.lon - p1.lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalKm += R * c;
    }
    return totalKm;
  }

  function renderTemplateRoute(w, h) {
    const numFont = 'bold 64px "NRCFont", "Rubik", -apple-system, sans-serif';
    const gx = state.routeX;
    const gy = state.routeY;
    const scale = state.routeScale;

    // --- 1. Distance + "公里" (100% 平齐等高 + 纯净自然字重) ---
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    ctx.font = numFont;
    const distNumText = state.routeDist || state.dist || '5.12';
    const numMetrics = ctx.measureText(distNumText);
    const numAscent = numMetrics.actualBoundingBoxAscent || 52;
    const numDescent = numMetrics.actualBoundingBoxDescent || 2;
    const numHeight = numAscent + numDescent;
    const distNumWidth = numMetrics.width;

    // Calculate matching Chinese font size
    let cnFontSize = Math.round(numHeight * 0.96);
    ctx.font = `700 ${cnFontSize}px "PingFang SC", "Hiragino Sans GB", "SF Pro Text", sans-serif`;
    let cnMetrics = ctx.measureText(' 公里');
    let cnH = cnMetrics.actualBoundingBoxAscent + cnMetrics.actualBoundingBoxDescent;
    if (cnH > 0 && Math.abs(cnH - numHeight) > 1) {
      cnFontSize = Math.round(cnFontSize * (numHeight / cnH));
      ctx.font = `700 ${cnFontSize}px "PingFang SC", "Hiragino Sans GB", "SF Pro Text", sans-serif`;
      cnMetrics = ctx.measureText(' 公里');
    }

    // Align Chinese baseline
    const baselineY_cn = (gy - numAscent) + (cnMetrics.actualBoundingBoxAscent || (numAscent * 0.9));

    // Draw Distance Number
    ctx.font = numFont;
    ctx.fillText(distNumText, gx, gy);

    // Draw "公里"
    ctx.font = `700 ${cnFontSize}px "PingFang SC", "Hiragino Sans GB", "SF Pro Text", sans-serif`;
    ctx.fillText(' 公里', gx + distNumWidth, baselineY_cn);
    ctx.restore();

    // --- 2. GPS Real Route Track ---
    const targetW = 180 * scale;
    const targetH = 230 * scale;
    const routeTopY = gy + 22;

    if (state.routePoints && state.routePoints.length >= 2) {
      const pts = state.routePoints;
      let minLat = Infinity, maxLat = -Infinity;
      let minLon = Infinity, maxLon = -Infinity;
      for (const p of pts) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lon < minLon) minLon = p.lon;
        if (p.lon > maxLon) maxLon = p.lon;
      }

      const midLat = (minLat + maxLat) / 2;
      const cosLat = Math.cos(midLat * Math.PI / 180);
      const projected = pts.map(p => ({
        x: p.lon * cosLat,
        y: p.lat
      }));

      let pMinX = Infinity, pMaxX = -Infinity;
      let pMinY = Infinity, pMaxY = -Infinity;
      for (const p of projected) {
        if (p.x < pMinX) pMinX = p.x;
        if (p.x > pMaxX) pMaxX = p.x;
        if (p.y < pMinY) pMinY = p.y;
        if (p.y > pMaxY) pMaxY = p.y;
      }

      const spanX = pMaxX - pMinX || 0.0001;
      const spanY = pMaxY - pMinY || 0.0001;
      const pad = 8;
      const availW = targetW - pad * 2;
      const availH = targetH - pad * 2;
      const fitScale = Math.min(availW / spanX, availH / spanY);

      const ox = gx + pad + (availW - spanX * fitScale) / 2;
      const oy = routeTopY + pad + (availH - spanY * fitScale) / 2;

      const screenPts = projected.map(p => ({
        x: ox + (p.x - pMinX) * fitScale,
        y: routeTopY + targetH - (oy - routeTopY + (p.y - pMinY) * fitScale)
      }));

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(3, 4.5 * scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].x, screenPts[i].y);
      }
      ctx.stroke();

      // Start Point Solid White Dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(screenPts[0].x, screenPts[0].y, Math.max(4, 5 * scale), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Placeholder dashed box
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, routeTopY, targetW, targetH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '600 15px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('＋ 请导入 GPX 真实轨迹', gx + targetW / 2, routeTopY + targetH / 2);
      ctx.restore();
    }

    // --- 3. Location Text ---
    const locY = routeTopY + targetH + 34;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '500 24px "PingFang SC", "SF Pro Text", -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(state.routeLocation || '上海市, 中国', gx, locY);
    ctx.restore();
  }

  // --- Image Loading & Sample Handling ---
  function loadImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      state.image = img;
      state.imageLoaded = true;
      state.imgOffsetX = 0;
      state.imgOffsetY = 0;
      state.imgScale = 1.0;
      scaleSlider.value = 1.0;
      scaleVal.textContent = '100%';
      render();
    };
    img.src = src;
  }

  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      loadImage(e.target.result);
      showToast('照片已载入，可拖动构图');
    };
    reader.readAsDataURL(file);
  }

  // --- Touch & Mouse Pan / Zoom Gestures ---
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialPinchDistance = null;
  let initialScale = 1.0;

  function getTouchDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  canvasWrapper.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - state.imgOffsetX;
    startY = e.clientY - state.imgOffsetY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    state.imgOffsetX = e.clientX - startX;
    state.imgOffsetY = e.clientY - startY;
    render();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Events for Mobile (iPhone Safari)
  canvasWrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - state.imgOffsetX;
      startY = e.touches[0].clientY - state.imgOffsetY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
      initialScale = state.imgScale;
    }
  }, { passive: false });

  canvasWrapper.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
      state.imgOffsetX = e.touches[0].clientX - startX;
      state.imgOffsetY = e.touches[0].clientY - startY;
      render();
    } else if (e.touches.length === 2 && initialPinchDistance) {
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const factor = currentDist / initialPinchDistance;
      state.imgScale = Math.min(3.0, Math.max(0.5, initialScale * factor));
      scaleSlider.value = state.imgScale;
      scaleVal.textContent = Math.round(state.imgScale * 100) + '%';
      render();
    }
  }, { passive: false });

  canvasWrapper.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      isDragging = false;
      initialPinchDistance = null;
    }
  });

  canvasWrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    state.imgScale = Math.min(3.0, Math.max(0.5, state.imgScale + zoomDelta));
    scaleSlider.value = state.imgScale;
    scaleVal.textContent = Math.round(state.imgScale * 100) + '%';
    render();
  }, { passive: false });

  // --- Optimized High-Quality Export & Direct Save to Photos Modal ---
  function exportShareImage() {
    showToast('正在生成打卡图...');

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext('2d');
    expCtx.drawImage(canvas, 0, 0);

    const isJpeg = state.exportFormat === 'jpeg';
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
    const quality = isJpeg ? 0.92 : undefined;
    const ext = isJpeg ? 'jpg' : 'png';
    const fileName = `晨跑打卡_${state.dist}km_${Date.now()}.${ext}`;
    currentExportFileName = fileName;

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        showToast('导出失败，请重试');
        return;
      }

      currentExportBlob = blob;
      const sizeKB = Math.round(blob.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      const dataUrl = URL.createObjectURL(blob);
      saveImgPreview.src = dataUrl;
      saveImgSizeInfo.textContent = `文件大小: ${sizeStr} (${isJpeg ? 'JPG 优质' : 'PNG 无损'})`;

      const file = new File([blob], fileName, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        btnNativeShare.style.display = 'block';
        btnNativeShare.onclick = async () => {
          try {
            await navigator.share({
              files: [file],
              title: `晨跑打卡 · ${state.dist}公里`
            });
            showToast('分享成功！');
          } catch (err) {
            if (err.name !== 'AbortError') console.warn(err);
          }
        };
      } else {
        btnNativeShare.style.display = 'none';
      }

      saveModal.classList.add('show');
    }, mimeType, quality);
  }

  function triggerDirectDownload() {
    if (!currentExportBlob) return;
    const url = URL.createObjectURL(currentExportBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentExportFileName || '晨跑打卡.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('已保存到本地下载');
  }

  // --- URL Query Parameter Parsing ---
  function parseUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (params.has('dist')) {
      inputDist.value = params.get('dist');
      state.dist = params.get('dist');
      changed = true;
    }
    if (params.has('time')) {
      let tVal = params.get('time').trim();
      if (!tVal.includes(':') && !isNaN(parseFloat(tVal))) {
        const totalSec = Math.round(parseFloat(tVal));
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        tVal = `${m}:${s < 10 ? '0' + s : s}`;
      }
      inputTime.value = tVal;
      state.time = tVal;
      changed = true;
    }
    if (params.has('pace')) {
      inputPace.value = params.get('pace');
      state.pace = params.get('pace');
      changed = true;
    } else if (changed) {
      updatePaceFromInputs();
    }
    if (params.has('hr') && inputHeartRate) {
      inputHeartRate.value = params.get('hr');
      state.heartRate = params.get('hr');
    }
    if (params.has('cal') && inputCalories) {
      inputCalories.value = params.get('cal');
      state.calories = params.get('cal');
    }
    if (params.has('tpl') || params.has('template') || params.has('mode')) {
      const t = params.get('tpl') || params.get('template') || params.get('mode');
      if (t === 'route') {
        state.template = 'route';
        if (btnModeRoute) btnModeRoute.classList.add('active');
        if (btnModeBottom) btnModeBottom.classList.remove('active');
        if (panelBottomData) panelBottomData.style.display = 'none';
        if (panelRouteData) panelRouteData.style.display = 'block';
      } else {
        state.template = t;
      }
      updateTabActive('#templateTabs', state.template);
    }
    if (params.has('logo')) {
      state.logo = params.get('logo');
      updateTabActive('#logoTabs', state.logo);
    }
    if (params.has('loc')) {
      state.routeLocation = params.get('loc');
      if (inputRouteLocation) inputRouteLocation.value = state.routeLocation;
    }
    if (params.has('dist') && inputRouteDist) {
      state.routeDist = params.get('dist');
      inputRouteDist.value = state.routeDist;
    }

    if (changed) {
      showToast('⚡️ 已从 Apple 健身导入数据');
    }
  }

  function saveRouteToStorage(fileName) {
    try {
      localStorage.setItem('runner_card_real_route', JSON.stringify({
        points: state.routePoints,
        dist: state.routeDist,
        loc: state.routeLocation,
        fileName: fileName || 'workout.gpx'
      }));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }

  function loadRouteFromStorage() {
    try {
      const saved = localStorage.getItem('runner_card_real_route');
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.points && data.points.length >= 2) {
          state.routePoints = data.points;
          if (data.dist) {
            state.routeDist = data.dist;
            if (inputRouteDist) inputRouteDist.value = data.dist;
          }
          if (data.loc) {
            state.routeLocation = data.loc;
            if (inputRouteLocation) inputRouteLocation.value = data.loc;
          }
          if (gpxStatusTag) {
            gpxStatusTag.textContent = `${state.routeDist}km · 已缓存`;
            gpxStatusTag.classList.add('active');
          }
          if (gpxInfoBanner) {
            gpxInfoBanner.textContent = `✅ 已载入最近轨迹: ${data.fileName || '真实轨迹'} (${data.points.length} 点)`;
          }
        }
      }
    } catch (e) {
      console.warn('Load storage error:', e);
    }
  }

  function updateTabActive(containerSelector, value) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const btns = container.querySelectorAll('.tab-btn');
    btns.forEach(b => {
      const val = b.getAttribute('data-tpl') || b.getAttribute('data-logo') || b.getAttribute('data-ratio') || b.getAttribute('data-fmt');
      if (val === value) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // --- Event Listeners Binding ---
  function initListeners() {
    // Mode Switcher
    if (btnModeBottom) {
      btnModeBottom.addEventListener('click', () => {
        state.template = 'nrc';
        btnModeBottom.classList.add('active');
        if (btnModeRoute) btnModeRoute.classList.remove('active');
        if (panelBottomData) panelBottomData.style.display = 'block';
        if (panelRouteData) panelRouteData.style.display = 'none';
        render();
      });
    }
    if (btnModeRoute) {
      btnModeRoute.addEventListener('click', () => {
        state.template = 'route';
        btnModeRoute.classList.add('active');
        if (btnModeBottom) btnModeBottom.classList.remove('active');
        if (panelBottomData) panelBottomData.style.display = 'none';
        if (panelRouteData) panelRouteData.style.display = 'block';
        render();
      });
    }

    // GPX Selection & Parsing
    if (btnSelectGPX && gpxFileInput) {
      btnSelectGPX.addEventListener('click', () => gpxFileInput.click());
      gpxFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = function(evt) {
            const pts = parseGpxOrTcx(evt.target.result);
            if (pts && pts.length >= 2) {
              state.routePoints = pts;
              const d = calculateRouteDistance(pts);
              state.routeDist = d.toFixed(2);
              if (inputRouteDist) inputRouteDist.value = state.routeDist;
              if (gpxStatusTag) {
                gpxStatusTag.textContent = `${state.routeDist}km · 已载入`;
                gpxStatusTag.classList.add('active');
              }
              if (gpxInfoBanner) {
                gpxInfoBanner.textContent = `✅ 真实轨迹: ${file.name} (${pts.length} 个点)`;
              }
              saveRouteToStorage(file.name);
              showToast(`真实轨迹导入成功 (${state.routeDist} 公里)`);
              render();
            } else {
              showToast('未在文件中识别出有效轨迹坐标');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    if (btnClearGPX) {
      btnClearGPX.addEventListener('click', () => {
        state.routePoints = [];
        if (gpxStatusTag) {
          gpxStatusTag.textContent = '待导入 GPX';
          gpxStatusTag.classList.remove('active');
        }
        if (gpxInfoBanner) {
          gpxInfoBanner.textContent = '💡 支持 WorkoutGPX、佳明、高驰、Keep 等导出的 GPX 文件';
        }
        if (gpxFileInput) gpxFileInput.value = '';
        localStorage.removeItem('runner_card_real_route');
        showToast('已清除当前轨迹');
        render();
      });
    }

    if (inputRouteDist) {
      inputRouteDist.addEventListener('input', () => {
        state.routeDist = inputRouteDist.value.trim();
        render();
      });
    }

    if (inputRouteLocation) {
      inputRouteLocation.addEventListener('input', () => {
        state.routeLocation = inputRouteLocation.value.trim();
        render();
      });
    }

    if (routeXSlider) {
      routeXSlider.addEventListener('input', (e) => {
        state.routeX = parseFloat(e.target.value);
        if (routeXVal) routeXVal.textContent = state.routeX + 'px';
        render();
      });
    }

    if (routeYSlider) {
      routeYSlider.addEventListener('input', (e) => {
        state.routeY = parseFloat(e.target.value);
        if (routeYVal) routeYVal.textContent = state.routeY + 'px';
        render();
      });
    }

    if (routeScaleSlider) {
      routeScaleSlider.addEventListener('input', (e) => {
        state.routeScale = parseFloat(e.target.value);
        if (routeScaleVal) routeScaleVal.textContent = Math.round(state.routeScale * 100) + '%';
        render();
      });
    }

    if (btnResetRoutePos) {
      btnResetRoutePos.addEventListener('click', () => {
        state.routeX = 60;
        state.routeY = 380;
        state.routeScale = 1.0;
        if (routeXSlider) routeXSlider.value = 60;
        if (routeXVal) routeXVal.textContent = '60px';
        if (routeYSlider) routeYSlider.value = 380;
        if (routeYVal) routeYVal.textContent = '380px';
        if (routeScaleSlider) routeScaleSlider.value = 1.0;
        if (routeScaleVal) routeScaleVal.textContent = '100%';
        render();
        showToast('路线位置已复位');
      });
    }

    inputDist.addEventListener('input', updatePaceFromInputs);
    inputTime.addEventListener('input', updatePaceFromInputs);
    inputPace.addEventListener('input', () => {
      state.pace = inputPace.value.trim();
      render();
    });
    if (inputHeartRate) {
      inputHeartRate.addEventListener('input', () => {
        state.heartRate = inputHeartRate.value.trim();
        render();
      });
    }
    if (inputCalories) {
      inputCalories.addEventListener('input', () => {
        state.calories = inputCalories.value.trim();
        render();
      });
    }

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
    emptyState.addEventListener('click', () => fileInput.click());
    document.getElementById('btnChangePhoto').addEventListener('click', () => fileInput.click());

    canvasWrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    canvasWrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    // Reset View Button
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        state.imgOffsetX = 0;
        state.imgOffsetY = 0;
        state.imgScale = 1.0;
        scaleSlider.value = 1.0;
        scaleVal.textContent = '100%';
        render();
        showToast('视角已居中复位');
      });
    }

    scaleSlider.addEventListener('input', (e) => {
      state.imgScale = parseFloat(e.target.value);
      scaleVal.textContent = Math.round(state.imgScale * 100) + '%';
      render();
    });

    vignetteSlider.addEventListener('input', (e) => {
      state.vignette = parseFloat(e.target.value);
      vignetteVal.textContent = Math.round(state.vignette * 100) + '%';
      render();
    });

    const tplTabs = document.getElementById('templateTabs');
    if (tplTabs) {
      tplTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#templateTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.template = btn.dataset.tpl;
        render();
      });
    }

    const logoTabs = document.getElementById('logoTabs');
    if (logoTabs) {
      logoTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#logoTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.logo = btn.dataset.logo;
        render();
      });
    }

    const ratioTabs = document.getElementById('ratioTabs');
    if (ratioTabs) {
      ratioTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#ratioTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.ratio = btn.dataset.ratio;
        updateCanvasDimensions();
      });
    }

    const formatTabs = document.getElementById('formatTabs');
    if (formatTabs) {
      formatTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#formatTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exportFormat = btn.dataset.fmt;
      });
    }

    document.getElementById('btnExport').addEventListener('click', exportShareImage);

    btnDirectDownload.addEventListener('click', triggerDirectDownload);
    btnCloseSaveModal.addEventListener('click', () => {
      saveModal.classList.remove('show');
    });
    saveModal.addEventListener('click', (e) => {
      if (e.target === saveModal) saveModal.classList.remove('show');
    });

    const btnSample = document.getElementById('btnSample');
    if (btnSample) {
      btnSample.addEventListener('click', () => {
        state.sampleIndex = state.sampleIndex === 1 ? 2 : 1;
        loadImage(`assets/sample${state.sampleIndex}.jpg`);
        if (state.sampleIndex === 1) {
          inputDist.value = '5.37';
          inputTime.value = '25:45';
          inputPace.value = "4'48\"";
        } else {
          inputDist.value = '5.03';
          inputTime.value = '23:27';
          inputPace.value = "4'40\"";
        }
        state.dist = inputDist.value;
        state.time = inputTime.value;
        state.pace = inputPace.value;
        showToast(`已载入示范底图 ${state.sampleIndex}`);
        render();
      });
    }

    document.getElementById('btnHelp').addEventListener('click', () => {
      helpModal.classList.add('show');
    });
    document.getElementById('btnCloseHelp').addEventListener('click', () => {
      helpModal.classList.remove('show');
    });
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });

    document.getElementById('btnCopyShortcutUrl').addEventListener('click', () => {
      const text = `Apple Watch 晨跑打卡快捷指令设置步骤：
1. 打开 iPhone“快捷指令”App，新建快捷指令
2. 添加动作【查找 体能训练】：
   - 类型 是 跑步
   - 开始日期 是 今天
   - 排序方式：开始日期（从新到旧），限制 1 项
3. 添加动作【计算】，根据“持续时间(秒) / 总距离(公里)”换算出配速
4. 添加动作【打开 URL】，填入 RunnerCard 地址并拼接参数：
   ?dist=总距离&time=持续时间&pace=配速
5. 跑完步在桌面点一下，即可自动填好运动数据并选图打卡！`;

      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制快捷指令配置说明到剪贴板！');
      }).catch(() => {
        showToast('快捷指令指南已就绪');
      });
    });
  }

  // --- Initializer ---
  function init() {
    updateCanvasDimensions();
    initListeners();
    loadRouteFromStorage();
    parseUrlParameters();

    // Clean initial state: do NOT load sample photo, wait for user photo
    render();

    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        render();
      });
    }

    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('SW registration error:', err);
      });
    }
  }

  let assetsReady = 0;
  function onAssetReady() {
    assetsReady++;
    if (assetsReady >= 3) {
      render();
    }
  }
  assets.swoosh.onload = onAssetReady;
  assets.stopwatch.onload = onAssetReady;
  assets.gauge.onload = onAssetReady;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
