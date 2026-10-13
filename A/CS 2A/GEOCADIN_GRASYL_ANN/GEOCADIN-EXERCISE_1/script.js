const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeToggle.textContent = "☀️";
    } else {
        themeToggle.textContent = "🌙";
    }
});

const contactButton = document.getElementById("contactButton");

contactButton.addEventListener("click", function () {
    alert("Thank you for visiting my portfolio!");
});

document.getElementById("year").textContent = new Date().getFullYear();