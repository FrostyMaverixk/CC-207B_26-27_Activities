// ---------- Project view ----------
const tabList = document.getElementById("project-tabs");
const panelBox = document.getElementById("project-panels");
const caseStudy = document.getElementById("case-study");

function isProjectPlaceholder(value) {
    if (typeof value !== "string") {
        return true;
    }

    const trimmedValue = value.trim();
    return trimmedValue === "" || trimmedValue.charAt(0) === "[";
}

function escapeHtml(value) {
    let safeText = String(value);
    safeText = safeText.replace(/&/g, "&amp;");
    safeText = safeText.replace(/</g, "&lt;");
    safeText = safeText.replace(/>/g, "&gt;");
    safeText = safeText.replace(/"/g, "&quot;");
    safeText = safeText.replace(/'/g, "&#39;");
    return safeText;
}

function getImagePath(project, shot) {
    return "assets/" + project.folder + "/" + shot[0];
}

function makeProjectTabs() {
    if (!tabList || !panelBox) {
        return;
    }

    for (let projectIndex = 0; projectIndex < PROJECTS.length; projectIndex++) {
        const project = PROJECTS[projectIndex];
        const firstShot = project.shots[0];
        let projectMeta = "";

        if (!isProjectPlaceholder(project.role)) {
            projectMeta = escapeHtml(project.role);
        }
        if (!isProjectPlaceholder(project.period)) {
            if (projectMeta !== "") {
                projectMeta += "<br>";
            }
            projectMeta += escapeHtml(project.period);
        }

        let stackHtml = "";
        if (project.stack) {
            for (let stackIndex = 0; stackIndex < project.stack.length; stackIndex++) {
                const stackItem = project.stack[stackIndex];
                if (!isProjectPlaceholder(stackItem) && stackItem.toLowerCase() !== "not specified") {
                    stackHtml += "<li>" + escapeHtml(stackItem) + "</li>";
                }
            }
        }

        const tab = document.createElement("button");
        tab.className = "tab";
        tab.type = "button";
        tab.textContent = project.name;
        tab.setAttribute("aria-controls", "panel-" + project.id);
        tab.setAttribute("aria-pressed", String(projectIndex === 0));
        if (projectIndex === 0) {
            tab.classList.add("active");
        }
        tabList.appendChild(tab);

        const panel = document.createElement("article");
        panel.className = "project-panel";
        panel.id = "panel-" + project.id;
        if (projectIndex === 0) {
            panel.classList.add("active");
        }

        panel.innerHTML = `
            <div class="preview">
                <button class="preview-trigger" type="button" aria-label="View ${escapeHtml(project.name)} screenshot full size">
                    <img src="${getImagePath(project, firstShot)}" alt="${escapeHtml(project.name)}: ${escapeHtml(firstShot[1])}" loading="lazy">
                </button>
                ${projectMeta ? `<p class="preview-meta">${projectMeta}</p>` : ""}
            </div>
            <aside class="project-info">
                <h3>${escapeHtml(project.name)}</h3>
                <p>${escapeHtml(project.summary)}</p>
                ${stackHtml ? `<ul class="project-stack" aria-label="Technology stack">${stackHtml}</ul>` : ""}
                <a class="view-btn" href="project.html?id=${project.id}">View project</a>
            </aside>
        `;
        panelBox.appendChild(panel);

        const previewTrigger = panel.querySelector(".preview-trigger");
        previewTrigger.addEventListener("click", function () {
            openPreview(project, firstShot, previewTrigger);
        });

        tab.addEventListener("click", function () {
            const allTabs = document.querySelectorAll(".tab");
            const allPanels = document.querySelectorAll(".project-panel");

            for (let tabIndex = 0; tabIndex < allTabs.length; tabIndex++) {
                allTabs[tabIndex].classList.remove("active");
                allTabs[tabIndex].setAttribute("aria-pressed", "false");
            }
            for (let panelIndex = 0; panelIndex < allPanels.length; panelIndex++) {
                allPanels[panelIndex].classList.remove("active");
            }

            tab.classList.add("active");
            tab.setAttribute("aria-pressed", "true");
            panel.classList.add("active");
        });
    }
}

let previewReturnFocus = null;

function openPreview(project, shot, trigger) {
    const previewLightbox = document.getElementById("preview-lightbox");
    const previewImage = document.getElementById("preview-lightbox-image");
    const previewCaption = document.getElementById("preview-lightbox-caption");
    const closeButton = document.getElementById("preview-lightbox-close");

    previewReturnFocus = trigger;
    previewImage.src = getImagePath(project, shot);
    previewImage.alt = project.name + ": " + shot[1];
    previewCaption.textContent = project.name + " - " + shot[1];
    previewLightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    closeButton.focus();
}

function closePreview() {
    const previewLightbox = document.getElementById("preview-lightbox");
    previewLightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (previewReturnFocus) {
        previewReturnFocus.focus();
    }
}

function setUpPreviewLightbox() {
    const previewLightbox = document.getElementById("preview-lightbox");
    if (!previewLightbox) {
        return;
    }

    document.getElementById("preview-lightbox-close").addEventListener("click", closePreview);
    previewLightbox.addEventListener("click", function (event) {
        if (event.target === previewLightbox) {
            closePreview();
        }
    });
    document.addEventListener("keydown", function (event) {
        if (!previewLightbox.hidden && event.key === "Escape") {
            closePreview();
        }
    });
}

function setUpMobileMenu() {
    const menuToggle = document.getElementById("menu-toggle");
    const navigation = document.getElementById("main-nav");
    if (!menuToggle || !navigation) {
        return;
    }

    menuToggle.addEventListener("click", function () {
        const expanded = menuToggle.getAttribute("aria-expanded") !== "true";
        menuToggle.setAttribute("aria-expanded", String(expanded));
        navigation.classList.toggle("nav-open", expanded);
    });

    navigation.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
            menuToggle.setAttribute("aria-expanded", "false");
            navigation.classList.remove("nav-open");
        }
    });
}

