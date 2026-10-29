
/* ==========================================
   DHANANJAYAN R - PORTFOLIO JAVASCRIPT
   ========================================== */

/* 1. GOOGLE SHEETS TRAINING JOURNAL */

const TRAINING_SHEET_CSV_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vRlr_Ez1GvgYhBowF4OGKRHFnOjW1VO8ckz-uh-FlkpNs-CdgAIHagHPMor00yWugVVNgn32lkIRIbx/pub?gid=2006043793&single=true&output=csv";

const trainingGrid = document.getElementById("trainingGrid");
const trainingCount = document.getElementById("trainingCount");
const trainingSearch = document.getElementById("trainingSearch");

let trainingActivities = [];

/* Normalize column names */
function normalizeHeader(value) {
    return String(value || "")
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

/* Read CSV correctly, including commas inside quotes */
function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    text = String(text || "").replace(/^\uFEFF/, "");

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            if (quoted && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else {
                quoted = !quoted;
            }
        } else if (char === "," && !quoted) {
            row.push(cell.trim());
            cell = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && text[i + 1] === "\n") i++;

            row.push(cell.trim());

            if (row.some(value => value !== "")) {
                rows.push(row);
            }

            row = [];
            cell = "";
        } else {
            cell += char;
        }
    }

    if (cell || row.length) {
        row.push(cell.trim());

        if (row.some(value => value !== "")) {
            rows.push(row);
        }
    }

    if (rows.length < 2) return [];

    const headers = rows.shift().map(normalizeHeader);

    return rows.map(values => {
        const data = {};

        headers.forEach((header, index) => {
            data[header] = values[index] || "";
        });

        return {
            date: data.date || data.trainingdate || "",
            school: data.school || data.schoolname || data.institution || "",
            location: data.location || data.place || data.district || "",
            topic: data.topic || data.activity || data.trainingtopic || "",
            description: data.description || data.details || data.learningoutcomes || "",
            photo: data.photourl || data.photo || data.imageurl || data.image || "",
            report: data.reporturl || data.reportlink || data.report || ""
        };
    }).filter(item =>
        item.date || item.school || item.topic ||
        item.location || item.description
    );
}

/* Validate external links */
function safeURL(value) {
    try {
        const url = new URL(String(value || "").trim());

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch (error) {
        // Ignore invalid URLs.
    }

    return "";
}

/* Create an element using safe text */
function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    element.textContent = text || "";

    return element;
}

/* Show loading or error messages */
function showTrainingMessage(message) {
    if (trainingGrid) {
        trainingGrid.replaceChildren(
            makeElement("p", "training-status", message)
        );
    }

    if (trainingCount) {
        trainingCount.textContent = "";
    }
}

/* Create one training activity card */
function createTrainingCard(activity) {
    const card = document.createElement("article");
    card.className = "training-card";

    const photoURL = safeURL(activity.photo);

    if (photoURL) {
        const image = document.createElement("img");

        image.src = photoURL;
        image.alt = activity.topic || "STEM training activity";
        image.loading = "lazy";

        image.onerror = () => image.remove();

        card.appendChild(image);
    }

    const content = document.createElement("div");
    content.className = "training-card-body";

    content.appendChild(
        makeElement("p", "training-meta", activity.date)
    );

    content.appendChild(
        makeElement("h3", "", activity.topic || "Training Activity")
    );

    const schoolInfo = [activity.school, activity.location]
        .filter(Boolean)
        .join(" · ");

    if (schoolInfo) {
        content.appendChild(
            makeElement("p", "training-location", schoolInfo)
        );
    }

    if (activity.description) {
        content.appendChild(
            makeElement("p", "training-description", activity.description)
        );
    }

    const reportURL = safeURL(activity.report);

    if (reportURL) {
        const reportLink = document.createElement("a");

        reportLink.href = reportURL;
        reportLink.target = "_blank";
        reportLink.rel = "noopener noreferrer";
        reportLink.textContent = "View Report ↗";

        content.appendChild(reportLink);
    }

    card.appendChild(content);

    return card;
}

/* Display activities and filter search results */
function renderTrainingActivities() {
    if (!trainingGrid) return;

    const query = trainingSearch
        ? trainingSearch.value.trim().toLowerCase()
        : "";

    const filtered = trainingActivities.filter(activity => {
        const searchable = [
            activity.date,
            activity.school,
            activity.location,
            activity.topic,
            activity.description
        ].join(" ").toLowerCase();

        return searchable.includes(query);
    });

    trainingGrid.replaceChildren();

    if (filtered.length === 0) {
        const message = trainingActivities.length
            ? "No matching activities found. Try another search."
            : "No activities found in your Google Sheet.";

        trainingGrid.appendChild(
            makeElement("p", "training-status", message)
        );

        if (trainingCount) {
            trainingCount.textContent = "0 activities";
        }

        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(activity => {
        fragment.appendChild(createTrainingCard(activity));
    });

    trainingGrid.appendChild(fragment);

    if (trainingCount) {
        trainingCount.textContent =
            `${filtered.length} ${filtered.length === 1 ? "activity" : "activities"}`;
    }
}

/* Load activities from Google Sheets */
async function loadTrainingActivities() {
    if (!trainingGrid) {
        console.warn(
            "Training Journal element not found. Add id='trainingGrid' to index.html."
        );
        return;
    }

    showTrainingMessage("Loading training activities...");

    try {
        const response = await fetch(TRAINING_SHEET_CSV_URL, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Google Sheets returned HTTP " + response.status);
        }

        const csvText = await response.text();

        if (
            /<html[\s>]/i.test(csvText) ||
            /accounts\.google\.com/i.test(csvText)
        ) {
            throw new Error(
                "Google Sheets returned a webpage instead of CSV. Check your publishing settings."
            );
        }

        const activities = parseCSV(csvText);

        if (activities.length === 0) {
            throw new Error(
                "No activity rows found. Check your column headings and spreadsheet data."
            );
        }

        trainingActivities = activities;
        renderTrainingActivities();

        console.log(
            "Training Journal loaded:",
            trainingActivities.length,
            "activities"
        );

    } catch (error) {
        console.error("Training Journal error:", error);

        showTrainingMessage(
            "Unable to load activities. Check that the Google Sheet is published as CSV and try again. See the browser Console for details."
        );
    }
}

/* Search activities while typing */
if (trainingSearch) {
    trainingSearch.addEventListener(
        "input",
        renderTrainingActivities
    );
}

/* Start loading the journal */
loadTrainingActivities();


/* ==========================================
   2. MOBILE NAVIGATION
   ========================================== */

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
        const open = nav.classList.toggle("open");

        menuBtn.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            nav.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        });
    });
}


/* ==========================================
   3. SCROLL REVEAL ANIMATIONS
   ========================================== */

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    document.querySelectorAll(".reveal").forEach(element => {
        observer.observe(element);
    });
} else {
    document.querySelectorAll(".reveal").forEach(element => {
        element.classList.add("visible");
    });
}


/* ==========================================
   4. BACK TO TOP BUTTON
   ========================================== */

const topBtn = document.getElementById("topBtn");

if (topBtn) {
    function updateTopButton() {
        topBtn.classList.toggle("show", window.scrollY > 600);
    }

    window.addEventListener("scroll", updateTopButton, {
        passive: true
    });

    updateTopButton();

    topBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


/* ==========================================
   5. AUTOMATIC FOOTER YEAR
   ========================================== */

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
