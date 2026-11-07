// DREAM CANVAS — 개인용 AI 그림 생성 스튜디오 (빌드 없이 동작하는 단일 모듈)

const POLL_BASE = 'https://gen.pollinations.ai';
const FALLBACK_POLL_MODELS = [
  { id: 'microsoft/mai-image-2.6', title: 'MAI Image 2.6' },
  { id: 'zimage', title: 'Z-Image Turbo' },
  { id: 'flux', title: 'FLUX.1 Schnell' },
  { id: 'klein', title: 'FLUX.2 Klein 4B' },
];

const STYLES = [
  { id: 'none', label: '그대로', tags: '' },
  { id: 'anime', label: '애니메', tags: 'anime style, cel shading, vibrant colors, detailed eyes, clean lineart, masterpiece, best quality' },
  { id: 'game', label: '게임 캐릭터', tags: 'gacha game character art, official art style, detailed fantasy outfit, intricate accessories, dynamic pose, anime coloring, soft rim lighting, highly detailed, masterpiece, best quality, no text, no watermark' },
  { id: 'illust', label: '일러스트', tags: 'digital illustration, soft lighting, painterly, highly detailed, artstation' },
  { id: 'watercolor', label: '수채화', tags: 'watercolor painting, soft pastel palette, paper texture, delicate brush strokes' },
  { id: 'pixel', label: '픽셀아트', tags: 'pixel art, 16-bit, crisp pixels, limited palette' },
  { id: '3d', label: '3D 캐릭터', tags: '3d render, stylized character, soft global illumination, octane render, cute' },
  { id: 'oil', label: '유화', tags: 'oil painting, thick impasto, rich colors, classical composition' },
  { id: 'cyber', label: '사이버펑크', tags: 'cyberpunk, neon lights, rainy night city, cinematic lighting' },
  { id: 'fantasy', label: '판타지', tags: 'epic fantasy art, magical atmosphere, glowing particles, dramatic sky' },
  { id: 'photo', label: '실사', tags: 'photorealistic, 85mm lens, shallow depth of field, natural light' },
];

const RATIOS = [
  { id: '1:1', w: 1024, h: 1024 },
  { id: '2:3', w: 832, h: 1216 },
  { id: '3:2', w: 1216, h: 832 },
  { id: '9:16', w: 768, h: 1344 },
  { id: '16:9', w: 1344, h: 768 },
];

const DEFAULT_SETTINGS = {
  engine: 'pollinations',
  pollKey: '',
  showPaid: false,
  localUrl: 'http://127.0.0.1:7860',
  localSteps: 25,
  localCfg: 6,
  localSampler: 'Euler a',
};

const $ = (sel) => document.querySelector(sel);
const els = {
  form: $('#genForm'), prompt: $('#prompt'), negative: $('#negative'), negWrap: $('#negWrap'),
  styles: $('#styles'), ratios: $('#ratios'), model: $('#model'), count: $('#count'),
  seed: $('#seed'), clearSeed: $('#clearSeed'), generate: $('#generate'), status: $('#status'),
  current: $('#current'), gallery: $('#gallery'), galleryCount: $('#galleryCount'), clearGallery: $('#clearGallery'),
  enginePill: $('#enginePill'), openSettings: $('#openSettings'),
  settings: $('#settings'), settingsForm: $('#settingsForm'), pollKey: $('#pollKey'), showPaid: $('#showPaid'),
  localUrl: $('#localUrl'), localSteps: $('#localSteps'), localCfg: $('#localCfg'), localSampler: $('#localSampler'),
  testLocal: $('#testLocal'),
  viewer: $('#viewer'), viewerImg: $('#viewerImg'), viewerPrompt: $('#viewerPrompt'), viewerMeta: $('#viewerMeta'),
  viewerDownload: $('#viewerDownload'), viewerReuse: $('#viewerReuse'), viewerDelete: $('#viewerDelete'), viewerClose: $('#viewerClose'),
};

/* ---------- 브라우저 저장소 ---------- */

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 불가 환경 */ }
  },
};

