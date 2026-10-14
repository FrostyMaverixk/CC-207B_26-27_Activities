document.addEventListener('DOMContentLoaded', async function() {
  let next = document.querySelector('.next');
  let prev = document.querySelector('.prev');
  let deleteButton = document.querySelector('#delete-button');
  let editButton = document.querySelector('.icon-button.edit'); // Edit button

  next.addEventListener('click', function() {
      let items = document.querySelectorAll('.item');
      items[4].style.display = 'none'; // Hide the 4th slide before moving it
      document.querySelector('.slide').appendChild(items[0]);
      disableButtons();
      showHiddenSlides(); // Show the hidden slides when navigation occurs
  });

  prev.addEventListener('click', function() {
      let items = document.querySelectorAll('.item');
      items[4].style.display = 'none'; // Hide the 4th slide before moving it
      document.querySelector('.slide').prepend(items[items.length - 1]);
      disableButtons();
      showHiddenSlides(); // Show the hidden slides when navigation occurs
  });

  document.getElementById('delete-button').addEventListener('click', function() {
    let selectedSlide = document.querySelector('.slide .item.active');
    if (selectedSlide) {
        if (selectedSlide.getAttribute('data-predefined') === 'true') {
            showNotification('Cannot delete predefined slides.', 'red');
            return;
        }

        let slideName = selectedSlide.querySelector('.name').textContent;
        let slideDescription = selectedSlide.querySelector('.des').textContent;

        // Remove slide from DOM
        selectedSlide.remove();

        // Remove slide from localStorage
        let storedSlides = JSON.parse(localStorage.getItem("slides")) || [];
        const slideIndex = storedSlides.findIndex(slide => slide.name === slideName && slide.description === slideDescription);

        if (slideIndex !== -1) {
            storedSlides.splice(slideIndex, 1); // Remove the slide from the array
            localStorage.setItem("slides", JSON.stringify(storedSlides)); // Update localStorage

            // Remove corresponding thread page data
            localStorage.removeItem(`threadAdd${slideIndex + 1}`);
        }

        // Log current localStorage state
        logLocalStorage();
        showHiddenSlides(); // Ensure visibility is updated

        // Show notification for successful deletion
        showNotification('You deleted a thread.', 'red');
    } else {
        // Show notification for no slide selected
        showNotification('No slide selected to delete.', 'red');
    }
});


function logLocalStorage() {
    console.log("Current localStorage state:", localStorage);
}

function showHiddenSlides() {
    const slides = document.querySelectorAll('.slide .item');
    slides.forEach(slide => {
        slide.style.display = 'block';
    });
}



document.addEventListener('DOMContentLoaded', function() {
    const editButton = document.querySelector('.icon-button.edit');
    
    // Initially disable the edit button
    editButton.disabled = true;

    // Add an event listener for the disabled state
    editButton.addEventListener('click', function(event) {
        if (editButton.disabled) {
            event.preventDefault(); // Prevent the default action if button is disabled
            showNotification('No slide selected to edit.', 'red');
        }
    });

    // Event listener for slide selection for existing slides
    document.querySelectorAll('.slide .item').forEach(slide => {
        slide.addEventListener('click', function() {
            console.log('Slide clicked:', this); // Log to check slide selection

            // Make this slide active and others inactive
            document.querySelectorAll('.slide .item').forEach(s => s.classList.remove('active'));
            this.classList.add('active');

            // Enable edit button only if the slide is dynamically added
            if (this.classList.contains('dynamic-slide')) {
                editButton.disabled = false;
                console.log('Edit button enabled'); // Log to check if edit button is enabled
            } else {
                editButton.disabled = true;
                console.log('Edit button disabled'); // Log to check if edit button is disabled
            }
        });
    });
});



  // Edit button functionality
editButton.addEventListener('click', function() {
  console.log('Edit button clicked'); // Log to check button click

  let selectedSlide = document.querySelector('.slide .item.active.dynamic-slide');
  console.log('Selected slide:', selectedSlide); // Log to check if a slide is selected

  if (selectedSlide) {
      let slideName = selectedSlide.querySelector('.name').textContent;
      let slideDescription = selectedSlide.querySelector('.des').textContent;
      let slideImage = selectedSlide.style.backgroundImage.slice(5, -2); // Remove url("")

      // Retrieve additional attributes
      let slideFoodName = selectedSlide.getAttribute('data-food-name') || '';
      let slideFoodDescription = selectedSlide.getAttribute('data-food-description') || '';
      let slideCultureName = selectedSlide.getAttribute('data-culture-name') || '';
      let slideCultureDescription = selectedSlide.getAttribute('data-culture-description') || '';
      let slideAttractionName = selectedSlide.getAttribute('data-attraction-name') || '';
      let slideAttractionDescription = selectedSlide.getAttribute('data-attraction-description') || '';

      // Store the current slide data in localStorage for editing
      const slideData = {
          name: slideName,
          description: slideDescription,
          image: slideImage,
          foodName: slideFoodName,
          foodDescription: slideFoodDescription,
          cultureName: slideCultureName,
          cultureDescription: slideCultureDescription,
          attractionName: slideAttractionName,
          attractionDescription: slideAttractionDescription
      };
      console.log('Slide data to be stored:', slideData); // Log to check slide data

      localStorage.setItem("editSlide", JSON.stringify(slideData));

      // Redirect to edit form
      window.location.href = "FORM-EDIT.html";
  } else {
      showNotification('No slide selected to edit.', 'red');
  }
});


  // Function to disable next and prev buttons temporarily
function disableButtons() {
  let next = document.querySelector('.next');
  let prev = document.querySelector('.prev');
  next.disabled = true;
  prev.disabled = true;
  setTimeout(() => {
      next.disabled = false;
      prev.disabled = false;
  }, 500);
}

  // Function to show hidden slides
  function showHiddenSlides() {
      let items = document.querySelectorAll('.item');
      items.forEach((item, index) => {
          item.style.display = 'block'; // Show all slides initially
      });
      // Hide slides beyond the 4th
      for (let i = 4; i < items.length; i++) {
          items[i].style.display = 'none';
      }

      if (items.length > 4) {
          items[4].style.display = 'block'; // Show the hidden slide
      }
  }

  // Function to add a new slide dynamically
  window.addNewSlide = async function(name, description, imageId, foodName, foodDescription, cultureName, cultureDescription, attractionName, attractionDescription) {
      console.log('Adding new slide with parameters:', { name, description, imageId, foodName, foodDescription, cultureName, cultureDescription, attractionName, attractionDescription });

      const slideContainer = document.querySelector('.slide'); // Where the slides are displayed
      const newSlide = document.createElement('div');
      newSlide.classList.add('item', 'dynamic-slide'); // Add 'dynamic-slide' class
      const image = await getImageFromIndexedDB(imageId); // Fetch the image from IndexedDB

      newSlide.style.backgroundImage = `url(${image})`;
      newSlide.style.backgroundSize = 'cover'; // Ensure the background covers the whole slide
      newSlide.style.backgroundPosition = 'center'; // Center the background image
      newSlide.style.backgroundColor = '#000'; // Ensure solid background
      newSlide.style.opacity = 1; // Ensure full opacity

      // Set additional attributes
      newSlide.setAttribute('data-food-name', foodName);
      newSlide.setAttribute('data-food-description', foodDescription);
      newSlide.setAttribute('data-culture-name', cultureName);
      newSlide.setAttribute('data-culture-description', cultureDescription);
      newSlide.setAttribute('data-attraction-name', attractionName);
      newSlide.setAttribute('data-attraction-description', attractionDescription);

      const contentDiv = document.createElement('div');
      contentDiv.classList.add('content');

      const nameDiv = document.createElement('div');
      nameDiv.classList.add('name');
      nameDiv.textContent = name;

      const descDiv = document.createElement('div');
      descDiv.classList.add('des');
      descDiv.textContent = description;

      const button = document.createElement('button');
      button.textContent = 'Explore';

      contentDiv.appendChild(nameDiv);
      contentDiv.appendChild(descDiv);
      contentDiv.appendChild(button);
      newSlide.appendChild(contentDiv);

      // Add event listener to new slide for selection and enabling edit button
      newSlide.addEventListener('click', function() {
          console.log('New slide clicked:', this); // Log to check slide selection
          document.querySelectorAll('.slide .item').forEach(s => s.classList.remove('active'));
          this.classList.add('active');

          // Enable edit button only if the slide is dynamically added
          const editButton = document.querySelector('.icon-button.edit');
          if (this.classList.contains('dynamic-slide')) {
              editButton.disabled = false;
              console.log('Edit button enabled for new slide'); // Log to check if edit button is enabled
          } else {
              editButton.disabled = true;
              console.log('Edit button disabled for new slide'); // Log to check if edit button is disabled
          }
      });

      newSlide.style.display = 'none'; // Initially hide new slides
      slideContainer.appendChild(newSlide); // Adds the new slide to the carousel

      console.log('New slide added:', newSlide); // Log to check the new slide
      logLocalStorage();
  };

  // Function to load slides from localStorage
  async function loadSlides() {
      const storedSlides = JSON.parse(localStorage.getItem("slides")) || [];
      for (const slideData of storedSlides) {
          await addNewSlide(slideData.name, slideData.description, slideData.imageId, slideData.foodName, slideData.foodDescription, slideData.cultureName, slideData.cultureDescription, slideData.attractionName, slideData.attractionDescription);
      }
      showHiddenSlides(); // Adjust visibility of all slides on load
  }

  // Log localStorage state
  function logLocalStorage() {
      console.log("Current localStorage state:", JSON.parse(localStorage.getItem("slides")));
  }

  // Load existing slides from localStorage
  await loadSlides();

  // Load new slide data from localStorage and add it to the carousel
  const newSlideData = JSON.parse(localStorage.getItem("newSlide"));
  if (newSlideData) {
      let storedSlides = JSON.parse(localStorage.getItem("slides")) || [];
      storedSlides.push(newSlideData); // Add new slide to stored slides
      localStorage.setItem("slides", JSON.stringify(storedSlides)); // Update localStorage
      await addNewSlide(newSlideData.name, newSlideData.description, newSlideData.imageId, newSlideData.foodName, newSlideData.foodDescription, newSlideData.cultureName, newSlideData.cultureDescription, newSlideData.attractionName, newSlideData.attractionDescription);
      localStorage.removeItem("newSlide"); // Clear data after use
      showHiddenSlides(); // Adjust visibility of all slides
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const loggedInUser = localStorage.getItem('loggedInUser');
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  const createButton = document.querySelector('.icon-button.create');
  const editButton = document.querySelector('.icon-button.edit');
  const deleteButton = document.querySelector('.icon-button.delete');

  function setButtonVisibility(isHidden) {
      if (isHidden) {
          createButton.classList.add('hidden');
          editButton.classList.add('hidden');
          deleteButton.classList.add('hidden');
      } else {
          createButton.classList.remove('hidden');
          editButton.classList.remove('hidden');
          deleteButton.classList.remove('hidden');
      }
  }

  if (loggedInUser === 'Guest') {
      setButtonVisibility(true);
  } else {
      const user = users.find(user => user.username === loggedInUser);
      if (user && user.userType === 'regular') {
          setButtonVisibility(true);
      } else {
          setButtonVisibility(false);
      }
  }
});



const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
  sidebar.classList.toggle('close');
  toggleButton.classList.toggle('rotate');

  closeAllSubMenus();
}

function toggleSubMenu(button) {
  if (!button.nextElementSibling.classList.contains('show')) {
    closeAllSubMenus();
  }

  button.nextElementSibling.classList.toggle('show');
  button.classList.toggle('rotate');

  if (sidebar.classList.contains('close')) {
    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');
  }
}

function closeAllSubMenus() {
  Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
    ul.classList.remove('show');
    ul.previousElementSibling.classList.remove('rotate');
  });
}

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

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('showNotification') === 'true') {
      showNotification('You added a thread', 'blue').then(() => {
        // Clear the flag from localStorage
        localStorage.removeItem('showNotification');
      });
    }
  });

//pre-loader

var loader = document.getElementById("pre-loader");
window.addEventListener("load", function() {
setTimeout(function() {
loader.style.display = "none";
}, 1500);
});
