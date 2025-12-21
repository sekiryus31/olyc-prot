const API_BASE = "/api/v1";
const LIST_ENDPOINT = `${API_BASE}/hotels`;
const DETAIL_ENDPOINT_BASE = "/api/v1/hotels"; 

document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("status");
    const tblEl = document.getElementById("tbl");
    const tbodyEl = document.getElementById("tbody");
    const qEl = document.getElementById("q");
    const reloadBtn = document.getElementById("reloadBtn");

    if (!statusEl || !tblEl || !tbodyEl) return;
    if (qEl) {
        qEl.addEventListener("input", () => {
            render(window.__hotels || [], tbodyEl, (qEl.value || ""));
        });
    }

    // 再読み込み
    if (reloadBtn) {
        reloadBtn.addEventListener("click", () => loadHotels());
    }

    loadHotels();

    async function loadHotels() {

        statusEl.className = "loading";
        statusEl.textContent = "読み込み中…";
        tblEl.style.display = "none";
        tbodyEl.innerHTML = "";

        try {
            const res = await fetch(LIST_ENDPOINT, {
                headers: { "Accept": "application/json" }
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }

            const hotels = await res.json();
            window.__hotels = hotels;

            statusEl.textContent = `件数：${hotels.length}`;
            statusEl.className = "";
            tblEl.style.display = "";
            
            render(hotels, tbodyEl, (qEl?.value || ""));
        } catch (err) {
            statusEl.textContent = `取得に失敗：${err.message}`;
            statusEl.className = "error";
        }

    }
});


function render(hotels, tbodyEl, query = "") {
  const q = (query || "").trim().toLowerCase();

  const filtered = hotels.filter(h => {
    const code = (h.code || "").toLowerCase();
    const name = (h.name || "").toLowerCase();
    return !q || code.includes(q) || name.includes(q);
  });

  tbodyEl.innerHTML = filtered.map(h => {
    const detailUrl = `./detail.html?id=${encodeURIComponent(h.id)}`;
    return `
      <tr>
        <td>${escapeHtml(h.id)}</td>
        <td>${escapeHtml(h.code || "")}</td>
        <td><a href="${detailUrl}">${escapeHtml(h.name || "")}</a></td>
        <td>${escapeHtml(h.address || "")}</td>
        <td>${escapeHtml(h.phone || "")}</td>
      </tr>
    `;
  }).join("");
}


function escapeHtml(v) {
    return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



// 新規作成画面
const ENDPOINT = `${API_BASE}/hotels`;
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form");
  const backBtn = document.getElementById("backBtn");
  const saveBtn = document.getElementById("saveBtn");
  const statusEl = document.getElementById("status");

  // ✅ このJSは一覧でも使い回す想定だと思うので、
  // ページに要素が無い場合は何もしないで抜ける
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      location.href = "list.html";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      console.log("submit handler fired");
      e.preventDefault();

      statusEl.textContent = "";
      statusEl.className = "status";

      const payload = buildPayload();

      if (!payload.code || !payload.name) {
        statusEl.textContent = "ホテルコードとホテル名は必須です。";
        statusEl.classList.add("error");
        return;
      }

      // ボタンが無いページでも落ちないようにガード
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "保存中…";
      }

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const created = await res.json();
        statusEl.textContent = `作成しました（id=${created.id}）`;
        statusEl.classList.add("ok");
        alert("ホテルを新規登録しました！");

        setTimeout(() => {
          location.href = "list.html";
        }, 300);

      } catch (err) {
        statusEl.textContent = `失敗：${err.message}`;
        statusEl.classList.add("error");
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "保存";
        }
      }
    });
  }
});





function buildPayload() {
    const operatorRaw = document.getElementById("operator_id").value.trim();

    return {
    code: document.getElementById("code").value.trim(),
    name: document.getElementById("name").value.trim(),
    address: emptyToNull(document.getElementById("address").value),
    phone: emptyToNull(document.getElementById("phone").value),
    operator_id: operatorRaw === "" ? null : Number(operatorRaw),
    };
}

function emptyToNull(v) {
    const s = (v ?? "").trim();
    return s === "" ? null : s;
}




