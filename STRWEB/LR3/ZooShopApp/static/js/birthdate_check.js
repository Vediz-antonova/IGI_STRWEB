document.addEventListener("DOMContentLoaded", () => {
  const birthInput = document.getElementById("birth_date");
  const infoBlock = document.getElementById("birth_info");
  const message = document.getElementById("birth_message");

  // Установим max на сегодня
  const today = new Date().toISOString().split("T")[0];
  birthInput.max = today;

  birthInput.addEventListener("change", () => {
    const value = birthInput.value;
    if (!value) return;

    const birthDate = new Date(value);
    const now = new Date();

    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    const d = now.getDate() - birthDate.getDate();
    if (m < 0 || (m === 0 && d < 0)) age--;

    const weekdays = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
    const weekday = weekdays[birthDate.getDay()];

    infoBlock.style.display = "block";

    if (age >= 18) {
      birthInput.setCustomValidity("");
      birthInput.classList.remove("invalid-age");
      message.textContent = `Вам ${age} лет. Вы родились в день недели: ${weekday}.`;
    } else {
      birthInput.setCustomValidity("Вам должно быть не менее 18 лет");
      birthInput.classList.add("invalid-age");
      message.textContent = `Вам ${age} лет. Для использования сайта необходимо разрешение родителей.`;
      alert("Вы несовершеннолетний. Для использования сайта необходимо разрешение родителей.");
    }

    birthInput.reportValidity();
  });
});
