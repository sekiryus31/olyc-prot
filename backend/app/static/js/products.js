document.addEventListener("DOMContentLoaded", () => {
const LIST_ENDPOINT = "/api/v1/products";
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
    const statusEl = document.getElementById("status");
    const tblEl = document.getElementById("tbl");
    const tbodyEl = document.getElementById("tbody");
    const qEl = document.getElementById("q");
    const reloadBtn = document.getElementById("reloadBtn");
    const newBtn = document.getElementById("newBtn");

    // null ガード（id間違いで落ちるのを防ぐ）
    if (!statusEl || !tblEl || !tbodyEl || !qEl || !reloadBtn || !newBtn) {
        console.warn("[product-list] required elements not found");
        return;
    }

    // --- events ---
    reloadBtn.addEventListener("click", () => load());
    newBtn.addEventListener("click", () => {
        // 新規登録画面へ（パスは運用に合わせて調整）
        location.href = "create.html";
    });

    // 入力しながら検索（叩きすぎ防止でデバウンス）
    qEl.addEventListener("input", debounce(() => load(), 250));

    // 初回ロード
    load();

    // =========================
    // main
    // =========================
    async function load() {
        try {
        setStatus("loading", "読み込み中…");
        tblEl.style.display = "none";

        // クエリ組み立て
        const params = new URLSearchParams();
        const q = (qEl.value || "").trim();
        if (q) params.set("q", q);

        const url = `/api/v1/products${params.toString() ? "?" + params.toString() : ""}`;
        console.log(url);

        // common.js に apiFetchJson があるならそれを優先、なければ自前fetch
        const products = await (window.apiFetchJson ? window.apiFetchJson(url) : fetchJson(url));
        console.log(products)
        // const c = await fetchJson(`/api/v1/category/${encodeURIComponent(products.category_id)}`);

        render(products || []);
        tblEl.style.display = "table";
        setStatus("ok", `OK（${(products || []).length}件）`);
        } catch (e) {
            console.error(e);
            setStatus("error", `取得に失敗：${e.message || e}`);
            tbodyEl.innerHTML = "";
            tblEl.style.display = "none";
        }
    }

    function render(products) {
        // 試作品なので「表示項目が無い時はIDなどで埋める」方針
        tbodyEl.innerHTML = products.map(p => {
        const id = p.id;
        const code = p.code || "";
        const name = p.name || "";

        const categoryText =
            p.category_name ?? (p.n ? `${p.n}` : "—");

        const hotelText =
            p.hotel_name ?? (p.hotel_id ? `#${p.hotel_id}` : "共通");

        const priceText = formatYen(p.price);
        const updatedText = formatDateTime(p.updated_at);

        // 行クリックで詳細へ（HTMLが「クリックで詳細へ」なので a ではなく tr クリックに寄せる）
        return `
            <tr class="clickable" data-id="${escapeHtml(id)}">
            <td>${escapeHtml(id)}</td>
            <td>${escapeHtml(code)}</td>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(categoryText)}</td>
            <td class="num">${escapeHtml(priceText)}</td>
            <td>${escapeHtml(hotelText)}</td>
            <td>${escapeHtml(updatedText)}</td>
            </tr>
        `;
        }).join("");

        // 行クリックイベント（tbodyに委譲）
        tbodyEl.onclick = (ev) => {
        const tr = ev.target.closest("tr[data-id]");
        if (!tr) return;
        const id = tr.getAttribute("data-id");
        if (!id) return;
        location.href = `detail.html?id=${encodeURIComponent(id)}`;
        };
    }

    // =========================
    // utils
    // =========================
    function setStatus(kind, text) {
        statusEl.className = kind || "";
        statusEl.textContent = text || "";
    }

    async function fetchJson(url) {
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) {
        // できるだけデバッグしやすいように本文も拾う
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? " / " + body : ""}`);
        }
        return await res.json();
    }

    function escapeHtml(v) {
        return String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function formatYen(value) {
        if (value === null || value === undefined || value === "") return "";
        // DB/JSON で "1200.00" 文字列の場合もあるので Number へ
        const n = Number(value);
        if (Number.isNaN(n)) return String(value);
        return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
    }

    function formatDateTime(iso) {
        if (!iso) return "";
        // "2025-12-22T16:00:00" → "2025-12-22 16:00:00"
        return String(iso).replace("T", " ").slice(0, 19);
    }

    function debounce(fn, delayMs) {
        let t = null;
        return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delayMs);
        };
    }
}


// 新規登録画面
  function initNew() {
    const statusEl = document.getElementById("status");
    const backBtn = document.getElementById("backBtn");
    const saveBtn = document.getElementById("saveBtn");

    const codeEl = document.getElementById("code");
    const nameEl = document.getElementById("name");
    const categoryEl = document.getElementById("category_id");
    const priceEl = document.getElementById("price");
    const hotelEl = document.getElementById("hotel_id");
    const descEl = document.getElementById("description");

    if (!statusEl || !backBtn || !saveBtn || !codeEl || !nameEl || !categoryEl || !priceEl || !hotelEl || !descEl) {
        console.warn("[product-new] required elements not found");
        return;
    }

    backBtn.addEventListener("click", () => {
        location.href = "list.html";
    });

    saveBtn.addEventListener("click", async () => {
        await save();
    });

    // 初期データ（カテゴリ/ホテル）
    loadMasters();

    async function loadMasters() {
        try {
        setStatus("loading", "マスタ読込中…");

        const [categories, hotels] = await Promise.all([
            fetchJson("/api/v1/category"),
            fetchJson("/api/v1/hotels"),
        ]);

        renderCategoryOptions(categories || []);
        renderHotelOptions(hotels || []);

        setStatus("ok", "OK");
        } catch (e) {
        console.error(e);
        setStatus("error", `マスタ取得に失敗：${e.message || e}`);
        }
    }

    async function save() {
        try {
            const name = (nameEl.value || "").trim();
            const priceRaw = (priceEl.value || "").trim();

            if (!name) {
                setStatus("error", "商品名は必須です");
                nameEl.focus();
                return;
            }
            if (!priceRaw) {
                setStatus("error", "価格は必須です");
                priceEl.focus();
                return;
            }

            setStatus("loading", "登録中…");
            saveBtn.disabled = true;

            const payload = {
                code: (codeEl.value || "").trim() || null,
                name,
                category_id: categoryEl.value ? Number(categoryEl.value) : null,
                price: Number(priceRaw), // FastAPI側で Decimal に受けられる（"1200.00" でもOK）
                hotel_id: hotelEl.value ? Number(hotelEl.value) : null,
                description: (descEl.value || "").trim() || null,
            };

            const body = compact(payload);
            console.log(body);

            const created = await postJson("/api/v1/products", body);

            setStatus("ok", `登録しました（ID: ${created.id}）`);
            // 登録後は詳細へ飛ぶのが気持ちいい
            location.href = `detail.html?id=${encodeURIComponent(created.id)}`;

        } catch (e) {
            console.error(e);
            setStatus("error", `登録に失敗：${e.message || e}`);
        } finally {
            saveBtn.disabled = false;
        }
    }

    function renderCategoryOptions(categories) {
        // 先頭（未指定）を残して作り直し
        categoryEl.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());

        categories.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.code ?? ""} ${c.name ?? ""}`.trim() || `#${c.id}`;
        categoryEl.appendChild(opt);
        });
    }

    function renderHotelOptions(hotels) {
        hotelEl.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());

        hotels.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h.id;
        opt.textContent = `${h.code ?? ""} ${h.name ?? ""}`.trim() || `#${h.id}`;
        hotelEl.appendChild(opt);
        });
    }

    function setStatus(kind, text) {
        statusEl.className = kind || "";
        statusEl.textContent = text || "";
    }

    async function fetchJson(url) {
        // common.js に apiFetchJson があるなら優先
        if (window.apiFetchJson) return await window.apiFetchJson(url);

        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${t ? " / " + t : ""}`);
        }
        return await res.json();
    }

    async function postJson(url, body) {
        if (window.apiPostJson) return await window.apiPostJson(url, body);

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${t ? " / " + t : ""}`);
        }
        return await res.json();
    }

    function compact(obj) {
        // null/undefined/"" を取り除く（price/name は必須なので残る）
        const out = {};
        Object.keys(obj).forEach(k => {
        const v = obj[k];
        if (v === null || v === undefined || v === "") return;
        out[k] = v;
        });
        return out;
    }
    }