let settings = { ...DEFAULT_SETTINGS, ...store.get('dc.settings', {}) };

// 주소 끝에 #key=sk_... 를 붙여 열면 키를 이 브라우저에 저장하고, 주소창에서는 바로 지워요.
function importKeyFromHash() {
  const m = location.hash.match(/(?:^#|&)key=(sk_[A-Za-z0-9_-]+)/);
  if (!m) return false;
  settings = { ...settings, engine: 'pollinations', pollKey: m[1] };
  store.set('dc.settings', settings);
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}
importKeyFromHash();
const PREFERRED_POLL_MODEL = 'microsoft/mai-image-2.6';
let draft = { style: 'game', ratio: '2:3', model: PREFERRED_POLL_MODEL, count: 4, ...store.get('dc.draft', {}) };
// 기본 모델을 MAI Image 2.6으로 바꾼 업데이트: 예전 기본값을 쓰던 사람도 한 번 옮겨 줘요.
if (!draft.defaultsV2) {
  draft.defaultsV2 = true;
  if (!draft.model || draft.model === 'tongyi-mai/z-image-turbo' || draft.model === 'zimage') draft.model = PREFERRED_POLL_MODEL;
  store.set('dc.draft', draft);
}

const db = (() => {
  let dbp;
  const open = () => dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('dream-canvas', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('images', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const tx = async (mode, fn) => {
    const d = await open();
    return new Promise((resolve, reject) => {
      const t = d.transaction('images', mode);
      const r = fn(t.objectStore('images'));
      t.oncomplete = () => resolve(r?.result);
      t.onerror = () => reject(t.error);
    });
  };
  return {
    all: () => tx('readonly', (s) => s.getAll()).catch(() => []),
    put: (item) => tx('readwrite', (s) => s.put(item)),
    del: (id) => tx('readwrite', (s) => s.delete(id)),
    clear: () => tx('readwrite', (s) => s.clear()),
  };
})();

/* ---------- 엔진 ---------- */

class GenError extends Error {}

const engines = {
  pollinations: {
    name: 'Pollinations',
    async models() {
      const res = await fetch(`${POLL_BASE}/image/models`);
      if (!res.ok) throw new Error('모델 목록을 못 불러왔어요');
      const list = await res.json();
      const usable = list.filter((m) =>
        (m.output_modalities || []).includes('image') &&
        !(m.output_modalities || []).includes('video') &&
        m.health?.status !== 'down' &&
        (settings.showPaid || !m.paid_only));
      usable.sort((a, b) => Number(b.name === PREFERRED_POLL_MODEL) - Number(a.name === PREFERRED_POLL_MODEL) || Number(!!a.community) - Number(!!b.community) || Number(!!a.paid_only) - Number(!!b.paid_only));
      return usable.map((m) => ({
        id: m.name,
        aliases: m.aliases || [],
        title: `${m.title || m.name}${m.paid_only ? ' · 유료' : ''}${m.community ? ' · 커뮤니티' : ''}`,
      }));
    },
    async generate({ prompt, width, height, seed, model }) {
      if (!settings.pollKey.trim()) {
        throw new GenError('설정에서 Pollinations API 키를 먼저 넣어 주세요.');
      }
      const params = new URLSearchParams({ model, width, height, seed, nologo: 'true' });
      const res = await fetch(`${POLL_BASE}/image/${encodeURIComponent(prompt)}?${params}`, {
        headers: { Authorization: `Bearer ${settings.pollKey.trim()}` },
      });
      if (!res.ok) throw new GenError(await describeHttpError(res));
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new GenError('이미지가 아닌 응답이 왔어요.');
      return blob;
    },
  },

  local: {
    name: '내 PC',
    base: () => settings.localUrl.replace(/\/+$/, ''),
    async models() {
      const res = await fetch(`${this.base()}/sdapi/v1/sd-models`);
      if (!res.ok) throw new Error(`WebUI 응답 오류 (${res.status})`);
      const list = await res.json();
      return list.map((m) => ({ id: m.title, aliases: [m.model_name], title: m.model_name || m.title }));
    },
    async generate({ prompt, negative, width, height, seed, model }) {
      const body = {
        prompt, negative_prompt: negative, width, height, seed,
        steps: Number(settings.localSteps) || 25,
        cfg_scale: Number(settings.localCfg) || 6,
        sampler_name: settings.localSampler || 'Euler a',
        batch_size: 1, n_iter: 1,
      };
      if (model) body.override_settings = { sd_model_checkpoint: model };
      let res;
      try {
        res = await fetch(`${this.base()}/sdapi/v1/txt2img`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } catch {
        throw new GenError('내 PC의 WebUI에 연결하지 못했어요. 주소와 --api, --cors-allow-origins 옵션을 확인해 주세요.');
      }
      if (!res.ok) throw new GenError(await describeHttpError(res));
      const data = await res.json();
      const b64 = data.images?.[0];
      if (!b64) throw new GenError('WebUI가 이미지를 돌려주지 않았어요.');
      return base64ToBlob(b64, 'image/png');
    },
  },
};

async function describeHttpError(res) {
  let detail = '';
  try {
    const j = await res.clone().json();
    detail = j?.error?.message || j?.error || j?.detail || j?.message || '';
    if (typeof detail !== 'string') detail = JSON.stringify(detail);
  } catch { /* JSON 아님 */ }
  const map = {
    401: 'API 키가 없거나 잘못됐어요.',
    402: 'Pollen 잔액이 부족해요. 무료 모델인지 확인해 주세요.',
    403: '이 키로는 이 모델을 쓸 수 없어요.',
    429: '요청이 너무 많아요. 잠시 뒤에 다시 해 주세요.',
  };
  const base = map[res.status] || `생성 실패 (${res.status})`;
  return detail ? `${base} — ${detail.slice(0, 160)}` : base;
}

function base64ToBlob(b64, type) {
  const bin = atob(b64.includes(',') ? b64.split(',')[1] : b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/* ---------- 화면 ---------- */

function renderChips(container, items, selected, labelFn, onPick) {
  container.replaceChildren(...items.map((it) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(it.id === selected));
    b.dataset.id = it.id;
    labelFn(b, it);
    b.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c === b)));
      onPick(it.id);
    });
    return b;
  }));
}

