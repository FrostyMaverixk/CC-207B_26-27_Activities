//comments
let currentIndex = 0;
const cardsToShow = 3;

function showSlide(index) {
    const slider = document.querySelector('.slider');
    const totalCards = document.querySelectorAll('.card').length;

    if (index >= totalCards - cardsToShow + 1) {
        currentIndex = 0;
    } else if (index < 0) {
        currentIndex = totalCards - cardsToShow;
    } else {
        currentIndex = index;
    }

    slider.style.transform = `translateX(-${currentIndex * (100 / cardsToShow)}%)`;
}

function nextSlide() {
    showSlide(currentIndex + 1);
}

function prevSlide() {
    showSlide(currentIndex - 1);
}

function getUserProfileImage(username) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username);
    return user ? user.profileImage : 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png';
}

function updateCommentCount() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(user => user.username === loggedInUser);
    const comments = JSON.parse(localStorage.getItem('vigancomments')) || [];
    const userComments = comments.filter(comment => comment.header === loggedInUser).length;

    if (userIndex !== -1) {
        users[userIndex].commentCount = userComments;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function addComment() {
    const backgroundInput = document.getElementById('backgroundInput');
    const userLocationInput = document.getElementById('userLocationInput');
    const commentInput = document.getElementById('commentInput');
    const userLocation = userLocationInput.value.trim();
    const commentText = commentInput.value.trim();
    const loggedInUser = localStorage.getItem('loggedInUser') || 'New Comment';
    const profileImage = getUserProfileImage(loggedInUser);

    if (backgroundInput.files && backgroundInput.files[0] && userLocation && commentText) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const newComment = {
                background: e.target.result,
                location: userLocation,
                text: commentText,
                timestamp: Date.now(),
                createdByLoggedInUser: true,
                header: loggedInUser,
                profileImage: profileImage
            };

            let comments = JSON.parse(localStorage.getItem('vigancomments')) || [];
            comments.push(newComment);
            localStorage.setItem('vigancomments', JSON.stringify(comments));

            createSlide(newComment);

            backgroundInput.value = '';
            userLocationInput.value = '';
            commentInput.value = '';
            showSlide(currentIndex);

            showNotification("You added a comment.", 'blue'); // Added notification
            updateCommentCount();
        };
        reader.readAsDataURL(backgroundInput.files[0]);
    }
}

function getUserType(username) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username);
    return user ? user.userType : 'user'; // Default to 'user' if no match
}

function createSlide(comment) {
    const slider = document.querySelector('.slider');
    const newCard = document.createElement('div');
    newCard.classList.add('card');

    const commentHeader = comment.header || 'New Comment';
    const profileImage = comment.profileImage || 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png';
    const loggedInUser = localStorage.getItem('loggedInUser') || 'New Comment';
    const loggedInUserType = getUserType(loggedInUser);

    const showEditButton = comment.header === loggedInUser;
    const showDeleteButton = comment.header === loggedInUser || loggedInUserType === 'admin';

    let actionButtonsHTML = '';

    if (showEditButton) {
        actionButtonsHTML += `<button class="edit-comment-btn" onclick="editComment(${comment.timestamp})">Edit</button>`;
    }
    
    if (showDeleteButton) {
        actionButtonsHTML += `<button class="delete-comment-btn" onclick="deleteComment(${comment.timestamp})">Delete</button>`;
    }

    newCard.innerHTML = `
        <div class="background-container">
            <img src="${comment.background}" alt="Background" class="background-img">
            <img src="${profileImage}" alt="Avatar" class="card-img">
        </div>
        <h2>${commentHeader}</h2>
        <p class="user-location"> ${comment.location}</p>
        <p class="comment-text">${comment.text}</p>
        <div class="action-buttons">
            ${actionButtonsHTML}
        </div>
    `;

    slider.appendChild(newCard);
}

function editComment(timestamp) {
    const comments = JSON.parse(localStorage.getItem('vigancomments')) || [];
    const comment = comments.find(c => c.timestamp === timestamp);

    if (comment) {
        const backgroundInput = document.getElementById('backgroundInput');
        const userLocationInput = document.getElementById('userLocationInput');
        const commentInput = document.getElementById('commentInput');
        backgroundInput.dataset.timestamp = timestamp;
        userLocationInput.value = comment.location;
        commentInput.value = comment.text;
    }
}

