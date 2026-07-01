document.documentElement.classList.add("js");

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

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((item, index) => {
  item.style.setProperty("--delay", `${Math.min(index % 5, 4) * 70}ms`);
  revealObserver.observe(item);
});

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
}

const stageData = {
  source: {
    tag: "源端决策",
    title: "价值驱动上报",
    body: "子机根据风险状态、信息增益、新鲜度、置信度和通信代价计算单位字节价值，并选择完整报告、紧凑报告、心跳保持或抑制上报。",
    points: ["输入：本地估计、协方差、观测质量", "输出：按价值选择的数据包", "目的：避免无差别全量上报"]
  },
  channel: {
    tag: "受限信道",
    title: "显式考虑受限通信",
    body: "数据包经过带宽受限链路，可能出现延迟、抖动、丢包和乱序。算法将通信代价纳入源端决策，从决策层降低无效链路占用。",
    points: ["约束：带宽、延迟、丢包", "策略：优先高价值证据", "目的：降低无效链路占用"]
  },
  admission: {
    tag: "收端准入",
    title: "一致性准入与降权",
    body: "母机收到数据后先做 NIS 一致性检验，再结合轨迹新鲜度和安全相关性决定接受、降权或拒绝，避免低质量证据污染融合结果。",
    points: ["接受：可信且新鲜", "降权：可疑但有价值", "拒绝：异常或过期"]
  },
  fusion: {
    tag: "融合与控制",
    title: "融合服务追捕控制",
    body: "通过 EKF/UKF 融合形成目标信念状态，再进入任务分配和 CBF 安全滤波，最终生成追捕指令。",
    points: ["融合：更新轨迹状态", "分配：最大化任务效用", "控制：满足安全约束"]
  },
  sentinel: {
    tag: "安全哨兵",
    title: "风险升高时主动回退",
    body: "当高速目标、雷达退化或队伍资源紧张触发安全哨兵时，系统临时提升报告频率、放宽关键证据准入，并在风险降低后恢复标准策略。",
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
  const actionText = {
    "full report": "完整报告",
    "compact report": "紧凑报告",
    heartbeat: "心跳保持",
    suppress: "抑制上报"
  };
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
    let receiver = "收端：保持上一时刻信念状态";
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
    let rationale = "风险和信息价值都不高，抑制上报以节省通信预算。";
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
    if (actionEl) actionEl.textContent = actionText[action] || action;
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
