// --- INTERACTIVE TERMINAL LOGIC ---
const terminalInput = document.getElementById('terminalInput');
const terminalOutput = document.getElementById('terminalOutput');

// Available Terminal Commands
const COMMANDS = {
  help: `AVAILABLE COMMANDS:
  - bio      : Display student biography
  - skills   : Show technical competencies
  - projects : List project schematics
  - contact  : Display contact details
  - clear    : Clear terminal screen`,

  bio: `Alexander Vance — CICT IT Student specializing in Web Architecture & System Design.`,

  skills: `Skills: HTML5, CSS3, JS, PHP, MySQL, Java, C++, Git, Linux`,

  projects: `1. CICT Student Portal
2. Retro Console Emulator
3. Library Management System`,

  contact: `Email: alexander.vance@cict.edu`
};

if (terminalInput) {
  terminalInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const input = this.value.trim().toLowerCase();
      this.value = '';

      // Print command line
      appendOutput(`CICT-USER> ${input}`);

      if (input === 'clear') {
        terminalOutput.innerHTML = '';
        return;
      }

      if (COMMANDS[input]) {
        appendOutput(COMMANDS[input]);
      } else if (input !== '') {
        appendOutput(`Command not found: '${input}'. Type 'help' for available commands.`);
      }

      // Auto-scroll to bottom of terminal
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  });
}

function appendOutput(text) {
  const line = document.createElement('div');
  line.style.whiteSpace = 'pre-wrap';
  line.textContent = text;
  terminalOutput.appendChild(line);
}


// --- TELEGRAM FORM DISPATCH LOGIC ---
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    formStatus.style.color = '#8c7b6c';
    formStatus.textContent = 'TRANSMITTING DISPATCH...';

    setTimeout(() => {
      formStatus.style.color = '#2b2622';
      formStatus.textContent = '✓ TELEGRAM TRANSMITTED SUCCESSFULLY!';
      contactForm.reset();
    }, 1000);
  });
}