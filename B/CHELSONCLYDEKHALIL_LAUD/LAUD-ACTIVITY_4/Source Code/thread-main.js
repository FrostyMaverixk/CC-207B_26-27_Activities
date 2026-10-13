/*Sidebar*/
const toggleButton = document.getElementById('toggle-btn')
const sidebar = document.getElementById('sidebar')

function toggleSidebar(){
sidebar.classList.toggle('close')
toggleButton.classList.toggle('rotate')

closeAllSubMenus()
}

function toggleSubMenu(button){

if(!button.nextElementSibling.classList.contains('show')){
  closeAllSubMenus()
}

button.nextElementSibling.classList.toggle('show')
button.classList.toggle('rotate')

if(sidebar.classList.contains('close')){
  sidebar.classList.toggle('close')
  toggleButton.classList.toggle('rotate')
}
}

function closeAllSubMenus(){
Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
  ul.classList.remove('show')
  ul.previousElementSibling.classList.remove('rotate')
})
}

document.querySelectorAll('.about__btn').forEach(btn => {
  btn.addEventListener('click', event => {
    event.preventDefault(); // Prevent default link behavior

    const readMoreBtn = event.target;
    const aboutContent = readMoreBtn.closest('.about__content');
    const readMoreText = aboutContent.querySelector('.read-more-text');

    if (readMoreBtn && readMoreText) {
      readMoreText.classList.toggle('read-more-text--show');
      readMoreBtn.textContent = readMoreBtn.textContent.includes('Read More')
        ? "Read Less..." : "Read More...";
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const subMenu = document.querySelector('.sub-menu div');

  function addSubMenuItem(name, url) {
      const newListItem = document.createElement('li');
      const newLink = document.createElement('a');
      newLink.href = url;
      newLink.textContent = name;
      newListItem.appendChild(newLink);
      subMenu.appendChild(newListItem);
  }

  function loadSidebarItems() {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('threadAdd'));
      keys.sort((a, b) => a.localeCompare(b)); // Sort keys to ensure the correct order

      keys.forEach(key => {
          const item = JSON.parse(localStorage.getItem(key));
          if (item && item.name) {
              const url = `thread-add${key.replace('threadAdd', '')}.html`;
              addSubMenuItem(item.name, url);
          }
      });
  }

  loadSidebarItems();
});

//pre-loader

var loader = document.getElementById("pre-loader");
window.addEventListener("load", function() {
    setTimeout(function() {
        loader.style.display = "none";
    }, 1500);
});



