/* =========================================
   CUSTOM SAVING CHALLENGE
   FULL UPDATED SCRIPT
   CARRY-FORWARD SYSTEM
========================================= */


/* =========================================
   SETTINGS
========================================= */

const MIN_TARGET = 5000;
const MAX_TARGET = 500000;
const TARGET_STEP = 5000;

const STORAGE_KEY = "customSavingChallenge_v2";


/* =========================================
   DOM ELEMENTS
========================================= */

const $ = (id) => document.getElementById(id);

const targetInput = $("targetInput");
const dailyAmountInput = $("dailyAmountInput");
const startBtn = $("startBtn");
const resetBtn = $("resetBtn");

const setupSection = $("setupSection");
const challengeSection = $("challengeSection");

const setupMessage = $("setupMessage");
const paymentMessage = $("paymentMessage");

const addSavingBtn = $("addSavingBtn");
const savingTableBody = $("savingTableBody");
const chartCanvas = $("savingChart");


/* =========================================
   DATA
========================================= */

let data = loadData();


/* =========================================
   MONEY FORMAT
========================================= */

function formatMoney(amount) {

    return (
        "Rs." +
        Math.round(Number(amount) || 0)
            .toLocaleString("en-US")
    );
}


/* =========================================
   DEFAULT DATA
========================================= */

function createDefaultData() {

    return {

        version: 2,

        target: 0,

        dailyAmount: 0,

        /*
           Original estimated days.
           This does NOT change when money is missed.
        */
        totalDays: 0,

        /*
           Actual amount saved.
        */
        saved: 0,

        /*
           Current challenge day.
        */
        currentDay: 1,

        /*
           Money that was not saved previously
           and must be added to today's target.
        */
        carryForward: 0,

        /*
           Daily records.
        */
        days: [],

        createdAt: null

    };
}


/* =========================================
   LOAD DATA
========================================= */

