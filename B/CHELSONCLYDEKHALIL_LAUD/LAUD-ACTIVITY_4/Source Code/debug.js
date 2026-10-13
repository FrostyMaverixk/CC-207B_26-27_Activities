function showNotification(message, type) {
  const notification = type === 'blue' ? document.querySelector('.toast') : document.querySelector('.toasty');
  const progress = notification.querySelector('.progress');
  const messageText = notification.querySelector('.text-2');
  const closeIcon = notification.querySelector('.close');

  return new Promise((resolve) => {
    messageText.textContent = message;

    notification.classList.add('active');
    progress.classList.add('active');

    progress.addEventListener('animationend', () => {
      notification.classList.add('hide');
      setTimeout(() => {
        notification.classList.remove('active', 'hide');
        progress.classList.remove('active');
        resolve();
      }, 500);
    }, { once: true });

    closeIcon.addEventListener('click', () => {
      notification.classList.add('hide');
      setTimeout(() => {
        notification.classList.remove('active', 'hide');
        progress.classList.remove('active');
        resolve();
      }, 500);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const defaultUsers = [
    { username: "Chelson Laud", email: "chelsonlaud@gmail.com", password: "hello12345", userType: "admin" }
  ];

  const users = JSON.parse(localStorage.getItem('users')) || defaultUsers;


  function login() {
    const usernameOrEmail = document.querySelector('#login input[type="text"]').value.trim().toLowerCase();
    const password = document.querySelector('#login input[type="password"]').value.trim();
    const userType = document.querySelector('#login input[list="user"]').value.trim().toLowerCase();

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => (u.username.toLowerCase() === usernameOrEmail || u.email.toLowerCase() === usernameOrEmail) && u.password === password);


    
  
    if (user) {
      if (user.userType.toLowerCase() !== userType) {
        if (user.userType.toLowerCase() === 'admin' && userType === 'regular') {
          showNotification("You are now eligible for Admin. Please change the User Type.", 'red');
        } else if (user.userType.toLowerCase() === 'regular' && userType === 'admin') {
          showNotification("You are not eligible for Admin. Please change the User Type to Regular.", 'red');
        }
      } else {
        showNotification("Login successful. You are about to enter Lagawan", 'blue').then(() => {
          localStorage.setItem('loggedInUser', user.username);
          window.location.href = "Loading.html";
        });
      }
    } else {
      showNotification("Invalid login details", 'red');
    }
    
    
  }


/*Code for FORM.html*/


function register() {
  const firstName = document.querySelector('#register .input-field[placeholder="Firstname"]').value.trim();
  const lastName = document.querySelector('#register .input-field[placeholder="Lastname"]').value.trim();
  const email = document.querySelector('#register .input-field[placeholder="Email"]').value.trim();
  const password = document.querySelector('#register .input-field[placeholder="Password"]').value.trim();
  
  const newUsername = `${firstName} ${lastName}`;
  const newUser = { username: newUsername, email, password, userType: "regular" };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  showNotification("Registration successful. You can now login.", 'blue').then(() => {
  });
}


  function updateNavbar(username) {
    const profileLinks = document.querySelectorAll('nav .home-link, .dropdown-menu h3');
    profileLinks.forEach(link => link.textContent = username);
  }

// Assuming showNotification is already defined earlier in your script
function guestLogin() {
  showNotification("Signing in as Guest. You are about to enter Lagawan", 'blue').then(() => {
    localStorage.setItem('loggedInUser', 'Guest');
    window.location.href = "Loading.html";
  });
}

document.querySelector('#login .submit').addEventListener('click', login);
document.querySelector('#register .submit').addEventListener('click', register);
document.querySelector('#guestLoginBtn').addEventListener('click', guestLogin);


  function myMenuFunction() {
    var i = document.getElementById("navMenu");
    if(i.className === "nav-menu") {
        i.className += " responsive";
    } else {
        i.className = "nav-menu";
    }
  }

  var a = document.getElementById("loginBtn");
  var b = document.getElementById("registerBtn");
  var x = document.getElementById("login");
  var y = document.getElementById("register");

  function loginTransition() {
    x.style.left = "4px";
    y.style.right = "-520px";
    a.className += " white-btn";
    b.className = "btn";
    x.style.opacity = 1;
    y.style.opacity = 0;
  }

  function registerTransition() {
    x.style.left = "-510px";
    y.style.right = "5px";
    a.className = "btn";
    b.className += " white-btn";
    x.style.opacity = 0;
    y.style.opacity = 1;
  }

  a.addEventListener('click', loginTransition);
  b.addEventListener('click', registerTransition);

  document.getElementById("registerLink").addEventListener('click', (event) => { 
    event.preventDefault(); 
    registerTransition(); 
  }); 
  
  document.getElementById("loginLink").addEventListener('click', (event) => { 
    event.preventDefault(); 
    loginTransition(); 
  });

  function resetStoredData() {
    localStorage.removeItem('users');
    alert("Stored data has been reset.");
  }

  document.querySelector('#login .two a').addEventListener('click', resetStoredData);
});


        // Function to save the form data to local storage
        function saveFormData() {
          const name = document.getElementById('name').value;
          const description = document.getElementById('description').value;
          const foodName = document.getElementById('foodName').value;
          const foodDescription = document.getElementById('foodDescription').value;
          const cultureName = document.getElementById('cultureName').value;
          const cultureDescription = document.getElementById('cultureDescription').value;
          const attractionName = document.getElementById('attractionName').value;
          const attractionDescription = document.getElementById('attractionDescription').value;

          localStorage.setItem('name', name);
          localStorage.setItem('description', description);
          localStorage.setItem('foodName', foodName);
          localStorage.setItem('foodDescription', foodDescription);
          localStorage.setItem('cultureName', cultureName);
          localStorage.setItem('cultureDescription', cultureDescription);
          localStorage.setItem('attractionName', attractionName);
          localStorage.setItem('attractionDescription', attractionDescription);
      }

      // Function to load the form data from local storage
      function loadFormData() {
          const name = localStorage.getItem('name');
          const description = localStorage.getItem('description');
          const foodName = localStorage.getItem('foodName');
          const foodDescription = localStorage.getItem('foodDescription');
          const cultureName = localStorage.getItem('cultureName');
          const cultureDescription = localStorage.getItem('cultureDescription');
          const attractionName = localStorage.getItem('attractionName');
          const attractionDescription = localStorage.getItem('attractionDescription');

          if (name) document.getElementById('name').value = name;
          if (description) document.getElementById('description').value = description;
          if (foodName) document.getElementById('foodName').value = foodName;
          if (foodDescription) document.getElementById('foodDescription').value = foodDescription;
          if (cultureName) document.getElementById('cultureName').value = cultureName;
          if (cultureDescription) document.getElementById('cultureDescription').value = cultureDescription;
          if (attractionName) document.getElementById('attractionName').value = attractionName;
          if (attractionDescription) document.getElementById('attractionDescription').value = attractionDescription;
      }

      // Save form data on input change
      document.getElementById('experienceForm').addEventListener('input', saveFormData);

      // Load form data on page load
      window.addEventListener('load', loadFormData);

      document.getElementById('viewExperience').addEventListener('click', () => {
  // Update Text Content
  updateTextContent('.header .section__subheader', 'name');
  updateTextContent('.header .section__header', 'description');

  updateTextContent('.about__content-1 .section__header', 'foodName');
  updateDescription('.about__content-1 p', 'foodDescription');

  updateTextContent('.about__content-2 .section__header', 'cultureName');
  updateDescription('.about__content-2 p', 'cultureDescription');

  updateTextContent('.about__content-3 .section__header', 'attractionName');
  updateDescription('.about__content-3 p', 'attractionDescription');
  
  // Update Images
  updateBackgroundImage(document.getElementById('image').files[0], '.header::before');
  updateImage(document.getElementById('foodImage').files[0], '.about__image-1 img');
  updateImage(document.getElementById('cultureImage').files[0], '.about__image-2 img');
  updateImage(document.getElementById('attractionImage').files[0], '.about__image-3 img');
});

function updateTextContent(selector, inputId) {
  const inputValue = document.getElementById(inputId).value;
  if (inputValue.trim() !== '') {
      document.querySelector(selector).innerText = inputValue;
  }
}

function updateDescription(selector, inputId) {
  const inputValue = document.getElementById(inputId).value;
  if (inputValue.trim() !== '') {
      document.querySelector(selector).innerHTML = splitDescription(inputValue);
  }
}

function splitDescription(description) {
  const words = description.split(' ');
  const firstPart = words.slice(0, 70).join(' ');
  const secondPart = words.slice(70).join(' ');
  return `${firstPart}<span class="read-more-text">${secondPart}</span>`;
}

function updateBackgroundImage(file, selector) {
  if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
          const styleTag = document.createElement('style');
          styleTag.innerHTML = `${selector} { background-image: radial-gradient(rgba(255, 255, 255, 0), var(--primary-color)), url("${e.target.result}"); }`;
          document.head.appendChild(styleTag);
      };
      reader.readAsDataURL(file);
  }
}

