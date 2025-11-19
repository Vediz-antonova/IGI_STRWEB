class ZooSlider {
    constructor(container) {
        this.container = container;
        this.slides = container.querySelectorAll('.slide');
        this.total = this.slides.length;
        this.current = 0;
        this.loop = container.dataset.loop === 'true';
        this.auto = container.dataset.auto === 'true';
        this.delay = parseInt(container.dataset.delay) || 5;
        this.stopHover = container.dataset.stopHover === 'true';
        this.counter = container.querySelector('#current-slide');
        this.init();
    }

    init() {
        this.showSlide(this.current);
        this.bindControls();
        if (this.auto) this.startAuto();
    }

    showSlide(index) {
        this.slides.forEach((s, i) => {
            if (i === index) {
                s.style.display = 'block';
                s.classList.add('active');
            } else {
                s.style.display = 'none';
                s.classList.remove('active');
            }
        });

        if (this.counter) {
            this.counter.textContent = index + 1;
        }

        const dots = this.container.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        this.current = index;
    }

    nextSlide() {
        let next = this.current + 1;
        if (next >= this.total) next = this.loop ? 0 : this.total - 1;
        this.showSlide(next);
    }

    prevSlide() {
        let prev = this.current - 1;
        if (prev < 0) prev = this.loop ? this.total - 1 : 0;
        this.showSlide(prev);
    }

    bindControls() {
        const nextBtn = this.container.querySelector('.slider-next');
        const prevBtn = this.container.querySelector('.slider-prev');
        const dots = this.container.querySelectorAll('.slider-dot');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
        dots.forEach(dot => {
            dot.addEventListener('click', () => this.showSlide(parseInt(dot.dataset.slide)));
        });

        if (this.stopHover) {
            this.container.addEventListener('mouseenter', () => this.stopAuto());
            this.container.addEventListener('mouseleave', () => this.startAuto());
        }
    }

    startAuto() {
        this.stopAuto();
        this.timer = setInterval(() => this.nextSlide(), this.delay * 1000);
    }

    stopAuto() {
        clearInterval(this.timer);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.slider-section');
    if (slider) new ZooSlider(slider);
});
