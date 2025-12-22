document.addEventListener("DOMContentLoaded", () => {
const LIST_ENDPOINT = "/api/v1/category";
const API_BASE = "/api/v1";

  // ============================================================
  // 共通 util
  // ============================================================
  function setStatus(el, msg, cls = "") {
    if (!el) return;
    el.className = cls || "";
    el.textContent = msg || "";
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
    const method = (options.method || "GET").toUpperCase();

    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;

    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
    });

    // ★ bodyは一回だけ読む
    const raw = await res.text();

    // raw が JSON っぽいなら parse（空なら null）
    const data = raw ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : null;

    if (!res.ok) {
      // FastAPIなら detail を優先して見せる
      const detail =
        (data && typeof data === "object" && "detail" in data) ? JSON.stringify(data.detail)
        : (raw || `${res.status} ${res.statusText}`);

      throw new Error(`${res.status} ${res.statusText}: ${detail}`);
    }

    return data;
  }



  // ============================================================
  // 一覧画面
  // 必須: q, reloadBtn, newBtn, status, tbl, tbody
  // ============================================================
  function initIndex() {
    const qEl = document.getElementById("q");
    const reloadBtn = document.getElementById("reloadBtn");
    const newBtn = document.getElementById("newBtn");

    const statusEl = document.getElementById("status");
    const tblEl = document.getElementById("tbl");
    const tbodyEl = document.getElementById("tbody");

    // 必須DOMが揃ってなければこの画面ではない
    if (!qEl || !reloadBtn || !newBtn || !statusEl || !tblEl || !tbodyEl) return false;

    let categories = [];

    function render(list) {
      const q = (qEl.value || "").trim().toLowerCase();

      const filtered = list.filter(c => {
        const code = (c.code || "").toLowerCase();
        const name = (c.name || "").toLowerCase();
        return !q || code.includes(q) || name.includes(q);
      });

      tbodyEl.innerHTML = filtered.map(c => {
        const detailUrl = `detail.html?id=${encodeURIComponent(c.id)}`;
        return `
          <tr data-href="${detailUrl}" style="cursor:pointer;">
            <td>${escapeHtml(c.id)}</td>
            <td>${escapeHtml(c.sort_order ?? 0)}</td>
            <td>${escapeHtml(c.code)}</td>
            <td>${escapeHtml(c.name)}</td>
          </tr>
        `;
      }).join("");

      // 行クリックで詳細へ
      tbodyEl.querySelectorAll("tr[data-href]").forEach(tr => {
        tr.addEventListener("click", () => {
          location.href = tr.dataset.href;
        });
      });

      // 表の表示制御
      tblEl.style.display = filtered.length ? "" : "none";
      setStatus(statusEl, `表示 ${filtered.length} 件 / 全 ${list.length} 件`, "ok");
    }

    async function loadCategories() {
      setStatus(statusEl, "読み込み中...", "loading");
      tblEl.style.display = "none";

      try {
        categories = await api("/category");
        categories.sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id ?? 0) - (b.id ?? 0)
        );
        render(categories);
      } catch (e) {
        console.error(e);
        setStatus(statusEl, e.message, "error");
      }
    }

    function goNew() {
      location.href = "create.html";
    }

    // events
    qEl.addEventListener("input", () => render(categories));
    reloadBtn.addEventListener("click", loadCategories);
    newBtn.addEventListener("click", goNew);

    // init
    loadCategories();
    return true;
  }





  // ============================================================
  // 新規登録画面
  // 必須: frm, saveBtn, backBtn, code, name, sortOrder, status
  // ============================================================
  function initNew() {
    const frm = document.getElementById("frm");
    const saveBtn = document.getElementById("saveBtn");
    const backBtn = document.getElementById("backBtn");

    const codeEl = document.getElementById("code");
    const nameEl = document.getElementById("name");
    const sortOrderEl = document.getElementById("sortOrder");

    const statusEl = document.getElementById("status");

    // 必須DOMが揃ってなければこの画面ではない
    if (!frm || !saveBtn || !backBtn || !codeEl || !nameEl || !sortOrderEl || !statusEl) return false;

    function goBack() {
      location.href = "list.html";
    }

    async function save() {
      const code = (codeEl.value || "").trim();
      const name = (nameEl.value || "").trim();
      const sort_order_raw = (sortOrderEl.value || "").trim();

      if (!code) return alert("コードは必須です");
      if (!name) return alert("カテゴリ名は必須です");

      const payload = {
        code,
        name,
        sort_order: sort_order_raw === "" ? 0 : Number(sort_order_raw),
      };

      setStatus(statusEl, "保存中...", "loading");

      try {
        await api("/category", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setStatus(statusEl, "登録しました", "ok");
        alert("新規登録しました");
        location.href = "list.html";
      } catch (e) {
        console.error(e);
        setStatus(statusEl, e.message, "error");
        alert(e.message);
      }
    }

    backBtn.addEventListener("click", goBack);
    saveBtn.addEventListener("click", save);

    // Enter（フォーム送信）でも保存
    frm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      save();
    });

    // 初期
    setStatus(statusEl, "", "");
    return true;
  }


  // ===== 共通：URLから id を取る =====
  function getIdFromQuery() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    return id ? String(id) : null;
  }


  // ============================================================
  // 詳細画面
  // 必須: frm, saveBtn, backBtn, code, name, sortOrder, status
  // ============================================================
  function initDetail() {
    const statusEl = document.getElementById("status");

    // 表示用DOM（span/div など textContent に入れる想定）
    const vId = document.getElementById("id");
    const vCode = document.getElementById("code");
    const vName = document.getElementById("name");
    const vSortOrder = document.getElementById("sort_order");
    const vDeleteFlag = document.getElementById("delete_flag");

    const reloadBtn = document.getElementById("reloadBtn");
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id) {
      statusEl.className = "error";
      statusEl.textContent = "ID が指定されていません（URLに ?id=... が必要）";
      return;
    }

    // config.js で定義しておく（例： const LIST_ENDPOINT = "http://127.0.0.1:8000/api/v1/category";）
    if (typeof LIST_ENDPOINT === "undefined") {
      statusEl.className = "error";
      statusEl.textContent = "LIST_ENDPOINT が未定義です（config.js を確認）";
      return;
    }

    if (reloadBtn) reloadBtn.addEventListener("click", loadDetail);

    // 編集ボタン（edit.html に飛ばす）
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        location.href = `edit.html?id=${encodeURIComponent(id)}`;
      });
    }

    // 削除ボタン
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        console.log(`${API_BASE}/category/${id}`)
        if (!id) {
            alert("ID が指定されていません。");
            return;
          }

          const ok = confirm("このカテゴリを削除します。よろしいですか？\n（商品に使用中の場合は削除できません）");
          if (!ok) return;

          try {
            const res = await fetch(`${API_BASE}/category/${id}`, {
              method: "DELETE",
            });

            // if (res.status === 409) {
            //   const data = await res.json().catch(() => ({}));
            //   alert(`削除できません：${data.detail ?? "このカテゴリは使用中です"}`);
            //   return;
            // }

            if (!res.ok) {
              const t = await res.text();
              throw new Error(`DELETE failed: ${res.status} ${t}`);
            }

            alert("削除しました");
            // ✅ 一覧に戻す（あなたのURLに合わせて）
            location.href = "list.html";
          } catch (e) {
            console.error(e);
            alert("削除に失敗しました");
          }
      });
    }

    async function loadDetail() {
      statusEl.className = "loading";
      statusEl.textContent = "読み込み中…";

      try {
        // 末尾の / を除去してから /{id} を付ける（ダブルスラッシュ事故防止）
        const base = LIST_ENDPOINT.replace(/\/+$/, "");
        const url = `${base}/${encodeURIComponent(id)}`;

        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const c = await res.json();

        // 表示反映
        vId.textContent = c.id ?? "-";
        vCode.textContent = c.code ?? "";
        vName.textContent = c.name ?? "";
        vSortOrder.textContent = (c.sort_order ?? 0);
        vDeleteFlag.textContent = (c.delete_flag ?? 0);

        statusEl.className = "";
        statusEl.textContent = "取得OK";
      } catch (err) {
        statusEl.className = "error";
        statusEl.textContent = `取得に失敗：${err.message}`;
      }

    }


    // ===== 初期ロード =====
    loadDetail();
    if (reloadBtn) reloadBtn.addEventListener("click", loadDetail);
    return true; // ← 重要：このページの init は成功した

  }


  // ============================================================
  // 編集画面
  // ============================================================
  function initEdit() {
    const API_BASE = "";

    const qs = new URLSearchParams(location.search);
    const categoryId = qs.get("id");

    const nameEl = document.getElementById("name");
    const sortEl = document.getElementById("sort_order");
    const msgEl = document.getElementById("status");
    const form = document.getElementById("form");

    function showMsg(text, isError=false) {
      msgEl.textContent = text;
      msgEl.style.color = isError ? "#c00" : "#0a0";
    }

    async function loadCategory() {
      if (!categoryId) {
        showMsg("id が指定されていません", true);
        form.querySelector("button[type=submit]").disabled = true;
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/v1/category/${categoryId}`);
        if (!res.ok) throw new Error(`GET failed: ${res.status}`);
        const data = await res.json();
        nameEl.value = data.name ?? "";
        sortEl.value = (data.sort_order ?? "");
        showMsg("読み込みOK");
      } catch (e) {
        console.error(e);
        showMsg("カテゴリの読み込みに失敗しました", true);
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!categoryId) return;

      const payload = {
        name: nameEl.value.trim(),
        // 空なら送らない（DBのNULL許可ならnullでもOK）
        sort_order: sortEl.value === "" ? null : Number(sortEl.value),
      };

      try {
        const res = await fetch(`${API_BASE}/api/v1/category/${categoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`PUT failed: ${res.status} ${t}`);
        }
        await res.json();
        showMsg("保存しました！");
      } catch (e) {
        console.error(e);
        showMsg("保存に失敗しました", true);
      }
    });

    document.getElementById("backBtn").addEventListener("click", () => {
      history.back();
    });

    loadCategory();
  }



  // 動かすメソッド選定
  const page = document.body.dataset.page;

  switch (page) {
    case "category-list":
      initIndex();
      break;
    case "category-new":
      initNew();
      break;
    case "category-detail":
      initDetail();
      break;
    case "category-edit":
      initEdit();
      break;
    default:
      console.warn("Unknown page:", page);
  }
});


