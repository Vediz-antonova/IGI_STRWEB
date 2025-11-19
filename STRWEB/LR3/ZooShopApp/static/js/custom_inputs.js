document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("enableCustomInputs");
  const container = document.getElementById("custom-inputs-container");
  const storageKey = `customInputs_${currentUsername}`;

  // Загружаем сохранённые поля
  const savedInputs = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (savedInputs.length > 0 && container.children.length === 0) {
    savedInputs.forEach(data => createInputBlock(data));
  }

  // Сброс чекбокса при загрузке
  checkbox.checked = false;

  // Обработка активации чекбокса
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      createInputBlock();
      checkbox.checked = false; // сбрасываем сразу после добавления
    }
  });

  function createInputBlock(data = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-group";
    wrapper.style.border = "1px solid #ced4da";
    wrapper.style.padding = "1rem";
    wrapper.style.borderRadius = "6px";
    wrapper.style.backgroundColor = "#f8f9fa";
    wrapper.style.marginBottom = "1rem";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = data.placeholder || "";
    input.name = data.name || "";
    input.maxLength = data.maxlength || "";
    input.value = data.value || "";
    input.readOnly = data.readonly || false;
    input.disabled = data.disabled || false;
    input.className = "form-control";

    const controls = document.createElement("div");
    controls.className = "custom-controls";
    controls.style.display = "grid";
    controls.style.gridTemplateColumns = "repeat(auto-fit, minmax(140px, 1fr))";
    controls.style.gap = "0.5rem";
    controls.style.marginTop = "0.5rem";

    controls.innerHTML = `
      <input type="text" placeholder="name" value="${data.name || ""}">
      <input type="text" placeholder="placeholder" value="${data.placeholder || ""}">
      <input type="number" placeholder="maxlength" value="${data.maxlength || ""}">
      <input type="text" placeholder="value" value="${data.value || ""}">
      <label><input type="checkbox" ${data.readonly ? "checked" : ""}> readonly</label>
      <label><input type="checkbox" ${data.disabled ? "checked" : ""}> disabled</label>
      <button type="button" class="remove-button">Удалить</button>
    `;

    const nameInput = controls.children[0];
    const placeholderInput = controls.children[1];
    const maxlengthInput = controls.children[2];
    const valueInput = controls.children[3];
    const readonlyCheckbox = controls.children[4].querySelector("input");
    const disabledCheckbox = controls.children[5].querySelector("input");

    nameInput.addEventListener("input", () => {
      input.name = nameInput.value;
      saveInputs();
    });
    placeholderInput.addEventListener("input", () => {
      input.placeholder = placeholderInput.value;
      saveInputs();
    });
    maxlengthInput.addEventListener("input", () => {
      input.maxLength = maxlengthInput.value;
      saveInputs();
    });
    valueInput.addEventListener("input", () => {
      input.value = valueInput.value;
      saveInputs();
    });
    readonlyCheckbox.addEventListener("change", () => {
      input.readOnly = readonlyCheckbox.checked;
      saveInputs();
    });
    disabledCheckbox.addEventListener("change", () => {
      input.disabled = disabledCheckbox.checked;
      saveInputs();
    });

    controls.querySelector(".remove-button").addEventListener("click", () => {
      container.removeChild(wrapper);
      saveInputs();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(controls);
    container.appendChild(wrapper);
    saveInputs();
  }

  function saveInputs() {
    const blocks = container.querySelectorAll(".form-group");
    const data = Array.from(blocks).map(block => {
      const controls = block.querySelector(".custom-controls");
      return {
        name: controls.children[0].value,
        placeholder: controls.children[1].value,
        maxlength: controls.children[2].value,
        value: controls.children[3].value,
        readonly: controls.children[4].querySelector("input").checked,
        disabled: controls.children[5].querySelector("input").checked
      };
    });
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
});
