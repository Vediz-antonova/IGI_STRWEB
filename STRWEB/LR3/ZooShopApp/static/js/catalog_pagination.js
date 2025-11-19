let currentPage = 1;
let pageSize = 3;

const grid = document.getElementById("product-grid");
const pagination = document.getElementById("pagination-controls");
const pageSizeSelector = document.getElementById("page-size");

function renderProducts() {
  grid.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = productsData.slice(start, end);

  pageItems.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-info">
        <a href="${product.url}" class="product-name">${product.name}</a>
        <p class="product-description">${product.description}</p>
        <p class="product-article">Артикул: ${product.article}</p>
        <p class="product-quantity">Количество: ${product.quantity}</p>
        <div class="product-actions">
          ${product.quantity <= 0
            ? `<p class="out-of-stock">Нет поставок</p>`
            : `<p class="product-price">${product.price} BYN</p>`}
          ${product.is_employee === "true"
            ? `<form method="POST" action="${product.delete_url}">
                 <input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
                 <button type="submit" class="delete-button">Удалить</button>
               </form>`
            : product.is_user === "true" && product.quantity > 0
            ? `<a href="${product.cart_url}" class="add-to-cart" data-product-id="${product.id}">
                 <input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
                 <img src="/static/icons/cart-plus.svg" alt="Добавить в корзину" width="32" height="32">
               </a>`
            : ""}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function getCSRFToken() {
  return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

function renderPagination() {
  const total = productsData.length;
  const pages = Math.ceil(total / pageSize);
  pagination.innerHTML = "";

  const createBtn = (label, page, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (disabled) btn.disabled = true;
    btn.className = page === currentPage ? "active" : "";
    if (page !== null) {
      btn.addEventListener("click", () => {
        currentPage = page;
        renderProducts();
        renderPagination();
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

pageSizeSelector.addEventListener("change", () => {
  pageSize = parseInt(pageSizeSelector.value);
  currentPage = 1;
  renderProducts();
  renderPagination();
});

renderProducts();
renderPagination();
