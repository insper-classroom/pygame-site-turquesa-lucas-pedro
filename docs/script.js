(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // Keeps the footer current without hardcoding future edits.
  const setYear = () => {
    const year = document.querySelector("#year");
    if (year) year.textContent = new Date().getFullYear();
  };

  // Reveals content once, giving long sections a staged game-trailer rhythm.
  const revealOnScroll = () => {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -60px" }
    );

    items.forEach((item) => observer.observe(item));
  };

  // Moves hero layers by different depths for sky, ocean and character parallax.
  const setupParallax = () => {
    const layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length || prefersReducedMotion) return;

    let scrollY = window.scrollY;
    let pointerX = 0;
    let pointerY = 0;
    let ticking = false;

    const render = () => {
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.parallax) || 0;
        const x = pointerX * depth * 18;
        const y = scrollY * depth * -0.08 + pointerY * depth * 14;
        layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      ticking = false;
    };

    const requestRender = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    };

    window.addEventListener(
      "scroll",
      () => {
        scrollY = window.scrollY;
        requestRender();
      },
      { passive: true }
    );

    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX / window.innerWidth - 0.5;
        pointerY = event.clientY / window.innerHeight - 0.5;
        requestRender();
      },
      { passive: true }
    );

    render();
  };

  // Adds a lightweight pointer-based 3D tilt to cards and screenshots.
  const setupTiltCards = () => {
    const cards = document.querySelectorAll("[data-tilt]");
    if (!cards.length || prefersReducedMotion) return;

    cards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${y * -8}deg) rotateY(${x * 10}deg) translateY(-3px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  };

  // Follows the native pirate cursor with a subtle golden aura on precise pointers.
  const setupCursor = () => {
    const cursor = document.querySelector(".cursor-aura");
    if (!cursor || window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let targetX = x;
    let targetY = y;

    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
      },
      { passive: true }
    );

    const animate = () => {
      x += (targetX - x) * 0.22;
      y += (targetY - y) * 0.22;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(animate);
    };

    animate();
  };

  // Draws ambient treasure dust and sea bubbles on a single canvas.
  const setupParticles = () => {
    const canvas = document.querySelector("#particles");
    if (!canvas || prefersReducedMotion) return;

    const context = canvas.getContext("2d");
    const particles = [];
    const palette = ["rgba(244,191,69,0.55)", "rgba(143,164,197,0.5)", "rgba(242,240,213,0.38)"];
    const particleCount = 58;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createParticle = (resetY = false) => ({
      x: Math.random() * width,
      y: resetY ? height + Math.random() * 80 : Math.random() * height,
      radius: 1 + Math.random() * 2.8,
      speed: 0.18 + Math.random() * 0.42,
      drift: -0.15 + Math.random() * 0.3,
      color: palette[Math.floor(Math.random() * palette.length)],
      phase: Math.random() * Math.PI * 2,
    });

    const seed = () => {
      particles.length = 0;
      for (let index = 0; index < particleCount; index += 1) {
        particles.push(createParticle());
      }
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        particle.y -= particle.speed;
        particle.x += particle.drift + Math.sin(time * 0.001 + particle.phase) * 0.12;

        if (particle.y < -20 || particle.x < -30 || particle.x > width + 30) {
          particles[index] = createParticle(true);
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.shadowBlur = 12;
        context.shadowColor = particle.color;
        context.fill();
      });

      window.requestAnimationFrame(draw);
    };

    resize();
    seed();
    window.addEventListener("resize", () => {
      resize();
      seed();
    });
    window.requestAnimationFrame(draw);
  };

  // Tightens the header contrast once the player leaves the opening shot.
  const setupHeaderState = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const update = () => {
      root.style.setProperty("--header-alpha", window.scrollY > 20 ? "0.9" : "0.68");
      header.style.background = `rgba(11, 16, 34, ${window.scrollY > 20 ? 0.9 : 0.68})`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
  };

  document.addEventListener("DOMContentLoaded", () => {
    setYear();
    revealOnScroll();
    setupParallax();
    setupTiltCards();
    setupCursor();
    setupParticles();
    setupHeaderState();
  });
})();