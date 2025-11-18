document.addEventListener("DOMContentLoaded", () => {
  // === DOM Elements ===
  const tableBody = document.querySelector("#contacts-table tbody");
  const pagination = document.getElementById("pagination");
  const filterBtn = document.getElementById("filter-btn");
  const filterInput = document.getElementById("filter-input");
  const rewardBtn = document.getElementById("reward-btn");
  const rewardResult = document.getElementById("reward-result");
  const detailsBlock = document.getElementById("details-block");
  const preloader = document.getElementById("preloader");

  const addBtn = document.getElementById("add-btn");
  const addForm = document.getElementById("add-form");
  const validateBtn = document.getElementById("validate-btn");
  const submitBtn = document.getElementById("submit-btn");
  const validationResult = document.getElementById("validation-result");

  // === State Variables ===
  let employees = [];
  let currentPage = 1;
  let sortField = null;
  let sortAsc = true;

  // === Loader Control ===
  const showLoader = () => preloader.classList.remove("hidden");
  const hideLoader = () => preloader.classList.add("hidden");

  // === Data Fetching ===
  async function loadData() {
    showLoader();
    const res = await fetch("/contacts/api/");
    const data = await res.json();
    employees = data.employees;
    renderTable();
    hideLoader();
  }

  // === Table Rendering ===
  function renderTable() {
    const text = filterInput.value.toLowerCase();

    const filtered = employees.filter(e =>
      (`${e.name}` || "").toLowerCase().includes(text) ||
      (e.email || "").toLowerCase().includes(text) ||
      (e.phone || "").toLowerCase().includes(text) ||
      (e.job_description || "").toLowerCase().includes(text)
    );

    if (sortField) {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortField === "name") {
          valA = `${a.name}`.toLowerCase();
          valB = `${b.name}`.toLowerCase();
        } else {
          valA = (a[sortField] || "").toLowerCase();
          valB = (b[sortField] || "").toLowerCase();
        }
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    const start = (currentPage - 1) * 3;
    const pageData = filtered.slice(start, start + 3);

    tableBody.innerHTML = "";
    pageData.forEach(e => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${e.name}</td>
        <td><img src="${e.image}" alt="Фото" width="60" height="60" onerror="this.src='/static/images/baseavatar.jpg';"/></td>
        <td>${e.job_description || ""}</td>
        <td>${e.phone || ""}</td>
        <td>${e.email || ""}</td>
        <td><input type="checkbox" data-name="${e.name}"/></td>
      `;
      row.addEventListener("click", () => showDetails(e));
      tableBody.appendChild(row);
    });

    renderPagination(filtered.length);
  }

  // === Pagination Rendering ===
  function renderPagination(total) {
    const pages = Math.ceil(total / 3);
    pagination.innerHTML = "";

    const createBtn = (label, page, disabled = false) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      if (disabled) btn.disabled = true;
      btn.className = page === currentPage ? "active" : "";
      if (page !== null) {
        btn.addEventListener("click", () => {
          currentPage = page;
          renderTable();
        });
      }
      return btn;
    };

    if (currentPage > 1) pagination.appendChild(createBtn("←", currentPage - 1));

    if (currentPage === 1) {
      pagination.appendChild(createBtn("1", 1));
      if (pages >= 2) pagination.appendChild(createBtn("2", 2));
      if (pages > 2) pagination.appendChild(createBtn("...", null, true));
    } else if (currentPage === 2) {
      pagination.appendChild(createBtn("1", 1));
      pagination.appendChild(createBtn("2", 2));
      if (pages > 3) pagination.appendChild(createBtn("3", 3));
      if (pages > 3) pagination.appendChild(createBtn("...", null, true));
    } else if (currentPage === pages) {
      if (pages > 3) pagination.appendChild(createBtn("...", null, true));
      pagination.appendChild(createBtn(`${pages - 1}`, pages - 1));
      pagination.appendChild(createBtn(`${pages}`, pages));
    } else {
      if (currentPage > 2) pagination.appendChild(createBtn("...", null, true));
      pagination.appendChild(createBtn(`${currentPage - 1}`, currentPage - 1));
      pagination.appendChild(createBtn(`${currentPage}`, currentPage, true));
      pagination.appendChild(createBtn(`${currentPage + 1}`, currentPage + 1));
      if (currentPage + 1 < pages) pagination.appendChild(createBtn("...", null, true));
    }

    if (currentPage < pages) pagination.appendChild(createBtn("→", currentPage + 1));
  }

  // === Sorting Control ===
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;

      document.querySelectorAll("th[data-sort]").forEach(header => {
        header.textContent = header.textContent.replace(/[\u25B2\u25BC▲▼]/g, "");
      });

      sortAsc = sortField === field ? !sortAsc : true;
      sortField = field;

      th.textContent += sortAsc ? " ▲" : " ▼";

      renderTable();
    });
  });

  // === Filter Button ===
  filterBtn.addEventListener("click", () => {
    currentPage = 1;
    renderTable();
  });

  // === Details Display ===
  function showDetails(e) {
    detailsBlock.innerHTML = `
      <h3>Детали сотрудника</h3>
      <p><strong>ФИО:</strong> ${e.name}</p>
      <p><strong>Описание:</strong> ${e.job_description}</p>
      <p><strong>Телефон:</strong> ${e.phone}</p>
      <p><strong>Email:</strong> ${e.email}</p>
    `;
  }

  // === Reward Button ===
  rewardBtn.addEventListener("click", () => {
    const selected = [...document.querySelectorAll("input[type='checkbox']:checked")];
    const names = selected.map(cb => cb.dataset.name);
    rewardResult.textContent = names.length
      ? `Премированы: ${names.join(", ")}`
      : "Никто не выбран для премирования.";
  });

    // === Add Button: toggles visibility of the add employee form ===
  addBtn.addEventListener("click", () => {
    addForm.classList.toggle("hidden");

    validationResult.textContent = "";
    submitBtn.disabled = true;

    ["add-name", "add-phone", "add-email", "add-url", "add-desc"].forEach(id => {
      document.getElementById(id).value = "";
      document.getElementById(id).classList.remove("invalid");
    });

    console.log("Форма добавления открыта");
  });

  // === Validation for Add Form ===
  validateBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("add-name");
    const phoneInput = document.getElementById("add-phone");
    const emailInput = document.getElementById("add-email");
    const urlInput = document.getElementById("add-url");

    let valid = true;
    const raw = phoneInput.value.trim();
    const cleaned = raw.replace(/[\s\-()]/g, "");
    const phoneRegex = /^(\+375|80)(25|29|33|44)\d{7}$/;

    if (!phoneRegex.test(cleaned)) {
      phoneInput.classList.add("invalid");
      valid = false;
    }

    const imageRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;

    if (!imageRegex.test(imageInput.value.trim())) {
      imageInput.classList.add("invalid");
      valid = false;
      document.getElementById("validation-result").textContent = "Ссылка должна вести на изображение (.jpg/.png/...)";
    } else {
      imageInput.classList.remove("invalid");
      document.getElementById("validation-result").textContent = "✅ Ссылка валидна";
    }

    [nameInput, phoneInput, emailInput, urlInput].forEach(input => {
      input.classList.remove("invalid");
    });

    if (!emailInput.value.includes("@")) {
      emailInput.classList.add("invalid");
      valid = false;
    }

    if (nameInput.value.trim().split(" ").length < 2) {
      nameInput.classList.add("invalid");
      valid = false;
    }

    validationResult.textContent = valid
      ? "✅ Все поля валидны"
      : "❌ Проверьте корректность данных";

    submitBtn.disabled = !valid;
  });

  // === Add New Employee ===
  submitBtn.addEventListener("click", async () => {
    console.log("Кнопка нажата");
    const name = document.getElementById("add-name").value.trim();
    const phone = document.getElementById("add-phone").value.trim();
    const email = document.getElementById("add-email").value.trim();
    const url = document.getElementById("add-url").value.trim();
    const desc = document.getElementById("add-desc").value.trim();

    // Create new employee object
    const newEmployee = {
      name,
      phone,
      email,
      job_description: desc,
      image: url,
    };

    showLoader();

    try {
      const res = await fetch("/contacts/api/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      });

      const result = await res.json();
      if (result.status === "success") {
        await loadData(); // Перезагрузка данных с сервера
      } else {
        alert("Ошибка при добавлении: " + result.message);
      }
    } catch (err) {
      alert("Ошибка сети: " + err.message);
    }

    hideLoader();

    // Hide form and reset validation
    addForm.classList.add("hidden");
    validationResult.textContent = "";
    submitBtn.disabled = true;

    // Clear input fields
    ["add-name", "add-phone", "add-email", "add-url", "add-desc"].forEach(id => {
      document.getElementById(id).value = "";
    });
  });

  // === Initial Load ===
  loadData();
});
