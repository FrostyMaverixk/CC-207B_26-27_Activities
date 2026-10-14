function updateCommentCount() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(user => user.username === loggedInUser);
    const comments = JSON.parse(localStorage.getItem('bicolcomments')) || [];
    const userComments = comments.filter(comment => comment.header === loggedInUser).length;

    if (userIndex !== -1) {
        users[userIndex].commentCount = userComments;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function addComment() {
    // Existing addComment code...
    updateCommentCount(); // Call this to update the comment count
}

function saveEditComment() {
    // Existing saveEditComment code...
    updateCommentCount(); // Call this to update the comment count
}

function deleteComment(timestamp) {
    // Existing deleteComment code...
    updateCommentCount(); // Call this to update the comment count
}

function checkCommentCount() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === loggedInUser);
    const comments = JSON.parse(localStorage.getItem('bicolcomments')) || [];
    const currentCommentCount = comments.filter(comment => comment.header === loggedInUser).length;

    if (user && user.commentCount !== undefined) {
        if (currentCommentCount < user.commentCount) {
            alert('Some changes have been made: Some of your comments have been deleted');
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