function renderControls() {
  renderChips(els.styles, STYLES, draft.style, (b, s) => { b.textContent = s.label; }, (id) => { draft.style = id; saveDraft(); });
  renderChips(els.ratios, RATIOS, draft.ratio, (b, r) => {
    const box = document.createElement('span');
    box.className = 'ratio-box';
    const scale = 14 / Math.max(r.w, r.h);
    box.style.width = `${Math.round(r.w * scale)}px`;
    box.style.height = `${Math.round(r.h * scale)}px`;
    b.append(box, r.id);
  }, (id) => { draft.ratio = id; saveDraft(); });
  els.count.value = String(draft.count);
  els.prompt.value = draft.prompt || '';
  els.negative.value = draft.negative || '';
  updateEngineUi();
}

function updateEngineUi() {
  const eng = engines[settings.engine];
  els.enginePill.textContent = `엔진: ${eng.name}`;
  els.negWrap.querySelector('small').textContent = settings.engine === 'local' ? '(네거티브)' : '(네거티브 · 내 PC 엔진 전용)';
}

let modelLoadToken = 0;
async function loadModels() {
  const token = ++modelLoadToken;
  const eng = engines[settings.engine];
  els.model.replaceChildren(new Option('불러오는 중…', ''));
  let list;
  try {
    list = await eng.models();
    if (!list.length) throw new Error('모델이 없어요');
  } catch (e) {
    if (token !== modelLoadToken) return;
    if (settings.engine === 'pollinations') {
      list = FALLBACK_POLL_MODELS;
    } else {
      els.model.replaceChildren(new Option('WebUI의 현재 모델', ''));
      setStatus(`모델 목록: ${e.message}`, true);
      return;
    }
  }
  if (token !== modelLoadToken) return;
  els.model.replaceChildren(...list.map((m) => new Option(m.title, m.id)));
  const saved = draft.model;
  const match = list.find((m) => m.id === saved || (m.aliases || []).includes(saved));
  const preferred = list.find((m) => m.id === PREFERRED_POLL_MODEL);
  els.model.value = match ? match.id : (preferred || list[0]).id;
}

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle('error', isError);
}

