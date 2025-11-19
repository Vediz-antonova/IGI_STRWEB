document.addEventListener("DOMContentLoaded", () => {
  const deliveryRadios = document.querySelectorAll("input[name='requires_delivery']");
  const addressField = document.getElementById("deliveryAddressField");
  const addressInput = document.getElementById("id_delivery_address");
  const geoStatus = document.getElementById("geo-status");

  function updateVisibility() {
    const selected = document.querySelector("input[name='requires_delivery']:checked").value;
    if (selected === "1") {
      addressField.style.display = "block";

      if (navigator.geolocation) {
        geoStatus.textContent = "Определяем ваше местоположение…";
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await response.json();
              const address = data.address;
              const city = address.city || address.town || address.village || "";
              const road = address.road || "";
              const house = address.house_number || "";
              const fullAddress = `${road} ${house}, ${city}`.trim();
              addressInput.value = fullAddress || `Координаты: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
              geoStatus.textContent = fullAddress
                ? `Ваш адрес определён: ${fullAddress}`
                : `Ваше местоположение: широта ${latitude.toFixed(5)}, долгота ${longitude.toFixed(5)}`;
            } catch {
              geoStatus.textContent = "Не удалось определить адрес.";
              addressInput.value = `Координаты: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            }
          },
          () => {
            geoStatus.textContent = "Не удалось получить координаты.";
          }
        );
      } else {
        geoStatus.textContent = "Геолокация не поддерживается.";
      }

    } else {
      addressField.style.display = "none";
      addressInput.value = "";
      geoStatus.textContent = "";
    }
  }

  deliveryRadios.forEach(radio => {
    radio.addEventListener("change", updateVisibility);
  });

  updateVisibility();
});