function makeProjectDetails() {
    if (!caseStudy) {
        return;
    }

    let projectId = window.location.search;
    if (projectId.indexOf("?id=") === 0) {
        projectId = projectId.substring(4);
        if (projectId.indexOf("&") !== -1) {
            projectId = projectId.substring(0, projectId.indexOf("&"));
        }
    }

    let project = null;
    let projectIndex = -1;
    for (let index = 0; index < PROJECTS.length; index++) {
        if (PROJECTS[index].id === projectId) {
            project = PROJECTS[index];
            projectIndex = index;
            break;
        }
    }

    if (project === null) {
        caseStudy.innerHTML = `
            <section class="project-not-found">
                <p class="section-label">Project not found</p>
                <h1>This project isn't available.</h1>
                <p>Choose a project from the portfolio to see its details.</p>
                <a class="view-btn" href="index.html#projects">Back to projects</a>
            </section>
        `;
        return;
    }

    document.title = project.name + " | Faith Benjamin";

    const shots = project.shots;
    let nextProjectIndex = projectIndex + 1;
    if (nextProjectIndex >= PROJECTS.length) {
        nextProjectIndex = 0;
    }
    const nextProject = PROJECTS[nextProjectIndex];
    const nextRecord = String(nextProjectIndex + 1).padStart(3, "0");

    let stackText = "-";
    if (project.stack && project.stack.length > 0) {
        stackText = "";
        for (let stackIndex = 0; stackIndex < project.stack.length; stackIndex++) {
            if (stackIndex > 0) {
                stackText += ", ";
            }
            stackText += escapeHtml(project.stack[stackIndex]);
        }
    }

    let contributionsHtml = "";
    for (let contributionIndex = 0; contributionIndex < project.contributions.length; contributionIndex++) {
        contributionsHtml += "<li>" + escapeHtml(project.contributions[contributionIndex]) + "</li>";
    }

    let screenshotsHtml = "";
    for (let shotIndex = 0; shotIndex < shots.length; shotIndex++) {
        const shot = shots[shotIndex];
        screenshotsHtml += `
            <figure>
                <button class="case-study-shot" type="button" data-shot="${shotIndex}" aria-label="Open ${escapeHtml(shot[1])} screenshot">
                    <img src="${getImagePath(project, shot)}" alt="${escapeHtml(project.name)}: ${escapeHtml(shot[1])}" loading="lazy">
                </button>
                <figcaption>${escapeHtml(shot[1])}</figcaption>
            </figure>
        `;
    }

    let statusHtml = escapeHtml(project.status || "-");
    if (project.link && project.link[1]) {
        statusHtml += `, visit at <a class="case-study-status-link" href="${escapeHtml(project.link[1])}" target="_blank" rel="noopener">${escapeHtml(project.link[0])}</a>`;
    }

    caseStudy.innerHTML = `
        <a class="case-study-back" href="index.html#projects"><span aria-hidden="true">&larr;</span> Back to all projects</a>
        <nav class="project-breadcrumb" aria-label="Breadcrumb">
            <a href="index.html">Portfolio</a><span>/</span><a href="index.html#projects">Projects</a><span>/</span><span aria-current="page">${escapeHtml(project.name)}</span>
        </nav>
        <header class="case-study-heading">
            <h1>${escapeHtml(project.name)}</h1>
            <p class="case-study-summary">${escapeHtml(project.summary)}</p>
        </header>

        <dl class="case-study-facts">
            <div><dt>My role</dt><dd>${escapeHtml(project.role || "-")}</dd></div>
            <div><dt>Timeline</dt><dd>${escapeHtml(project.period || "-")}</dd></div>
            <div><dt>Status</dt><dd>${statusHtml}</dd></div>
            <div><dt>Built with</dt><dd>${stackText}</dd></div>
        </dl>

        <section class="case-study-section">
            <h2>My contributions</h2>
            <ul class="case-study-contributions">${contributionsHtml}</ul>
        </section>

        <section class="case-study-section case-study-screenshots">
            <h2>Screenshots <span class="screenshot-count">${shots.length}</span></h2>
            <div class="case-study-shot-grid">${screenshotsHtml}</div>
        </section>

        <nav class="case-study-next" aria-label="Project navigation">
            <a href="project.html?id=${nextProject.id}">Next record: P-${nextRecord} ${escapeHtml(nextProject.name)}</a>
        </nav>
    `;

    let activeShot = 0;
    let returnFocus = null;
    const shotButtons = caseStudy.querySelectorAll(".case-study-shot");

    function showLightboxShot(shotIndex) {
        activeShot = shotIndex;
        if (activeShot < 0) {
            activeShot = shots.length - 1;
        }
        if (activeShot >= shots.length) {
            activeShot = 0;
        }

        const shot = shots[activeShot];
        document.getElementById("lb-img").src = getImagePath(project, shot);
        document.getElementById("lb-img").alt = project.name + ": " + shot[1];
        document.getElementById("lb-cap").textContent = shot[1];
    }

    function openLightbox(shotIndex, trigger) {
        returnFocus = trigger;
        showLightboxShot(shotIndex);
        document.getElementById("lightbox").hidden = false;
        document.body.classList.add("lightbox-open");
        document.getElementById("lb-close").focus();
    }

    function closeLightbox() {
        document.getElementById("lightbox").hidden = true;
        document.body.classList.remove("lightbox-open");
        if (returnFocus) {
            returnFocus.focus();
        }
    }

    for (let buttonIndex = 0; buttonIndex < shotButtons.length; buttonIndex++) {
        shotButtons[buttonIndex].addEventListener("click", function () {
            const shotIndex = Number(shotButtons[buttonIndex].getAttribute("data-shot"));
            openLightbox(shotIndex, shotButtons[buttonIndex]);
        });
    }

    document.getElementById("lb-close").addEventListener("click", closeLightbox);
    document.getElementById("lb-prev").addEventListener("click", function () {
        showLightboxShot(activeShot - 1);
    });
    document.getElementById("lb-next").addEventListener("click", function () {
        showLightboxShot(activeShot + 1);
    });
    document.getElementById("lightbox").addEventListener("click", function (event) {
        if (event.target === document.getElementById("lightbox")) {
            closeLightbox();
        }
    });
    document.addEventListener("keydown", function (event) {
        if (document.getElementById("lightbox").hidden) {
            return;
        }
        if (event.key === "Escape") {
            closeLightbox();
        } else if (event.key === "ArrowLeft") {
            showLightboxShot(activeShot - 1);
        } else if (event.key === "ArrowRight") {
            showLightboxShot(activeShot + 1);
        }
    });
}

makeProjectTabs();
setUpPreviewLightbox();
setUpMobileMenu();
makeProjectDetails();

