(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const counterItems = Array.from(document.querySelectorAll("[data-count-to]"));
  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  const tiltItems = Array.from(document.querySelectorAll("[data-tilt]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  const magneticItems = Array.from(
    document.querySelectorAll(".nav-cta, .button, .footer-cta, .store-row a")
  );
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (menuToggle && siteNav) {
    const closeMenu = () => {
      siteNav.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    };

    navLinks.forEach((link) => link.addEventListener("click", closeMenu));
    window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  }

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const animateCounter = (counter) => {
    if (counter.dataset.counted === "true") return;

    counter.dataset.counted = "true";
    const endValue = Number(counter.dataset.countTo || 0);
    const suffix = counter.dataset.countSuffix || "";

    if (reduceMotion) {
      counter.textContent = `${endValue}${suffix}`;
      return;
    }

    const duration = clamp(900 + endValue * 40, 900, 1500);
    const start = performance.now();
    counter.textContent = `0${suffix}`;

    const tick = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      counter.textContent = `${Math.round(endValue * eased)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target;
          element.classList.add("is-visible");
          element
            .querySelectorAll("[data-count-to]")
            .forEach((counter) => animateCounter(counter));

          if (element.matches("[data-count-to]")) {
            animateCounter(element);
          }

          revealObserver.unobserve(element);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.16,
      }
    );

    revealItems.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 60}ms`);
      revealObserver.observe(element);
    });
  } else {
    revealItems.forEach((element) => element.classList.add("is-visible"));
    counterItems.forEach((counter) => animateCounter(counter));
  }

  if (reduceMotion) {
    root.classList.add("motion-reduced");
    revealItems.forEach((element) => element.classList.add("is-visible"));
    counterItems.forEach((counter) => animateCounter(counter));
  }

  const updateActiveNav = () => {
    let activeHash = "#site";

    navLinks.forEach((link) => {
      const target = document.querySelector(link.hash);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.48) {
        activeHash = link.hash;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.hash === activeHash);
    });
  };

  let scrollTicking = false;

  const updateScrollMotion = () => {
    scrollTicking = false;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty("--scroll-progress", progress.toFixed(4));
    root.classList.toggle("is-scrolled", window.scrollY > 16);

    if (!reduceMotion) {
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax || 0.05);
        const rect = item.getBoundingClientRect();
        const distanceFromCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
        const offset = clamp(distanceFromCenter * speed * -1, -42, 42);
        item.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
      });
    }

    updateActiveNav();
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollMotion);
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  requestScrollUpdate();

  if (!reduceMotion && finePointer) {
    tiltItems.forEach((item) => {
      item.addEventListener("pointermove", (event) => {
        const rect = item.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

        item.style.setProperty("--tilt-x", `${((0.5 - y) * 8).toFixed(2)}deg`);
        item.style.setProperty("--tilt-y", `${((x - 0.5) * 9).toFixed(2)}deg`);
        item.style.setProperty("--spotlight-x", `${(x * 100).toFixed(2)}%`);
        item.style.setProperty("--spotlight-y", `${(y * 100).toFixed(2)}%`);
        item.style.setProperty("--hover-y", "-8px");
      });

      item.addEventListener("pointerleave", () => {
        item.style.setProperty("--tilt-x", "0deg");
        item.style.setProperty("--tilt-y", "0deg");
        item.style.setProperty("--hover-y", "0px");
      });
    });

    magneticItems.forEach((item) => {
      item.addEventListener("pointermove", (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - (rect.left + rect.width / 2);
        const y = event.clientY - (rect.top + rect.height / 2);

        item.style.setProperty("--magnet-x", `${clamp(x * 0.16, -10, 10).toFixed(2)}px`);
        item.style.setProperty("--magnet-y", `${clamp(y * 0.2, -8, 8).toFixed(2)}px`);
      });

      item.addEventListener("pointerleave", () => {
        item.style.setProperty("--magnet-x", "0px");
        item.style.setProperty("--magnet-y", "0px");
      });
    });

    let pointerTicking = false;
    let pointerEvent = null;

    document.addEventListener(
      "pointermove",
      (event) => {
        pointerEvent = event;
        if (pointerTicking) return;

        pointerTicking = true;
        requestAnimationFrame(() => {
          pointerTicking = false;
          const x = ((pointerEvent.clientX / window.innerWidth) - 0.5) * 24;
          const y = ((pointerEvent.clientY / window.innerHeight) - 0.5) * 18;

          root.style.setProperty("--cursor-shift-x", `${x.toFixed(2)}px`);
          root.style.setProperty("--cursor-shift-y", `${y.toFixed(2)}px`);
        });
      },
      { passive: true }
    );
  }
})();
