const welcomeButton = document.getElementById("welcomeButton");
const moreButton = document.getElementById("moreButton");
const extraInfo = document.getElementById("extraInfo");
const year = document.getElementById("year");

welcomeButton.addEventListener("click", function () {
    alert("Welcome to my portfolio!");
});

moreButton.addEventListener("click", function () {
    extraInfo.classList.toggle("hidden");

    if (extraInfo.classList.contains("hidden")) {
        moreButton.textContent = "Show More";
    } else {
        moreButton.textContent = "Show Less";
    }
});

year.textContent = new Date().getFullYear();