function saveEditComment() {
    const backgroundInput = document.getElementById('backgroundInput');
    const userLocationInput = document.getElementById('userLocationInput');
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();
    const userLocation = userLocationInput.value.trim();
    const timestamp = backgroundInput.dataset.timestamp;
    const loggedInUser = localStorage.getItem('loggedInUser') || 'New Comment';
    const profileImage = getUserProfileImage(loggedInUser);

    if (userLocation && commentText && timestamp) {
        let comments = JSON.parse(localStorage.getItem('vigancomments')) || [];
        const commentIndex = comments.findIndex(c => c.timestamp == timestamp);

        if (commentIndex !== -1) {
            if (backgroundInput.files && backgroundInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    comments[commentIndex].background = e.target.result;
                    comments[commentIndex].location = userLocation;
                    comments[commentIndex].text = commentText;
                    comments[commentIndex].header = loggedInUser;
                    comments[commentIndex].profileImage = profileImage;
                    localStorage.setItem('vigancomments', JSON.stringify(comments));
                    loadComments();
                    showNotification("You edited a comment.", 'blue'); // Added notification
                };
                reader.readAsDataURL(backgroundInput.files[0]);
            } else {
                comments[commentIndex].location = userLocation;
                comments[commentIndex].text = commentText;
                comments[commentIndex].header = loggedInUser;
                comments[commentIndex].profileImage = profileImage;
                localStorage.setItem('vigancomments', JSON.stringify(comments));
                loadComments();
                showNotification("You edited a comment.", 'blue'); // Added notification
            }
        }

        backgroundInput.value = '';
        userLocationInput.value = '';
        commentInput.value = '';
        delete backgroundInput.dataset.timestamp;
    }
}

function deleteComment(timestamp) {
    let comments = JSON.parse(localStorage.getItem('vigancomments')) || [];
    comments = comments.filter(comment => comment.timestamp !== timestamp);
    localStorage.setItem('vigancomments', JSON.stringify(comments));
    loadComments();
    showNotification("You deleted a comment.", 'red'); // Added notification
    updateCommentCount();
}

function loadComments() {
    const slider = document.querySelector('.slider');
    slider.innerHTML = '';
    const comments = JSON.parse(localStorage.getItem('vigancomments')) || [];
    comments.forEach(comment => {
        createSlide(comment);
    });
}

document.querySelector('.next').addEventListener('click', nextSlide);
document.querySelector('.prev').addEventListener('click', prevSlide);
window.addEventListener('load', loadComments);

// Function to check if the user is a guest or an admin and adjust button visibility/functionality
function checkGuestUser() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const addCommentBtn = document.getElementById('addCommentBtn');
    const saveEditCommentBtn = document.getElementById('saveEditCommentBtn');
    const userType = getUserType(loggedInUser);

    if (loggedInUser === 'Guest') {
        addCommentBtn.style.opacity = '0.5';
        saveEditCommentBtn.style.opacity = '0.5';
        addCommentBtn.onclick = function() {
            showNotification('You must sign in first to share experiences', 'red');
        };
        saveEditCommentBtn.onclick = function() {
            showNotification('You must sign in first to share experiences', 'red');
        };
    } else if (userType === 'admin') {
        addCommentBtn.style.opacity = '0.5';
        saveEditCommentBtn.style.opacity = '0.5';
        addCommentBtn.onclick = function() {
            showNotification('You cannot share experiences as an Admin', 'red');
        };
        saveEditCommentBtn.onclick = function() {
            showNotification('You cannot share experiences as an Admin', 'red');
        };
    } else {
        addCommentBtn.style.opacity = '1';
        saveEditCommentBtn.style.opacity = '1';
        addCommentBtn.onclick = addComment;
        saveEditCommentBtn.onclick = saveEditComment;
    }    
}

// Update the load event to include the guest check
window.addEventListener('load', function() {
    loadComments();
    checkGuestUser();
});

document.querySelector('.next').addEventListener('click', nextSlide);
document.querySelector('.prev').addEventListener('click', prevSlide);

function handleCommentInput() {
    const commentInput = document.getElementById('commentInput');
    commentInput.addEventListener('input', function () {
        if (this.value.length > 80) {
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
}

function checkCommentCount() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === loggedInUser);
    const comments = JSON.parse(localStorage.getItem('vigancomments')) || [];
    const currentCommentCount = comments.filter(comment => comment.header === loggedInUser).length;
  
    if (user && user.commentCount !== undefined) {
      if (currentCommentCount < user.commentCount) {
        showNotification('Your comment(s) has been deleted by an Admin', 'red'); // Added notification
      }
      user.commentCount = currentCommentCount; // Update the stored count
      localStorage.setItem('users', JSON.stringify(users));
    }
  }
  

window.addEventListener('load', function() {
    checkCommentCount();
    loadComments();
    checkGuestUser();
    handleCommentInput();
});