// 詳細画面
  function initDetail() {
    const statusEl = document.getElementById("status");

    const backBtn = document.getElementById("backBtn");
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    // kv 値表示エリア
    const vId = document.getElementById("v_id");
    const vCode = document.getElementById("v_code");
    const vName = document.getElementById("v_name");
    const vCategory = document.getElementById("v_category");
    const vPrice = document.getElementById("v_price");
    const vHotel = document.getElementById("v_hotel");
    const vDesc = document.getElementById("v_description");
    const vCreatedAt = document.getElementById("v_created_at");
    const vUpdatedAt = document.getElementById("v_updated_at");

    // nullガード（idミスで落ちるのを防ぐ）
    if (
        !statusEl || !backBtn || !editBtn || !deleteBtn ||
        !vId || !vCode || !vName || !vCategory || !vPrice || !vHotel ||
        !vDesc || !vCreatedAt || !vUpdatedAt
    ) {
        console.warn("[product-detail] required elements not found");
        return;
    }

    const productId = getIdFromQuery();
    if (!productId) {
        setStatus("error", "ID が指定されていません（?id=xxx）");
        return;
    }

    // --- events ---
    backBtn.addEventListener("click", () => {
        location.href = "list.html";
    });

    editBtn.addEventListener("click", () => {
        location.href = `edit.html?id=${encodeURIComponent(productId)}`;
    });

    deleteBtn.addEventListener("click", async () => {
        if (!confirm("削除しますか？（論理削除）")) return;

        try {
        setStatus("loading", "削除中…");
        deleteBtn.disabled = true;

        await deleteJson(`/api/v1/products/${encodeURIComponent(productId)}`);

        setStatus("ok", "削除しました。一覧へ戻ります…");
        location.href = "list.html";
        } catch (e) {
        console.error(e);
        setStatus("error", `削除に失敗：${e.message || e}`);
        } finally {
        deleteBtn.disabled = false;
        }
    });

    // 初回ロード
    load();

    // =========================
    // main
    // =========================
    async function load() {
        try {
        setStatus("loading", "読み込み中…");

        const p = await fetchJson(`/api/v1/products/${encodeURIComponent(productId)}`);
        const c = await fetchJson(`/api/v1/category/${encodeURIComponent(p.category_id)}`);
        console.log(c);
        render(p, c);

        setStatus("ok", "OK");
        } catch (e) {
        console.error(e);
        setStatus("error", `取得に失敗：${e.message || e}`);
        }
    }

    function render(p, c) {
        // 返ってくる形に応じて「名前が無い場合はID表示」で逃がす（試作品）
        const categoryText =
        p.category_name ?? (c.name ? `#${c.name}` : "—");
        console.log(c);
        const hotelText =
        p.hotel_name ?? (p.hotel_id ? `#${p.hotel_id}` : "共通");

        vId.textContent = safeText(p.id, "-");
        vCode.textContent = safeText(p.code, "—");
        vName.textContent = safeText(p.name, "—");
        vCategory.textContent = safeText(categoryText, "—");
        vPrice.textContent = safeText(formatYen(p.price), "—");
        vHotel.textContent = safeText(hotelText, "—");
        vDesc.textContent = safeText(p.description, "—");
        vCreatedAt.textContent = safeText(formatDateTime(p.created_at), "—");
        vUpdatedAt.textContent = safeText(formatDateTime(p.updated_at), "—");
    }

    // =========================
    // utils
    // =========================
    function setStatus(kind, text) {
        statusEl.className = kind || "";
        statusEl.textContent = text || "";
    }

    function getIdFromQuery() {
        const sp = new URLSearchParams(location.search);
        return sp.get("id");
    }

    function safeText(v, fallback = "—") {
        if (v === null || v === undefined || v === "") return fallback;
        return String(v);
    }

    // --- HTTP helpers（common.js にあればそれを優先） ---
    async function fetchJson(url) {
        if (window.apiFetchJson) return await window.apiFetchJson(url);

        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${t ? " / " + t : ""}`);
        }
        return await res.json();
    }

    async function deleteJson(url) {
        if (window.apiDeleteJson) return await window.apiDeleteJson(url);

        const res = await fetch(url, { method: "DELETE", headers: { "Accept": "application/json" } });
        if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${t ? " / " + t : ""}`);
        }

        // {ok:true} でも空でも良い
        const txt = await res.text().catch(() => "");
        return txt ? JSON.parse(txt) : { ok: true };
    }

    function formatDateTime(iso) {
        if (!iso) return "";
        return String(iso).replace("T", " ").slice(0, 19);
    }

    function formatYen(value) {
        if (value === null || value === undefined || value === "") return "";
        const n = Number(value);
        if (Number.isNaN(n)) return String(value);
        return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
    }
  }



  // 編集画面
  function initEdit() {
    const statusEl = document.getElementById("status");
    const backBtn = document.getElementById("backBtn");
    const saveBtn = document.getElementById("saveBtn");

    const vId = document.getElementById("v_id");

    const codeEl = document.getElementById("code");
    const nameEl = document.getElementById("name");
    const categoryEl = document.getElementById("category_id");
    const priceEl = document.getElementById("price");
    const hotelEl = document.getElementById("hotel_id");
    const descEl = document.getElementById("description");

    if (!statusEl || !backBtn || !saveBtn || !vId ||
        !codeEl || !nameEl || !categoryEl || !priceEl || !hotelEl || !descEl) {
        console.warn("[product-edit] required elements not found");
        return;
    }

    const productId = getIdFromQuery();
    if (!productId) {
        setStatus("error", "ID が指定されていません（?id=xxx）");
        return;
    }

    backBtn.addEventListener("click", () => {
        location.href = `./detail.html?id=${encodeURIComponent(productId)}`;
    });

    saveBtn.addEventListener("click", async () => {
        await save();
    });

    // 初期ロード（マスタ→詳細）
    loadAll();

    async function loadAll() {
        try {
        setStatus("loading", "読み込み中…");

        // ※あなたの実装に合わせて必要ならURL変更
        const [categories, hotels] = await Promise.all([
            fetchJson("/api/v1/category"), // ←違ったら変更
            fetchJson("/api/v1/hotels"),            // ←違ったら変更
        ]);

        renderCategoryOptions(categories || []);
        renderHotelOptions(hotels || []);

        const p = await fetchJson(`/api/v1/products/${encodeURIComponent(productId)}`);
        fill(p);

        setStatus("ok", "OK");
        } catch (e) {
        console.error(e);
        setStatus("error", `取得に失敗：${e.message || e}`);
        }
    }

    function fill(p) {
        vId.textContent = safeText(p.id, "-");

        codeEl.value = p.code ?? "";
        nameEl.value = p.name ?? "";
        priceEl.value = p.price ?? "";

        categoryEl.value = p.category_id ?? "";
        hotelEl.value = p.hotel_id ?? "";

        descEl.value = p.description ?? "";
    }

    async function save() {
        try {
        const name = (nameEl.value || "").trim();
        const priceRaw = (priceEl.value || "").trim();

        if (!name) {
            setStatus("error", "商品名は必須です");
            nameEl.focus();
            return;
        }
        if (!priceRaw) {
            setStatus("error", "価格は必須です");
            priceEl.focus();
            return;
        }

        setStatus("loading", "保存中…");
        saveBtn.disabled = true;

        const payload = compact({
            // 空文字は null に寄せて「未指定」にできるようにする
            code: (codeEl.value || "").trim() || null,
            name,
            category_id: categoryEl.value ? Number(categoryEl.value) : null,
            price: Number(priceRaw),
            hotel_id: hotelEl.value ? Number(hotelEl.value) : null,
            description: (descEl.value || "").trim() || null,
        });

        const updated = await putJson(
            `/api/v1/products/${encodeURIComponent(productId)}`,
            payload
        );

        fill(updated);
        setStatus("ok", "保存しました");
        setTimeout(() => {
            location.href = `detail.html?id=${encodeURIComponent(updated.id)}`;
        }, 300);
        } catch (e) {
            console.error(e);
            setStatus("error", `保存に失敗：${e.message || e}`);
        } finally {
            saveBtn.disabled = false;
        }
        
    }

    function renderCategoryOptions(categories) {
        categoryEl.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());
        categories.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.code ?? ""} ${c.name ?? ""}`.trim() || `#${c.id}`;
        categoryEl.appendChild(opt);
        });
    }

    function renderHotelOptions(hotels) {
        hotelEl.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());
        hotels.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h.id;
        opt.textContent = `${h.code ?? ""} ${h.name ?? ""}`.trim() || `#${h.id}`;
        hotelEl.appendChild(opt);
        });
    }

    function setStatus(kind, text) {
        statusEl.className = kind || "";
        statusEl.textContent = text || "";
    }

    function getIdFromQuery() {
        const sp = new URLSearchParams(location.search);
        return sp.get("id");
    }

    function safeText(v, fallback = "—") {
        if (v === null || v === undefined || v === "") return fallback;
        return String(v);
    }

    // --- HTTP helpers（common.js があればそれを優先） ---
    async function fetchJson(url) {
        if (window.apiFetchJson) return await window.apiFetchJson(url);

        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${t ? " / " + t : ""}`);
        }
        return await res.json();
    }

    async function putJson(url, body) {
        if (window.apiPutJson) return await window.apiPutJson(url, body);

        const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body),
        });

        if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${t ? " / " + t : ""}`);
        }
        return await res.json();
    }

    function compact(obj) {
        const out = {};
        Object.keys(obj).forEach(k => {
        const v = obj[k];
        if (v === null || v === undefined || v === "") return;
        out[k] = v;
        });
        return out;
    }
  }




  // 動かすメソッド選定
  const page = document.body.dataset.page;

  switch (page) {
    case "product-list":
      initIndex();
      break;
    case "product-new":
      initNew();
      break;
    case "product-detail":
      initDetail();
      break;
    case "product-edit":
      initEdit();
      break;
    default:
      console.warn("Unknown page:", page);
  }
});


