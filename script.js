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
    camera.position.set(9.8, 7.2, 12.4);

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

    function wrap(value) {
      return ((value % 1) + 1) % 1;
    }

    const targetConfigs = [
      {
        targetColor: 0xff8a2a,
        estimateColor: 0x14d6ff,
        start: new THREE.Vector3(-5.7, 1.7, -3.6),
        controlA: new THREE.Vector3(-3.8, 2.7, 2.8),
        controlB: new THREE.Vector3(-0.8, 1.4, 3.4),
        capture: new THREE.Vector3(1.0, 0.74, 0.36),
        phase: 0.15
      },
      {
        targetColor: 0xb480ff,
        estimateColor: 0x20d5b3,
        start: new THREE.Vector3(5.5, 1.45, 3.2),
        controlA: new THREE.Vector3(3.2, 2.35, -2.9),
        controlB: new THREE.Vector3(0.7, 1.3, -3.0),
        capture: new THREE.Vector3(-0.82, 0.7, -0.3),
        phase: 1.18
      }
    ];

    function missionRatio(time) {
      return time >= 0 && time <= 1 ? time : wrap(time);
    }

    function smoothstep(value) {
      const t = clamp01(value);
      return t * t * (3 - 2 * t);
    }

    function cubicPoint(config, t) {
      const u = 1 - t;
      return config.start.clone().multiplyScalar(u * u * u)
        .add(config.controlA.clone().multiplyScalar(3 * u * u * t))
        .add(config.controlB.clone().multiplyScalar(3 * u * t * t))
        .add(config.capture.clone().multiplyScalar(t * t * t));
    }

    function targetPosition(targetIndex, time) {
      const config = targetConfigs[targetIndex];
      const ratio = missionRatio(time);
      const t = smoothstep(ratio);
      const angle = (ratio * Math.PI * 2) + config.phase;
      const evade = 1 - t;
      const point = cubicPoint(config, t);
      point.x += Math.sin(angle * 1.9) * 0.42 * evade;
      point.y += Math.sin(angle * 1.35 + targetIndex) * 0.34 * evade + 0.08 * Math.sin(angle * 3.1);
      point.z += Math.cos(angle * 1.7) * 0.38 * evade;
      return point;
    }

    function estimatePosition(targetIndex, time) {
      const ratio = missionRatio(time);
      const t = smoothstep(ratio);
      const angle = (ratio * Math.PI * 2) + targetConfigs[targetIndex].phase;
      const lag = 0.028 * (1 - t) + 0.004;
      const base = targetPosition(targetIndex, ratio - lag);
      const residual = 1 - t;
      base.x += Math.sin(angle * 2.2 + 0.3) * (0.18 * residual + 0.035);
      base.y += Math.cos(angle * 1.6) * (0.12 * residual + 0.025);
      base.z += Math.cos(angle * 1.9 - 0.4) * (0.16 * residual + 0.035);
      return base;
    }

    function makePath(sampler, color, opacity) {
      const points = Array.from({ length: 240 }, (_, index) => sampler(index / 239));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geometry, material);
    }

    targetConfigs.forEach((config, targetIndex) => {
      rig.add(makePath((time) => targetPosition(targetIndex, time), config.targetColor, 0.46));
      rig.add(makePath((time) => estimatePosition(targetIndex, time), config.estimateColor, 0.54));
    });

    function makeTrail(color, opacity) {
      const count = 150;
      const positions = new Float32Array(count * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(geometry, material);
      rig.add(line);
      return { count, geometry, positions };
    }

    const targetTrails = targetConfigs.map((config) => makeTrail(config.targetColor, 0.86));
    const estimateTrails = targetConfigs.map((config) => makeTrail(config.estimateColor, 0.9));

    function updateTrail(trail, sampler, phase) {
      for (let index = 0; index < trail.count; index += 1) {
        const point = sampler(phase - index * 0.0048);
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

    const targetMeshes = targetConfigs.map((config) => makeMarker(config.targetColor, 0.22, 0.72));
    const estimateMeshes = targetConfigs.map((config) => makeMarker(config.estimateColor, 0.18, 0.66));
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

    const targetHalos = targetConfigs.map((config) => makeHalo(config.targetColor, 0.46, 0.68));
    const estimateHalos = targetConfigs.map((config) => makeHalo(config.estimateColor, 0.36, 0.62));

    const droneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x14d6ff,
      emissiveIntensity: 0.35,
      metalness: 0.22,
      roughness: 0.18
    });
    const droneGroups = targetConfigs.map(() => Array.from({ length: 3 }, () => {
      const drone = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), droneMaterial);
      rig.add(drone);
      return drone;
    }));

    const tetherMaterial = new THREE.LineBasicMaterial({ color: 0x88f2ff, transparent: true, opacity: 0.34 });
    const tetherGroups = targetConfigs.map(() => Array.from({ length: 3 }, () => {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geometry, tetherMaterial);
      rig.add(line);
      return line;
    }));

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

    let pointerX = 0;
    let pointerY = 0;
    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
      pointerY = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    }, { passive: true });

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
      const phase = wrap((now - animationStart) * 0.000043);
      const captureProgress = clamp01((phase - 0.08) / 0.9);
      const targetPositions = targetConfigs.map((_, targetIndex) => targetPosition(targetIndex, phase));
      const estimatePositions = targetConfigs.map((_, targetIndex) => estimatePosition(targetIndex, phase));
      const errors = targetPositions.map((target, targetIndex) => target.distanceTo(estimatePositions[targetIndex]));

      targetConfigs.forEach((config, targetIndex) => {
        const target = targetPositions[targetIndex];
        const estimate = estimatePositions[targetIndex];
        targetMeshes[targetIndex].position.copy(target);
        estimateMeshes[targetIndex].position.copy(estimate);
        targetHalos[targetIndex].position.copy(target);
        estimateHalos[targetIndex].position.copy(estimate);
        targetHalos[targetIndex].rotation.z = now * (0.001 + targetIndex * 0.0003);
        estimateHalos[targetIndex].rotation.z = -now * (0.0012 + targetIndex * 0.0002);

        updateTrail(targetTrails[targetIndex], (time) => targetPosition(targetIndex, time), phase);
        updateTrail(estimateTrails[targetIndex], (time) => estimatePosition(targetIndex, time), phase);

        const formationRadius = 1.62 - captureProgress * 1.04 + Math.sin(phase * Math.PI * 3 + targetIndex) * 0.08;
        droneGroups[targetIndex].forEach((drone, droneIndex) => {
          const angle = phase * Math.PI * 2 + droneIndex * (Math.PI * 2 / 3) + targetIndex * 0.9;
          drone.position.set(
            estimate.x + Math.cos(angle) * formationRadius,
            0.22 + Math.sin(angle * 1.35 + droneIndex) * 0.16 + targetIndex * 0.06,
            estimate.z + Math.sin(angle) * formationRadius
          );
          drone.rotation.set(0.52 + Math.sin(angle) * 0.2, angle, 0.22);

          const position = tetherGroups[targetIndex][droneIndex].geometry.attributes.position;
          position.setXYZ(0, estimate.x, estimate.y, estimate.z);
          position.setXYZ(1, drone.position.x, drone.position.y, drone.position.z);
          position.needsUpdate = true;
        });
      });

      const cameraTargetX = 9.8 + pointerX * 1.25;
      const cameraTargetY = 7.2 - pointerY * 0.72;
      camera.position.x += (cameraTargetX - camera.position.x) * 0.045;
      camera.position.y += (cameraTargetY - camera.position.y) * 0.045;
      camera.lookAt(0, 0.55, 0);
      rig.rotation.y = -0.28 + Math.sin(now * 0.00022) * 0.08 + pointerX * 0.08;
      renderer.render(scene, camera);

      frame += 1;
      if (frame % 8 === 0) {
        const load = 21.0 + Math.sin(phase * Math.PI * 2 + 0.4) * 2.2 + (errors[0] + errors[1]) * 1.2;
        let stageLabel = "初始发现";
        if (phase > 0.28) stageLabel = "双目标稳定跟踪";
        if (phase > 0.66) stageLabel = "追捕收敛";
        if (phase > 0.9) stageLabel = "捕获完成";
        if (trackErrorEl) trackErrorEl.textContent = `${errors[0].toFixed(2)} / ${errors[1].toFixed(2)} m`;
        if (gateStateEl) gateStateEl.textContent = stageLabel;
        if (linkLoadEl) linkLoadEl.textContent = `${load.toFixed(1)} kbps`;
        if (safetyMarginEl) safetyMarginEl.textContent = `${phase > 0.9 ? 100 : Math.round(captureProgress * 100)}%`;
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