function loadData() {

    try {

        const raw =
            localStorage.getItem(STORAGE_KEY);

        if (!raw) {

            return createDefaultData();
        }

        const parsed =
            JSON.parse(raw);

        if (
            !parsed ||
            !parsed.version ||
            !parsed.target
        ) {

            return createDefaultData();
        }

        /*
           Migration protection
           for older version.
        */

        if (parsed.carryForward === undefined) {

            parsed.carryForward = 0;
        }

        if (!Array.isArray(parsed.days)) {

            parsed.days = [];
        }

        return parsed;

    } catch (error) {

        console.error(
            "Unable to load saving challenge:",
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
   TARGET DROPDOWN
========================================= */

function populateTargets() {

    targetInput.innerHTML = "";

    for (
        let amount = MIN_TARGET;
        amount <= MAX_TARGET;
        amount += TARGET_STEP
    ) {

        const option =
            document.createElement("option");

        option.value = amount;

        option.textContent =
            formatMoney(amount);

        targetInput.appendChild(option);
    }
}


/* =========================================
   INITIAL DAY CALCULATION
========================================= */

function calculateDays(target, daily) {

    if (!daily || daily <= 0) {

        return 0;
    }

    return Math.max(
        1,
        Math.ceil(target / daily)
    );
}


/* =========================================
   REMAINING GOAL
========================================= */

function getRemainingGoal() {

    return Math.max(
        data.target - data.saved,
        0
    );
}


/* =========================================
   TODAY'S NORMAL TARGET
========================================= */

function getNormalDailyTarget() {

    return Math.min(
        data.dailyAmount,
        getRemainingGoal()
    );
}


/* =========================================
   TODAY'S TOTAL TARGET
========================================= */

function getTodayTarget() {

    const remainingGoal =
        getRemainingGoal();

    if (remainingGoal <= 0) {

        return 0;
    }

    return Math.min(
        data.dailyAmount + data.carryForward,
        remainingGoal
    );
}


/* =========================================
   PREVIEW
========================================= */

function updatePreview() {

    const target =
        Number(targetInput.value) ||
        MIN_TARGET;

    const daily =
        Number(dailyAmountInput.value) ||
        0;

    $("previewTarget").textContent =
        formatMoney(target);

    $("previewDaily").textContent =
        daily > 0
            ? formatMoney(daily)
            : "Rs.0";

    $("previewDays").textContent =
        daily > 0
            ? calculateDays(
                target,
                daily
            ).toLocaleString("en-US")
            : "—";
}


/* =========================================
   FORM MESSAGE
========================================= */

function showFormMessage(
    element,
    message,
    type = "error"
) {

    if (!element) return;

    element.textContent = message;

    element.className =
        "form-message " + type;

    window.clearTimeout(
        element._timer
    );

    element._timer =
        window.setTimeout(
            () => {

                element.textContent = "";

            },
            5000
        );
}


/* =========================================
   CREATE CHALLENGE
========================================= */

function createChallenge() {

    const target =
        Number(targetInput.value);

    const daily =
        Math.floor(
            Number(
                dailyAmountInput.value
            )
        );


    /* -----------------------------------------
       VALIDATE TARGET
    ----------------------------------------- */

    if (
        !target ||
        target < MIN_TARGET ||
        target > MAX_TARGET ||
        target % TARGET_STEP !== 0
    ) {

        showFormMessage(
            setupMessage,
            "Please select a valid target from Rs.5,000 to Rs.500,000."
        );

        return;
    }


    /* -----------------------------------------
       VALIDATE DAILY AMOUNT
    ----------------------------------------- */

    if (!daily || daily < 1) {

        showFormMessage(
            setupMessage,
            "Please enter a daily saving amount greater than Rs.0."
        );

        return;
    }


    /* -----------------------------------------
       DAILY > TARGET
    ----------------------------------------- */

    if (daily > target) {

        const ok =
            window.confirm(

                "Your daily saving amount is higher than the target.\n\n" +

                "You can complete the goal in 1 day.\n\n" +

                "Continue?"

            );


        if (!ok) return;
    }


    /* -----------------------------------------
       EXISTING CHALLENGE
    ----------------------------------------- */

    if (
        data.target > 0 &&
        data.saved > 0
    ) {

        const ok =
            window.confirm(

                "A challenge is already in progress.\n\n" +

                "Starting a new challenge will replace the current progress.\n\n" +

                "Continue?"

            );


        if (!ok) return;
    }


    /* -----------------------------------------
       CREATE NEW DATA
    ----------------------------------------- */

    data = {

        version: 2,

        target: target,

        dailyAmount: daily,

        totalDays:
            calculateDays(
                target,
                daily
            ),

        saved: 0,

        currentDay: 1,

        /*
           IMPORTANT:
           New challenge starts with zero carry.
        */
        carryForward: 0,

        days: [],

        createdAt:
            new Date().toISOString()

    };


    /* -----------------------------------------
       CREATE FIRST DAY
    ----------------------------------------- */

    ensureCurrentDay();


    saveData();


    setupSection.classList.add(
        "hidden"
    );

    challengeSection.classList.remove(
        "hidden"
    );


    render();
}


/* =========================================
   ENSURE CURRENT DAY
========================================= */

function ensureCurrentDay() {

    if (
        !data.target ||
        data.saved >= data.target
    ) {

        return null;
    }


    let day =
        data.days.find(
            item =>
                item.day === data.currentDay
        );


    if (day) {

        return day;
    }


    /* -----------------------------------------
       TODAY'S TARGET

       Normal daily amount
       +
       previous missed amount
    ----------------------------------------- */

    const todayTarget =
        getTodayTarget();


    day = {

        day: data.currentDay,

        /*
           This is the ACTUAL target for today.
        */
        planned: todayTarget,

        /*
           How much user actually saved today.
        */
        saved: 0,

        /*
           How much is still missing.
        */
        remaining: todayTarget,

        completed: false,

        date: null

    };


    data.days.push(day);


    return day;
}


/* =========================================
   GET CURRENT DAY
========================================= */

function getCurrentDayRecord() {

    return data.days.find(
        item =>
            item.day === data.currentDay
    );
}


/* =========================================
   ADD TODAY'S SAVING
========================================= */

function addTodaySaving() {

    if (!data.target || !data.dailyAmount) {

        showFormMessage(
            paymentMessage,
            "Create a saving challenge first."
        );

        return;
    }


    /* Goal already completed */

    if (data.saved >= data.target) {

        showFormMessage(
            paymentMessage,
            "🎉 Your goal is already completed!",
            "success"
        );

        return;
    }


    /* Get today's current record */

    const day = ensureCurrentDay();

    if (!day) {
        return;
    }


    if (day.completed) {

        showFormMessage(
            paymentMessage,
            "Today's saving has already been recorded.",
            "error"
        );

        return;
    }


    /* =========================================
       GET AMOUNT FROM THE INPUT BOX
       NO POPUP
    ========================================= */

    const input = $("todaySavingInput");

    const amount = Math.floor(
        Number(input.value)
    );


    /* =========================================
       VALIDATE
    ========================================= */

    if (
        Number.isNaN(amount) ||
        amount < 0
    ) {

        showFormMessage(
            paymentMessage,
            "Please enter a valid saving amount.",
            "error"
        );

        return;
    }


    /* =========================================
       TODAY'S TARGET
    ========================================= */

    const todayTarget =
        getTodayTarget();


    /* =========================================
       PREVIOUS TOTAL
       BEFORE TODAY'S SAVING
    ========================================= */

    const previousSaved =
        data.saved;


    /* =========================================
       AMOUNT THAT CAN ACTUALLY BE ADDED
       
       Extra saving is allowed,
       but total target cannot be exceeded.
    ========================================= */

    const amountToAdd =
        Math.min(
            amount,
            data.target - previousSaved
        );


    /* =========================================
       UPDATE TOTAL SAVED
    ========================================= */

    data.saved += amountToAdd;


    /* =========================================
       SAVE TODAY'S RECORD
    ========================================= */

    day.saved = amountToAdd;

    day.date =
        new Date().toISOString();


    /* =========================================
       CALCULATE TODAY'S REMAINING
    ========================================= */

    day.remaining =
        Math.max(
            todayTarget - amountToAdd,
            0
        );


    /* =========================================
       CARRY FORWARD
    ========================================= */

    if (day.remaining > 0) {

        /*
           Example:

           Today's target = Rs.500
           Saved = Rs.300

           Carry = Rs.200
        */

        data.carryForward =
            day.remaining;

    } else {

        /*
           Today's target completed.
        */

        data.carryForward = 0;
    }


    /* =========================================
       MARK TODAY COMPLETE
       
       The button represents today's action,
       so today is recorded after pressing it.
    ========================================= */

    day.completed = true;


    /* =========================================
       MOVE TO NEXT DAY
    ========================================= */

    if (data.saved < data.target) {

        data.currentDay += 1;

        /*
           Automatically create tomorrow's
           target using carry-forward.
        */

        ensureCurrentDay();
    }


    /* =========================================
       SAVE TO LOCAL STORAGE
    ========================================= */

    saveData();


    /* =========================================
       CLEAR INPUT
    ========================================= */

    input.value = "";


    /* =========================================
       UPDATE EVERYTHING
    ========================================= */

    render();


    /* =========================================
       MESSAGE
    ========================================= */

    if (data.saved >= data.target) {

        showFormMessage(
            paymentMessage,
            "🎉 Goal completed! You reached your target.",
            "success"
        );

        return;
    }


    if (day.remaining > 0) {

        showFormMessage(
            paymentMessage,

            `✅ Day ${day.day} completed — ` +
            `${formatMoney(amountToAdd)} saved. ` +
            `${formatMoney(day.remaining)} carried forward to tomorrow.`,

            "success"
        );

    } else {

        showFormMessage(
            paymentMessage,

            `✅ Day ${day.day} completed — ` +
            `${formatMoney(amountToAdd)} saved.`,

            "success"
        );
    }
}

    /* -----------------------------------------
       GOAL ALREADY COMPLETE
    ----------------------------------------- */

    if (
        data.saved >= data.target
    ) {

        showFormMessage(
            paymentMessage,
            "🎉 Your goal is already completed!",
            "success"
        );

        return;
    }


    const day =
        ensureCurrentDay();


    if (!day) {

        return;
    }


    if (day.completed) {

        showFormMessage(
            paymentMessage,
            "Today's saving has already been recorded.",
            "error"
        );

        return;
    }


    /* =========================================
       ASK USER HOW MUCH THEY ACTUALLY SAVED
    ========================================= */

    const todayTarget =
        getTodayTarget();


    const input =
        window.prompt(

            "Today's saving target:\n\n" +

            `${formatMoney(todayTarget)}\n\n` +

            "How much did you actually save today?\n\n" +

            "Enter 0 if you could not save anything."

        );


    /* -----------------------------------------
       CANCEL
    ----------------------------------------- */

    if (input === null) {

        return;
    }


    const amount =
        Math.floor(
            Number(input)
        );


    /* -----------------------------------------
       INVALID AMOUNT
    ----------------------------------------- */

    if (
        Number.isNaN(amount) ||
        amount < 0
    ) {

        showFormMessage(
            paymentMessage,
            "Please enter a valid amount.",
            "error"
        );

        return;
    }


    /* =========================================
       AMOUNT TO SAVE

       User can save MORE than today's target.

       Example:
       Target = 500
       User saves = 700

       Full Rs.700 is counted.
    ========================================= */

    const actualAmount =
        amount;


    /* -----------------------------------------
       UPDATE TOTAL SAVED
    ----------------------------------------- */

    data.saved += actualAmount;


    /*
       Never allow total saved
       to exceed the main target.
    */

    if (
        data.saved > data.target
    ) {

        data.saved =
            data.target;
    }


    /* =========================================
       HOW MUCH WAS ACTUALLY COUNTED
    ========================================= */

    const countedAmount =
        data.saved -
        (
            data.saved -
            actualAmount
        );


    /*
       The above calculation is protected
       below with a simpler safe value.
    */

    const previousSaved =
        data.saved -
        Math.min(
            actualAmount,
            data.saved
        );


    /* =========================================
       DAY RECORD
    ========================================= */

    const previousTotal =
        Math.max(
            data.saved -
            Math.min(
                actualAmount,
                data.saved
            ),
            0
        );


    /*
       Actual amount counted for this day.
    */

    const savedForDay =
        Math.min(
            actualAmount,
            todayTarget
        );


    /*
       If user saves MORE than today's target,
       extra money still goes toward the goal.

       So calculate from previous total.
    */

    const beforeSaving =
        data.saved -
        Math.min(
            actualAmount,
            getRemainingGoal() +
            actualAmount
        );


    /* =========================================
       SAFER DAY SAVED CALCULATION
    ========================================= */

    const oldSaved =
        Math.max(
            0,
            data.saved -
            Math.min(
                actualAmount,
                data.target
            )
        );


    let daySaved =
        data.saved -
        oldSaved;


    /*
       Limit to actual amount entered.
    */

    daySaved =
        Math.min(
            actualAmount,
            data.target - oldSaved
        );


    day.saved =
        Math.max(
            0,
            daySaved
        );


    /* =========================================
       CALCULATE TODAY REMAINING
    ========================================= */

    day.remaining =
        Math.max(
            todayTarget -
            day.saved,
            0
        );


    day.date =
        new Date().toISOString();


    day.completed = true;


    /* =========================================
       ⭐ CARRY FORWARD LOGIC
    ========================================= */

    if (
        day.remaining > 0
    ) {

        /*
           User did NOT save enough.

           Example:

           Today's target = 500
           Saved = 300

           Carry = 200
        */

        data.carryForward =
            day.remaining;

    } else {

        /*
           Today's target completed.
           No previous shortage.
        */

        data.carryForward = 0;
    }


    /* =========================================
       MOVE TO NEXT DAY
    ========================================= */

    if (
        data.saved < data.target
    ) {

        data.currentDay += 1;

        /*
           Create next day automatically.
        */

        ensureCurrentDay();
    }


    /* =========================================
       SAVE
    ========================================= */

    saveData();


    /* =========================================
       UPDATE UI
    ========================================= */

    render();


    /* =========================================
       MESSAGE
    ========================================= */

    if (
        data.saved >= data.target
    ) {

        showFormMessage(

            paymentMessage,

            "🎉 Goal completed! You reached your target.",

            "success"
        );

        return;
    }


    if (
        day.remaining > 0
    ) {

        showFormMessage(

            paymentMessage,

            `Day ${day.day} completed — ` +

            `${formatMoney(day.saved)} saved.\n` +

            `${formatMoney(day.remaining)} will carry forward to tomorrow.`,

            "success"
        );

    } else {

        showFormMessage(

            paymentMessage,

            `✅ Day ${day.day} completed — ` +

            `${formatMoney(day.saved)} saved.`,

            "success"
        );
    }
}


/* =========================================
   PROGRESS
========================================= */

function getProgress() {

    if (!data.target) {

        return 0;
    }


    return Math.min(

        (
            data.saved /
            data.target
        ) * 100,

        100
    );
}


/* =========================================
   COMPLETED DAYS
========================================= */

function getCompletedDays() {

    return data.days.filter(
        day =>
            day.completed
    );
}


function updateStats() {

    const progress = getProgress();

    const remaining =
        getRemainingGoal();

    const completedDays =
        getCompletedDays().length;


    /* =========================================
       CURRENT DAY
    ========================================= */

    const currentDay =
        getCurrentDayRecord();


    /*
       Today's actual target
       = normal daily amount
       + previous remaining
    */

    const normalDaily =
        Math.min(
            data.dailyAmount,
            remaining
        );


    const carryForward =
        Number(data.carryForward) || 0;


    const todayTarget =
        currentDay
            ? Number(currentDay.planned) || 0
            : getTodayTarget();


    const savedToday =
        currentDay
            ? Number(currentDay.saved) || 0
            : 0;


    const todayRemaining =
        currentDay
            ? Math.max(
                Number(currentDay.remaining) || 0,
                0
            )
            : Math.max(
                todayTarget - savedToday,
                0
            );


    /* =========================================
       DAYS
    ========================================= */

    const daysLeft =
        Math.max(
            data.totalDays -
            completedDays,
            0
        );


    /* =========================================
       MAIN STATS
    ========================================= */

    $("targetAmount").textContent =
        formatMoney(data.target);


    $("savedAmount").textContent =
        formatMoney(data.saved);


    $("remainingAmount").textContent =
        formatMoney(remaining);


    $("currentDay").textContent =

        data.saved >= data.target

            ? "Completed 🎉"

            : `Day ${data.currentDay}`;


    /* =========================================
       PROGRESS
    ========================================= */

    $("progressText").textContent =
        `${progress.toFixed(2)}% completed`;


    $("progressPercent").textContent =
        `${progress.toFixed(2)}%`;


    $("progressFill").style.width =
        `${progress}%`;


    /* =========================================
       DAYS
    ========================================= */

    $("completedDays").textContent =
        completedDays.toLocaleString("en-US");


    $("totalDays").textContent =
        data.totalDays.toLocaleString("en-US");


    $("daysRemaining").textContent =
        daysLeft.toLocaleString("en-US");


    /* =========================================
       TODAY MAIN DISPLAY
    ========================================= */

    $("todayAmount").textContent =

        data.saved >= data.target

            ? "Goal Reached 🎉"

            : formatMoney(todayTarget);


    $("todayDescription").textContent =

        data.saved >= data.target

            ? "You have completed this saving challenge."

            : `Today's target: ${formatMoney(todayTarget)}. ` +
              `Remaining: ${formatMoney(todayRemaining)}.`;


    /* =========================================
       ⭐ TODAY BREAKDOWN
    ========================================= */

    /*
       1. NORMAL DAILY TARGET
    */

    $("normalDailyTarget").textContent =
        formatMoney(normalDaily);


    /*
       2. PREVIOUS REMAINING
    */

    $("carryForwardAmount").textContent =
        formatMoney(carryForward);


    /*
       3. TODAY'S TOTAL TARGET
    */

    $("todayTotalTarget").textContent =
        formatMoney(todayTarget);


    /*
       4. SAVED TODAY
    */

    $("savedToday").textContent =
        formatMoney(savedToday);


    /*
       5. TODAY'S REMAINING
    */

    $("todayRemaining").textContent =
        formatMoney(todayRemaining);


    /* =========================================
       SUMMARY
    ========================================= */

    $("summarySaved").textContent =
        formatMoney(data.saved);


    $("summaryRemaining").textContent =
        formatMoney(remaining);


    $("summaryProgress").textContent =
        `${progress.toFixed(2)}%`;


    $("summaryDaily").textContent =
        formatMoney(data.dailyAmount);


    /* =========================================
       TABLE STATS
    ========================================= */

    $("tableCompleted").textContent =
        completedDays.toLocaleString("en-US");


    $("tableTotal").textContent =
        data.totalDays.toLocaleString("en-US");


    /* =========================================
       BUTTON
    ========================================= */

    addSavingBtn.disabled =
        data.saved >= data.target;


    addSavingBtn.textContent =

        data.saved >= data.target

            ? "✓ Goal Completed"

            : "✓ Add Today's Saving";
}
    /* -----------------------------------------
       MAIN STATS
    ----------------------------------------- */

    $("targetAmount").textContent =
        formatMoney(
            data.target
        );


    $("savedAmount").textContent =
        formatMoney(
            data.saved
        );


    $("remainingAmount").textContent =
        formatMoney(
            remaining
        );


    $("currentDay").textContent =

        data.saved >= data.target

            ? "Completed 🎉"

            : `Day ${data.currentDay}`;


    /* -----------------------------------------
       PROGRESS
    ----------------------------------------- */

    $("progressText").textContent =
        `${progress.toFixed(2)}% completed`;


    $("progressPercent").textContent =
        `${progress.toFixed(2)}%`;


    $("progressFill").style.width =
        `${progress}%`;


    /* -----------------------------------------
       DAYS
    ----------------------------------------- */

    $("completedDays").textContent =
        completedDays.toLocaleString(
            "en-US"
        );


    $("totalDays").textContent =
        data.totalDays.toLocaleString(
            "en-US"
        );


    $("daysRemaining").textContent =
        daysLeft.toLocaleString(
            "en-US"
        );


    /* -----------------------------------------
       TODAY
    ----------------------------------------- */

    $("todayAmount").textContent =

        data.saved >= data.target

            ? "Goal Reached 🎉"

            : formatMoney(
                todayTarget
            );


    $("todayDescription").textContent =

        data.saved >= data.target

            ? "You have completed this saving challenge."

            : todayRemaining > 0

                ? `Today's target: ${formatMoney(todayTarget)}. ` +
                  `Remaining: ${formatMoney(todayRemaining)}.`

                : "Today's saving is complete.";


    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    $("summarySaved").textContent =
        formatMoney(
            data.saved
        );


    $("summaryRemaining").textContent =
        formatMoney(
            remaining
        );


    $("summaryProgress").textContent =
        `${progress.toFixed(2)}%`;


    $("summaryDaily").textContent =
        formatMoney(
            data.dailyAmount
        );


    /* -----------------------------------------
       TABLE STATS
    ----------------------------------------- */

    $("tableCompleted").textContent =
        completedDays.toLocaleString(
            "en-US"
        );


    $("tableTotal").textContent =
        data.totalDays.toLocaleString(
            "en-US"
        );


    /* -----------------------------------------
       BUTTON
    ----------------------------------------- */

    addSavingBtn.disabled =
        data.saved >= data.target;


    addSavingBtn.textContent =

        data.saved >= data.target

            ? "✓ Goal Completed"

            : "✓ Add Today's Saving";
}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable() {

    savingTableBody.innerHTML = "";


    if (!data.target) {

        return;
    }


    const completed =
        data.days.filter(
            day =>
                day.completed
        );


    const upcoming =
        data.days.filter(
            day =>
                !day.completed
        );


    let visible = [];


    /* -----------------------------------------
       LAST COMPLETED DAYS
    ----------------------------------------- */

    if (
        completed.length > 0
    ) {

        visible =
            completed.slice(-20);
    }


    /* -----------------------------------------
       UPCOMING
    ----------------------------------------- */

    visible =
        visible.concat(
            upcoming.slice(0, 10)
        );


    /* -----------------------------------------
       REMOVE DUPLICATES
    ----------------------------------------- */

    visible =
        visible.filter(
            (day, index, arr) =>

                arr.findIndex(
                    x =>
                        x.day === day.day
                ) === index
        );


    /* -----------------------------------------
       CREATE ROWS
    ----------------------------------------- */

    visible.forEach(
        day => {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                day.completed

                    ? '<span class="status completed">✓ Completed</span>'

                    : '<span class="status pending">⏳ Today / Pending</span>';


            row.innerHTML = `

                <td>
                    <strong>
                        Day ${day.day.toLocaleString("en-US")}
                    </strong>
                </td>

                <td>
                    ${formatMoney(day.planned)}
                </td>

                <td>
                    ${formatMoney(day.saved)}
                </td>

                <td>
                    ${status}
                </td>

            `;


            savingTableBody.appendChild(
                row
            );
        }
    );


    /* -----------------------------------------
       TABLE NOTE
    ----------------------------------------- */

    const hiddenCount =
        Math.max(
            data.days.length -
            visible.length,
            0
        );


    $("tableNote").textContent =

        hiddenCount

            ? `Showing the latest completed days and upcoming days. ${hiddenCount.toLocaleString("en-US")} older entries are hidden for performance.`

            : "Your saving history will grow automatically as you complete each day.";
}


/* =========================================
   CHART
========================================= */

function drawChart() {

    const canvas =
        chartCanvas;


    if (!canvas) {

        return;
    }


    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio || 1;


    const width =
        Math.max(
            320,
            Math.floor(
                rect.width
            )
        );


    const height = 280;


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    const ctx =
        canvas.getContext("2d");


    ctx.scale(
        dpr,
        dpr
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /* -----------------------------------------
       COMPLETED DAYS
    ----------------------------------------- */

    const completed =
        data.days.filter(
            day =>
                day.completed
        );


    if (!completed.length) {

        ctx.fillStyle =
            "#777";


        ctx.font =
            "600 14px Inter, Arial, sans-serif";


        ctx.textAlign =
            "center";


        ctx.fillText(

            "Your daily savings will appear here.",

            width / 2,

            height / 2

        );


        return;
    }


    /* -----------------------------------------
       LAST 30 DAYS
    ----------------------------------------- */

    const items =
        completed.slice(-30);


    const padding = {

        top: 28,

        right: 18,

        bottom: 42,

        left: 54

    };


    const chartW =
        width -
        padding.left -
        padding.right;


    const chartH =
        height -
        padding.top -
        padding.bottom;


    const maxValue =
        Math.max(

            ...items.map(
                x =>
                    x.saved
            ),

            data.dailyAmount,

            1

        );


    const step =
        chartW /
        items.length;


    const barW =
        Math.max(
            5,
            step * 0.58
        );


    /* -----------------------------------------
       GRID
    ----------------------------------------- */

    ctx.font =
        "11px Inter, Arial, sans-serif";


    ctx.textAlign =
        "right";


    ctx.fillStyle =
        "#8a8a96";


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const value =
            maxValue *
            (
                i / 4
            );


        const y =
            padding.top +
            chartH -
            (
                chartH *
                i /
                4
            );


        ctx.strokeStyle =
            "rgba(80,80,100,0.10)";


        ctx.lineWidth = 1;


        ctx.beginPath();


        ctx.moveTo(
            padding.left,
            y
        );


        ctx.lineTo(
            width -
            padding.right,
            y
        );


        ctx.stroke();


        ctx.fillText(

            formatCompact(
                value
            ),

            padding.left - 8,

            y + 4

        );
    }


    /* -----------------------------------------
       BARS
    ----------------------------------------- */

    items.forEach(
        (item, index) => {

            const x =
                padding.left +
                index * step +
                (
                    step -
                    barW
                ) / 2;


            const barH =
                (
                    item.saved /
                    maxValue
                ) *
                chartH;


            const y =
                padding.top +
                chartH -
                barH;


            const gradient =
                ctx.createLinearGradient(

                    0,
                    y,
                    0,
                    padding.top +
                    chartH

                );


            gradient.addColorStop(
                0,
                "#7c3aed"
            );


            gradient.addColorStop(
                1,
                "#2563eb"
            );


            ctx.fillStyle =
                gradient;


            roundRect(

                ctx,

                x,

                y,

                barW,

                Math.max(
                    barH,
                    3
                ),

                6

            );


            ctx.fill();


            ctx.fillStyle =
                "#70707b";


            ctx.font =
                "10px Inter, Arial, sans-serif";


            ctx.textAlign =
                "center";


            if (
                items.length <= 15 ||
                index % 3 === 0 ||
                index ===
                    items.length - 1
            ) {

                ctx.fillText(

                    `D${item.day}`,

                    x +
                    barW / 2,

                    height - 17

                );
            }
        }
    );
}


/* =========================================
   ROUNDED RECTANGLE
========================================= */

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {

    const r =
        Math.min(
            radius,
            width / 2,
            height / 2
        );


    ctx.beginPath();


    ctx.moveTo(
        x + r,
        y
    );


    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        r
    );


    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        r
    );


    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        r
    );


    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        r
    );


    ctx.closePath();
}


