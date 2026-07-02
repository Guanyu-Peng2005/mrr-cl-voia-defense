document.documentElement.classList.add("js");

const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
const narrowViewportQuery = window.matchMedia("(max-width: 860px)");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileUserAgent = /iPhone|iPad|iPod|Android|MicroMessenger|MQQBrowser|Mobile/i.test(navigator.userAgent);
const mobileLite = coarsePointerQuery.matches || narrowViewportQuery.matches || mobileUserAgent;

if (mobileLite) {
  document.documentElement.classList.add("mobile-lite");
  document.querySelectorAll("video").forEach((video) => {
    video.preload = "none";
  });
}

const navLinks = Array.from(document.querySelectorAll(".nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === id);
      });
    });
  },
  { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
);

sections.forEach((section) => activeObserver.observe(section));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("section-lit", entry.isIntersecting);
    });
  },
  { rootMargin: "-28% 0px -48% 0px", threshold: 0.01 }
);

document.querySelectorAll(".story-section").forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    });
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.04 }
);

document.querySelectorAll(".reveal").forEach((item, index) => {
  item.style.setProperty("--delay", `${Math.min(index % 5, 4) * 70}ms`);
  revealObserver.observe(item);
});

function revealVisibleItems() {
  document.querySelectorAll(".reveal:not(.in-view)").forEach((item) => {
    const rect = item.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight * 0.94 && rect.bottom > window.innerHeight * 0.06;
    if (!isVisible) return;
    item.classList.add("in-view");
    revealObserver.unobserve(item);
  });
}

requestAnimationFrame(revealVisibleItems);
window.addEventListener("hashchange", () => requestAnimationFrame(revealVisibleItems));
window.addEventListener("load", () => {
  [80, 320, 900].forEach((delay) => {
    window.setTimeout(revealVisibleItems, delay);
  });
});

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

const rootStyle = document.documentElement.style;
const responsiveSurfaces = Array.from(document.querySelectorAll(".liquid"));
let atmosphereFrame = 0;
let typeMotionFrame = 0;
let pendingTypePointer = null;

function resetTypeMotion() {
  [
    "--type-x",
    "--type-y",
    "--type-x-soft",
    "--type-y-soft",
    "--type-x-shadow",
    "--type-y-shadow",
    "--type-x-soft-shadow",
    "--type-y-soft-shadow",
    "--type-kicker-x",
    "--type-kicker-y",
    "--type-glow",
    "--type-boost",
    "--art-light-x",
    "--art-light-y",
    "--art-glow-radius",
    "--type-aura",
    "--type-aura-soft",
    "--type-aura-alpha",
    "--type-edge-alpha",
    "--type-sheen-opacity",
  ].forEach((property) => {
    rootStyle.removeProperty(property);
  });
}

function updateTypeMotion(pointer) {
  typeMotionFrame = 0;
  if (!pointer || mobileLite || reduceMotionQuery.matches) return;

  const pointerX = clamp01(pointer.clientX / Math.max(window.innerWidth, 1));
  const pointerY = clamp01(pointer.clientY / Math.max(window.innerHeight, 1));
  const x = (pointerX - 0.5) * 5.8;
  const y = (pointerY - 0.5) * 4.4;
  const energy = clamp01((Math.abs(x) + Math.abs(y)) / 4.8);

  rootStyle.setProperty("--type-x", `${x.toFixed(2)}px`);
  rootStyle.setProperty("--type-y", `${y.toFixed(2)}px`);
  rootStyle.setProperty("--type-x-soft", `${(x * 0.46).toFixed(2)}px`);
  rootStyle.setProperty("--type-y-soft", `${(y * 0.46).toFixed(2)}px`);
  rootStyle.setProperty("--type-x-shadow", `${(x * -0.85).toFixed(2)}px`);
  rootStyle.setProperty("--type-y-shadow", `${(y * -0.55).toFixed(2)}px`);
  rootStyle.setProperty("--type-x-soft-shadow", `${(x * -0.28).toFixed(2)}px`);
  rootStyle.setProperty("--type-y-soft-shadow", `${(y * -0.18).toFixed(2)}px`);
  rootStyle.setProperty("--type-kicker-x", `${(x * -0.2).toFixed(2)}px`);
  rootStyle.setProperty("--type-kicker-y", `${(y * 0.16).toFixed(2)}px`);
  rootStyle.setProperty("--type-glow", energy.toFixed(3));
  rootStyle.setProperty("--type-boost", Math.min(1, energy * 0.48 + 0.08).toFixed(3));
  rootStyle.setProperty("--art-light-x", `${(pointerX * 100).toFixed(1)}%`);
  rootStyle.setProperty("--art-light-y", `${(pointerY * 100).toFixed(1)}%`);
  rootStyle.setProperty("--art-glow-radius", `${(24 + energy * 22).toFixed(1)}px`);
  rootStyle.setProperty("--type-aura", `${(14 + energy * 16).toFixed(1)}px`);
  rootStyle.setProperty("--type-aura-soft", `${(24 + energy * 20).toFixed(1)}px`);
  rootStyle.setProperty("--type-aura-alpha", (0.16 + energy * 0.12).toFixed(3));
  rootStyle.setProperty("--type-edge-alpha", (0.1 + energy * 0.08).toFixed(3));
  rootStyle.setProperty("--type-sheen-opacity", (0.14 + energy * 0.2).toFixed(3));
}

