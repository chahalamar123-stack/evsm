document.documentElement.classList.add("js");

const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.querySelector(".nav-panel");
const contactForm = document.querySelector("[data-contact-form]");
const statusField = document.querySelector("[data-form-status]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const syncScrollState = () => {
  body.classList.toggle("is-scrolled", window.scrollY > 18);
};

syncScrollState();
window.addEventListener("scroll", syncScrollState, { passive: true });

if (navToggle && navPanel) {
  const closeMenu = () => {
    body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const nextExpanded = navToggle.getAttribute("aria-expanded") !== "true";
    navToggle.setAttribute("aria-expanded", String(nextExpanded));
    body.classList.toggle("nav-open", nextExpanded);
  });

  navPanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

if (!prefersReducedMotion.matches) {
  const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
  revealElements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 220)}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

  const parallaxNodes = Array.from(document.querySelectorAll("[data-parallax]"));

  if (parallaxNodes.length) {
    let ticking = false;

    const updateParallax = () => {
      const y = Math.min(window.scrollY, 800);
      parallaxNodes.forEach((node) => {
        const depth = Number(node.dataset.parallax) || 18;
        node.style.setProperty("--parallax-shift", `${y / depth}px`);
      });
      ticking = false;
    };

    const requestParallax = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    updateParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
  }
} else {
  document.querySelectorAll("[data-reveal]").forEach((element) => {
    element.classList.add("is-visible");
  });
}

const counterElements = Array.from(document.querySelectorAll("[data-count]"));

if (counterElements.length && !prefersReducedMotion.matches) {
  const animateCounter = (element) => {
    const target = Number(element.dataset.count || element.textContent);
    const length = String(target).length;
    const start = performance.now();
    const duration = 1000;

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = String(value).padStart(length, "0");

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counterElements.forEach((element) => {
    counterObserver.observe(element);
  });
} else {
  counterElements.forEach((element) => {
    const target = Number(element.dataset.count || element.textContent);
    const length = String(target).length;
    element.textContent = String(target).padStart(length, "0");
  });
}

if (contactForm && statusField) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactForm.reset();
    statusField.textContent =
      "Your inquiry layout is ready. Connect this form to your preferred inbox or CRM endpoint before launch.";
  });
}