/* =========================================
   COMPACT MONEY
========================================= */

function formatCompact(value) {

    if (
        value >= 1000000
    ) {

        return `Rs.${(
            value /
            1000000
        ).toFixed(1)}M`;
    }


    if (
        value >= 1000
    ) {

        return `Rs.${(
            value /
            1000
        ).toFixed(
            value % 1000 === 0
                ? 0
                : 1
        )}K`;
    }


    return `Rs.${Math.round(value)}`;
}


/* =========================================
   COMPLETION
========================================= */

function updateCompletion() {

    const complete =
        data.target > 0 &&
        data.saved >= data.target;


    $("completionSection")
        .classList
        .toggle(
            "hidden",
            !complete
        );


    $("completedTargetText")
        .textContent =
        formatMoney(
            data.target
        );
}


/* =========================================
   RENDER
========================================= */

function render() {

    if (!data.target) {

        setupSection.classList.remove(
            "hidden"
        );

        challengeSection.classList.add(
            "hidden"
        );

        updatePreview();

        return;
    }


    setupSection.classList.add(
        "hidden"
    );


    challengeSection.classList.remove(
        "hidden"
    );


    /*
       Make sure current day exists.
    */

    ensureCurrentDay();


    updateStats();

    renderTable();

    updateCompletion();

    drawChart();
}