function requestTypeMotionUpdate(event) {
  if (mobileLite || reduceMotionQuery.matches) return;
  pendingTypePointer = {
    clientX: event.clientX,
    clientY: event.clientY,
  };
  if (typeMotionFrame) return;
  typeMotionFrame = requestAnimationFrame(() => updateTypeMotion(pendingTypePointer));
}

function updateAtmosphere() {
  atmosphereFrame = 0;
  const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = clamp01(window.scrollY / scrollMax);
  const heroDrift = clamp01(window.scrollY / Math.max(1, window.innerHeight));
  rootStyle.setProperty("--page-progress", progress.toFixed(3));
  rootStyle.setProperty("--scroll-glow", Math.min(1, progress * 1.4 + 0.18).toFixed(3));
  rootStyle.setProperty("--hero-drift", heroDrift.toFixed(3));
  rootStyle.setProperty("--type-scroll", `${(Math.sin(progress * Math.PI * 2) * 2.2).toFixed(2)}px`);
  document.body.classList.toggle("is-scrolled", window.scrollY > 18);
}

function requestAtmosphereUpdate() {
  if (atmosphereFrame) return;
  atmosphereFrame = requestAnimationFrame(updateAtmosphere);
}

if (!mobileLite) responsiveSurfaces.forEach((surface) => {
  const updateSurfaceLight = (event) => {
    const rect = surface.getBoundingClientRect();
    const x = clamp01((event.clientX - rect.left) / Math.max(rect.width, 1));
    const y = clamp01((event.clientY - rect.top) / Math.max(rect.height, 1));

    surface.style.setProperty("--light-x", `${(x * 100).toFixed(1)}%`);
    surface.style.setProperty("--light-y", `${(y * 100).toFixed(1)}%`);
    surface.style.setProperty("--motion-x", ((x - 0.5) * 16).toFixed(2));
    surface.style.setProperty("--motion-y", ((y - 0.5) * 12).toFixed(2));
    surface.style.setProperty("--tilt-x", `${((0.5 - y) * 3.2).toFixed(2)}deg`);
    surface.style.setProperty("--tilt-y", `${((x - 0.5) * 4.2).toFixed(2)}deg`);
    surface.style.setProperty("--surface-glow", "1");
  };

  surface.addEventListener("pointerenter", updateSurfaceLight);
  surface.addEventListener("pointermove", updateSurfaceLight);
  surface.addEventListener("pointerleave", () => {
    ["--light-x", "--light-y", "--motion-x", "--motion-y", "--tilt-x", "--tilt-y"].forEach((property) => {
      surface.style.removeProperty(property);
    });
    surface.style.setProperty("--surface-glow", "0");
  });
});

if (!mobileLite) {
  document.addEventListener("pointermove", requestTypeMotionUpdate, { passive: true });
  document.addEventListener("pointerleave", resetTypeMotion);
  window.addEventListener("blur", resetTypeMotion);
}
const handleMotionPreferenceChange = (event) => {
  if (event.matches) resetTypeMotion();
};
if (typeof reduceMotionQuery.addEventListener === "function") {
  reduceMotionQuery.addEventListener("change", handleMotionPreferenceChange);
} else if (typeof reduceMotionQuery.addListener === "function") {
  reduceMotionQuery.addListener(handleMotionPreferenceChange);
}

