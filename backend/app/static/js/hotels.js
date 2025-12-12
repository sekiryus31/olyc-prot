const params = new URLSearchParams(window.location.search);
const hotelId = params.get("id");


// ホテル新規登録
async function createHotel(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const address = document.getElementById("address").value;

    try {
        const response = await fetch('/api/v1/hotels', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                code: code,
                address: address
            })
        });

        if (!response.ok) {
            throw new Error("登録エラー: " + response.status);
        }

        alert("ホテルを登録しました！");
        window.location.href = "list.html";  // 登録後一覧へ

    } catch (err) {
        console.error(err);
        alert("登録に失敗しました。");
    }
};

// ホテル情報取得して一覧に表示する
async function loadHotels() {
    try {
      // FastAPI の API を叩く
      const response = await fetch('/api/v1/hotels');
      if (!response.ok) {
        throw new Error('API error: ' + response.status);
      }

      const hotels = await response.json();
      console.log(response);
      const tbody = document.querySelector('#hotel-table tbody');
      tbody.innerHTML = ''; // 初期化（更新の場合、あったものも）

      hotels.forEach(hotel => {
        const tr = document.createElement('tr');

        tr.addEventListener("click", () => {
            window.location.href = `/static/hotel/detail.html?id=${hotel.id}`;
        });

        const tdId = document.createElement('td');
        tdId.textContent = hotel.id;
        tr.appendChild(tdId);

        const tdName = document.createElement('td');
        tdName.textContent = hotel.name;
        tr.appendChild(tdName);

        const tdCode = document.createElement('td');
        tdCode.textContent = hotel.code ?? '';
        tr.appendChild(tdCode);

        const tdAddress = document.createElement('td');
        tdAddress.textContent = hotel.address ?? '';
        tr.appendChild(tdAddress);

        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      alert('ホテル一覧の取得に失敗しました');
    }
  }



// ホテル詳細情報取得
async function loadHotelDetail() {
    // クエリパラメータから id を取得
    const detailEl = document.getElementById("detail");
    if (!hotelId) {
        detailEl.textContent = "ID が指定されていません。";
        return;
    }

    try {
        const response = await fetch(`/api/v1/hotels/${hotelId}`);
        if (!response.ok) {
            if (response.status === 404) {
                detailEl.textContent = "指定されたホテルが見つかりませんでした。";
                return;
            }
            throw new Error("API error: " + response.status);
        }

        const hotel = await response.json();
        detailEl.innerHTML = `  
        <div>
            <span class="field-label">ID:</span>
            <span class="field-value">${hotel.id}</span>
        </div>
        <div>
            <span class="field-label">ホテル名:</span>
            <span class="field-value">${hotel.name ?? ""}</span>
        </div>
        <div>
            <span class="field-label">コード:</span>
            <span class="field-value">${hotel.code ?? ""}</span>
        </div>
        <div>
            <span class="field-label">住所:</span>
            <span class="field-value">${hotel.address ?? ""}</span>
        </div>
        <a href="edit.html?id=${hotel.id}"><button>更新</button></a>
        

        `;
    } catch (err) {
        console.error(err);
        document.getElementById("detail").textContent = "詳細の取得に失敗しました。";
    }
}




// 編集画面
async function loadHotelEdit() {


    const hotelInput = document.getElementById("id");
    const nameInput = document.getElementById("name");
    const codeInput = document.getElementById("code");
    const addressInput = document.getElementById("address");
    const backLink = document.getElementById("back-link");

    if (hotelId) {
        // 詳細画面などがあるなら、戻り先を detail にしてもOK
        backLink.href = `detail.html?id=${hotelId}`;
    }
    if (!hotelId) {
        alert("ID が指定されていません。");
        return;
    }

    try {
        const response = await fetch(`/api/v1/hotels/${hotelId}`);
        if (!response.ok) {
            alert("ホテル情報の取得に失敗しました。");
            return;
        }
        const hotel = await response.json();
        hotelInput.value = hotel.id ?? "";
        nameInput.value = hotel.name ?? "";
        codeInput.value = hotel.code ?? "";
        addressInput.value = hotel.address ?? "";
    } catch (err) {
        console.error(err);
        alert("ホテル情報の取得でエラーが発生しました。");
    }
}


// ホテル編集画面で更新ボタン押下で情報の更新
async function updateHotel(e) {
    const nameInput = document.getElementById("name");
    const codeInput = document.getElementById("code");
    const addressInput = document.getElementById("address");

    e.preventDefault();

    if (!hotelId) {
        alert("ID が指定されていません。");
        return;
    }

    const payload = {
        name: nameInput.value,
        code: codeInput.value,
        address: addressInput.value,
    };

    try {
        console.log(hotelId);
        const response = await fetch(`/api/v1/hotels/${hotelId}`, {
            method: "PUT",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            alert("更新に失敗しました。(status: " + response.status + ")");
            return;
        }

        alert("更新しました！");
        // 更新後の遷移先：一覧に戻す or 詳細画面へ
        window.location.href = `detail.html?id=${hotelId}`;
    } catch (err) {
        console.error(err);
        alert("更新処理でエラーが発生しました。");
    }
};






// ホテル削除
async function deleteHotel(){
    if (!hotelId) {
        alert("ID が指定されていません。");
        return;
    }

    const ok = confirm("本当にこのホテルを削除しますか？");
    if (!ok) {
        return;
    }

    try {
    const response = await fetch(`/api/v1/hotels/${hotelId}`, {
        method: "DELETE"
    });

    if (response.status === 204) {
        alert("削除しました。");
        window.location.href = "list.html";
    } else if (response.status === 404) {
        alert("ホテルが見つかりませんでした。すでに削除済みかもしれません。");
    } else {
        alert("削除に失敗しました。(status: " + response.status + ")");
    }
    } catch (err) {
        console.error(err);
        alert("削除処理でエラーが発生しました。");
    }
};

  