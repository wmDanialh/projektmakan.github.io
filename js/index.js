function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('show');
}

// --- Carousel logic (auto + swipe + arrows + dots) ---
function initCarousel(root, { intervalMs = 3500 } = {}) {
    const track = root.querySelector('.carousel-track');
    const slides = Array.from(root.querySelectorAll('.slide'));
    const prevBtn = root.querySelector('.carousel-btn.prev');
    const nextBtn = root.querySelector('.carousel-btn.next');
    const dotsWrap = root.querySelector('.dots');

    if (!track || slides.length === 0 || !dotsWrap) return;

    // Build dots
    dotsWrap.innerHTML = '';
    const dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.className = 'dot';
        b.type = 'button';
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        b.addEventListener('click', () => goTo(i, true));
        dotsWrap.appendChild(b);
        return b;
    });

    let index = 0;
    let timer = null;
    let cachedStep = 0;

    function computeStep() {
        const first = slides[0];
        const gap = parseFloat(getComputedStyle(track).gap || '0');
        cachedStep = first.getBoundingClientRect().width + gap;
    }

    function updateDots() {
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function goTo(i, userAction = false) {
        index = (i + slides.length) % slides.length;
        if (!cachedStep) computeStep();
        const x = cachedStep * index;
        track.scrollTo({ left: x, behavior: 'smooth' });
        updateDots();
        if (userAction) restart();
    }

    function next(userAction = false) { goTo(index + 1, userAction); }
    function prev(userAction = false) { goTo(index - 1, userAction); }

    function start() {
        stop();
        timer = setInterval(() => next(false), intervalMs);
    }

    function stop() {
        if (timer) clearInterval(timer);
        timer = null;
    }

    function restart() { start(); }

    // Buttons
    prevBtn?.addEventListener('click', () => prev(true));
    nextBtn?.addEventListener('click', () => next(true));

    // Swipe
    let startX = 0;
    let isDown = false;

    track.addEventListener('pointerdown', (e) => {
        isDown = true;
        startX = e.clientX;
        track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointerup', (e) => {
        if (!isDown) return;
        isDown = false;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 50) {
            dx < 0 ? next(true) : prev(true);
        }
    });

    track.addEventListener('pointercancel', () => { isDown = false; });

    // Pause on hover (desktop)
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', () => { if (isInView) start(); });

    // Only run autoplay when carousel is in view (big performance win)
    let isInView = false;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
            if (en.target !== root) return;
            isInView = en.isIntersecting;
            if (isInView) start();
            else stop();
        });
    }, { threshold: 0.25 });
    io.observe(root);

    // Pause when tab not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (isInView) start();
    });

    // Keep index in sync on resize
    window.addEventListener('resize', () => {
        computeStep();
        const x = cachedStep * index;
        track.scrollTo({ left: x, behavior: 'auto' });
    });

    // Initial
    computeStep();
    updateDots();
    // autoplay starts via IntersectionObserver when in view
}

document.querySelectorAll('.carousel-wrap').forEach((c) => {
    initCarousel(c, { intervalMs: 3500 });
});