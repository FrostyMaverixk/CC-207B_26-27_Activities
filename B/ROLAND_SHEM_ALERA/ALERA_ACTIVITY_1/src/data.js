
// ─────────────────────────────────────────────
//  PORTFOLIO DATA  —  Edit everything here!
// ─────────────────────────────────────────────

export const PERSONAL = {
  name: 'Roland Shem J. Alera',
  initials: 'RSA',
  tagline: 'Frontend Developer, Virtual Assistant, and NC2-Certified IT Technician — building solutions one line of code and one task at a time.',
  location: 'Iloilo City, Philippines',
  email: 'kazamechalera@email.com',
  course: 'Bachelor of Science in Information Technology',
  roles: [
    'Frontend Developer',
    'Backend Developer',
    'IT Technician',
    'NC2 CSS Certified',
    'Virtual Assistant',
    'Freelancer',
    'Social Media Manager',
  ],
  stats: [
    { value: '3+', label: 'Years Experience' },
    { value: '10+', label: 'Projects Built' },
    { value: 'NC2', label: 'Certified' },
  ],
  aboutHeadline: 'Developer by passion,',
  aboutHeadlineAccent: 'Technician by trade.',
  aboutHeadline2: 'VA & Social Media Manager by skill.',
  aboutP1: "I'm Roland Shem J. Alera, a passionate Frontend Developer, Virtual Assistant, and NC2-Certified IT Technician. I specialize in creating responsive web applications, managing online tasks, and providing technical support.",
  aboutP2: 'NC2-certified in Computer Systems Servicing by TESDA, I also run GadgetCrate PH — an online buy-and-sell business specializing in iPhones and gadgets. I combine technical skills, remote work experience, and hands-on business operations — making me a versatile hire whether you need a developer, a VA, or both.',
  aboutTags: ['React.js', 'Node.js', 'PHP', 'MySQL', 'NC2 CSS', 'IT Support', 'Virtual Assistance', 'Social Media Management'],
  contactNote: "Have a project in mind or need IT support? Let's build something great together.",
};

export const NAV_LINKS = ['Home', 'About', 'Skills', 'Projects', 'Experience', 'Contact'];

