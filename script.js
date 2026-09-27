/* =========================================
   100 DAY SAVING CHALLENGE
   SCRIPT.JS
========================================= */

const BASE_AMOUNT = 20;
const ORIGINAL_DAYS = 100;
const TARGET_AMOUNT = 101000;

const STORAGE_KEY = "savingChallengeData";


/* =========================================
   DOM ELEMENTS
========================================= */

const savingInput = document.getElementById("savingInput");
const addSavingBtn = document.getElementById("addSavingBtn");
const savingTableBody = document.getElementById("savingTableBody");

const savedAmountEl = document.getElementById("savedAmount");
const remainingAmountEl = document.getElementById("remainingAmount");
const currentDayEl = document.getElementById("currentDay");

const progressTextEl = document.getElementById("progressText");
const progressPercentEl = document.getElementById("progressPercent");
const progressFillEl = document.getElementById("progressFill");

const completedDaysEl = document.getElementById("completedDays");
const totalDaysEl = document.getElementById("totalDays");

const paymentMessageEl = document.getElementById("paymentMessage");

const completionSection =
    document.getElementById("completionSection");

const resetBtn =
    document.getElementById("resetBtn");


/* =========================================
   DEFAULT DATA
========================================= */

function createDefaultData() {

    return {
        saved: 0,

        carryOver: 0,

        currentDay: 1,

        completedDays: 0,

        days: []
    };

}


/* =========================================
   LOAD DATA
========================================= */

function loadData() {

    const savedData =
        localStorage.getItem(STORAGE_KEY);

    if (!savedData) {

        return createDefaultData();

    }

    try {

        return JSON.parse(savedData);

    } catch (error) {

        console.error(
            "Unable to load saving data:",
            error
        );

        return createDefaultData();

    }

}


/* =========================================
   SAVE DATA
========================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =========================================
   GLOBAL DATA
========================================= */

let data = loadData();


/* =========================================
   CALCULATE BASE TARGET
========================================= */

function getBaseTarget(day) {

    return BASE_AMOUNT * day;

}


/* =========================================
   GET CURRENT TARGET
========================================= */

function getCurrentTarget(day) {

    return getBaseTarget(day) + data.carryOver;

}


/* =========================================
   CREATE DAY
========================================= */

function createDay(dayNumber) {

    const baseTarget =
        getBaseTarget(dayNumber);

    const target =
        baseTarget + data.carryOver;

    return {

        day: dayNumber,

        baseTarget: baseTarget,

        carryOver: data.carryOver,

        target: target,

        saved: 0,

        completed: false

    };

}


/* =========================================
   ENSURE CURRENT DAY EXISTS
========================================= */

function ensureCurrentDay() {

    const existingDay =
        data.days.find(
            day => day.day === data.currentDay
        );

    if (!existingDay) {

        const newDay =
            createDay(data.currentDay);

        data.days.push(newDay);

        saveData();

    }

}


/* =========================================
   FORMAT MONEY
========================================= */

function formatMoney(amount) {

    return "Rs." +
        Number(amount).toLocaleString("en-US");

}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable() {

    savingTableBody.innerHTML = "";

    data.days.forEach(day => {

        const row =
            document.createElement("tr");

        let statusHTML = "";

        if (day.completed) {

            statusHTML = `
                <span class="status completed">
                    ✅ Completed
                </span>
            `;

        } else if (day.saved > 0) {

            statusHTML = `
                <span class="status partial">
                    ⚠️ Partial
                </span>
            `;

        } else {

            statusHTML = `
                <span class="status pending">
                    ⏳ Pending
                </span>
            `;

        }


        row.innerHTML = `

            <td>
                <strong>Day ${day.day}</strong>
            </td>

            <td>
                ${formatMoney(day.baseTarget)}
            </td>

            <td>
                ${
                    day.carryOver > 0
                    ? formatMoney(day.carryOver)
                    : "-"
                }
            </td>

            <td>
                <strong>
                    ${formatMoney(day.target)}
                </strong>
            </td>

            <td>
                ${formatMoney(day.saved)}
            </td>

            <td>
                ${statusHTML}
            </td>

        `;


        savingTableBody.appendChild(row);

    });

}


/* =========================================
   UPDATE STATS
========================================= */

