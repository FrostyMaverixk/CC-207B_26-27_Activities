// Automatically update footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Scroll smoothly to contact section on button click
const contactBtn = document.getElementById('contactBtn');
if (contactBtn) {
    contactBtn.addEventListener('click', () => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}