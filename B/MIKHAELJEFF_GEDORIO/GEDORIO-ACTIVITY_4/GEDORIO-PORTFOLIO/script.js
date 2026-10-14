// Simple JavaScript for the portfolio

console.log("Portfolio website loaded successfully!");

const links = document.querySelectorAll("nav a");

links.forEach(function(link) {
    link.addEventListener("click", function() {
        console.log("Navigating to " + link.textContent);
    });
});