function updateImage(file, selector) {
  if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
          document.querySelector(selector).src = e.target.result;
      };
      reader.readAsDataURL(file);
  }
}

document.getElementById('resetExperience').addEventListener('click', () => {
  // Reset all input fields
  document.getElementById('experienceForm').reset();
  
  // Reset displayed values
  document.querySelector('.header .section__subheader').innerText = 'Province';
  document.querySelector('.header .section__header').innerText = 'Catchline';

  document.querySelector('.about__content-1 .section__header').innerText = 'Sample Food';
  document.querySelector('.about__content-1 p').innerHTML = 'Lorem ipsum <span class="read-more-text">Extra</span>';

  document.querySelector('.about__content-2 .section__header').innerText = 'Sample Festival';
  document.querySelector('.about__content-2 p').innerHTML = 'Lorem ipsum <span class="read-more-text">Extra</span>';

  document.querySelector('.about__content-3 .section__header').innerText = 'Sample Attraction';
  document.querySelector('.about__content-3 p').innerHTML = 'Lorem ipsum <span class="read-more-text">Extra</span>';

  // Reset images
  resetBackgroundImage('.header::before');
  resetImage('.about__image-1 img');
  resetImage('.about__image-2 img');
  resetImage('.about__image-3 img');
});

function resetBackgroundImage(selector) {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `${selector} { background-image: radial-gradient(rgba(255, 255, 255, 0), var(--primary-color)), url("mainimage.jpg"); }`;
  document.head.appendChild(styleTag);
}

