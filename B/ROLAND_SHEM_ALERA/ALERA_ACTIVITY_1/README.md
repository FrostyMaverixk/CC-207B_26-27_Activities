# Roland Shem J. Alera — Portfolio

Personal portfolio website built with **React.js + Vite**.

---

## 🚀 Getting Started

### 1. Install dependencies
Open a terminal in this folder and run:
```bash
npm install
```

### 2. Start the dev server
```bash
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for production
```bash
npm run build
```
The output will be in the `dist/` folder — ready to deploy.

---

## 📁 Project Structure

```
roland-portfolio/
├── index.html                  ← HTML entry point
├── vite.config.js              ← Vite config
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                ← React entry point
    ├── App.jsx                 ← Root component (section order)
    ├── index.css               ← Global reset & base styles
    ├── data.js                 ← ⭐ ALL portfolio content (edit here!)
    ├── hooks/
    │   └── useInView.js        ← Scroll-triggered animation hook
    └── components/
        ├── Navbar.jsx / .module.css
        ├── Hero.jsx / .module.css
        ├── About.jsx / .module.css
        ├── Skills.jsx / .module.css
        ├── Projects.jsx / .module.css
        ├── Experience.jsx / .module.css
        ├── Contact.jsx / .module.css
        ├── Footer.jsx / .module.css
        └── SectionLabel.jsx / .module.css
```

---

## ✏️ How to Edit Content

**All your personal info, projects, skills, and experience are in one file:**

```
src/data.js
```

- Change your name, tagline, email, location → edit `PERSONAL`
- Add/remove skills → edit `SKILLS`
- Add/remove projects → edit `PROJECTS` (update `link` to your GitHub/live URL)
- Add/remove experience → edit `EXPERIENCE`

---

## 📬 Setting Up the Contact Form

The contact form currently just logs to the console.
To make it actually send emails, replace the `console.log` in `Contact.jsx` with one of:

- **[EmailJS](https://www.emailjs.com/)** — free, no backend needed
- **[Formspree](https://formspree.io/)** — easiest, just change `action` URL
- **[Web3Forms](https://web3forms.com/)** — free & simple

---

## 🌐 Deploying

Recommended free hosting options:
- **Vercel** — `npm i -g vercel && vercel`
- **Netlify** — drag & drop the `dist/` folder
- **GitHub Pages** — with `vite-plugin-gh-pages`

