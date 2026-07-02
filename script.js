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