function resetImage(selector) {
  document.querySelector(selector).src = 'sampleimage1.jpg';
}


// Open or create the database
function openDatabase() {
  return new Promise((resolve, reject) => {
      const request = indexedDB.open('imagesDatabase', 1);
      
      request.onupgradeneeded = function(event) {
          const db = event.target.result;
          db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
      };
      
      request.onsuccess = function(event) {
          resolve(event.target.result);
      };
      
      request.onerror = function(event) {
          reject(event.target.error);
      };
  });
}

// Save image to IndexedDB
function saveImageToIndexedDB(imageData) {
  return openDatabase().then(db => {
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['images'], 'readwrite');
          const objectStore = transaction.objectStore('images');
          const request = objectStore.add({ image: imageData });
          
          request.onsuccess = function() {
              resolve(request.result);
          };
          
          request.onerror = function(event) {
              reject(event.target.error);
          };
      });
  });
}

// Retrieve image from IndexedDB
function getImageFromIndexedDB(id) {
    return openDatabase().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['images'], 'readonly');
            const objectStore = transaction.objectStore('images');
            const request = objectStore.get(id);
            
            request.onsuccess = function(event) {
                resolve(event.target.result.image);
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    });
}



// Check if editing a slide
const editSlideData = JSON.parse(localStorage.getItem("editSlide"));
if (editSlideData) {
    document.getElementById("name").value = editSlideData.name;
    document.getElementById("description").value = editSlideData.description;
    // Display current image (optional): You might display the current image or notify the user that the existing image will be used if no new image is uploaded
}

