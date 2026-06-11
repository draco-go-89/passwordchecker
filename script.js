/*
  Futuristic Password Checker (single-file JS)
  - Analyzer (index.html)
  - Generator (generator.html)
  - History (history.html)
*/

(function () {
  const $ = (sel) => document.querySelector(sel);

  const LS_KEY = "pwchk_history_v1";
  const HISTORY_MAX = 30;

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  // ---- Charset building helpers ----
  function buildCharset() {
    const upper = { id: "#setUpper", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" };
    const lower = { id: "#setLower", chars: "abcdefghijklmnopqrstuvwxyz" };
    const digits = { id: "#setDigits", chars: "0123456789" };
    const symbols = { id: "#setSymbols", chars: "!@#$%^&*()_+-=~[]{}|:,.<>?" };

    const avoidAmbiguous = $("#avoidAmbiguous")?.checked;
    const avoidSimilar = $("#avoidSimilar")?.checked;

    const ambiguous = new Set(["O", "0", "I", "l", "1"]);
    const similar = new Set(["B", "8", "S", "5", "Z", "2"]);

    const sets = [upper, lower, digits, symbols].filter((s) => $(s.id)?.checked);
    if (sets.length === 0) {
      // fallback
      sets.push(lower, digits);
    }

    let raw = sets.map((s) => s.chars).join("");

    if (avoidAmbiguous) raw = Array.from(raw).filter((c) => !ambiguous.has(c)).join("");
    if (avoidSimilar) raw = Array.from(raw).filter((c) => !similar.has(c)).join("");

    // Ensure unique chars
    raw = Array.from(new Set(raw.split("").filter(Boolean))).join("");
    return { charset: raw };
  }

  function generatePasswordFromStudio() {
    const lenEl = $("#genLength");
    const length = lenEl ? clamp(parseInt(lenEl.value, 10), 8, 64) : 16;

    const { charset } = buildCharset();
    const avoidRepeats = $("#avoidSimilar")?.checked; // reuse option as a hint

    const chars = charset.length
      ? charset
      : "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let out = "";
    for (let i = 0; i < length; i++) {
      let pick;
      // avoid some repeats for nicer outputs
      do {
        pick = chars.charAt(Math.floor(Math.random() * chars.length));
      } while (avoidRepeats && out.length >= 2 && out.endsWith(pick) && Math.random() < 0.55);
      out += pick;
    }
    return out;
  }

  // ---- Strength evaluation (simple but richer than before) ----
  function estimateEntropyBits(p) {
    if (!p) return 0;

    let pool = 0;
    if (/[a-z]/.test(p)) pool += 26;
    if (/[A-Z]/.test(p)) pool += 26;
    if (/[0-9]/.test(p)) pool += 10;
    if (/[^A-Za-z0-9]/.test(p)) pool += 33;
    if (pool <= 0) return 0;

    return p.length * Math.log2(pool);
  }

  function crackTimeTier(bits) {
    if (bits <= 0) return { tier: 0, label: "—" };

    // UI educational guess: guesses/sec ~ 1e10
    const guesses = Math.pow(2, bits);
    const seconds = guesses / 1e10;

    const tiers = [
      { maxSeconds: 60, tier: 0, label: "Seconds" },
      { maxSeconds: 3600 * 24, tier: 1, label: "Hours/Days" },
      { maxSeconds: 3600 * 24 * 365, tier: 2, label: "Months/1y" },
      { maxSeconds: 3600 * 24 * 365 * 10, tier: 3, label: "10y-ish" },
      { maxSeconds: 3600 * 24 * 365 * 100, tier: 4, label: "Century+" }
    ];

    const hit = tiers.find((t) => seconds <= t.maxSeconds);
    return hit ? { tier: hit.tier, label: hit.label } : { tier: 5, label: "Unreasonable" };
  }

  function strengthPalette(level) {
    const colors = [
      "#f87171", // 0
      "#fbbf24", // 1
      "#facc15", // 2
      "#60a5fa", // 3
      "#22c55e", // 4
      "#22d3ee" // 5
    ];
    return colors[clamp(level, 0, 5)];
  }

  function strengthText(level, feedback) {
    if ((!level || level <= 1) && feedback.length) return "Very Weak";
    if (level <= 1) return "Very Weak";
    if (level === 2) return "Weak";
    if (level === 3) return "Medium";
    if (level === 4) return "Strong";
    return "Ultra Secure 🚀";
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "<")
      .replaceAll(">", ">");
  }

  function setProgressBar(barEl, level) {
    if (!barEl) return;
    const fill = barEl.querySelector(".progress-fill") || barEl;
    const width = [0, 25, 40, 60, 80, 100][clamp(level, 0, 5)];
    fill.style.width = width + "%";
    const color = strengthPalette(level);
    fill.style.background = `linear-gradient(90deg, ${color} 0%, rgba(34,211,238,1) 55%, rgba(59,130,246,1) 100%)`;
  }

  function readRuleChecklist() {
    // Optional: if a future checklist exists, use it.
    // Current site doesn’t include one, so defaults enable all.
    return { length: true, upper: true, lower: true, digits: true, symbols: true };
  }

  function evaluatePassword(password, ruleConfig) {
    const p = password || "";

    const checks = {
      length: { ok: p.length >= (ruleConfig?.minLength ?? 12), label: "Length" },
      upper: { ok: /[A-Z]/.test(p), label: "Uppercase" },
      lower: { ok: /[a-z]/.test(p), label: "Lowercase" },
      digits: { ok: /[0-9]/.test(p), label: "Digits" },
      symbols: { ok: /[^A-Za-z0-9]/.test(p), label: "Symbols" }
    };

    const enabled = ruleConfig?.enabled ?? readRuleChecklist();

    const keys = Object.keys(checks);
    const enabledKeys = keys.filter((k) => enabled[k]);

    let score = 0;
    const feedback = [];
    for (const k of enabledKeys) {
      if (checks[k].ok) score += 1;
      else feedback.push(checks[k].label);
    }

    const max = enabledKeys.length || 1;
    const strengthLevel = clamp(Math.round((score / max) * 4), 0, 4);
    // Map 0..4 -> 0..5 to keep UI variation
    const mappedLevel = strengthLevel === 4 ? 5 : strengthLevel;

    const entropyBits = estimateEntropyBits(p);
    const crack = crackTimeTier(entropyBits);

    return {
      score,
      max,
      strengthLevel: mappedLevel,
      feedback,
      checks,
      entropyBits,
      crackLabel: crack.label
    };
  }

  function toast(msg) {
    const toastEl = $("#toast");
    const toastMsg = $("#toastMsg");
    if (toastMsg) toastMsg.textContent = msg;
    if (!toastEl) return;

    try {
      if (window.bootstrap?.Toast) {
        const t = window.bootstrap.Toast.getOrCreateInstance(toastEl);
        t.show();
        return;
      }
    } catch {}

    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 900);
  }

  function resetAnalyzerUI() {
    const bar = $("#strengthBar");
    if (bar) setProgressBar(bar, 0);

    const resultEl = $("#result");
    if (resultEl) {
      resultEl.innerHTML = `<div class="result-icon">🔒</div><div class="result-text">Enter a password to analyze security</div>`;
    }
  }

  // ---- History (localStorage + canvas) ----
  function loadHistory() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function pushToHistory(entry) {
    if (!entry || entry.password === "") return;

    const items = loadHistory();
    items.unshift({
      ts: entry.ts || Date.now(),
      source: entry.source,
      scoreLevel: entry.scoreLevel,
      entropyBits: entry.entropyBits,
      checks: entry.checks
      // privacy: don’t store password
    });

    const next = items.slice(0, HISTORY_MAX);
    localStorage.setItem(LS_KEY, JSON.stringify(next));

    if (document.getElementById("historyCanvas")) renderHistory();
  }

  function drawGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 1;

    const rows = 4;
    for (let i = 0; i <= rows; i++) {
      const y = (i / rows) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cols = 6;
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHistory(canvas, items) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);

    if (!items.length) return;

    // convert stored history (most-recent first) to oldest->newest
    const levels = items.slice().reverse().map((it) => clamp(it.scoreLevel || 0, 0, 5));

    const pad = 14;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    const xAt = (i) => pad + (levels.length === 1 ? plotW / 2 : (i / (levels.length - 1)) * plotW);
    const yAt = (lvl) => pad + (1 - lvl / 5) * plotH;

    // line
    ctx.beginPath();
    levels.forEach((lvl, i) => {
      const x = xAt(i);
      const y = yAt(lvl);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = "rgba(34,211,238,.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // points
    levels.forEach((lvl, i) => {
      const x = xAt(i);
      const y = yAt(lvl);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = strengthPalette(lvl);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.stroke();
    });
  }

  function renderHistory() {
    const canvas = $("#historyCanvas");
    const tbody = $("#historyTbody");
    const countEl = $("#historyCount");
    if (!canvas || !tbody) return;

    const items = loadHistory();
    if (countEl) countEl.textContent = items.length ? `${items.length} items` : "0";

    tbody.innerHTML = "";
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center hud-muted">No history yet. Analyze or generate a password.</td></tr>`;
      drawHistory(canvas, []);
      return;
    }

    const dtFmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      year: "2-digit",
      month: "short",
      day: "2-digit"
    });

    for (const it of items) {
      const time = dtFmt.format(new Date(it.ts));
      const scoreTxt = ["Very Weak", "Weak", "Weak", "Medium", "Strong", "Ultra"][clamp(it.scoreLevel || 0, 0, 5)];
      const okCount = Object.values(it.checks || {}).filter((x) => x && x.ok).length;

      tbody.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td>${escapeHtml(time)}</td>
          <td><span class="hud-pill ${it.scoreLevel >= 4 ? "ok" : "bad"}">${escapeHtml(scoreTxt)}</span></td>
          <td>${Math.round(it.entropyBits || 0)} bits</td>
          <td>${okCount}/5</td>
        </tr>`
      );
    }

    drawHistory(canvas, items);
  }

  function renderAnalyzer(result) {
    const bar = $("#strengthBar");
    const resultEl = $("#result");
    const level = clamp(result.strengthLevel, 0, 5);

    if (bar) setProgressBar(bar, level);

    if (resultEl) {
      const title = strengthText(level, result.feedback);
      const feedback = result.feedback.length
        ? `<span style='color: rgba(234,246,255,.75); font-size:.9em'>Need: ${escapeHtml(result.feedback.join(", "))}</span>`
        : "";
      const entropy = `<div class="hud-meta">Entropy: <b>${Math.round(result.entropyBits)}</b> bits • Cracks: <b>${escapeHtml(result.crackLabel)}</b></div>`;

      resultEl.innerHTML = `
        <div class="d-flex gap-2 align-items-center">
          <div class="result-icon">🔒</div>
          <div class="result-text">
            <div class="result-title" style="color:${strengthPalette(level)};font-weight:800">${escapeHtml(title)}</div>
            ${feedback}
            ${entropy}
          </div>
        </div>`;
    }
  }

  // ---- Public API for HTML onclick handlers ----
  window.togglePassword = function togglePassword() {
    const input = $("#password");
    const eye = $("#eyeIcon");
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      if (eye) eye.textContent = "🙈";
    } else {
      input.type = "password";
      if (eye) eye.textContent = "👁️";
    }
  };

  window.checkPassword = function checkPassword() {
    const input = $("#password");
    if (!input) return;

    const password = input.value;
    if (!password) {
      resetAnalyzerUI();
      return;
    }

    const enabled = readRuleChecklist();
    const res = evaluatePassword(password, { enabled, minLength: 12 });
    renderAnalyzer(res);

    const copyBtn = $("#copyBtn");
    if (copyBtn) copyBtn.classList.toggle("d-none", !password);

    pushToHistory({
      source: "analyzer",
      password,
      scoreLevel: res.strengthLevel,
      entropyBits: res.entropyBits,
      checks: res.checks
    });
  };

  window.generatePassword = function generatePassword() {
    // legacy analyzer page “Generate” button
    const out = $("#password");
    if (!out) return;

    const password = generatePasswordFromStudio();
    out.value = password;
    window.checkPassword();
  };

  window.generateFromStudio = function generateFromStudio() {
    const out = $("#generatedPassword");
    if (!out) return;

    const password = generatePasswordFromStudio();
    out.value = password;

    const enabled = readRuleChecklist();
    const res = evaluatePassword(password, { enabled, minLength: 12 });

    const fill = $("#genStrengthFill");
    if (fill) {
      const level = clamp(res.strengthLevel, 0, 5);
      fill.style.width = [0, 25, 40, 60, 80, 100][level] + "%";
      fill.style.background = `linear-gradient(90deg, ${strengthPalette(level)} 0%, rgba(34,211,238,1) 55%, rgba(59,130,246,1) 100%)`;
    }

    const badge = $("#genEntropyBadge");
    if (badge) badge.textContent = `${Math.round(res.entropyBits)} bits • ${res.crackLabel}`;

    pushToHistory({
      source: "generator",
      password,
      scoreLevel: res.strengthLevel,
      entropyBits: res.entropyBits,
      checks: res.checks
    });
  };

  window.autoTuneToTarget = function autoTuneToTarget() {
    const len = $("#genLength");
    if (len) len.value = "24";

    const ids = ["#setUpper", "#setLower", "#setDigits", "#setSymbols"];
    ids.forEach((id) => {
      const el = $(id);
      if (el) el.checked = true;
    });

    window.generateFromStudio();
    toast("Target applied");
  };

  window.regenerateAgain = function regenerateAgain() {
    window.generateFromStudio();
  };

  window.copyPassword = async function copyPassword() {
    const input = $("#password");
    if (!input || !input.value) return;

    try {
      await navigator.clipboard.writeText(input.value);
      toast("Copied");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = input.value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copied");
    }
  };

  window.copyGenerated = async function copyGenerated() {
    const inp = $("#generatedPassword");
    if (!inp || !inp.value) return;

    try {
      await navigator.clipboard.writeText(inp.value);
      toast("Copied");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inp.value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copied");
    }
  };

  window.clearHistory = function clearHistory() {
    localStorage.removeItem(LS_KEY);
    renderHistory();
    toast("History cleared");
  };

  window.exportHistory = function exportHistory() {
    const items = loadHistory();
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "passwordchecker-history.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---- Init ----
  function bindAnalyzerInput() {
    const input = $("#password");
    if (!input) return;

    input.addEventListener("input", () => {
      // live update only (don’t push to history repeatedly)
      const password = input.value;
      if (!password) {
        resetAnalyzerUI();
        return;
      }
      const enabled = readRuleChecklist();
      const res = evaluatePassword(password, { enabled, minLength: 12 });
      renderAnalyzer(res);

      // Keep copy button visible while typing
      const copyBtn = $("#copyBtn");
      if (copyBtn) copyBtn.classList.toggle("d-none", !password);

      // Don’t push live typing into history.
    });
  }

  function bindGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;

      if (e.key === "Enter") {
        e.preventDefault();
        window.checkPassword && window.checkPassword();
      }

      if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (window.generateFromStudio) window.generateFromStudio();
        else if (window.generatePassword) window.generatePassword();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        resetAnalyzerUI();
      }
    });
  }

  function init() {
    bindGlobalShortcuts();
    bindAnalyzerInput();

    if (document.getElementById("historyCanvas")) {
      renderHistory();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