//詳細画面
document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const vId = document.getElementById("v_id");
  const vCode = document.getElementById("v_code");
  const vName = document.getElementById("v_name");
  const vAddress = document.getElementById("v_address");
  const vPhone = document.getElementById("v_phone");
  const reloadBtn = document.getElementById("reloadBtn");

  if (!statusEl || !vId || !vCode || !vName || !vAddress || !vPhone) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    statusEl.className = "error";
    statusEl.textContent = "ID が指定されていません（URLに ?id=... が必要）";
    return;
  }

  if (typeof LIST_ENDPOINT === "undefined") {
    statusEl.className = "error";
    statusEl.textContent = "LIST_ENDPOINT が未定義です（config.js を確認）";
    return;
  }

  if (reloadBtn) reloadBtn.addEventListener("click", loadDetail);

  loadDetail();

  async function loadDetail() {
    statusEl.className = "loading";
    statusEl.textContent = "読み込み中…";

    try {
      // 末尾の / を除去してから /{id} を付ける（ダブルスラッシュ事故防止）
      const base = LIST_ENDPOINT.replace(/\/+$/, "");
      const url = `${base}/${encodeURIComponent(id)}`;

    //   console.log("detail url:", url);

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const h = await res.json();

      vId.textContent = h.id ?? "-";
      vCode.textContent = h.code ?? "";
      vName.textContent = h.name ?? "";
      vAddress.textContent = h.address ?? "";
      vPhone.textContent = h.phone ?? "";

      statusEl.className = "";
      statusEl.textContent = "取得OK";
    } catch (err) {
      statusEl.className = "error";
      statusEl.textContent = `取得に失敗：${err.message}`;
    }
  }

  // 編集ボタン
    const editBtn = document.getElementById("editBtn");
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            if (!id) {
            alert("ID が取得できていません");
            return;
            }
            location.href = `edit.html?id=${encodeURIComponent(id)}`;
        });
    }

    // 削除ボタン
    const deleteBtn = document.getElementById("deleteBtn");

    if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
        if (!id) {
        alert("ID が取得できていません");
        return;
        }

        const ok = confirm("このホテルを削除します。よろしいですか？");
        if (!ok) return;

        try {
        statusEl.className = "loading";
        statusEl.textContent = "削除中…";

        // LIST_ENDPOINT から /{id} を作る方式が安全
        const base = LIST_ENDPOINT.replace(/\/+$/, "");
        const url = `${base}/${encodeURIComponent(id)}`;

        const res = await fetch(url, { method: "DELETE" });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }

        // 削除成功 → 一覧へ
        location.href = "list.html"; // あなたの一覧ファイル名に合わせて
        } catch (err) {
        statusEl.className = "error";
        statusEl.textContent = `削除に失敗：${err.message}`;
        }
    });
    }


});




// 編集
document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const formEl = document.getElementById("form");
  const saveBtn = document.getElementById("saveBtn");
  const reloadBtn = document.getElementById("reloadBtn");

  const idEl = document.getElementById("id");
  const codeEl = document.getElementById("code");
  const nameEl = document.getElementById("name");
  const addressEl = document.getElementById("address");
  const phoneEl = document.getElementById("phone");

  const backLink = document.getElementById("backLink");

  if (!statusEl || !formEl || !idEl || !nameEl) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    statusEl.className = "error";
    statusEl.textContent = "ID が指定されていません（URLに ?id=... が必要）";
    return;
  }

  // 詳細へ戻るリンクを id 付きに
  if (backLink) backLink.href = `./detail.html?id=${encodeURIComponent(id)}`;

  if (typeof LIST_ENDPOINT === "undefined") {
    statusEl.className = "error";
    statusEl.textContent = "LIST_ENDPOINT が未定義です（config.js を確認）";
    return;
  }

  const base = LIST_ENDPOINT.replace(/\/+$/, "");
  const detailUrl = `${base}/${encodeURIComponent(id)}`;

  if (reloadBtn) reloadBtn.addEventListener("click", loadHotel);

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveHotel();
  });

  loadHotel();

  async function loadHotel() {
    setLoading("読み込み中…");
    try {
      const res = await fetch(detailUrl, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const h = await res.json();

      idEl.value = h.id ?? "";
      if (codeEl) codeEl.value = h.code ?? "";
      nameEl.value = h.name ?? "";
      if (addressEl) addressEl.value = h.address ?? "";
      if (phoneEl) phoneEl.value = h.phone ?? "";

      setOk("読み込みOK");
    } catch (err) {
      setErr(`取得に失敗：${err.message}`);
    }
  }

  async function saveHotel() {
    // HTML required でも弾けるが念のため
    const name = (nameEl.value || "").trim();
    if (!name) {
      setErr("名前は必須です");
      nameEl.focus();
      return;
    }

    // 更新ペイロード（FastAPIのHotelUpdateスキーマに合わせて調整）
    const payload = {
      code: (codeEl?.value || "").trim() || null,
      name,
      address: (addressEl?.value || "").trim() || null,
      phone: (phoneEl?.value || "").trim() || null,
    };

    setLoading("保存中…");
    if (saveBtn) saveBtn.disabled = true;

    try {
      // まず PUT で送る（APIがPATCHなら method を "PATCH" に変更）
      const res = await fetch(detailUrl, {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const updated = await res.json();

      setOk("保存しました");

      // 保存後に詳細へ戻す（好みで）
      alert("更新しました。");
      location.href = `./detail.html?id=${encodeURIComponent(updated.id ?? id)}`;
    } catch (err) {
      setErr(`保存に失敗：${err.message}

APIがPATCH更新の場合、edit.jsの method を "PATCH" にしてください。`);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  function setLoading(msg) {
    statusEl.className = "loading";
    statusEl.textContent = msg;
  }
  function setOk(msg) {
    statusEl.className = "";
    statusEl.textContent = msg;
  }
  function setErr(msg) {
    statusEl.className = "error";
    statusEl.textContent = msg;
  }
});



