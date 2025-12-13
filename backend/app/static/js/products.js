const hotelId = new URLSearchParams(location.search).get("id");
const productId = new URLSearchParams(window.location.search).get("id");



// 商品情報取得して一覧に表示する
async function loadProducts() {
    try {
        // FastAPI の API を叩く
        const response = await fetch('/api/v1/products');
        if (!response.ok) {
            throw new Error('API error: ' + response.status);
        }

        const products = await response.json();
        console.log(products);

        const tbody = document.querySelector('#product-table tbody');
        tbody.innerHTML = ''; // 初期化

        products.forEach(product => {
            const tr = document.createElement('tr');

            // クリックで商品詳細ページへ（後で detail 作るなら）
            tr.addEventListener("click", () => {
                window.location.href = `/static/product/detail.html?id=${product.id}`;
            });

            // ID
            const tdId = document.createElement('td');
            tdId.textContent = product.id;
            tr.appendChild(tdId);

            // 商品名
            const tdName = document.createElement('td');
            tdName.textContent = product.name;
            tr.appendChild(tdName);

            // コード
            const tdCode = document.createElement('td');
            tdCode.textContent = product.code ?? '';
            tr.appendChild(tdCode);

            // 基本単価
            const tdBasePrice = document.createElement('td');
            tdBasePrice.textContent = product.price ?? '';
            tr.appendChild(tdBasePrice);

            // カテゴリID
            const tdCategory = document.createElement('td');
            tdCategory.textContent = product.category_id ?? '';
            tr.appendChild(tdCategory);

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alert('商品一覧の取得に失敗しました');
    }
}




// 商品新規登録
async function createProduct(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const categoryId = document.getElementById("category_id").value;
    const basePrice = document.getElementById("price").value;
    const description = document.getElementById("description").value;


    // 必須チェック（ざっくり）
    if (!name) {
        alert("商品名を入力してください。");
        return;
    }
    if (!basePrice) {
        alert("値段を入力してください。");
        return;
    }

    try {
        const response = await fetch('/api/v1/products', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: code || null,
                name: name,
                description: description || null,
                category_id: categoryId ? Number(categoryId) : null,
                // price / tax_rate は Decimal なので文字列で送ってOK
                price: basePrice,
                // hotel_id は今回は紐づけないので送らない（= null のまま）
            })
        });

        if (!response.ok) {
            throw new Error("登録エラー: " + response.status);
        }

        alert("商品を登録しました！");

        // 登録後に商品一覧ページへ遷移（ファイル名はお好みで）
        window.location.href = "list.html";

    } catch (err) {
        console.error(err);
        alert("商品の登録に失敗しました。");
    }
}




// 商品詳細情報取得
async function loadProductDetail() {
    const detailEl = document.getElementById("detail"); // ホテルと同じIDを使う想定

    if (!productId) {
        detailEl.textContent = "ID が指定されていません。";
        return;
    }

    try {
        const response = await fetch(`/api/v1/products/${productId}`);
        if (!response.ok) {
            if (response.status === 404) {
                detailEl.textContent = "指定された商品が見つかりませんでした。";
                return;
            }
            throw new Error("API error: " + response.status);
        }

        const product = await response.json();

        detailEl.innerHTML = `
        <div>
            <span class="field-label">ID:</span>
            <span class="field-value">${product.id}</span>
        </div>
        <div>
            <span class="field-label">商品名:</span>
            <span class="field-value">${product.name ?? ""}</span>
        </div>
        <div>
            <span class="field-label">コード:</span>
            <span class="field-value">${product.code ?? ""}</span>
        </div>
        <div>
            <span class="field-label">説明:</span>
            <span class="field-value">${product.description ?? ""}</span>
        </div>
        <div>
            <span class="field-label">カテゴリID:</span>
            <span class="field-value">${product.category_id ?? ""}</span>
        </div>
        <div>
            <span class="field-label">基本単価:</span>
            <span class="field-value">${product.price ?? ""}</span>
        </div>
        <div>
            <span class="field-label">税率:</span>
            <span class="field-value">${product.tax_rate ?? ""}</span>
        </div>
        <div>
            <span class="field-label">ホテルID:</span>
            <span class="field-value">${product.hotel_id ?? ""}</span>
        </div>

        <a href="edit.html?id=${product.id}">
            <button>更新</button>
        </a>
        `;

    } catch (err) {
        console.error(err);
        detailEl.textContent = "商品の詳細取得に失敗しました。";
    }
}


// 編集画面：商品情報をロード
async function loadProductEdit() {

    // const idInput = document.getElementById("id");
    const nameInput = document.getElementById("name");
    const codeInput = document.getElementById("code");
    const descriptionInput = document.getElementById("description");
    const categoryInput = document.getElementById("category_id");
    const priceInput = document.getElementById("price");
    // const taxRateInput = document.getElementById("tax_rate");
    // const hotelIdInput = document.getElementById("hotel_id");

    const backLink = document.getElementById("back-link");

    if (productId) {
        backLink.href = `detail.html?id=${productId}`;
    }
    if (!productId) {
        alert("ID が指定されていません。");
        return;
    }

    try {
        const response = await fetch(`/api/v1/products/${productId}`);
        if (!response.ok) {
            alert("商品情報の取得に失敗しました。");
            return;
        }

        const product = await response.json();

        // フォームに反映
        // idInput.value = product.id ?? "";
        nameInput.value = product.name ?? "";
        codeInput.value = product.code ?? "";
        descriptionInput.value = product.description ?? "";
        categoryInput.value = product.category_id ?? "";
        priceInput.value = product.price ?? "";
        // taxRateInput.value = product.tax_rate ?? "";
        // hotelIdInput.value = product.hotel_id ?? "";

    } catch (err) {
        console.error(err);
        alert("商品情報の取得でエラーが発生しました。");
    }
}


// 商品更新処理
async function updateProduct(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const description = document.getElementById("description").value;
    const categoryId = document.getElementById("category_id").value;
    const basePrice = document.getElementById("price").value;
    // const taxRate = document.getElementById("tax_rate").value;
    // const hotelId = document.getElementById("hotel_id").value;

    try {
        const response = await fetch(`/api/v1/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                code: code,
                description: description,
                category_id: categoryId ? Number(categoryId) : null,
                price: basePrice,
                // tax_rate: taxRate || null,
                // hotel_id: hotelId || null
            })
        });

        if (!response.ok) {
            throw new Error("更新エラー: " + response.status);
        }

        alert("商品を更新しました！");
        window.location.href = `detail.html?id=${productId}`;

    } catch (err) {
        console.error(err);
        alert("更新に失敗しました。");
    }
}


// 商品削除
async function deleteProduct() {
    if (!productId) {
        alert("ID が指定されていません。");
        return;
    }

    const ok = confirm("本当にこの商品を削除しますか？");
    if (!ok) {
        return;
    }

    try {
        const response = await fetch(`/api/v1/products/${productId}`, {
            method: "DELETE"
        });

        if (response.status === 204) {
            alert("削除しました。");
            window.location.href = "list.html"; // 商品一覧に戻す
        } 
        else if (response.status === 404) {
            alert("商品が見つかりませんでした。すでに削除済みかもしれません。");
        } 
        else {
            alert("削除に失敗しました。(status: " + response.status + ")");
        }

    } catch (err) {
        console.error(err);
        alert("削除処理でエラーが発生しました。");
    }
}





// フォームにイベントリスナーを付与（id は好きに合わせて）
const productForm = document.getElementById("product-form");
if (productForm) {
    productForm.addEventListener("submit", createProduct);
}