window.addEventListener("scroll", requestAtmosphereUpdate, { passive: true });
window.addEventListener("scroll", revealVisibleItems, { passive: true });
window.addEventListener("resize", requestAtmosphereUpdate);
requestAtmosphereUpdate();

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const decimals = target % 1 ? 2 : 0;
      const start = performance.now();
      const duration = 950;
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

const modeToggle = document.querySelector("[data-mode-toggle]");
if (modeToggle) {
  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("present");
    modeToggle.textContent = document.body.classList.contains("present") ? "退出演示" : "演示模式";
  });
}

const dialog = document.querySelector("[data-dialog]");
const dialogImage = document.querySelector("[data-dialog-image]");
const closeDialog = document.querySelector("[data-close]");

document.querySelectorAll("[data-lightbox] img").forEach((image) => {
  image.addEventListener("click", () => {
    if (!dialog || !dialogImage) return;
    dialogImage.hidden = false;
    dialogImage.src = image.currentSrc || image.src;
    dialogImage.alt = image.alt || "";
    dialog.showModal();
  });
});

if (closeDialog) closeDialog.addEventListener("click", () => dialog.close());
if (dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (!dialogImage) return;
    dialogImage.hidden = true;
    dialogImage.removeAttribute("src");
  });
}

const stageData = {
  source: {
    tag: "源端决策",
    title: "价值驱动上报",
    body: "子机根据风险状态、信息增益、新鲜度、置信度和通信代价计算单位字节价值，选择 full report、compact report、heartbeat 或 suppress。",
    points: ["输入：本地估计、协方差、观测质量", "输出：按价值选择的数据包", "目的：避免无差别全量上报"]
  },
  channel: {
    tag: "Limited channel",
    title: "显式考虑受限通信",
    body: "数据包经过带宽受限链路，可能出现延迟、抖动、丢包和乱序。算法把通信代价放入源端决策，而不是等拥塞后被动处理。",
    points: ["约束：带宽、延迟、丢包", "策略：优先高价值证据", "目的：降低无效链路占用"]
  },
  admission: {
    tag: "收端准入",
    title: "一致性准入与降权",
    body: "母机收到数据后先做 NIS 一致性检验，再结合轨迹新鲜度和安全相关性决定接受、降权或拒绝，避免低质量证据污染融合结果。",
    points: ["accept：可信且新鲜", "downweight：可疑但有价值", "reject：异常或过期"]
  },
  fusion: {
    tag: "Fusion and control",
    title: "融合服务追捕控制",
    body: "通过 EKF/UKF 融合形成目标 belief，再进入任务分配和 CBF 安全滤波，最终生成追捕指令。",
    points: ["融合：更新轨迹状态", "分配：最大化任务效用", "控制：满足安全约束"]
  },
  sentinel: {
    tag: "Safety sentinel",
    title: "风险升高时主动回退",
    body: "当高速目标、雷达退化或队伍资源紧张触发安全哨兵时，系统短时提升上报频率、放宽关键证据准入，并在风险降低后恢复标准策略。",
    points: ["触发：风险压力超过阈值", "回退：保留关键证据", "恢复：持续低风险后回归"]
  }
};

const stageExplorer = document.querySelector("[data-stage-explorer]");
if (stageExplorer) {
  const buttons = Array.from(stageExplorer.querySelectorAll("[data-stage]"));
  const tag = stageExplorer.querySelector("[data-stage-tag]");
  const title = stageExplorer.querySelector("[data-stage-title]");
  const body = stageExplorer.querySelector("[data-stage-body]");
  const points = stageExplorer.querySelector("[data-stage-points]");

  function renderStage(key) {
    const data = stageData[key];
    if (!data) return;
    buttons.forEach((button) => button.classList.toggle("active", button.dataset.stage === key));
    if (tag) tag.textContent = data.tag;
    if (title) title.textContent = data.title;
    if (body) body.textContent = data.body;
    if (points) {
      points.innerHTML = "";
      data.points.forEach((point) => {
        const span = document.createElement("span");
        span.textContent = point;
        points.appendChild(span);
      });
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => renderStage(button.dataset.stage));
  });
}

