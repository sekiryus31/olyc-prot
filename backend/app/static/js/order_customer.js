// static/js/app_common.js
const API_BASE = "/api/v1";
const HOTEL_ID = 1; // ★固定（あとで差し替え）

const CART_KEY = `olyc_cart_hotel_${HOTEL_ID}`;

function qs(id) {
    return document.getElementById(id);
}

document.addEventListener("DOMContentLoaded", () => {
  
    // ============================================================
    // 一覧画面
    // ============================================================
    function initCart() {
        
        const statusEl = qs("status-text");
        const qEl = qs("q");
        const catEl = qs("category");
        const productsRoot = qs("products-root");
        const cartTbody = qs("cart-tbody");
        const cartTotalEl = qs("cart-total");
        const roomNoEl = qs("room_no");

        // 初期：カート表示
        renderCart();


        try {
            statusEl.className = "status loading";
            statusEl.textContent = "読み込み中...";

            loadCategories();   // ← 追加（カテゴリ select を作る）
            loadProducts();     // ← 既存（商品一覧取得→描画）

            statusEl.className = "status ok";
            statusEl.textContent = "OK";
        } catch (e) {
            statusEl.className = "status ng";
            statusEl.textContent = `読み込み失敗：${e.message}`;
        }

        // 検索/カテゴリ変更で再描画
        qEl.addEventListener("input", () => renderProducts(window.__products || []));
        catEl.addEventListener("change", () => renderProducts(window.__products || []));

        // 確認へ（まだ confirm 画面ないので、今はバリデーションだけ）
        qs("to-confirm").addEventListener("click", () => {
            const roomNo = (roomNoEl.value || "").trim();
            if (!roomNo) {
                alert("room_no は必須です");
                roomNoEl.focus();
                return;
            }
            const cart = getCart();
            if (cart.items.length === 0) {
                alert("カートが空です。商品を追加してください。");
                return;
            }
            localStorage.setItem(`olyc_room_no_hotel_${HOTEL_ID}`, roomNo);
            location.href = "confirm.html";
        });

        // カテゴリ一覧取得
        async function loadCategories() {
            console.log("API_BASE=", API_BASE);
            console.log("fetch url=", `${API_BASE}/category`);
            const cats = await apiFetch("/category"); // ←あなたのAPIパスに合わせて変更

            categoryMap = new Map();
            (cats || []).forEach(c => categoryMap.set(Number(c.id), c.name));

            const catEl = qs("category");
            // 「すべて」以外を消す
            catEl.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());

            (cats || []).forEach(c => {
                const opt = document.createElement("option");
                opt.value = String(c.id);
                opt.textContent = c.name;
                catEl.appendChild(opt);
            });
        }

        


        async function loadProducts() {
            try {
            statusEl.className = "status loading";
            statusEl.textContent = "商品を読み込み中...";

            // ★ここはAPIに合わせて選んで
            // 推奨：GET /api/v1/products?hotel_id=1 みたいなAPIがあるならそれを使う
            // ない場合：/products で全部取って front で hotel_id を絞る
            const products = await apiFetch(`/products?hotel_id=${encodeURIComponent(HOTEL_ID)}`);

            window.__products = products || [];

            // カテゴリ select を構築（product.category_id / category_name がない場合は「未分類」扱い）
            buildCategoryOptions(window.__products);

            renderProducts(window.__products);

            statusEl.className = "status ok";
            statusEl.textContent = `商品 ${window.__products.length} 件`;
            } catch (e) {
            statusEl.className = "status ng";
            statusEl.textContent = `商品取得に失敗：${e.message}`;
            productsRoot.innerHTML = "";
            }
        }

        function buildCategoryOptions(products) {
            // products に category_id がある前提（なければ全部同じに）
            const set = new Map(); // id -> label

            for (const p of products) {
            const cid = p.category_id ?? "";
            // category_name がAPIに無いなら id表示で妥協（後で API拡張で name を返すのがおすすめ）
            const label = p.category_name ?? (cid === "" ? "未分類" : `カテゴリ#${cid}`);
            if (!set.has(cid)) set.set(cid, label);
            }

            // 既存option（すべて）以外をクリア
            catEl.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());

            for (const [cid, label] of [...set.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
            const opt = document.createElement("option");
            opt.value = String(cid);
            opt.textContent = label;
            catEl.appendChild(opt);
            }
        }

        function renderProducts(products) {
            const q = (qEl.value || "").trim().toLowerCase();
            const cat = (catEl.value || "").trim(); // "" or "3" など

            const filtered = (products || []).filter(p => {
            const name = String(p.name || "").toLowerCase();
            const code = String(p.code || "").toLowerCase();
            const okQ = !q || name.includes(q) || code.includes(q);
            const okCat = !cat || String(p.category_id ?? "") === cat;
            return okQ && okCat;
            });

            productsRoot.innerHTML = filtered.map(p => {
            const price = Number(p.price ?? 0);
            return `
                <div class="product-card">
                <div class="product-main">
                    <div class="product-title">${escapeHtml(p.name || "")}</div>
                    <div class="product-sub">
                    <span class="muted">¥${escapeHtml(String(price.toFixed(2)))}</span>
                    </div>
                </div>

                <div class="product-actions">
                    <button class="btn" data-add="${escapeHtml(String(p.id))}">カートに追加</button>
                </div>
                </div>
            `;
            }).join("");

            // 追加ボタンのイベントを付ける
            productsRoot.querySelectorAll("button[data-add]").forEach(btn => {
            btn.addEventListener("click", () => {
                const pid = Number(btn.getAttribute("data-add"));
                const p = (window.__products || []).find(x => Number(x.id) === pid);
                if (!p) return;

                addToCart({
                product_id: Number(p.id),
                product_name: p.name || "",
                unit_price: Number(p.price ?? 0),
                qty: 1,
                });

                renderCart();
            });
            });
        }

        function renderCart() {
            const cart = getCart();

            cartTbody.innerHTML = cart.items.map((it, idx) => {
            const sub = Number(it.unit_price) * Number(it.qty);
            return `
                <tr>
                <td>${escapeHtml(it.product_name || "")}</td>
                <td>¥${escapeHtml(Number(it.unit_price).toFixed(2))}</td>
                <td>
                    <div class="qty">
                    <button class="btn btn-ghost" data-dec="${idx}">−</button>
                    <input class="qty-input" data-qty="${idx}" type="number" min="1" value="${escapeHtml(String(it.qty))}">
                    <button class="btn btn-ghost" data-inc="${idx}">＋</button>
                    </div>
                </td>
                <td>¥${escapeHtml(sub.toFixed(2))}</td>
                <td><button class="btn btn-danger" data-del="${idx}">削除</button></td>
                </tr>
            `;
            }).join("");

            const total = cart.items.reduce((sum, it) => sum + Number(it.unit_price) * Number(it.qty), 0);
            cartTotalEl.textContent = `¥${total.toFixed(2)}`;

            // 数量変更
            cartTbody.querySelectorAll("[data-inc]").forEach(b => {
            b.addEventListener("click", () => {
                const i = Number(b.getAttribute("data-inc"));
                changeQty(i, getCart().items[i].qty + 1);
                renderCart();
            });
            });
            cartTbody.querySelectorAll("[data-dec]").forEach(b => {
            b.addEventListener("click", () => {
                const i = Number(b.getAttribute("data-dec"));
                const next = Math.max(1, getCart().items[i].qty - 1);
                changeQty(i, next);
                renderCart();
            });
            });
            cartTbody.querySelectorAll("[data-qty]").forEach(inp => {
            inp.addEventListener("change", () => {
                const i = Number(inp.getAttribute("data-qty"));
                const v = Math.max(1, Number(inp.value || 1));
                changeQty(i, v);
                renderCart();
            });
            });

            // 削除
            cartTbody.querySelectorAll("[data-del]").forEach(b => {
            b.addEventListener("click", () => {
                const i = Number(b.getAttribute("data-del"));
                removeFromCart(i);
                renderCart();
            });
            });
        }
    }


/* -------------------------
 * cart storage
 * ------------------------- */
function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [] };
    const obj = JSON.parse(raw);
    if (!obj.items) obj.items = [];
    return obj;
  } catch {
    return { items: [] };
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  // 同一product_idは「同じ行にまとめる」運用（明細DBは複数行OKでも、カートはまとめた方がUX良い）
  const found = cart.items.find(x => Number(x.product_id) === Number(item.product_id));
  if (found) {
    found.qty = Number(found.qty) + 1;
  } else {
    cart.items.push(item);
  }
  saveCart(cart);
}

