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
  // 注文画面
  // ============================================================
  function initNew() {
    const statusText = qs("status-text");

    qs("create-btn").addEventListener("click", async () => {
      try {
        statusText.className = "status loading";
        statusText.textContent = "作成中...";

        const payload = {
          hotel_id: Number(qs("hotel_id").value),
          room_no: qs("room_no").value.trim(),
          status: qs("status").value,
          requested_at: toIsoFromDatetimeLocal(qs("requested_at").value),
          total_amount: Number(qs("total_amount").value),
          payment: Number(qs("payment").value),
          notes: (qs("notes").value || "").trim() || null,
        };

        // 必須チェック（軽く）
        if (!payload.hotel_id || !payload.room_no || isNaN(payload.total_amount)) {
          throw new Error("hotel_id / room_no / total_amount は必須です");
        }

        const created = await apiFetch("/orders", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        statusText.className = "status ok";
        statusText.textContent = `作成完了：${created.order_no}`;

        // 詳細へ遷移
        window.location.href = `./detail.html?id=${encodeURIComponent(created.id)}`;
      } catch (e) {
        statusText.className = "status ng";
        statusText.textContent = `作成に失敗：${e.message}`;
      }
    });
  }




  // ============================================================
  // 詳細画面
  // ============================================================
  function initDetail() {
    const statusText = qs("status-text");
    const orderId = getQueryParam("id");

    if (!orderId) {
      statusText.className = "status ng";
      statusText.textContent = "ID が指定されていません。";
      return;
    }

    load();

    qs("update-btn").addEventListener("click", async () => {
      try {
        statusText.className = "status loading";
        statusText.textContent = "更新中...";

        // PATCH：変更したものだけ送る
        const patch = {};
        const statusVal = qs("status").value;
        const requestedVal = qs("requested_at").value;
        const paymentVal = qs("payment").value;
        const notesVal = qs("notes").value;

        if (statusVal) patch.status = statusVal;
        if (requestedVal) patch.requested_at = toIsoFromDatetimeLocal(requestedVal);
        if (paymentVal) patch.payment = Number(paymentVal);
        if (notesVal && notesVal.trim()) patch.notes = notesVal.trim();

        if (Object.keys(patch).length === 0) {
          throw new Error("変更項目がありません");
        }

        await apiFetch(`/orders/${encodeURIComponent(orderId)}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });

        statusText.className = "status ok";
        statusText.textContent = "更新しました";
        await load();
      } catch (e) {
        statusText.className = "status ng";
        statusText.textContent = `更新に失敗：${e.message}`;
      }
    });

    qs("delete-btn").addEventListener("click", async () => {
      if (!confirm("この注文を削除しますか？（試作：物理削除）")) return;

      try {
        statusText.className = "status loading";
        statusText.textContent = "削除中...";

        await apiFetch(`/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" });

        statusText.className = "status ok";
        statusText.textContent = "削除しました";
        window.location.href = "./index.html";
      } catch (e) {
        statusText.className = "status ng";
        statusText.textContent = `削除に失敗：${e.message}`;
      }
    });

    async function load() {
      try {
        statusText.className = "status loading";
        statusText.textContent = "読み込み中...";

        const o = await apiFetch(`/orders/${encodeURIComponent(orderId)}`);

        qs("v_id").textContent = o.id ?? "-";
        qs("v_order_no").textContent = o.order_no ?? "-";
        qs("v_hotel_id").textContent = o.hotel_id ?? "-";
        qs("v_room_no").textContent = o.room_no ?? "-";
        qs("v_total_amount").textContent = o.total_amount ?? "-";
        qs("v_payment").textContent = o.payment ?? "-";
        qs("v_created_at").textContent = fmtDateTime(o.created_at);
        qs("v_updated_at").textContent = fmtDateTime(o.updated_at);
        qs("v_notes").textContent = o.notes || "";

        statusText.className = "status ok";
        statusText.textContent = "OK";
      } catch (e) {
        statusText.className = "status ng";
        statusText.textContent = `取得に失敗：${e.message}`;
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