const voiConsole = document.querySelector("[data-voi-console]");
if (voiConsole) {
  const inputs = Array.from(voiConsole.querySelectorAll("[data-voi]"));
  const presetButtons = Array.from(voiConsole.querySelectorAll("[data-preset]"));
  const scoreEl = voiConsole.querySelector("[data-score]");
  const actionEl = voiConsole.querySelector("[data-action]");
  const rationaleEl = voiConsole.querySelector("[data-rationale]");
  const sourceStageEl = voiConsole.querySelector("[data-source-stage]");
  const channelStageEl = voiConsole.querySelector("[data-channel-stage]");
  const receiverStageEl = voiConsole.querySelector("[data-receiver-stage]");
  const presets = {
    nominal: { risk: 48, gain: 58, fresh: 82, conf: 78, cost: 34 },
    radar: { risk: 86, gain: 76, fresh: 68, conf: 48, cost: 42 },
    escape: { risk: 92, gain: 70, fresh: 82, conf: 72, cost: 34 },
    congested: { risk: 62, gain: 70, fresh: 72, conf: 76, cost: 82 }
  };

  function read(name) {
    const el = inputs.find((input) => input.dataset.voi === name);
    return el ? Number(el.value) / 100 : 0;
  }

  function setStage(action, cost) {
    let source = "源端：抑制无效上报";
    let channel = "链路：几乎不占用带宽";
    let receiver = "收端：保持上一时刻 belief";
    if (action === "full report") {
      source = "源端：发送完整报告";
      channel = cost > 0.65 ? "链路：高代价但风险优先" : "链路：允许关键包通过";
      receiver = "收端：一致性检验后强融合";
    } else if (action === "compact report") {
      source = "源端：发送紧凑报告";
      channel = "链路：压缩证据、控制字节数";
      receiver = "收端：准入后低成本融合";
    } else if (action === "heartbeat") {
      source = "源端：发送心跳";
      channel = "链路：只保留轨迹存在性";
      receiver = "收端：维持目标连续性";
    }
    if (sourceStageEl) sourceStageEl.textContent = source;
    if (channelStageEl) channelStageEl.textContent = channel;
    if (receiverStageEl) receiverStageEl.textContent = receiver;
  }

  function updateVoi() {
    const risk = read("risk");
    const gain = read("gain");
    const fresh = read("fresh");
    const conf = read("conf");
    const cost = read("cost");
    const utility = 0.32 * risk + 0.28 * gain + 0.18 * fresh + 0.16 * conf + 0.06 * risk * gain;
    const score = Math.max(0, utility / (0.35 + 0.85 * cost));
    let action = "suppress";
    let rationale = "风险和信息价值均较低，抑制上报以降低通信占用。";
    if (score > 0.88 && risk > 0.62) {
      action = "full report";
      rationale = "风险高且信息价值强，发送完整包，保留协方差和质量信息。";
    } else if (score > 0.58) {
      action = "compact report";
      rationale = "信息仍有价值，但通信代价需要控制，发送紧凑包。";
    } else if (risk > 0.72 && fresh > 0.45) {
      action = "heartbeat";
      rationale = "风险偏高但单位字节价值不足，发送心跳维持轨迹存在性。";
    }
    if (scoreEl) scoreEl.textContent = score.toFixed(2);
    if (actionEl) actionEl.textContent = action;
    if (rationaleEl) rationaleEl.textContent = rationale;
    setStage(action, cost);
  }

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const preset = presets[button.dataset.preset];
      if (!preset) return;
      inputs.forEach((input) => {
        const next = preset[input.dataset.voi];
        if (typeof next === "number") input.value = String(next);
      });
      presetButtons.forEach((item) => item.classList.toggle("active", item === button));
      updateVoi();
    });
  });

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      presetButtons.forEach((button) => button.classList.remove("active"));
      updateVoi();
    });
  });
  updateVoi();
}

const trajectoryStage = document.querySelector("[data-trajectory-stage]");
if (trajectoryStage) {
  setupTrajectoryStage(trajectoryStage);
}

