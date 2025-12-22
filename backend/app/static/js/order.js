// static/js/app_common.js
const API_BASE = "http://127.0.0.1:8000/api/v1";


document.addEventListener("DOMContentLoaded", () => {
  function qs(id) {
    return document.getElementById(id);
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function toIsoFromDatetimeLocal(value) {
    // "2025-12-25T10:00" -> "2025-12-25T10:00:00"（ブラウザ依存を吸収）
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString(); // backendがDateTimeならISOで渡すのが安全
  }

  function fmtDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = j.detail ? JSON.stringify(j.detail) : JSON.stringify(j);
      } catch (e) {
        detail = await res.text();
      }
      throw new Error(`HTTP ${res.status}: ${detail}`);
    }
    // 204 は body なし
    if (res.status === 204) return null;
    return await res.json();
  }



  // ============================================================
  // 一覧画面
  // ============================================================
  function initIndex() {
    const statusText = qs("status-text");
    const tbody = qs("tbody");

    const hotelIdEl = qs("hotel_id");
    const roomNoEl = qs("room_no");
    const statusEl = qs("status");

    qs("search-btn").addEventListener("click", load);
    qs("reset-btn").addEventListener("click", () => {
      hotelIdEl.value = "";
      roomNoEl.value = "";
      statusEl.value = "";
      load();
    });

    load();

    async function load() {
      try {
        statusText.className = "status loading";
        statusText.textContent = "読み込み中...";

        const params = new URLSearchParams();
        if (hotelIdEl.value) params.set("hotel_id", hotelIdEl.value);
        if (roomNoEl.value) params.set("room_no", roomNoEl.value);
        if (statusEl.value) params.set("status", statusEl.value);

        const q = params.toString() ? `?${params.toString()}` : "";
        const orders = await apiFetch(`/orders${q}`);

        tbody.innerHTML = (orders || []).map(o => {
          const detailUrl = `./detail.html?id=${encodeURIComponent(o.id)}`;
          return `
            <tr>
              <td>${escapeHtml(String(o.id))}</td>
              <td><a href="${detailUrl}">${escapeHtml(o.order_no || "")}</a></td>
              <td>${escapeHtml(o.room_no || "")}</td>
              <td>${escapeHtml(o.status || "")}</td>
              <td>${escapeHtml(String(o.total_amount ?? ""))}</td>
              <td>${escapeHtml(fmtDateTime(o.created_at))}</td>
            </tr>
          `;
        }).join("");

        statusText.className = "status ok";
        statusText.textContent = `取得件数: ${(orders || []).length}`;
      } catch (e) {
        statusText.className = "status ng";
        statusText.textContent = `取得に失敗：${e.message}`;
        tbody.innerHTML = "";
      }
    }
  }





  // ============================================================
  // 詳細画面
  // ============================================================
  function initDetail() {
    // ===== 設定（必要なら /api/v1 を合わせて） =====
    const API_BASE = "/api/v1";

    // ===== util =====
    const el = (id) => document.getElementById(id);
    const money = (s) => (s == null ? "-" : Number(s).toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
    const setMsg = (text, type="") => {
      el("msg").className = type ? type : "muted";
      el("msg").textContent = text || "";
    };
    const getOrderIdFromQuery = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get("id");
    };
    const isoToLocalInput = (iso) => {
      // "2025-12-22T13:31:06" -> "2025-12-22T13:31"
      if (!iso) return "";
      const d = new Date(iso);
      // ブラウザのローカルに合わせて yyyy-MM-ddTHH:mm
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const localInputToISO = (val) => {
      // "yyyy-MM-ddTHH:mm" -> ISO (秒は00)
      if (!val) return null;
      const d = new Date(val);
      return d.toISOString(); // APIがローカル想定ならここは要調整
    };

    // ===== API =====
    async function apiGet(path) {
      const r = await fetch(`${API_BASE}${path}`, { headers: { "Accept":"application/json" } });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return await r.json();
    }

    async function apiPatch(path, body) {
      const r = await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json", "Accept":"application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text().catch(()=> "");
        throw new Error(`${r.status} ${r.statusText} ${t}`);
      }
      return await r.json();
    }

    // ===== 描画 =====
    function renderOrder(o) {
      el("orderId").textContent = o.id ?? "-";
      el("orderNo").textContent = o.order_no ? `#${o.order_no}` : "（番号なし）";
      el("hotelId").textContent = o.hotel_id ?? "-";
      el("roomNo").textContent = o.room_no ?? "-";
      el("totalAmount").textContent = money(o.total_amount);
      el("createdAt").textContent = o.created_at ?? "-";
      el("updatedAt").textContent = o.updated_at ?? "-";

      el("statusPill").textContent = o.status ?? "-";

      // 編集欄へ反映
      if (o.status != null) el("statusSelect").value = o.status;
      if (o.payment != null) el("paymentSelect").value = String(o.payment);
      el("requestedAt").value = isoToLocalInput(o.requested_at);
      el("notes").value = o.notes ?? "";
    }

    function renderItems(items) {
      const tb = el("itemsTbody");
      tb.innerHTML = "";

      if (!items || items.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6" class="muted">明細がありません</td>`;
        tb.appendChild(tr);
        return;
      }

      for (const it of items) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${it.id ?? ""}</td>
          <td>${it.product_id ?? ""}</td>
          <td>${it.product_name ?? ""}</td>
          <td class="num">${money(it.unit_price)}</td>
          <td class="num">${it.qty ?? ""}</td>
          <td class="num">${money(it.line_amount)}</td>
        `;
        tb.appendChild(tr);
      }
    }

    // ===== ロード =====
    let currentOrderId = null;
    loadAll();
    el("btnReload").addEventListener("click", loadAll);
    el("btnUpdate").addEventListener("click", updateOrder);

    async function loadAll() {
      const id = getOrderIdFromQuery();
      if (!id) {
        setMsg("URLに id がありません（例：detail.html?id=2）", "error");
        return;
      }
      currentOrderId = id;

      setMsg("読み込み中…");
      try {
        const [order, items] = await Promise.all([
          apiGet(`/orders/${id}`),
          apiGet(`/orders/${id}/items`),
        ]);
        renderOrder(order);
        renderItems(items);
        setMsg("");
      } catch (e) {
        setMsg(`取得に失敗しました：${e.message}`, "error");
        el("itemsTbody").innerHTML = `<tr><td colspan="6" class="error">取得エラー</td></tr>`;
      }
    }

    // ===== 更新 =====
    async function updateOrder() {
      if (!currentOrderId) return;

      const body = {
        status: el("statusSelect").value,
        payment: Number(el("paymentSelect").value),
        requested_at: localInputToISO(el("requestedAt").value),
        notes: el("notes").value || null,
      };

      setMsg("更新中…");
      try {
        const updated = await apiPatch(`/orders/${currentOrderId}`, body);
        renderOrder(updated);
        setMsg("更新しました。", "ok");
      } catch (e) {
        setMsg(`更新に失敗しました：${e.message}`, "error");
      }
    }

  }

  // 動かすメソッド選定
  const page = document.body.dataset.page;

  switch (page) {
    case "order-list":
      initIndex();
      break;
    case "order-new":
      initNew();
      break;
    case "order-detail":
      initDetail();
      break;
    case "order-edit":
      initEdit();
      break;
    default:
      console.warn("Unknown page:", page);
  }
});


/* -------------------------
 * util
 * ------------------------- */
function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}