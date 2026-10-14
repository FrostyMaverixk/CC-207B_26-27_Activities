
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -30px 0px",
        }
    );

    revealElements.forEach((element, index) => {
        element.style.transitionDelay = `${(index % 3) * 80}ms`;
        revealObserver.observe(element);
    });
} else {
    revealElements.forEach((element) => {
        element.classList.add("is-visible");
    });
}

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );

        menuToggle.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 650) {
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
    });
}

const currentYear = document.getElementById("currentYear");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("is-visible");

    window.clearTimeout(toastTimeout);

    toastTimeout = window.setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 3000);
}

document.querySelectorAll(".placeholder-link").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();

        showToast(
            "This link is still a placeholder! Add your real project URL in index.html."
        );
    });
});

const workCards = document.querySelectorAll(".work-card");

workCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        const rect = card.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;

        const tiltY = (relativeX - 0.5) * 3;
        const tiltX = (0.5 - relativeY) * 3;

        card.style.setProperty("--tilt-x", `${tiltX}deg`);
        card.style.setProperty("--tilt-y", `${tiltY}deg`);
    });

    card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
    });
});

const comicBurst = document.querySelector(".comic-burst");

if (comicBurst) {
    comicBurst.style.cursor = "pointer";
    comicBurst.setAttribute("role", "button");
    comicBurst.setAttribute("tabindex", "0");
    comicBurst.setAttribute("aria-label", "Show a little encouragement");

    const burstMessages = [
        "POW!",
        "YOU GOT THIS!",
        "KEEP CREATING!",
        "WOW!",
        "MAKE STUFF!"
    ];

    let burstIndex = 0;

    function changeBurst() {
        burstIndex = (burstIndex + 1) % burstMessages.length;
        comicBurst.textContent = burstMessages[burstIndex];
    }

    comicBurst.addEventListener("click", changeBurst);

    comicBurst.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            changeBurst();
        }
    });
}

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

if (prefersReducedMotion.matches) {
    revealElements.forEach((element) => {
        element.classList.add("is-visible");
    });
}