function updateStats() {

    const saved =
        data.saved;

    const remaining =
        Math.max(
            TARGET_AMOUNT - saved,
            0
        );

    const progress =
        Math.min(
            (saved / TARGET_AMOUNT) * 100,
            100
        );


    savedAmountEl.textContent =
        formatMoney(saved);

    remainingAmountEl.textContent =
        formatMoney(remaining);

    currentDayEl.textContent =
        `Day ${data.currentDay}`;

    progressTextEl.textContent =
        `${progress.toFixed(1)}% completed`;

    progressPercentEl.textContent =
        `${progress.toFixed(1)}%`;

    progressFillEl.style.width =
        `${progress}%`;

    completedDaysEl.textContent =
        data.completedDays;

    totalDaysEl.textContent =
        Math.max(
            ORIGINAL_DAYS,
            data.days.length
        );

}


/* =========================================
   CHECK COMPLETION
========================================= */

function checkCompletion() {

    if (data.saved >= TARGET_AMOUNT) {

        completionSection.classList.remove(
            "hidden"
        );

        progressFillEl.style.width = "100%";

        progressPercentEl.textContent =
            "100%";

        progressTextEl.textContent =
            "Challenge completed! 🎉";

        return true;

    }

    completionSection.classList.add(
        "hidden"
    );

    return false;

}


/* =========================================
   ADD SAVING
========================================= */

function addSaving() {

    const amount =
        Number(savingInput.value);


    /* ---------- VALIDATION ---------- */

    if (!amount || amount <= 0) {

        showMessage(
            "Please enter a valid amount.",
            "error"
        );

        return;

    }


    if (checkCompletion()) {

        showMessage(
            "🎉 Your challenge is already completed!",
            "success"
        );

        return;

    }


    /* ---------- CURRENT DAY ---------- */

    ensureCurrentDay();


    const day =
        data.days.find(
            item =>
                item.day === data.currentDay
        );


    if (!day) {

        showMessage(
            "Something went wrong. Please try again.",
            "error"
        );

        return;

    }


    /* ---------- PREVENT DOUBLE PAYMENT ---------- */

    if (day.completed) {

        showMessage(
            "This day is already completed.",
            "error"
        );

        return;

    }


    /* ---------- SAVE AMOUNT ---------- */

    day.saved += amount;

    data.saved += amount;


    /* =========================================
       TARGET REACHED
    ========================================= */

    if (day.saved >= day.target) {

        const extra =
            day.saved - day.target;


        day.completed = true;

        data.completedDays++;


        /*
            Extra money becomes credit
            for the next day.
        */

        data.carryOver =
            Math.max(extra, 0);


        /*
            Move to next day
        */

        data.currentDay++;


        /*
            Create next day automatically
        */

        if (data.saved < TARGET_AMOUNT) {

            const nextDay =
                createDay(data.currentDay);

            data.days.push(nextDay);

        }


        showMessage(
            `✅ Day ${day.day} completed!`,
            "success"
        );


    } else {

        /*
            Day was not fully completed.

            Calculate how much is still missing.
        */

        const remainingForDay =
            day.target - day.saved;


        data.carryOver =
            remainingForDay;


        /*
            IMPORTANT:
            Current day is NOT completed yet.
            User can add more money to the same day.
        */

        showMessage(
            `⚠️ ${formatMoney(remainingForDay)} remaining for Day ${day.day}.`,
            "error"
        );

    }


    savingInput.value = "";

    saveData();

    renderTable();

    updateStats();

    checkCompletion();

}


/* =========================================
   MESSAGE
========================================= */

function showMessage(message, type) {

    paymentMessageEl.textContent =
        message;


    if (type === "success") {

        paymentMessageEl.style.color =
            "#16a34a";

    } else {

        paymentMessageEl.style.color =
            "#dc2626";

    }


    setTimeout(() => {

        paymentMessageEl.textContent = "";

    }, 4000);

}


/* =========================================
   RESET CHALLENGE
========================================= */

function resetChallenge() {

    const confirmed =
        confirm(
            "Are you sure you want to reset the entire saving challenge?"
        );


    if (!confirmed) {

        return;

    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    data =
        createDefaultData();


    ensureCurrentDay();

    renderTable();

    updateStats();

    checkCompletion();


    showMessage(
        "Challenge has been reset.",
        "success"
    );

}


/* =========================================
   EVENTS
========================================= */

addSavingBtn.addEventListener(
    "click",
    addSaving
);


savingInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            addSaving();

        }

    }
);


resetBtn.addEventListener(
    "click",
    resetChallenge
);


/* =========================================
   INITIALIZE
========================================= */

function initialize() {

    ensureCurrentDay();

    renderTable();

    updateStats();

    checkCompletion();

}


initialize();
