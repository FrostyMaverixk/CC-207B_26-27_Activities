// Show the current year in the footer
document.getElementById("year").textContent = new Date().getFullYear();

// Dark mode toggle
const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark");
});