function saveDraft() {
  draft.prompt = els.prompt.value;
  draft.negative = els.negative.value;
  draft.count = Number(els.count.value);
  draft.model = els.model.value || draft.model;
  store.set('dc.draft', draft);
}

/* ---------- 생성 ---------- */

let busy = false;

function buildPrompt(text, styleId) {
  const tags = STYLES.find((s) => s.id === styleId)?.tags;
  return tags ? `${text.trim()}, ${tags}` : text.trim();
}

function randomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

async function generate() {
  if (busy) return;
  const text = els.prompt.value.trim();
  if (!text) { setStatus('그리고 싶은 장면을 먼저 적어 주세요.', true); els.prompt.focus(); return; }
  saveDraft();

  const ratio = RATIOS.find((r) => r.id === draft.ratio) || RATIOS[0];
  const count = Number(els.count.value) || 1;
  const baseSeed = els.seed.value === '' ? null : Number(els.seed.value);
  const job = {
    engine: settings.engine,
    model: els.model.value,
    modelTitle: els.model.selectedOptions[0]?.textContent || '',
    prompt: buildPrompt(text, draft.style),
    userPrompt: text,
    negative: els.negative.value.trim(),
    style: draft.style,
    ratio: ratio.id,
    width: ratio.w,
    height: ratio.h,
  };

  busy = true;
  els.generate.disabled = true;
  els.generate.querySelector('.btn-text').textContent = '그리는 중…';
  setStatus('');

  const tiles = Array.from({ length: count }, () => {
    const t = document.createElement('div');
    t.className = 'tile loading';
    t.style.aspectRatio = `${ratio.w} / ${ratio.h}`;
    const msg = document.createElement('span');
    msg.className = 'tile-msg';
    msg.textContent = '그리는 중…';
    t.append(msg);
    return t;
  });
  els.current.replaceChildren(...tiles);
  if (window.matchMedia('(max-width: 860px)').matches) els.current.scrollIntoView({ behavior: 'smooth', block: 'start' });

  let ok = 0;
  let lastError = '';
  // Pollinations는 2장씩 동시에, 내 PC는 그래픽카드 하나라 1장씩 차례로 그려요.
  const parallel = job.engine === 'pollinations' ? 2 : 1;
  let next = 0;
  let stopped = false;
  const worker = async () => {
    while (!stopped && next < count) {
      const i = next++;
      const seed = baseSeed == null ? randomSeed() : baseSeed + i;
      try {
        const blob = await engines[job.engine].generate({ ...job, seed });
        const item = { ...job, id: crypto.randomUUID(), seed, blob, createdAt: Date.now() + i };
        await db.put(item).catch(() => {});
        tiles[i].replaceWith(makeTile(item));
        ok++;
      } catch (e) {
        lastError = e instanceof GenError ? e.message : `네트워크 오류: ${e.message}`;
        tiles[i].className = 'tile failed';
        tiles[i].querySelector('.tile-msg').textContent = lastError;
        if (e instanceof GenError && /키|잔액|연결/.test(lastError)) {
          stopped = true;
          for (let j = next; j < count; j++) tiles[j].remove();
          next = count;
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallel, count) }, worker));

  busy = false;
  els.generate.disabled = false;
  els.generate.querySelector('.btn-text').textContent = '그리기';
  setStatus(ok ? `${ok}장 완성!${lastError ? ` (일부 실패: ${lastError})` : ''}` : lastError, !ok);
  if (ok) renderGallery();
}

/* ---------- 갤러리 & 뷰어 ---------- */

