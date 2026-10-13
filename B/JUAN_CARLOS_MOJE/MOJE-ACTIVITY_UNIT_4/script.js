// Display the current year in the footer.
document.getElementById('year').textContent = new Date().getFullYear();

// Show and hide extra information about the project.
const detailsButton = document.getElementById('details-button');
const projectDetails = document.getElementById('project-details');

detailsButton.addEventListener('click', () => {
  const isExpanded = detailsButton.getAttribute('aria-expanded') === 'true';
  detailsButton.setAttribute('aria-expanded', String(!isExpanded));
  projectDetails.hidden = isExpanded;
  detailsButton.textContent = isExpanded ? 'Show details' : 'Hide details';
});
