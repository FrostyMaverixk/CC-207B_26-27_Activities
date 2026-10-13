document.addEventListener('DOMContentLoaded', () => {
    const greetBtn = document.getElementById('greetBtn');
    const message = document.getElementById('message');
  
    greetBtn.addEventListener('click', () => {
      message.textContent = 'Hello! Thanks for visiting my portfolio activity!';
    });
  });