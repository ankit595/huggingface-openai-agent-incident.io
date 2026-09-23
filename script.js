const slides = [...document.querySelectorAll(".slide")];
const previousButton = document.querySelector(".prev");
const nextButton = document.querySelector(".next");
const progress = document.querySelector(".progress-track i");
const slideCount = document.querySelector(".slide-count");
const chapterName = document.querySelector(".chapter-name");
const notesToggle = document.querySelector(".notes-toggle");
const notesPanel = document.querySelector(".notes-panel");
const notesText = notesPanel.querySelector("p");
const notesClose = notesPanel.querySelector("button");
const cursorGlow = document.querySelector(".cursor-glow");

let current = 0;

function formatNumber(value, compact) {
  if (compact && value >= 1000) {
    return `${Math.round(value / 1000)}K+`;
  }
  return value.toLocaleString();
}

function animateCounters(slide) {
  slide.querySelectorAll("[data-count]").forEach((counter) => {
    const target = Number(counter.dataset.count);
    const suffix = counter.dataset.suffix || "";
    const compact = counter.dataset.format === "compact";
    const start = performance.now();
    const duration = 1100;

    function tick(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const value = Math.round(target * eased);
      counter.textContent = `${formatNumber(value, compact)}${suffix}`;
      if (elapsed < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

function updateNotes() {
  notesText.textContent = slides[current].querySelector(".notes")?.textContent.trim() || "";
}

function goTo(index) {
  const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
  if (nextIndex === current && slides[current].classList.contains("active")) return;

  slides[current]?.classList.remove("active");
  current = nextIndex;
  slides[current].classList.add("active");

  const displayed = String(current + 1).padStart(2, "0");
  slideCount.textContent = `${displayed} / ${String(slides.length).padStart(2, "0")}`;
  progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  chapterName.textContent = slides[current].dataset.chapter;
  previousButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1;
  updateNotes();
  animateCounters(slides[current]);

  history.replaceState(null, "", `#${current + 1}`);
}

function toggleNotes(force) {
  const shouldOpen = typeof force === "boolean" ? force : !notesPanel.classList.contains("open");
  notesPanel.classList.toggle("open", shouldOpen);
  notesPanel.setAttribute("aria-hidden", String(!shouldOpen));
  notesToggle.setAttribute("aria-pressed", String(shouldOpen));
}

previousButton.addEventListener("click", () => goTo(current - 1));
nextButton.addEventListener("click", () => goTo(current + 1));
notesToggle.addEventListener("click", () => toggleNotes());
notesClose.addEventListener("click", () => toggleNotes(false));

document.addEventListener("keydown", (event) => {
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(event.key)) {
    event.preventDefault();
    goTo(current + 1);
  }
  if (["ArrowLeft", "PageUp", "Backspace"].includes(event.key)) {
    event.preventDefault();
    goTo(current - 1);
  }
  if (event.key.toLowerCase() === "n") toggleNotes();
  if (event.key === "Escape") toggleNotes(false);
  if (event.key === "Home") goTo(0);
  if (event.key === "End") goTo(slides.length - 1);
});

let wheelLocked = false;
document.addEventListener(
  "wheel",
  (event) => {
    if (wheelLocked || Math.abs(event.deltaY) < 18) return;
    wheelLocked = true;
    goTo(current + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLocked = false;
    }, 700);
  },
  { passive: true },
);

let touchStartX = 0;
document.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
});
document.addEventListener("touchend", (event) => {
  const distance = touchStartX - event.changedTouches[0].clientX;
  if (Math.abs(distance) > 50) goTo(current + (distance > 0 ? 1 : -1));
});

document.addEventListener("pointermove", (event) => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

const hashSlide = Number.parseInt(window.location.hash.slice(1), 10) - 1;
current = Number.isInteger(hashSlide) && hashSlide >= 0 && hashSlide < slides.length ? hashSlide : 0;
slides.forEach((slide, index) => slide.classList.toggle("active", index === current));
updateNotes();
goTo(current);

// goTo exits early for the initial active slide, so set initial chrome explicitly.
slideCount.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
progress.style.width = `${((current + 1) / slides.length) * 100}%`;
chapterName.textContent = slides[current].dataset.chapter;
previousButton.disabled = current === 0;
nextButton.disabled = current === slides.length - 1;
animateCounters(slides[current]);
