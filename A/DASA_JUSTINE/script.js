// Keep the page interactions in one place and wait until the HTML is ready.
document.addEventListener("DOMContentLoaded", () => {
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const menuToggle = document.querySelector(".menu-toggle");
	const navLinks = document.querySelector(".nav-links");
	const backToTop = document.querySelector(".back-to-top");
	const typingText = document.querySelector("[data-typing-text]");
	const year = document.querySelector("#current-year");

	// Fill in the footer year automatically.
	if (year) {
		year.textContent = new Date().getFullYear();
	}

	// Type the role line once, then leave the complete title on screen.
	if (typingText) {
		const fullText = typingText.dataset.typingText || "";

		if (reducedMotion) {
			typingText.textContent = fullText;
		} else {
			let characterIndex = 0;
			const typeNextCharacter = () => {
				typingText.textContent = fullText.slice(0, characterIndex);
				characterIndex += 1;

				if (characterIndex <= fullText.length) {
					window.setTimeout(typeNextCharacter, 45);
				}
			};

			window.setTimeout(typeNextCharacter, 420);
		}
	}

	// Open and close the small-screen navigation, including with Escape.
	const setMenuOpen = (isOpen) => {
		if (!menuToggle || !navLinks) return;
		menuToggle.setAttribute("aria-expanded", String(isOpen));
		menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
		navLinks.classList.toggle("is-open", isOpen);
		document.body.classList.toggle("menu-open", isOpen);
	};

	menuToggle?.addEventListener("click", () => {
		const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
		setMenuOpen(!isOpen);
	});

	navLinks?.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", () => setMenuOpen(false));
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") setMenuOpen(false);
	});

	window.addEventListener("resize", () => {
		if (window.innerWidth > 640) setMenuOpen(false);
	});

	// Reveal sections as they enter the viewport, with a graceful fallback.
	const revealItems = document.querySelectorAll(".reveal");
	if ("IntersectionObserver" in window && !reducedMotion) {
		const revealObserver = new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12 });

		revealItems.forEach((item) => revealObserver.observe(item));
	} else {
		revealItems.forEach((item) => item.classList.add("is-visible"));
	}

	// Select the section nearest the top of the reading area during scrolling.
	const sections = document.querySelectorAll("main section[id]");
	const sectionLinks = document.querySelectorAll('.nav-link[href^="#"]');
	const updateActiveNavigation = () => {
		const activationPoint = window.innerHeight * 0.4;
		let activeSection = sections[0];

		sections.forEach((section) => {
			if (section.getBoundingClientRect().top <= activationPoint) activeSection = section;
		});

		sectionLinks.forEach((link) => {
			const isActive = link.getAttribute("href") === `#${activeSection.id}`;
			link.classList.toggle("active", isActive);
			if (isActive) link.setAttribute("aria-current", "location");
			else link.removeAttribute("aria-current");
		});
	};

	const updateScrollState = () => {
		backToTop?.classList.toggle("visible", window.scrollY > 480);
		updateActiveNavigation();
	};
	window.addEventListener("scroll", updateScrollState, { passive: true });
	window.addEventListener("resize", updateActiveNavigation);
	updateScrollState();
});
