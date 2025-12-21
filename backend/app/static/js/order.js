const params = new URLSearchParams(window.location.search);
const hotelId = params.get("hotelId");

const hotelTitleEl = document.getElementById("hotel-title");
const categorySelect = document.getElementById("category-select");
const productTbody = document.getElementById("product-tbody");
const remarkEl = document.getElementById("remark");
const submitBtn = document.getElementById("submit-btn");

let allProducts = []; // 全商品（このホテル用）

async function init() {
  if (!hotelId) {
    alert("hotelId が URL にありません。");
    return;
  }

  // ホテル名取得（既存の /api/v1/hotels/{id} を想定）
  try {
    const hotelRes = await fetch(`/api/v1/hotels/${hotelId}`);
    if (hotelRes.ok) {
      const hotel = await hotelRes.json();
      hotelTitleEl.textContent = `【${hotel.name}】クリーニング依頼`;
    }
  } catch (e) {
    console.warn("ホテル名取得に失敗しましたが続行します。", e);
  }

  // 商品一覧取得
  try {
    const res = await fetch(`/api/v1/products?hotel_id=${hotelId}`);
    if (!res.ok) {
      alert("商品一覧の取得に失敗しました。");
      return;
    }
    allProducts = await res.json();
  } catch (e) {
    console.error(e);
    alert("商品一覧取得時にエラーが発生しました。");
    return;
  }

  if (allProducts.length === 0) {
    alert("登録済みの商品がありません。");
    return;
  }

  // カテゴリ一覧を作成してセレクトに詰める
  const categories = Array.from(
    new Set(allProducts.map((p) => p.category))
  );

  categorySelect.innerHTML = "";
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  // 最初のカテゴリの商品を表示
  renderProductsForCategory(categories[0]);

  // カテゴリ変更時
  categorySelect.addEventListener("change", () => {
    renderProductsForCategory(categorySelect.value);
  });

  // 提出ボタン
  submitBtn.addEventListener("click", submitOrder);
}

function renderProductsForCategory(category) {
  productTbody.innerHTML = "";

  const products = allProducts.filter((p) => p.category === category);

  products.forEach((p) => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = p.name;

    const priceTd = document.createElement("td");
    priceTd.textContent = `${p.price} 円`;

    const qtyTd = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.value = "0";
    input.dataset.productId = p.id;

    qtyTd.appendChild(input);

    tr.appendChild(nameTd);
    tr.appendChild(priceTd);
    tr.appendChild(qtyTd);

    productTbody.appendChild(tr);
  });
}

async function submitOrder() {
  const inputs = productTbody.querySelectorAll("input[type='number']");
  const items = [];

  inputs.forEach((input) => {
    const q = parseInt(input.value, 10) || 0;
    if (q > 0) {
      items.push({
        product_id: Number(input.dataset.productId),
        quantity: q,
      });
    }
  });

  if (items.length === 0) {
    alert("数量が1以上の品目がありません。");
    return;
  }

  const payload = {
    hotel_id: Number(hotelId),
    remark: remarkEl.value || null,
    items: items,
  };

  try {
    const res = await fetch("/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const msg = errData?.detail || `注文作成に失敗しました (status: ${res.status})`;
      alert(msg);
      return;
    }

    const created = await res.json();
    alert(`注文を登録しました。注文ID: ${created.id}`);
    // TODO: 必要なら詳細画面に遷移
    // location.href = `order_detail.html?orderId=${created.id}`;
  } catch (e) {
    console.error(e);
    alert("注文送信時にエラーが発生しました。");
  }
}


const root = document.getElementById("products-root");
const selectedList = document.getElementById("selected-list");
const totalPriceEl = document.getElementById("total-price");

let selected = new Map(); // product_id => { id, name, price, quantity }

document.getElementById("load-products").addEventListener("click", async () => {
  const hotelId = Number(document.getElementById("hotel-id").value);
  if (!hotelId) {
    alert("hotel_id を入れてね");
    return;
  }

  const res = await fetch(`/api/v1/products?hotel_id=${hotelId}`);
  const products = await res.json();

  renderProducts(products);
});

function renderProducts(products) {
  root.innerHTML = "";

  // category_name でグループ化
  const groups = new Map(); // category_name => products[]
  for (const p of products) {
    const key = p.category_name ?? "未分類";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  for (const [catName, items] of groups.entries()) {
    const section = document.createElement("div");
    section.innerHTML = `<h3>${escapeHtml(catName)}</h3>`;
    const ul = document.createElement("ul");

    for (const p of items) {
      const li = document.createElement("li");

      // チェック + 数量
      li.innerHTML = `
        <label style="display:flex; gap:12px; align-items:center;">
          <input type="checkbox" data-product-id="${p.id}">
          <span>${escapeHtml(p.name)}</span>
          <span style="margin-left:auto;">${Number(p.price).toLocaleString()}円</span>
          <input type="number" min="1" value="1" data-qty-id="${p.id}" style="width:70px;">
        </label>
      `;

      ul.appendChild(li);

      // イベント
      const checkbox = li.querySelector(`input[type="checkbox"][data-product-id="${p.id}"]`);
      const qtyInput = li.querySelector(`input[type="number"][data-qty-id="${p.id}"]`);

      checkbox.addEventListener("change", () => {
        const qty = Number(qtyInput.value || 1);
        if (checkbox.checked) {
          selected.set(p.id, { id: p.id, name: p.name, price: Number(p.price), quantity: qty });
        } else {
          selected.delete(p.id);
        }
        renderSelected();
      });

      qtyInput.addEventListener("change", () => {
        if (!selected.has(p.id)) return;
        const item = selected.get(p.id);
        item.quantity = Math.max(1, Number(qtyInput.value || 1));
        selected.set(p.id, item);
        renderSelected();
      });
    }

    section.appendChild(ul);
    root.appendChild(section);
  }
}

function renderSelected() {
  selectedList.innerHTML = "";
  let total = 0;

  for (const item of selected.values()) {
    total += item.price * item.quantity;
    const li = document.createElement("li");
    li.textContent = `${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()}円`;
    selectedList.appendChild(li);
  }

  totalPriceEl.textContent = total.toLocaleString();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}




// ページロード時に初期化
init();
