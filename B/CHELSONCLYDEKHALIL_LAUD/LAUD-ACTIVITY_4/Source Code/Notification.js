const button = document.querySelector("button"),
  toast = document.querySelector(".toast"),
  closeIcon = document.querySelector(".close"),
  progress = document.querySelector(".progress");


button.addEventListener("click", () => {
  toast.classList.add("active");
  progress.classList.add("active");

  progress.addEventListener(
    "animationend",
    () => {
      toast.classList.add("hide"); 
      setTimeout(() => {
        toast.classList.remove("active", "hide"); 
        progress.classList.remove("active");
      }, 500); 
    },
    { once: true } 
  );
});


closeIcon.addEventListener("click", () => {
  toast.classList.add("hide"); 
  setTimeout(() => {
    toast.classList.remove("active", "hide"); 
    progress.classList.remove("active");
  }, 500); 
});