export const SKILLS = [
 {
    category: 'Virtual Assistant / Admin',
    extraIcons: [
      { src: 'https://cdn.simpleicons.org/gmail/EA4335', alt: 'Gmail' },
      { src: 'https://cdn.simpleicons.org/googlesheets/34A853', alt: 'Google Sheets' },
      { src: 'https://cdn.simpleicons.org/googlecalendar/4285F4', alt: 'Google Calendar' },
      { src: 'https://skillicons.dev/icons?i=excel', alt: 'Excel' },
      { src: 'https://skillicons.dev/icons?i=word', alt: 'Word' },
    ],
    items: ['Data Entry & Encoding', 'Spreadsheet Management (Excel & Google Sheets)', 'Document Formatting', 'Email & Calendar Management', 'Web Research', 'Lead Generation', 'Transcription'],
  },
 {
    category: 'Social Media & Freelance Tools',
   extraIcons: [
  { src: '/canva.png', alt: 'Canva' },
  { src: 'https://cdn.simpleicons.org/facebook/1877F2', alt: 'Facebook' },
  { src: 'https://cdn.simpleicons.org/instagram/E4405F', alt: 'Instagram' },
  { src: 'https://cdn.simpleicons.org/upwork/6FDA44', alt: 'Upwork' },
  { src: 'https://cdn.simpleicons.org/fiverr/1DBF73', alt: 'Fiverr' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', alt: 'ChatGPT' },
  { src: 'https://cdn.simpleicons.org/googlegemini/8E75B2', alt: 'Gemini' },
  { src: 'https://cdn.simpleicons.org/claude/D97757', alt: 'Claude' },
],
    items: ['Content Scheduling', 'Caption Writing', 'Canva Graphics', 'Engagement Monitoring', 'Upwork', 'Fiverr', 'OnlineJobs.ph', 'ChatGPT', 'Gemini', 'Claude'],
  },
  {
    category: 'Frontend',
    icon: 'https://skillicons.dev/icons?i=html,css,js,react,tailwind,bootstrap&perline=6',
    items: ['HTML5', 'CSS3', 'JavaScript', 'React.js', 'Tailwind CSS', 'Bootstrap'],
  },
  {
    category: 'Backend',
    icon: 'https://skillicons.dev/icons?i=nodejs,express,php,mysql&perline=4',
    items: ['Node.js', 'Express.js', 'PHP', 'MySQL', 'REST APIs'],
  },
  {
    category: 'IT / Hardware',
    icon: 'https://skillicons.dev/icons?i=linux,windows&perline=4',
    items: ['PC Assembly', 'Laptop Repair', 'Printer Maintenance', 'Networking', 'Troubleshooting'],
  },
  {
    category: 'Tools & Others',
    icon: 'https://skillicons.dev/icons?i=git,github,vscode,figma&perline=4',
    items: ['Git & GitHub', 'VS Code', 'Figma', 'Windows OS'],
  },
];

export const PROJECTS = [
  {
    title: 'Weather App',
    desc: 'A React.js weather application integrating the Open-Meteo API to display real-time weather data by location.',
    tags: ['React', 'API', 'CSS'],
    icon: '🌤️',
    color: '#3b82f6',
    link: '#',
  },
  {
    title: 'ClearFocus',
    desc: 'A productivity app UI/UX design featuring task management, focus timer, and clean minimal wireframes.',
    tags: ['UI/UX', 'Figma', 'Wireframe'],
    icon: '🎯',
    color: '#8b5cf6',
    link: '#',
  },
  {
    title: 'Portfolio Website',
    desc: 'Personal developer portfolio built with React.js showcasing skills, projects, and experience.',
    tags: ['React', 'JavaScript', 'CSS'],
    icon: '💼',
    color: '#10b981',
    link: 'https://rsalera.netlify.app/',
  },
  {
    title: 'IT Support System',
    desc: 'A simple ticketing and inventory management system for tracking hardware repairs and maintenance.',
    tags: ['PHP', 'MySQL', 'Bootstrap'],
    icon: '🖥️',
    color: '#f59e0b',
    link: '#',
  },
  {
    title: 'Load Tracking System',
    desc: 'LoadTrackPro is a desktop-based business management system developed for load business operators in the Philippines.',
    tags: ['Netbeans', 'MySQL', 'Java'],
    icon: '🖥️',
    color: '#f59e0b',
    link: 'https://github.com/kazamechalera-gif/git-LoadtrackingSystem',
  },
  {
    title: 'GadgetCrate PH',
    desc: 'A specialized platform for buying and selling iPhones and laptops. Features secure transaction rules and product showcases.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Bootstrap', 'Tailwind'],
    icon: '/GadgetCrate.jpg',
    color: '#3b82f6',
    link: 'https://gadgetcratephkaz.netlify.app/',
  },
  {
    title: 'Core Banking System',
    desc: 'A secure banking application featuring user authentication and balance management. Developed as a collaborative group project.',
    tags: ['OOP', 'Java'],
    icon: '🏦',
    color: '#10b981',
    link: 'https://github.com/JuanAndrda/BankingSystemFinal',
  },
];

export const EXPERIENCE = [
  {
    year: '2026',
    title: 'BSIT Student — CIT 205',
    company: 'West Visayas State University',
    desc: 'Studying Information Technology with focus on Java programming, UI/UX design, networking, and technical writing.',
    current: true,
  },
  {
    year: '2025',
    title: 'Frontend Developer',
    company: 'Freelance',
    desc: 'Built web interfaces and small business websites using HTML, CSS, JavaScript, and React.js for local client and School project.',
    current: false,
  },
  {
    year: '2024',
    title: 'NC2 Certified — CSS',
    company: 'TESDA',
    desc: 'Earned National Certificate II in Computer Systems Servicing covering PC, laptop, and Basic Computer Network, installation, and maintenance.',
    current: false,
  },
  {
    year: '2023',
    title: 'IT Technician Intern',
    company: 'DepEd Division Office — Sipalay City',
    desc: 'Work immersion (OJT): installed and managed LAN cabling, diagnosed and repaired PC hardware, upgraded RAM/storage, and performed routine printer maintenance.',
    current: false,
  },
  {
    year: '2022-Present',
    title: 'Freelance IT Technician',
    company: 'Self Employed',
    desc: 'Provided hardware repair, troubleshooting, and maintenance services for PCs and laptops.',
    current: false,
  },
  {
    year: '2020',
    title: 'Filipino Transcriptionist',
    company: 'Eccellente Services Pvt. Ltd.',
    desc: 'Transcribed audio recordings in Filipino language with high accuracy for various clients.',
    current: false,
  },
];