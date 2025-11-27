document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".faq-item");
  const parrots = document.querySelectorAll(".parrot");

  // FAQ-блоки: IntersectionObserver работает и при обратном скролле
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      } else {
        entry.target.classList.remove("visible");
      }
    });
  }, { threshold: 0.2 });

  items.forEach(item => observer.observe(item));

  // Попугаи: включаем анимацию только во время скролла
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    parrots.forEach(parrot => {
      parrot.classList.add("visible", "fly");
    });

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      parrots.forEach(parrot => {
        parrot.classList.remove("visible", "fly");
      });
    }, 300);
  });
});
