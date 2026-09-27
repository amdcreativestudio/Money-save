/* =========================================
   100 DAY SAVING CHALLENGE
   SCRIPT.JS
========================================= */

const BASE_AMOUNT = 20;
const ORIGINAL_DAYS = 100;
const TARGET_AMOUNT = 101000;

const STORAGE_KEY = "savingChallengeData_v2";


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
        version: 2,

        saved: 0,

        currentDay: 1,

        processedDays: 0,

        shortfall: 0,

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

        const parsed =
            JSON.parse(savedData);

        /*
            Make sure required properties exist.
        */

        if (
            !parsed ||
            parsed.version !== 2 ||
            !Array.isArray(parsed.days)
        ) {

            return createDefaultData();

        }

        return parsed;

    } catch (error) {

        console.error(
            "Unable to load saving data:",
            error
        );

        return createDefaultData();

    }

}


/* =========================================
   GLOBAL DATA
========================================= */

let data = loadData();


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
   BASE TARGET
========================================= */

function getBaseTarget(dayNumber) {

    /*
        Day 1 = 20
        Day 2 = 40
        ...
        Day 100 = 2000

        Extra days:
        Day 101, 102... are NOT normal
        challenge targets. They are used
        only to clear the accumulated shortfall.
    */

    return BASE_AMOUNT * dayNumber;

}


/* =========================================
   CREATE NORMAL DAY
========================================= */

function createNormalDay(dayNumber) {

    return {

        day: dayNumber,

        baseTarget:
            getBaseTarget(dayNumber),

        target:
            getBaseTarget(dayNumber),

        saved: 0,

        remaining: 0,

        completed: false,

        processed: false,

        extraDay: false

    };

}


/* =========================================
   CREATE EXTRA DAY
========================================= */

function createExtraDay(dayNumber) {

    return {

        day: dayNumber,

        baseTarget: 0,

        target: data.shortfall,

        saved: 0,

        remaining: data.shortfall,

        completed: false,

        processed: false,

        extraDay: true

    };

}


/* =========================================
   ENSURE CURRENT DAY
========================================= */

function ensureCurrentDay() {

    let existingDay =
        data.days.find(
            day => day.day === data.currentDay
        );


    if (existingDay) {

        return existingDay;

    }


    let newDay;


    /*
        First 100 days
    */

    if (data.currentDay <= ORIGINAL_DAYS) {

        newDay =
            createNormalDay(
                data.currentDay
            );

    }

    /*
        Extra days after Day 100
    */

    else {

        /*
            If there is no shortfall,
            no extra day is required.
        */

        if (data.shortfall <= 0) {

            return null;

        }

        newDay =
            createExtraDay(
                data.currentDay
            );

    }


    data.days.push(newDay);

    saveData();

    return newDay;

}


/* =========================================
   FORMAT MONEY
========================================= */

function formatMoney(amount) {

    return "Rs." +
        Number(amount).toLocaleString("en-US");

}


/* =========================================
   GET CURRENT DAY
========================================= */

