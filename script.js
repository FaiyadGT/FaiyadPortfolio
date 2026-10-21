const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const progressBar = document.querySelector(".scroll-progress span");
const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const slides = [...document.querySelectorAll("main section[id]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const slideDuration = 1450;
let isAnimatingSlide = false;
let scrollFrame = null;

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navLinks.classList.remove("is-open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  navLinks.classList.toggle("is-open", !isOpen);
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function slideTarget(slide) {
  const offset = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  return Math.max(0, slide.offsetTop - offset);
}

function scrollToSlide(slide) {
  if (!slide) return;
  if (reducedMotion.matches) {
    window.scrollTo({ top: slideTarget(slide), behavior: "auto" });
    return;
  }

  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  const startY = window.scrollY;
  const targetY = slideTarget(slide);
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;

  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  isAnimatingSlide = true;
  let startTime;

  function animateSlide(time) {
    if (startTime === undefined) startTime = time;
    const progress = Math.min((time - startTime) / slideDuration, 1);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      scrollFrame = requestAnimationFrame(animateSlide);
      return;
    }

    window.scrollTo(0, targetY);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    isAnimatingSlide = false;
    scrollFrame = null;
  }

  scrollFrame = requestAnimationFrame(animateSlide);
}

function activeSlideIndex() {
  const referenceY = Math.min(window.innerHeight * 0.55, window.innerHeight - 1);
  return slides.findIndex((slide) => {
    const bounds = slide.getBoundingClientRect();
    return bounds.top <= referenceY && bounds.bottom > referenceY;
  });
}

function moveSlide(direction) {
  const currentIndex = activeSlideIndex();
  const nextIndex = Math.max(0, Math.min(slides.length - 1, currentIndex + direction));
  if (nextIndex !== currentIndex) scrollToSlide(slides[nextIndex]);
}

window.addEventListener("wheel", (event) => {
  if (reducedMotion.matches || Math.abs(event.deltaY) < Math.abs(event.deltaX) || event.deltaY === 0) return;
  if (isAnimatingSlide) {
    event.preventDefault();
    return;
  }
  const currentIndex = activeSlideIndex();
  const nextIndex = currentIndex + (event.deltaY > 0 ? 1 : -1);
  if (nextIndex < 0 || nextIndex >= slides.length) return;
  event.preventDefault();
  scrollToSlide(slides[nextIndex]);
}, { passive: false });

document.addEventListener("keydown", (event) => {
  if (reducedMotion.matches || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.target.matches("a, button, input, textarea, select, [contenteditable='true']")) return;
  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    moveSlide(1);
  } else if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    moveSlide(-1);
  }
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.hash);
    if (!target || !slides.includes(target)) return;
    event.preventDefault();
    if (window.location.hash !== link.hash) history.pushState(null, "", link.hash);
    scrollToSlide(target);
  });
});

function updateScrollProgress() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

if ("IntersectionObserver" in window) {
  document.body.classList.add("js-ready");

  const revealTargets = document.querySelectorAll(
    ".section-heading, .about-copy, .fact-card, .experience-entry, .skill-group, .project-card, .contact-inner > *",
  );

  revealTargets.forEach((element, index) => {
    element.classList.add("reveal");
    if (index % 3 === 1) element.classList.add("reveal-delay-1");
    if (index % 3 === 2) element.classList.add("reveal-delay-2");
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

  revealTargets.forEach((element) => revealObserver.observe(element));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        if (link.hash === `#${entry.target.id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  }, { rootMargin: "-25% 0px -65% 0px" });

  document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
}
