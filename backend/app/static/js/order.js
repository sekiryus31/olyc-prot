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

// ページロード時に初期化
init();