function changeQty(index, qty) {
  const cart = getCart();
  if (!cart.items[index]) return;
  cart.items[index].qty = Math.max(1, Number(qty));
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.items.splice(index, 1);
  saveCart(cart);
}

/* -------------------------
 * util
 * ------------------------- */
function escapeHtml(s) {
  return (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}




/* -------------------------
 * 注文確認画面
 * ------------------------- */
function initConfirm() {
  const statusEl = qs("status-text");
  const tbodyEl = qs("confirm-tbody");
  const totalEl = qs("confirm-total");

  statusEl.className = "status loading";
  statusEl.textContent = "確認内容を読み込み中...";

  const roomNo = (localStorage.getItem(`olyc_room_no_hotel_${HOTEL_ID}`) || "").trim();
  qs("v_room_no").textContent = roomNo || "-";

  const cart = getCart();
  if (!roomNo || cart.items.length === 0) {
    statusEl.className = "status ng";
    statusEl.textContent = "room_no もしくはカートが空です。商品選択に戻ってください。";
    qs("submit-order").disabled = true;
    return;
  }

  tbodyEl.innerHTML = cart.items.map(it => {
    const sub = Number(it.unit_price) * Number(it.qty);
    return `
      <tr>
        <td>${escapeHtml(it.product_name || "")}</td>
        <td>¥${escapeHtml(Number(it.unit_price).toFixed(2))}</td>
        <td>${escapeHtml(String(it.qty))}</td>
        <td>¥${escapeHtml(sub.toFixed(2))}</td>
      </tr>
    `;
  }).join("");

  const total = cart.items.reduce((sum, it) => sum + Number(it.unit_price) * Number(it.qty), 0);
  totalEl.textContent = `¥${total.toFixed(2)}`;

  statusEl.className = "status ok";
  statusEl.textContent = "内容を確認してください";

  // ここは次でAPI確定処理を書く
  qs("submit-order").addEventListener("click", submitOrder);

  
}

async function submitOrder() {
  const btn = qs("submit-order");
  const statusEl = qs("status-text");

  try {
    btn.disabled = true;
    statusEl.className = "status loading";
    statusEl.textContent = "注文を確定しています...";

    // 必要データ
    const roomNo = (localStorage.getItem(`olyc_room_no_hotel_${HOTEL_ID}`) || "").trim();
    const cart = getCart();

    if (!roomNo || cart.items.length === 0) {
      throw new Error("room_no または カートが空です");
    }

    // 1) 注文ヘッダ作成（draft）
    const order = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        hotel_id: HOTEL_ID,
        room_no: roomNo
      })
    });

    const orderId = order.id;
    const orderNo = order.order_no;

    // 2) 注文明細を登録
    for (const it of cart.items) {
      await apiFetch(`/orders/${orderId}/items`, {
        method: "POST",
        body: JSON.stringify({
          product_id: it.product_id,
          qty: it.qty
        })
      });
    }

    // 3) 注文確定（status = placed）
    await apiFetch(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "placed"
      })
    });

    const total = cart.items.reduce(
        (sum, it) => sum + Number(it.unit_price) * Number(it.qty),
        0
    );

    // 4) localStorage クリア
    localStorage.removeItem(`olyc_cart_hotel_${HOTEL_ID}`);
    localStorage.removeItem(`olyc_room_no_hotel_${HOTEL_ID}`);
    localStorage.setItem("olyc_last_order", JSON.stringify({
        order_no: orderNo,
        room_no: roomNo,
        total: total,
        items: cart.items,
        ordered_at: new Date().toLocaleString()
    }));

    // 5) 完了画面へ
    location.href = `./complete.html?order_no=${encodeURIComponent(orderNo)}`;

  } catch (e) {
    statusEl.className = "status ng";
    statusEl.textContent = `注文に失敗しました：${e.message}`;
    btn.disabled = false;
  }
}