function getCurrentDay() {

    return data.days.find(
        day =>
            day.day === data.currentDay
    );

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


        /* ---------- COMPLETED ---------- */

        if (day.completed) {

            statusHTML = `
                <span class="status completed">
                    ✅ Completed
                </span>
            `;

        }


        /* ---------- PARTIAL ---------- */

        else if (
            day.processed &&
            day.remaining > 0
        ) {

            statusHTML = `
                <span class="status partial">
                    ⚠️ Partial
                </span>
            `;

        }


        /* ---------- PENDING ---------- */

        else {

            statusHTML = `
                <span class="status pending">
                    ⏳ Pending
                </span>
            `;

        }


        row.innerHTML = `

            <td>
                <strong>
                    Day ${day.day}
                    ${
                        day.extraDay
                        ? '<small style="display:block;color:#7c3aed;">Extra Day</small>'
                        : ''
                    }
                </strong>
            </td>

            <td>
                ${
                    day.extraDay
                    ? "-"
                    : formatMoney(day.baseTarget)
                }
            </td>

            <td>
                ${
                    day.remaining > 0
                    ? formatMoney(day.remaining)
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
        Math.min(
            data.saved,
            TARGET_AMOUNT
        );


    const remaining =
        Math.max(
            TARGET_AMOUNT - saved,
            0
        );


    /*
        REAL PROGRESS

        Rs.20 / Rs.101000 × 100
    */

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


    /*
        IMPORTANT:
        Actually fill the progress bar.
    */

    progressFillEl.style.width =
        `${progress}%`;


    /*
        Processed days
    */

    completedDaysEl.textContent =
        data.processedDays;


    /*
        Original 100 days + extra days
    */

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

    if (
        data.saved >= TARGET_AMOUNT &&
        data.shortfall <= 0
    ) {

        completionSection.classList.remove(
            "hidden"
        );


        progressFillEl.style.width =
            "100%";


        progressPercentEl.textContent =
            "100%";


        progressTextEl.textContent =
            "Challenge completed! 🎉";


        currentDayEl.textContent =
            "Completed 🎉";


        return true;

    }


    completionSection.classList.add(
        "hidden"
    );


    return false;

}


/* =========================================
   PROCESS NORMAL DAY
========================================= */

function processNormalDay(day, amount) {

    day.saved = amount;

    day.processed = true;

    data.processedDays++;


    /*
        Calculate remaining amount
    */

    const remaining =
        Math.max(
            day.target - amount,
            0
        );


    day.remaining =
        remaining;


    /*
        Add shortfall to total shortfall
    */

    data.shortfall += remaining;


    /*
        If exact target reached
    */

    if (amount >= day.target) {

        day.completed = true;

        /*
            If user paid extra,
            subtract extra from shortfall.

            Example:
            Target = 40
            Paid = 50
            Extra = 10
        */

        const extra =
            amount - day.target;


        if (extra > 0) {

            data.shortfall =
                Math.max(
                    data.shortfall - extra,
                    0
                );

        }

    }


    /*
        Move to next day
    */

    data.currentDay++;

}


/* =========================================
   PROCESS EXTRA DAY
========================================= */

function processExtraDay(day, amount) {

    day.saved = amount;

    day.processed = true;

    data.processedDays++;


    /*
        Extra day target is the
        accumulated shortfall.
    */

    const remaining =
        Math.max(
            day.target - amount,
            0
        );


    day.remaining =
        remaining;


    /*
        Reduce shortfall by payment.
    */

    data.shortfall =
        remaining;


    /*
        If fully paid
    */

    if (remaining <= 0) {

        day.completed = true;

        data.shortfall = 0;

    }


    /*
        If still remaining,
        create another extra day.
    */

    if (data.shortfall > 0) {

        data.currentDay++;

    }

}


/* =========================================
   ADD SAVING
========================================= */

function addSaving() {

    const amount =
        Number(
            savingInput.value
        );


    /* ---------- VALIDATION ---------- */

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showMessage(
            "Please enter a valid amount.",
            "error"
        );

        return;

    }


    /*
        Prevent saving more after completion.
    */

    if (checkCompletion()) {

        showMessage(
            "🎉 Your challenge is already completed!",
            "success"
        );

        return;

    }


    /*
        Get current day
    */

    let day =
        getCurrentDay();


    /*
        If day does not exist,
        create it.
    */

    if (!day) {

        day =
            ensureCurrentDay();

    }


    if (!day) {

        showMessage(
            "Something went wrong.",
            "error"
        );

        return;

    }


    /*
        Do not allow the same day
        to be processed twice.
    */

    if (day.processed) {

        showMessage(
            "This day has already been recorded.",
            "error"
        );

        return;

    }


    /* =========================================
       ADD TO TOTAL SAVINGS
    ========================================= */

    data.saved += amount;


    /*
        Never allow saved to go
        above the final target.
    */

    if (data.saved > TARGET_AMOUNT) {

        data.saved =
            TARGET_AMOUNT;

    }


    /* =========================================
       NORMAL DAY
    ========================================= */

    if (
        !day.extraDay &&
        day.day <= ORIGINAL_DAYS
    ) {

        processNormalDay(
            day,
            amount
        );


        if (day.completed) {

            showMessage(
                `✅ Day ${day.day} completed!`,
                "success"
            );

        } else {

            showMessage(
                `⚠️ Day ${day.day} completed partially. ${formatMoney(day.remaining)} added to your remaining amount.`,
                "error"
            );

        }

    }


    /* =========================================
       EXTRA DAY
    ========================================= */

    else {

        processExtraDay(
            day,
            amount
        );


        if (day.completed) {

            showMessage(
                `🎉 Extra Day ${day.day} completed!`,
                "success"
            );

        } else {

            showMessage(
                `⚠️ ${formatMoney(day.remaining)} still remaining.`,
                "error"
            );

        }

    }


    /*
        Create next day automatically
        if necessary.
    */

    if (
        data.saved < TARGET_AMOUNT
    ) {

        /*
            For days 1-100:
            Always create next normal day.
        */

        if (
            data.currentDay <= ORIGINAL_DAYS
        ) {

            ensureCurrentDay();

        }

        /*
            After Day 100:
            Create extra day only if
            there is shortfall.
        */

        else if (
            data.shortfall > 0
        ) {

            ensureCurrentDay();

        }

    }


    /*
        Clear input
    */

    savingInput.value = "";


    /*
        Save
    */

    saveData();


    /*
        Update UI
    */

    renderTable();

    updateStats();

    checkCompletion();

}


/* =========================================
   SHOW MESSAGE
========================================= */

function showMessage(
    message,
    type
) {

    paymentMessageEl.textContent =
        message;


    if (
        type === "success"
    ) {

        paymentMessageEl.style.color =
            "#16a34a";

    } else {

        paymentMessageEl.style.color =
            "#dc2626";

    }


    setTimeout(() => {

        paymentMessageEl.textContent =
            "";

    }, 5000);

}


/* =========================================
   RESET CHALLENGE
========================================= */

function resetChallenge() {

    /*
        Confirmation message
    */

    const confirmed =
        window.confirm(
            "⚠️ Are you sure?\n\n" +
            "This will delete all your saved progress and restart the 100-Day Saving Challenge from Day 1."
        );


    /*
        User pressed Cancel
    */

    if (!confirmed) {

        return;

    }


    /*
        Delete saved data
    */

    localStorage.removeItem(
        STORAGE_KEY
    );


    /*
        Create fresh challenge
    */

    data =
        createDefaultData();


    /*
        Create Day 1
    */

    ensureCurrentDay();


    /*
        Update page
    */

    renderTable();

    updateStats();

    checkCompletion();


    showMessage(
        "🔄 Challenge has been reset successfully.",
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

        if (
            event.key === "Enter"
        ) {

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

    /*
        Make sure Day 1 exists.
    */

    ensureCurrentDay();


    /*
        Render everything.
    */

    renderTable();

    updateStats();

    checkCompletion();

}


initialize();
