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
    template: 'nrc',
    logo: 'nike',
    ratio: '1:1',
    vignette: 0,
    exportFormat: 'jpeg',
    sampleIndex: 2
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
    const parts = timeStr.trim().split(':').map(Number);
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
    if (state.template === 'nrc') {
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
      inputTime.value = params.get('time');
      state.time = params.get('time');
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
    if (params.has('tpl')) {
      state.template = params.get('tpl');
      updateTabActive('#templateTabs', state.template);
    }
    if (params.has('logo')) {
      state.logo = params.get('logo');
      updateTabActive('#logoTabs', state.logo);
    }

    if (changed) {
      showToast('⚡️ 已从 Apple 健身导入数据');
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