/* =========================================
   RESET CHALLENGE
========================================= */

function resetChallenge() {

    if (!data.target) {

        setupSection.classList.remove(
            "hidden"
        );

        return;
    }


    /*
       Confirmation.
    */

    const confirmed =
        window.confirm(

            "🔄 Reset Saving Challenge?\n\n" +

            "Your target, daily amount, " +
            "carry-forward amount, and all " +
            "saved progress will be deleted.\n\n" +

            "Press OK to start a new challenge."

        );


    if (!confirmed) {

        return;
    }


    /* -----------------------------------------
       DELETE DATA
    ----------------------------------------- */

    localStorage.removeItem(
        STORAGE_KEY
    );


    data =
        createDefaultData();


    /* -----------------------------------------
       RESET INPUTS
    ----------------------------------------- */

    targetInput.value =
        MIN_TARGET;


    dailyAmountInput.value =
        "";


    /* -----------------------------------------
       SHOW SETUP
    ----------------------------------------- */

    setupSection.classList.remove(
        "hidden"
    );


    challengeSection.classList.add(
        "hidden"
    );


    setupMessage.textContent =
        "";


    paymentMessage.textContent =
        "";


    updatePreview();
}


/* =========================================
   EVENT LISTENERS
========================================= */

targetInput.addEventListener(
    "change",
    updatePreview
);


dailyAmountInput.addEventListener(
    "input",
    updatePreview
);


startBtn.addEventListener(
    "click",
    createChallenge
);


addSavingBtn.addEventListener(
    "click",
    addTodaySaving
);


resetBtn.addEventListener(
    "click",
    resetChallenge
);


/* =========================================
   RESIZE
========================================= */

window.addEventListener(
    "resize",
    () => {

        if (data.target) {

            drawChart();
        }
    }
);


/* =========================================
   INITIALIZE
========================================= */

populateTargets();


targetInput.value =
    data.target ||
    MIN_TARGET;


dailyAmountInput.value =
    data.dailyAmount ||
    "";


updatePreview();


render();
