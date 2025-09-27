$(document).ready(function () {
  const successMessage = $("#jq-notification");
  const cartCountEl = $("#goods-in-cart-count");
  const cartItemsContainer = $("#cart-items-container");

  // Уведомление: автоисчезновение
  const notification = $("#notification");
  if (notification.length > 0) {
    setTimeout(() => notification.fadeOut(400), 2000);
  }

  // Уведомление: ручное закрытие
  $(".notification-close").on("click", function () {
    $(this).closest(".notification").fadeOut(300);
  });

  // Открытие модального окна корзины
  $("#modalButton").on("click", function () {
    $("#cartModal").attr("aria-hidden", "false");
  });

  // Закрытие модального окна корзины
  $("#closeModal, #cartOverlay").on("click", function () {
    $("#cartModal").attr("aria-hidden", "true");
  });

  // Добавление товара в корзину
  $(document).on("click", ".add-to-cart", function (e) {
    e.preventDefault();
    const product_id = $(this).data("product-id");
    const url = $(this).attr("href");
    let cartCount = parseInt(cartCountEl.text() || 0);

    $.ajax({
      type: "POST",
      url: url,
      data: {
        product_id: product_id,
        csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]").val(),
      },
      success: function (data) {
        successMessage.html(data.message).fadeIn(400);
        setTimeout(() => successMessage.fadeOut(400), 7000);
        cartCount++;
        cartCountEl.text(cartCount);
        cartItemsContainer.html(data.cart_items_html);
      },
      error: function () {
        console.log("Ошибка при добавлении товара в корзину");
      },
    });
  });

  // Удаление товара из корзины
  $(document).on("click", ".remove-from-cart", function (e) {
    e.preventDefault();
    const cart_id = $(this).data("cart-id");
    const url = $(this).attr("href");
    let cartCount = parseInt(cartCountEl.text() || 0);

    $.ajax({
      type: "POST",
      url: url,
      data: {
        cart_id: cart_id,
        csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]").val(),
      },
      success: function (data) {
        successMessage.html(data.message).fadeIn(400);
        setTimeout(() => successMessage.fadeOut(400), 7000);
        cartCount -= data.quantity_deleted;
        cartCountEl.text(cartCount);
        cartItemsContainer.html(data.cart_items_html);
      },
      error: function () {
        console.log("Ошибка при удалении товара из корзины");
      },
    });
  });

  // Изменение количества товара
  $(document).on("click", ".decrement, .increment", function () {
    const isIncrement = $(this).hasClass("increment");
    const url = $(this).data("cart-change-url");
    const cartID = $(this).data("cart-id");
    const $input = $(this).closest(".input-group").find(".number");
    let currentValue = parseInt($input.val());

    if (!isIncrement && currentValue > 1) {
      $input.val(currentValue - 1);
      updateCart(cartID, currentValue - 1, -1, url);
    } else if (isIncrement) {
      $input.val(currentValue + 1);
      updateCart(cartID, currentValue + 1, 1, url);
    }
  });

  function updateCart(cartID, quantity, change, url) {
    $.ajax({
      type: "POST",
      url: url,
      data: {
        cart_id: cartID,
        quantity: quantity,
        csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]").val(),
      },
      success: function (data) {
        successMessage.html(data.message).fadeIn(400);
        setTimeout(() => successMessage.fadeOut(400), 7000);
        let cartCount = parseInt(cartCountEl.text() || 0);
        cartCount += change;
        cartCountEl.text(cartCount);
        cartItemsContainer.html(data.cart_items_html);
      },
      error: function () {
        console.log("Ошибка при обновлении количества");
      },
    });
  }

  // Выбор способа доставки
  $("input[name='requires_delivery']").change(function () {
    const selectedValue = $(this).val();
    if (selectedValue === "1") {
      $("#deliveryAddressField").show();
    } else {
      $("#deliveryAddressField").hide();
    }
  });
});
