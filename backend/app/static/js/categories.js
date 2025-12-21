const API_BASE = "/api/v1"; // 必要なら "http://localhost:8000/api/v1" に変更

const qEl = document.getElementById("q");
const statusEl = document.getElementById("status");
const tbodyEl = document.getElementById("tbody");

const codeEl = document.getElementById("code");
const nameEl = document.getElementById("name");
const sortOrderEl = document.getElementById("sort_order");

const reloadBtn = document.getElementById("reload-btn");
const createBtn = document.getElementById("create-btn");

let categories = [];

function setStatus(text, kind = "") {
  statusEl.className = "status " + kind;
  statusEl.textContent = text || "";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // 失敗はここでまとめて投げる
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail ? JSON.stringify(data.detail) : JSON.stringify(data);
    } catch {
      detail = await res.text();
    }
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }

  // DELETE などで body なしの可能性を考慮
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function render(list) {
  const q = (qEl.value || "").trim().toLowerCase();

  const filtered = list.filter(c => {
    const code = (c.code || "").toLowerCase();
    const name = (c.name || "").toLowerCase();
    return !q || code.includes(q) || name.includes(q);
  });

  tbodyEl.innerHTML = filtered.map(c => {
    const detailUrl = `./detail.html?id=${encodeURIComponent(c.id)}`;
    return `
      <tr>
        <td>${escapeHtml(c.id)}</td>
        <td>${escapeHtml(c.sort_order ?? "")}</td>
        <td><span class="badge">${escapeHtml(c.code)}</span></td>
        <td><a href="${detailUrl}">${escapeHtml(c.name)}</a></td>
        <td><a href="${detailUrl}">編集</a></td>
      </tr>
    `;
  }).join("");

  setStatus(`表示 ${filtered.length} 件 / 全 ${list.length} 件`, "ok");
}

async function loadCategories() {
  setStatus("読み込み中…", "loading");
  try {
    categories = await api("/product-categories");
    // sort_order → id の順に並べたい場合はフロントでも補強
    categories.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    render(categories);
  } catch (e) {
    console.error(e);
    setStatus(e.message, "error");
  }
}

async function createCategory() {
  const code = (codeEl.value || "").trim();
  const name = (nameEl.value || "").trim();
  const sort_order_raw = (sortOrderEl.value || "").trim();

  if (!code) return alert("code は必須です");
  if (!name) return alert("name は必須です");

  const payload = {
    code,
    name,
    sort_order: sort_order_raw === "" ? 0 : Number(sort_order_raw),
  };

  setStatus("作成中…", "loading");
  try {
    await api("/product-categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // 入力をクリア
    codeEl.value = "";
    nameEl.value = "";
    sortOrderEl.value = "";

    await loadCategories();
    setStatus("作成しました", "ok");
  } catch (e) {
    console.error(e);
    setStatus(e.message, "error");
    alert(e.message);
  }
}

qEl.addEventListener("input", () => render(categories));
reloadBtn.addEventListener("click", loadCategories);
createBtn.addEventListener("click", createCategory);

// 初期ロード
loadCategories();




// product-categories/detail.js
const API_BASE = "/api/v1";

const statusEl = document.getElementById("status");

const idEl = document.getElementById("id");
const codeEl = document.getElementById("code");
const nameEl = document.getElementById("name");
const sortOrderEl = document.getElementById("sort_order");

const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");

function setStatus(text, kind = "") {
  statusEl.className = "status " + kind;
  statusEl.textContent = text || "";
}

function getIdFromQuery() {
  const params = new URLSearchParams(location.search);
  const v = params.get("id");
  return v ? Number(v) : null;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail ? JSON.stringify(data.detail) : JSON.stringify(data);
    } catch {
      detail = await res.text();
    }
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

let categoryId = getIdFromQuery();
if (!categoryId) {
  alert("ID が指定されていません");
  location.href = "./index.html";
}

async function load() {
  setStatus("読み込み中…", "loading");
  try {
    // 一覧APIに get(id) が無い前提なので、一覧から拾う方式
    // もし GET /product-categories/{id} を作ってるなら、そっちの方が綺麗。
    const list = await api("/product-categories");
    const c = list.find(x => Number(x.id) === Number(categoryId));
    if (!c) throw new Error("Category not found");

    idEl.value = c.id ?? "";
    codeEl.value = c.code ?? "";
    nameEl.value = c.name ?? "";
    sortOrderEl.value = c.sort_order ?? 0;

    setStatus("読み込み完了", "ok");
  } catch (e) {
    console.error(e);
    setStatus(e.message, "error");
    alert(e.message);
  }
}

async function save() {
  const code = (codeEl.value || "").trim();
  const name = (nameEl.value || "").trim();
  const sort_order = Number((sortOrderEl.value || "0").trim() || "0");

  if (!code) return alert("code は必須です");
  if (!name) return alert("name は必須です");

  setStatus("保存中…", "loading");
  try {
    await api(`/product-categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify({ code, name, sort_order }),
    });
    setStatus("保存しました", "ok");
  } catch (e) {
    console.error(e);
    setStatus(e.message, "error");
    alert(e.message);
  }
}

async function del() {
  if (!confirm("削除（非表示）しますか？\n※ delete_flag=1 になる想定")) return;

  setStatus("削除中…", "loading");
  try {
    await api(`/product-categories/${categoryId}`, { method: "DELETE" });
    setStatus("削除しました", "ok");
    location.href = "./index.html";
  } catch (e) {
    console.error(e);
    setStatus(e.message, "error");
    alert(e.message);
  }
}

saveBtn.addEventListener("click", save);
deleteBtn.addEventListener("click", del);

load();