const urls = new Map();
function urlFor(item) {
  if (!urls.has(item.id)) urls.set(item.id, URL.createObjectURL(item.blob));
  return urls.get(item.id);
}

function makeTile(item) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tile';
  b.style.aspectRatio = `${item.width} / ${item.height}`;
  const img = document.createElement('img');
  img.src = urlFor(item);
  img.alt = item.userPrompt;
  img.loading = 'lazy';
  b.append(img);
  b.addEventListener('click', () => openViewer(item));
  return b;
}

let galleryItems = [];
async function renderGallery() {
  galleryItems = (await db.all()).sort((a, b) => b.createdAt - a.createdAt);
  els.galleryCount.textContent = galleryItems.length ? `${galleryItems.length}장` : '';
  els.clearGallery.hidden = !galleryItems.length;
  if (!galleryItems.length) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.textContent = '그린 그림은 이 브라우저에 자동으로 저장돼요.';
    els.gallery.replaceChildren(e);
    return;
  }
  els.gallery.replaceChildren(...galleryItems.map(makeTile));
}

let viewing = null;
function openViewer(item) {
  viewing = item;
  els.viewerImg.src = urlFor(item);
  els.viewerImg.alt = item.userPrompt;
  els.viewerPrompt.textContent = item.userPrompt;
  const style = STYLES.find((s) => s.id === item.style)?.label || '-';
  const rows = [
    ['엔진', engines[item.engine]?.name || item.engine],
    ['모델', item.modelTitle || item.model || '-'],
    ['그림체', style],
    ['크기', `${item.width}×${item.height}`],
    ['시드', String(item.seed)],
    ['날짜', new Date(item.createdAt).toLocaleString('ko-KR')],
  ];
  if (item.negative) rows.splice(3, 0, ['네거티브', item.negative]);
  els.viewerMeta.replaceChildren(...rows.flatMap(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    return [dt, dd];
  }));
  els.viewer.showModal();
}

function download(item) {
  const ext = item.blob.type.includes('png') ? 'png' : item.blob.type.includes('webp') ? 'webp' : 'jpg';
  // 한글 파일명은 일부 브라우저에서 'download'로 바뀌어서 영문/숫자만 남겨요.
  const d = new Date(item.createdAt);
  const pad = (n) => String(n).padStart(2, '0');
  const slug = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const a = document.createElement('a');
  a.href = urlFor(item);
  a.download = `dreamcanvas_${slug}_${item.seed}.${ext}`;
  // 모달이 열려 있으면 바깥 요소는 비활성(inert)이라 대화상자 안에 붙여요.
  (els.viewer.open ? els.viewer : document.body).append(a);
  a.click();
  a.remove();
}

function reuse(item) {
  els.prompt.value = item.userPrompt;
  els.negative.value = item.negative || '';
  if (item.negative) els.negWrap.open = true;
  els.seed.value = String(item.seed);
  draft.style = item.style;
  draft.ratio = item.ratio;
  draft.model = item.model;
  saveDraft();
  renderControls();
  if (item.engine !== settings.engine) {
    setStatus(`이 그림은 '${engines[item.engine]?.name}' 엔진으로 그렸어요. 같은 결과를 원하면 설정에서 엔진을 바꿔 주세요.`);
  } else {
    const has = [...els.model.options].some((o) => o.value === item.model);
    if (has) els.model.value = item.model;
    setStatus('설정을 불러왔어요. 같은 시드로 다시 그릴 수 있어요.');
  }
  els.viewer.close();
  els.prompt.focus();
}

/* ---------- 설정 ---------- */

function openSettings() {
  els.settingsForm.engine.value = settings.engine;
  els.pollKey.value = settings.pollKey;
  els.showPaid.checked = settings.showPaid;
  els.localUrl.value = settings.localUrl;
  els.localSteps.value = settings.localSteps;
  els.localCfg.value = settings.localCfg;
  els.localSampler.value = settings.localSampler;
  syncEngineFieldsets();
  els.settings.showModal();
}