async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }

    if (res.status === 204) return null;

    return await res.json(); 
}



    /* -------------------------
    * 注文確定控え画面
    * ------------------------- */
    function initComplete() {
        const data = JSON.parse(localStorage.getItem("olyc_last_order") || "{}");

        qs("order_no").textContent = data.order_no || "-";
        qs("v_room_no").textContent = data.room_no || "-";
        qs("ordered_at").textContent = data.ordered_at || "-";

        const items = data.items || [];
        const total = items.reduce((sum, it) => sum + Number(it.unit_price || 0) * Number(it.qty || 0), 0);

        qs("v_total").textContent = `¥${total.toFixed(2)}`;

        const tbody = qs("items-tbody");
        tbody.innerHTML = items.map(it => {
            const unit = Number(it.unit_price || 0);
            const qty = Number(it.qty || 0);
            const sub = unit * qty;

            return `
            <tr>
                <td>${escapeHtml(it.product_name || "")}</td>
                <td>¥${unit.toFixed(2)}</td>
                <td>${qty}</td>
                <td>¥${sub.toFixed(2)}</td>
            </tr>
            `;
        }).join("");
    }

    // 動かすメソッド選定
  const page = document.body.dataset.page;
  switch (page) {
    case "order-cart":
      initCart();
      break;
    case "order-confirm":
      initConfirm();
      break;
    case "order-complete":
      initComplete();
      break;
    default:
      console.warn("Unknown page:", page);
  }
});