async function setupTrajectoryStage(stage) {
  const canvas = stage.querySelector("[data-trajectory-canvas]");
  const trackErrorEl = stage.querySelector("[data-track-error]");
  const gateStateEl = stage.querySelector("[data-gate-state]");
  const linkLoadEl = stage.querySelector("[data-link-load]");
  const safetyMarginEl = stage.querySelector("[data-safety-margin]");
  const fallbackSvg = stage.querySelector("[data-trajectory-fallback-svg]");

  let payload;
  try {
    const response = await fetch("assets/data/real_trajectory_rollout.json?v=trajectory-controls-20260702", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    payload = await response.json();
  } catch (error) {
    stage.classList.add("trajectory-lite");
    console.warn("Real trajectory log could not be loaded.", error);
    return;
  }

  const frames = Array.isArray(payload.frames) ? payload.frames : [];
  if (!frames.length) {
    stage.classList.add("trajectory-lite");
    return;
  }

  function targetCount() {
    return Math.max(1, frames[0]?.targets?.length || 1);
  }

  function numeric(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function validPosition(position) {
    return Array.isArray(position) && position.length >= 3 && position.every(numeric);
  }

  function formatError(target) {
    if (numeric(target?.error_m)) return `${target.error_m.toFixed(1)} m`;
    if (target?.state === "CAPTURED") return "已捕获";
    return "--";
  }

  function updateTrajectoryReadout(frame) {
    const targets = frame.targets || [];
    const captured = Number(frame.captured ?? targets.filter((target) => target.state === "CAPTURED").length);
    const count = targetCount();
    const hasTrack = targets.some((target) => numeric(target.error_m));
    let phaseLabel = "初始搜索";
    if (hasTrack) phaseLabel = "双目标跟踪";
    if (captured > 0 && captured < count) phaseLabel = `已捕获 ${captured}/${count}`;
    if (captured >= count) phaseLabel = "捕获完成";

    if (trackErrorEl) trackErrorEl.textContent = targets.map(formatError).join(" / ");
    if (gateStateEl) gateStateEl.textContent = phaseLabel;
    if (linkLoadEl) linkLoadEl.textContent = `${Number(frame.live_bandwidth_kbps || 0).toFixed(1)} kbps`;
    if (safetyMarginEl) safetyMarginEl.textContent = `${captured}/${count}`;
  }

  function renderFallbackSvg() {
    if (!fallbackSvg) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const bounds = payload.bounds || {};
    const min = bounds.min || [-1, -1, -1];
    const max = bounds.max || [1, 1, 1];
    const dx = Math.max(1, max[0] - min[0]);
    const dy = Math.max(1, max[1] - min[1]);
    const pad = 76;
    const width = 1000;
    const height = 560;
    const colors = ["#ff8a2a", "#b480ff"];
    const estimateColors = ["#14d6ff", "#20d5b3"];

    function project(position) {
      const x = pad + ((position[0] - min[0]) / dx) * (width - pad * 2);
      const y = height - pad - ((position[1] - min[1]) / dy) * (height - pad * 2);
      return [x, y];
    }

    function pathData(points) {
      return points.map((point, index) => {
        const [x, y] = project(point);
        return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
    }

    function add(tag, attrs) {
      const el = document.createElementNS(svgNS, tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
      fallbackSvg.appendChild(el);
      return el;
    }

    fallbackSvg.replaceChildren();
    for (let i = 0; i <= 10; i += 1) {
      const x = pad + (i / 10) * (width - pad * 2);
      const y = pad + (i / 10) * (height - pad * 2);
      add("line", { x1: x, x2: x, y1: pad, y2: height - pad, stroke: "rgba(255,255,255,0.08)", "stroke-width": 1 });
      add("line", { x1: pad, x2: width - pad, y1: y, y2: y, stroke: "rgba(255,255,255,0.08)", "stroke-width": 1 });
    }

    for (let targetIndex = 0; targetIndex < targetCount(); targetIndex += 1) {
      const truth = frames.map((frame) => frame.targets?.[targetIndex]?.position).filter(validPosition);
      const estimates = frames.map((frame) => frame.targets?.[targetIndex]?.estimate).filter(validPosition);
      if (truth.length > 1) {
        add("path", { d: pathData(truth), fill: "none", stroke: colors[targetIndex] || colors[0], "stroke-width": 3.6, "stroke-opacity": 0.78, "stroke-linecap": "round", "stroke-linejoin": "round" });
      }
      if (estimates.length > 1) {
        add("path", { d: pathData(estimates), fill: "none", stroke: estimateColors[targetIndex] || estimateColors[0], "stroke-width": 2.6, "stroke-opacity": 0.62, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "8 7" });
      }
    }

    const finalFrame = frames[frames.length - 1];
    finalFrame.targets?.forEach((target, targetIndex) => {
      if (!validPosition(target.position)) return;
      const [x, y] = project(target.position);
      add("circle", { cx: x, cy: y, r: 16, fill: colors[targetIndex] || colors[0], stroke: "rgba(255,255,255,0.75)", "stroke-width": 2.5 });
      if (validPosition(target.estimate)) {
        const [ex, ey] = project(target.estimate);
        add("circle", { cx: ex, cy: ey, r: 10, fill: estimateColors[targetIndex] || estimateColors[0], "fill-opacity": 0.82, stroke: "rgba(255,255,255,0.68)", "stroke-width": 2 });
      }
    });
  }

  renderFallbackSvg();
  updateTrajectoryReadout(frames[0]);

  if (!canvas || mobileLite || reduceMotionQuery.matches) {
    stage.classList.add("trajectory-lite");
    return;
  }

  try {
    const THREE = await import("./assets/vendor/three.module.min.js");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
    camera.position.set(9.8, 7.4, 12.6);

    const rig = new THREE.Group();
    rig.rotation.y = -0.28;
    scene.add(rig);

    const grid = new THREE.GridHelper(16, 16, 0x2ad9ff, 0x173457);
    grid.position.y = -0.82;
    grid.material.transparent = true;
    grid.material.opacity = 0.34;
    rig.add(grid);

    const ambient = new THREE.AmbientLight(0x87d8ff, 1.15);
    const key = new THREE.PointLight(0x14d6ff, 2.8, 34);
    key.position.set(-5, 6, 6);
    const warm = new THREE.PointLight(0xff8a2a, 1.6, 28);
    warm.position.set(6, 4, -5);
    scene.add(ambient, key, warm);

    const bounds = payload.bounds || {};
    const min = bounds.min || [-1, -1, -1];
    const max = bounds.max || [1, 1, 1];
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const horizontalSpan = Math.max(max[0] - min[0], max[1] - min[1], 1);
    const scale = 12 / horizontalSpan;
    const altitudeScale = scale * 0.82;
    const targetColors = [0xff8a2a, 0xb480ff];
    const estimateColors = [0x14d6ff, 0x20d5b3];

    function toScene(position) {
      return new THREE.Vector3(
        (position[0] - center[0]) * scale,
        (position[2] - center[2]) * altitudeScale + 0.25,
        (position[1] - center[1]) * scale
      );
    }

    function interpolatePosition(a, b, alpha) {
      if (validPosition(a) && validPosition(b)) {
        return [
          a[0] + (b[0] - a[0]) * alpha,
          a[1] + (b[1] - a[1]) * alpha,
          a[2] + (b[2] - a[2]) * alpha
        ];
      }
      return validPosition(a) ? a : b;
    }

    function makePath(points, color, opacity) {
      if (points.length < 2) return null;
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geometry, material);
    }

    function addPath(points, color, opacity) {
      const line = makePath(points.map(toScene), color, opacity);
      if (line) rig.add(line);
    }

    for (let targetIndex = 0; targetIndex < targetCount(); targetIndex += 1) {
      addPath(frames.map((frame) => frame.targets?.[targetIndex]?.position).filter(validPosition), targetColors[targetIndex] || targetColors[0], 0.46);
      addPath(frames.map((frame) => frame.targets?.[targetIndex]?.estimate).filter(validPosition), estimateColors[targetIndex] || estimateColors[0], 0.58);
    }

    function makeTrail(color) {
      const count = 46;
      const positions = new Float32Array(count * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.92 });
      const line = new THREE.Line(geometry, material);
      rig.add(line);
      return { count, geometry, positions, line };
    }

    const targetTrails = Array.from({ length: targetCount() }, (_, index) => makeTrail(targetColors[index] || targetColors[0]));
    const estimateTrails = Array.from({ length: targetCount() }, (_, index) => makeTrail(estimateColors[index] || estimateColors[0]));

    function updateTrail(trail, targetIndex, key, frameIndex) {
      const end = Math.floor(frameIndex);
      const start = Math.max(0, end - trail.count + 1);
      const points = [];
      for (let index = start; index <= end; index += 1) {
        const point = frames[index]?.targets?.[targetIndex]?.[key];
        if (validPosition(point)) points.push(toScene(point));
      }
      trail.line.visible = points.length > 1;
      const fill = points[0] || new THREE.Vector3();
      for (let index = 0; index < trail.count; index += 1) {
        const point = points[Math.max(0, points.length - trail.count + index)] || fill;
        const offset = index * 3;
        trail.positions[offset] = point.x;
        trail.positions[offset + 1] = point.y;
        trail.positions[offset + 2] = point.z;
      }
      trail.geometry.attributes.position.needsUpdate = true;
    }

    function makeMarker(color, size, emissiveScale) {
      return new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 18),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: emissiveScale,
          metalness: 0.18,
          roughness: 0.26
        })
      );
    }

    const targetMeshes = Array.from({ length: targetCount() }, (_, index) => makeMarker(targetColors[index] || targetColors[0], 0.22, 0.72));
    const estimateMeshes = Array.from({ length: targetCount() }, (_, index) => makeMarker(estimateColors[index] || estimateColors[0], 0.18, 0.66));
    targetMeshes.forEach((mesh) => rig.add(mesh));
    estimateMeshes.forEach((mesh) => rig.add(mesh));

    function makeHalo(color, radius, opacity) {
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.014, 8, 72),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
      );
      halo.rotation.x = Math.PI / 2;
      rig.add(halo);
      return halo;
    }

    const targetHalos = Array.from({ length: targetCount() }, (_, index) => makeHalo(targetColors[index] || targetColors[0], 0.46, 0.68));
    const estimateHalos = Array.from({ length: targetCount() }, (_, index) => makeHalo(estimateColors[index] || estimateColors[0], 0.36, 0.62));

    const resize = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    const viewTarget = new THREE.Vector3(0, 0.55, 0);
    const orbit = {
      yaw: Math.atan2(9.8, 12.6),
      pitch: Math.atan2(7.4 - viewTarget.y, Math.hypot(9.8, 12.6)),
      distance: Math.hypot(9.8, 7.4 - viewTarget.y, 12.6)
    };
    const dragState = { mode: null, x: 0, y: 0 };
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();

    function clamp(value, minValue, maxValue) {
      return Math.min(maxValue, Math.max(minValue, value));
    }

    function applyCamera() {
      const horizontal = Math.cos(orbit.pitch) * orbit.distance;
      camera.position.set(
        viewTarget.x + Math.sin(orbit.yaw) * horizontal,
        viewTarget.y + Math.sin(orbit.pitch) * orbit.distance,
        viewTarget.z + Math.cos(orbit.yaw) * horizontal
      );
      camera.lookAt(viewTarget);
      stage.dataset.viewDistance = orbit.distance.toFixed(2);
      stage.dataset.viewYaw = orbit.yaw.toFixed(3);
      stage.dataset.viewPitch = orbit.pitch.toFixed(3);
      stage.dataset.viewTarget = `${viewTarget.x.toFixed(2)},${viewTarget.y.toFixed(2)},${viewTarget.z.toFixed(2)}`;
    }

    function panCamera(deltaX, deltaY) {
      camera.updateMatrixWorld();
      camera.getWorldDirection(forward);
      right.crossVectors(forward, camera.up).normalize();
      up.crossVectors(right, forward).normalize();
      const panScale = orbit.distance * 0.0018;
      viewTarget.addScaledVector(right, -deltaX * panScale);
      viewTarget.addScaledVector(up, deltaY * panScale);
    }

    stage.addEventListener("contextmenu", (event) => event.preventDefault());
    stage.addEventListener("pointerdown", (event) => {
      if (event.button > 2) return;
      event.preventDefault();
      dragState.mode = event.button === 2 || event.altKey ? "rotate" : "pan";
      dragState.x = event.clientX;
      dragState.y = event.clientY;
      stage.classList.add("is-dragging");
      stage.setPointerCapture?.(event.pointerId);
    });
    stage.addEventListener("pointermove", (event) => {
      if (!dragState.mode) return;
      const deltaX = event.clientX - dragState.x;
      const deltaY = event.clientY - dragState.y;
      dragState.x = event.clientX;
      dragState.y = event.clientY;
      if (dragState.mode === "pan") {
        panCamera(deltaX, deltaY);
      } else {
        orbit.yaw -= deltaX * 0.006;
        orbit.pitch = clamp(orbit.pitch + deltaY * 0.004, 0.12, 1.12);
      }
    }, { passive: true });
    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
      stage.addEventListener(eventName, (event) => {
        dragState.mode = null;
        stage.classList.remove("is-dragging");
        if (event.pointerId !== undefined) stage.releasePointerCapture?.(event.pointerId);
      });
    });
    stage.addEventListener("wheel", (event) => {
      event.preventDefault();
      orbit.distance = clamp(orbit.distance * Math.exp(event.deltaY * 0.001), 7.2, 32);
    }, { passive: false });
    applyCamera();

    let active = false;
    let animationStart = null;
    const trajectoryObserver = new IntersectionObserver((entries) => {
      active = entries.some((entry) => entry.isIntersecting);
      if (active && animationStart === null) animationStart = performance.now();
    }, { threshold: 0.04 });
    trajectoryObserver.observe(stage);

    let frame = 0;
    function animate(now) {
      requestAnimationFrame(animate);
      if (!active) return;

      if (animationStart === null) animationStart = now;
      const durationMs = 28000;
      const ratio = ((now - animationStart) % durationMs) / durationMs;
      const frameIndex = ratio * (frames.length - 1);
      const lo = Math.floor(frameIndex);
      const hi = Math.min(frames.length - 1, lo + 1);
      const alpha = frameIndex - lo;
      const frameNow = frames[lo];
      const frameNext = frames[hi];

      for (let targetIndex = 0; targetIndex < targetCount(); targetIndex += 1) {
        const targetPosition = interpolatePosition(frameNow.targets?.[targetIndex]?.position, frameNext.targets?.[targetIndex]?.position, alpha);
        const estimatePosition = interpolatePosition(frameNow.targets?.[targetIndex]?.estimate, frameNext.targets?.[targetIndex]?.estimate, alpha);
        if (validPosition(targetPosition)) {
          const target = toScene(targetPosition);
          targetMeshes[targetIndex].visible = true;
          targetHalos[targetIndex].visible = true;
          targetMeshes[targetIndex].position.copy(target);
          targetHalos[targetIndex].position.copy(target);
        } else {
          targetMeshes[targetIndex].visible = false;
          targetHalos[targetIndex].visible = false;
        }
        if (validPosition(estimatePosition)) {
          const estimate = toScene(estimatePosition);
          estimateMeshes[targetIndex].visible = true;
          estimateHalos[targetIndex].visible = true;
          estimateMeshes[targetIndex].position.copy(estimate);
          estimateHalos[targetIndex].position.copy(estimate);
        } else {
          estimateMeshes[targetIndex].visible = false;
          estimateHalos[targetIndex].visible = false;
        }
        targetHalos[targetIndex].rotation.z = now * (0.001 + targetIndex * 0.0003);
        estimateHalos[targetIndex].rotation.z = -now * (0.0012 + targetIndex * 0.0002);
        updateTrail(targetTrails[targetIndex], targetIndex, "position", frameIndex);
        updateTrail(estimateTrails[targetIndex], targetIndex, "estimate", frameIndex);
      }

      applyCamera();
      rig.rotation.y = -0.28 + Math.sin(now * 0.00022) * 0.035;
      renderer.render(scene, camera);

      frame += 1;
      if (frame % 8 === 0) {
        updateTrajectoryReadout(frameNow);
      }
    }

    stage.classList.add("is-3d-ready");
    canvas.dataset.ready = "true";
    requestAnimationFrame(animate);
  } catch (error) {
    stage.classList.add("trajectory-lite");
    console.warn("Trajectory scene could not be initialized.", error);
  }
}
