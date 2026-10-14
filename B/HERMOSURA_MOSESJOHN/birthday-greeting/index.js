const envelope = document.getElementById("envelope");
const letterText = document.getElementById("letter-text");

const fullText = letterText.innerHTML;
letterText.innerHTML = "";

let isOpen = false;
let petalInterval = null;
let typingStarted = false;

/* ================= CLICK ================= */

envelope.addEventListener("click", () => {
  isOpen = !isOpen;

  envelope.classList.toggle("open");
  envelope.parentElement.classList.toggle("open-wrapper");

  if (isOpen) {
    startPetals();

    if (!typingStarted) {
      // wait for paper to fully settle
      setTimeout(() => {
        typeLetter();
      }, 600); // matches paper animation
    }
  } else {
    stopPetals();
  }
});

/* ================= TYPEWRITER ================= */

function typeLetter() {
  let i = 0;
  typingStarted = true;

  const typingInterval = setInterval(() => {
    letterText.innerHTML += fullText.charAt(i);
    i++;

    if (i >= fullText.length) {
      clearInterval(typingInterval);
    }
  }, 22);
}

/* ================= PETALS ================= */

function startPetals() {
  if (petalInterval) return;

  petalInterval = setInterval(() => {
    const petal = document.createElement("div");
    petal.className = "petal";

    petal.style.left = Math.random() * 100 + "vw";
    petal.style.animationDuration = 5 + Math.random() * 5 + "s";

    document.body.appendChild(petal);
    setTimeout(() => petal.remove(), 10000);
  }, 350);
}

function stopPetals() {
  clearInterval(petalInterval);
  petalInterval = null;
}