function syncEngineFieldsets() {
  const eng = els.settingsForm.engine.value;
  els.settingsForm.querySelectorAll('fieldset[data-engine]').forEach((f) => { f.hidden = f.dataset.engine !== eng; });
}

function readSettingsForm() {
  return {
    engine: els.settingsForm.engine.value || 'pollinations',
    pollKey: els.pollKey.value.trim(),
    showPaid: els.showPaid.checked,
    localUrl: els.localUrl.value.trim() || DEFAULT_SETTINGS.localUrl,
    localSteps: Number(els.localSteps.value) || DEFAULT_SETTINGS.localSteps,
    localCfg: Number(els.localCfg.value) || DEFAULT_SETTINGS.localCfg,
    localSampler: els.localSampler.value.trim() || DEFAULT_SETTINGS.localSampler,
  };
}

/* ---------- 이벤트 ---------- */

els.form.addEventListener('submit', (e) => { e.preventDefault(); generate(); });
els.prompt.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); generate(); }
});
['input', 'change'].forEach((ev) => {
  els.prompt.addEventListener(ev, saveDraft);
  els.negative.addEventListener(ev, saveDraft);
});
els.count.addEventListener('change', saveDraft);
els.model.addEventListener('change', saveDraft);
els.clearSeed.addEventListener('click', () => { els.seed.value = ''; setStatus('시드를 랜덤으로 바꿨어요.'); });

els.clearGallery.addEventListener('click', async () => {
  if (!confirm('갤러리의 그림을 모두 지울까요? 되돌릴 수 없어요.')) return;
  await db.clear();
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls.clear();
  renderGallery();
});

els.viewerClose.addEventListener('click', () => els.viewer.close());
els.viewer.addEventListener('click', (e) => { if (e.target === els.viewer) els.viewer.close(); });
els.viewerDownload.addEventListener('click', () => viewing && download(viewing));
els.viewerReuse.addEventListener('click', () => viewing && reuse(viewing));
els.viewerDelete.addEventListener('click', async () => {
  if (!viewing || !confirm('이 그림을 지울까요?')) return;
  await db.del(viewing.id);
  URL.revokeObjectURL(urls.get(viewing.id));
  urls.delete(viewing.id);
  els.viewer.close();
  renderGallery();
});

els.openSettings.addEventListener('click', openSettings);
els.settingsForm.addEventListener('change', (e) => { if (e.target.name === 'engine') syncEngineFieldsets(); });
els.settingsForm.addEventListener('submit', () => {
  const next = readSettingsForm();
  const reloadModels = next.engine !== settings.engine || next.showPaid !== settings.showPaid || next.localUrl !== settings.localUrl;
  settings = next;
  store.set('dc.settings', settings);
  updateEngineUi();
  setStatus('설정을 저장했어요.');
  if (reloadModels) loadModels();
});
els.testLocal.addEventListener('click', async () => {
  const prev = settings;
  settings = { ...settings, ...readSettingsForm() };
  els.testLocal.textContent = '확인 중…';
  try {
    const list = await engines.local.models();
    alert(`연결 성공! 모델 ${list.length}개를 찾았어요.`);
  } catch (e) {
    alert(`연결 실패: ${e.message}\nWebUI를 --api --cors-allow-origins=* 옵션으로 켰는지 확인해 주세요.`);
  } finally {
    settings = prev;
    els.testLocal.textContent = '연결 확인';
  }
});

/* ---------- 시작 ---------- */

// 이미 열린 탭에 키 링크를 붙여 넣은 경우에도 받아 줘요.
window.addEventListener('hashchange', () => {
  if (!importKeyFromHash()) return;
  updateEngineUi();
  loadModels();
  setStatus('API 키를 저장했어요. 바로 그릴 수 있어요.');
});

renderControls();
loadModels();
renderGallery();
if (settings.engine === 'pollinations' && !settings.pollKey) {
  setStatus('처음이라면 오른쪽 위 ⚙ 설정에서 무료 API 키를 넣어 주세요.');
}