document.getElementById("submitExperience").addEventListener("click", async function(event) {
  event.preventDefault(); // Prevent default form submission

  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const foodName = document.getElementById("foodName").value;
  const foodDescription = document.getElementById("foodDescription").value;
  const cultureName = document.getElementById("cultureName").value;
  const cultureDescription = document.getElementById("cultureDescription").value;
  const attractionName = document.getElementById("attractionName").value;
  const attractionDescription = document.getElementById("attractionDescription").value;
  const imageInput = document.getElementById("image");
  const foodImageInput = document.getElementById("foodImage");
  const cultureImageInput = document.getElementById("cultureImage");
  const attractionImageInput = document.getElementById("attractionImage");

  // Validate form inputs
  if (!validateForm()) return;


// Check if maximum slides limit reached
let storedSlides = JSON.parse(localStorage.getItem("slides")) || [];
if (storedSlides.length >= 5) {
  showNotification('You have reached the maximum limit of 5 slides.', 'red');
  return;
}

// Validate that all images are uploaded
if (imageInput.files.length === 0 || foodImageInput.files.length === 0 || cultureImageInput.files.length === 0 || attractionImageInput.files.length === 0) {
  showNotification('Please upload all required images.', 'red');
  return;
}


  const reader = new FileReader();
  reader.onload = async function(event) {
      const image = await compressImage(event.target.result);
      const imageId = await saveImageToIndexedDB(image);
      const foodReader = new FileReader();
      foodReader.onload = async function(foodEvent) {
          const foodImage = await compressImage(foodEvent.target.result);
          const foodImageId = await saveImageToIndexedDB(foodImage);

          const cultureReader = new FileReader();
          cultureReader.onload = async function(cultureEvent) {
              const cultureImage = await compressImage(cultureEvent.target.result);
              const cultureImageId = await saveImageToIndexedDB(cultureImage);

              const attractionReader = new FileReader();
              attractionReader.onload = async function(attractionEvent) {
                const attractionImage = await compressImage(attractionEvent.target.result);
                const attractionImageId = await saveImageToIndexedDB(attractionImage);
              
                // Store slide and thread data in localStorage
                const experienceData = {
                  name, description, imageId,
                  foodName, foodDescription, foodImageId,
                  cultureName, cultureDescription, cultureImageId,
                  attractionName, attractionDescription, attractionImageId
                };
              
                // Determine the next available thread index
                let nextIndex = 1;
                for (let i = 1; i <= 5; i++) {
                  if (!storedSlides.some(slide => slide.index === i)) {
                    nextIndex = i;
                    break;
                  }
                }
                console.log("Stored slides before adding new one:", storedSlides);
                console.log("Next index for new slide:", nextIndex);
              
                storedSlides.push({ ...experienceData, index: nextIndex });
                localStorage.setItem("slides", JSON.stringify(storedSlides));
                localStorage.setItem(`threadAdd${nextIndex}`, JSON.stringify(experienceData)); // Save to localStorage
              
                // Log updated localStorage state
                console.log("Stored slides after adding new one:", JSON.parse(localStorage.getItem("slides")));
                console.log("Stored experience data for threadAdd" + nextIndex, JSON.parse(localStorage.getItem(`threadAdd${nextIndex}`)));
              
                // Clear form data from localStorage
                localStorage.removeItem('name');
                localStorage.removeItem('description');
                localStorage.removeItem('foodName');
                localStorage.removeItem('foodDescription');
                localStorage.removeItem('cultureName');
                localStorage.removeItem('cultureDescription');
                localStorage.removeItem('attractionName');
                localStorage.removeItem('attractionDescription');
              
                // Set a flag to show notification on CRUD.html
                localStorage.setItem('showNotification', 'true');
              
                // Reset form
                document.getElementById('experienceForm').reset();
              
                // Redirect to the corresponding thread page
                window.location.href = `CRUD.html`;
              };
              

              if (attractionImageInput.files.length > 0) {
                  attractionReader.readAsDataURL(attractionImageInput.files[0]);
              }
          };

          if (cultureImageInput.files.length > 0) {
              cultureReader.readAsDataURL(cultureImageInput.files[0]);
          }
      };

      if (foodImageInput.files.length > 0) {
          foodReader.readAsDataURL(foodImageInput.files[0]);
      }
  };

  if (imageInput.files.length > 0) {
      reader.readAsDataURL(imageInput.files[0]);
  }
});

// Helper function to compress images
function compressImage(imageData) {
  return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = imageData;

      img.onload = () => {
          const width = img.width;
          const height = img.height;

          // Set the canvas dimensions to the image dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw the image onto the canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress the image to reduce its size (adjust quality as needed)
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7); // Change quality here
          resolve(compressedImage);
      };
  });
}

// Form validation function
function validateForm() {
  const requiredFields = [
    'name', 'description', 'foodName', 'foodDescription',
    'cultureName', 'cultureDescription', 'attractionName', 'attractionDescription'
  ];

  for (const fieldId of requiredFields) {
    if (document.getElementById(fieldId).value.trim() === '') {
      showNotification('Please fill in all fields and upload an image.', 'red');
      return false;
    }
  }
  return true;
}

// Load form data on page load
window.addEventListener('load', loadFormData);





