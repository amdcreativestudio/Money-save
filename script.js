/* =========================================
   CUSTOM SAVING CHALLENGE
   COMPLETE SCRIPT
   CUSTOM TARGET
   CUSTOM DAILY AMOUNT
   CARRY-FORWARD SYSTEM
========================================= */


/* =========================================
   SETTINGS
========================================= */

const MIN_TARGET = 5000;
const MAX_TARGET = 500000;
const TARGET_STEP = 5000;

const STORAGE_KEY =
    "customSavingChallenge_v3";


/* =========================================
   DOM
========================================= */

const $ =
    (id) =>
        document.getElementById(id);


const targetInput =
    $("targetInput");

const dailyAmountInput =
    $("dailyAmountInput");

const startBtn =
    $("startBtn");

const resetBtn =
    $("resetBtn");


const setupSection =
    $("setupSection");

const challengeSection =
    $("challengeSection");


const setupMessage =
    $("setupMessage");

const paymentMessage =
    $("paymentMessage");


const addSavingBtn =
    $("addSavingBtn");

const savingTableBody =
    $("savingTableBody");

const chartCanvas =
    $("savingChart");


/* =========================================
   DATA
========================================= */

let data =
    loadData();


/* =========================================
   MONEY FORMAT
========================================= */

function formatMoney(amount) {

    return (
        "Rs." +
        Math.round(
            Number(amount) || 0
        ).toLocaleString("en-US")
    );
}


/* =========================================
   DEFAULT DATA
========================================= */

function createDefaultData() {

    return {

        version: 3,

        target: 0,

        dailyAmount: 0,

        /*
           Original calculated number of days.
           This does NOT change when money is missed.
        */
        totalDays: 0,

        /*
           Actual total money saved.
        */
        saved: 0,

        /*
           Current challenge day.
        */
        currentDay: 1,

        /*
           Previous day's missed amount.
        */
        carryForward: 0,

        /*
           Daily saving records.
        */
        days: [],

        createdAt: null,

        /*
           Last amount entered.
           Used to show Saved Today immediately.
        */
        lastSavedAmount: 0,

        lastSavedDay: 0

    };
}


/* =========================================
   LOAD DATA
========================================= */

function loadData() {

    try {

        /*
           Use v3 first.
           If it does not exist, try the old v2 data.
        */

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            ) ||
            localStorage.getItem(
                "customSavingChallenge_v2"
            );


        if (!raw) {

            return createDefaultData();
        }


        const parsed =
            JSON.parse(raw);


        if (
            !parsed ||
            !Number(parsed.target)
        ) {

            return createDefaultData();
        }


        const fresh =
            createDefaultData();


        fresh.target =
            Math.max(
                0,
                Number(parsed.target) || 0
            );


        fresh.dailyAmount =
            Math.max(
                0,
                Number(parsed.dailyAmount) || 0
            );


        fresh.totalDays =
            Math.max(
                0,
                Number(parsed.totalDays) ||
                calculateDays(
                    fresh.target,
                    fresh.dailyAmount
                )
            );


        fresh.saved =
            Math.min(
                fresh.target,
                Math.max(
                    0,
                    Number(parsed.saved) || 0
                )
            );


        fresh.currentDay =
            Math.max(
                1,
                Number(parsed.currentDay) || 1
            );


        fresh.carryForward =
            Math.max(
                0,
                Number(parsed.carryForward) || 0
            );


        fresh.createdAt =
            parsed.createdAt || null;


        fresh.lastSavedAmount =
            Math.max(
                0,
                Number(
                    parsed.lastSavedAmount
                ) || 0
            );


        fresh.lastSavedDay =
            Math.max(
                0,
                Number(
                    parsed.lastSavedDay
                ) || 0
            );


        /*
           Convert old day records safely.
        */

        fresh.days =
            Array.isArray(parsed.days)

                ? parsed.days.map(
                    (day) => ({

                        day:
                            Math.max(
                                1,
                                Number(day.day) || 1
                            ),

                        planned:
                            Math.max(
                                0,
                                Number(day.planned) || 0
                            ),

                        saved:
                            Math.max(
                                0,
                                Number(day.saved) || 0
                            ),

                        remaining:
                            Math.max(
                                0,
                                Number(day.remaining) || 0
                            ),

                        completed:
                            Boolean(
                                day.completed
                            ),

                        date:
                            day.date || null

                    })
                )

                : [];


        return fresh;


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

        let amount =
            MIN_TARGET;

        amount <= MAX_TARGET;

        amount += TARGET_STEP

    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            amount;


        option.textContent =
            formatMoney(
                amount
            );


        targetInput.appendChild(
            option
        );
    }
}


/* =========================================
   CALCULATE DAYS
========================================= */

function calculateDays(
    target,
    daily
) {

    if (
        !daily ||
        daily <= 0
    ) {

        return 0;
    }


    return Math.max(

        1,

        Math.ceil(
            target / daily
        )

    );
}


/* =========================================
   REMAINING GOAL
========================================= */

function getRemainingGoal() {

    return Math.max(

        Number(data.target) -
        Number(data.saved),

        0

    );
}


/* =========================================
   NORMAL DAILY TARGET
========================================= */

function getNormalDailyTarget() {

    return Math.min(

        Number(data.dailyAmount) || 0,

        getRemainingGoal()

    );
}


/* =========================================
   TODAY TOTAL TARGET
========================================= */

function getTodayTarget() {

    const remainingGoal =
        getRemainingGoal();


    if (
        remainingGoal <= 0
    ) {

        return 0;
    }


    return Math.min(

        (
            Number(data.dailyAmount) || 0
        ) +

        (
            Number(data.carryForward) || 0
        ),

        remainingGoal

    );
}


/* =========================================
   PREVIEW
========================================= */

function updatePreview() {

    const target =
        Number(
            targetInput.value
        ) ||
        MIN_TARGET;


    const daily =
        Math.floor(
            Number(
                dailyAmountInput.value
            ) || 0
        );


    $("previewTarget")
        .textContent =
        formatMoney(
            target
        );


    $("previewDaily")
        .textContent =

        daily > 0

            ? formatMoney(
                daily
            )

            : "Rs.0";


    $("previewDays")
        .textContent =

        daily > 0

            ? calculateDays(
                target,
                daily
            ).toLocaleString(
                "en-US"
            )

            : "—";
}


/* =========================================
   MESSAGE
========================================= */

function showFormMessage(

    element,

    message,

    type = "error"

) {

    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        "form-message " +
        type;


    window.clearTimeout(
        element._timer
    );


    element._timer =
        window.setTimeout(

            () => {

                element.textContent =
                    "";

                element.className =
                    "form-message";

            },

            5000

        );
}


/* =========================================
   CREATE CHALLENGE
========================================= */

function createChallenge() {

    const target =
        Number(
            targetInput.value
        );


    const daily =
        Math.floor(

            Number(
                dailyAmountInput.value
            )

        );


    /* TARGET VALIDATION */

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


    /* DAILY VALIDATION */

    if (
        !daily ||
        daily < 1
    ) {

        showFormMessage(

            setupMessage,

            "Please enter a daily saving amount greater than Rs.0."

        );

        return;
    }


    /* DAILY > TARGET */

    if (
        daily > target
    ) {

        const ok =
            window.confirm(

                "Your daily saving amount is higher than the target.\n\n" +

                "You can complete the goal in 1 day.\n\n" +

                "Continue?"

            );


        if (!ok) {

            return;
        }
    }


    /* EXISTING CHALLENGE */

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


        if (!ok) {

            return;
        }
    }


    /* NEW DATA */

    data = {

        version: 3,

        target:
            target,

        dailyAmount:
            daily,

        totalDays:
            calculateDays(
                target,
                daily
            ),

        saved:
            0,

        currentDay:
            1,

        carryForward:
            0,

        days:
            [],

        createdAt:
            new Date().toISOString(),

        lastSavedAmount:
            0,

        lastSavedDay:
            0

    };


    /* FIRST DAY */

    ensureCurrentDay();


    saveData();


    setupSection
        .classList
        .add("hidden");


    challengeSection
        .classList
        .remove("hidden");


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
                item.day ===
                data.currentDay

        );


    if (day) {

        return day;
    }


    /*
       Today's target:

       Normal Daily
       +
       Previous Remaining
    */

    const todayTarget =
        getTodayTarget();


    day = {

        day:
            data.currentDay,

        planned:
            todayTarget,

        saved:
            0,

        remaining:
            todayTarget,

        completed:
            false,

        date:
            null

    };


    data.days.push(
        day
    );


    return day;
}


/* =========================================
   CURRENT DAY
========================================= */

function getCurrentDayRecord() {

    return data.days.find(

        item =>
            item.day ===
            data.currentDay

    );
}


/* =========================================
   ADD TODAY'S SAVING
   IMPORTANT:
   NO PROMPT
========================================= */

function addTodaySaving() {

    /* CHECK CHALLENGE */

    if (
        !data.target ||
        !data.dailyAmount
    ) {

        showFormMessage(

            paymentMessage,

            "Create a saving challenge first."

        );

        return;
    }


    /* GOAL COMPLETED */

    if (
        data.saved >=
        data.target
    ) {

        showFormMessage(

            paymentMessage,

            "🎉 Your goal is already completed!",

            "success"

        );

        return;
    }


    /* GET INPUT */

    const input =
        $("todaySavingInput");


    if (!input) {

        showFormMessage(

            paymentMessage,

            "Saving input was not found."

        );

        return;
    }


    const amount =
        Math.floor(
            Number(
                input.value
            )
        );


    /* VALIDATE */

    if (

        !Number.isFinite(
            amount
        ) ||

        amount < 0

    ) {

        showFormMessage(

            paymentMessage,

            "Please enter a valid saving amount.",

            "error"

        );

        return;
    }


    /* CURRENT DAY */

    const day =
        ensureCurrentDay();


    if (!day) {

        return;
    }


    if (
        day.completed
    ) {

        showFormMessage(

            paymentMessage,

            "Today's saving has already been recorded.",

            "error"

        );

        return;
    }


    /*
       TODAY'S TARGET
    */

    const todayTarget =
        Number(
            day.planned
        ) || 0;


    /*
       OLD TOTAL
    */

    const oldTotalSaved =
        Number(
            data.saved
        ) || 0;


    /*
       ONLY THE REMAINING MAIN GOAL
       CAN BE COUNTED.

       Example:

       Target = Rs.5,000

       Already saved = Rs.4,800

       User enters = Rs.500

       Only Rs.200 is counted.
    */

    const amountToAdd =
        Math.min(

            amount,

            Math.max(

                data.target -
                oldTotalSaved,

                0

            )

        );


    /*
       UPDATE TOTAL
    */

    data.saved =
        oldTotalSaved +
        amountToAdd;


    /*
       SAVE TODAY'S RECORD
    */

    day.saved =
        amountToAdd;


    day.remaining =
        Math.max(

            todayTarget -
            amountToAdd,

            0

        );


    day.completed =
        true;


    day.date =
        new Date()
            .toISOString();


    /*
       CARRY FORWARD

       Example:

       Target = Rs.500

       Saved = Rs.300

       Remaining = Rs.200

       Tomorrow:

       Normal Rs.500
       +
       Carry Rs.200

       = Rs.700
    */

    data.carryForward =
        day.remaining;


    /*
       SAVE LAST AMOUNT
       FOR UI
    */

    data.lastSavedAmount =
        amountToAdd;


    data.lastSavedDay =
        day.day;


    /*
       MOVE TO NEXT DAY
    */

    if (
        data.saved <
        data.target
    ) {

        data.currentDay += 1;


        /*
           Automatically create
           tomorrow's target.
        */

        ensureCurrentDay();

    } else {

        data.carryForward =
            0;
    }


    /*
       CLEAR INPUT
    */

    input.value =
        "";


    /*
       SAVE
    */

    saveData();


    /*
       UPDATE UI
    */

    render();


    /*
       SUCCESS MESSAGE
    */

    if (
        data.saved >=
        data.target
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

            `✅ Day ${day.day} completed — ` +

            `${formatMoney(
                amountToAdd
            )} saved. ` +

            `${formatMoney(
                day.remaining
            )} carried forward to tomorrow.`,

            "success"

        );

    } else {

        showFormMessage(

            paymentMessage,

            `✅ Day ${day.day} completed — ` +

            `${formatMoney(
                amountToAdd
            )} saved.`,

            "success"

        );
    }
}


/* =========================================
   PROGRESS
========================================= */

function getProgress() {

    if (
        !data.target
    ) {

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


/* =========================================
   UPDATE STATS
========================================= */

function updateStats() {

    const progress =
        getProgress();


    const remaining =
        getRemainingGoal();


    const completedDays =
        getCompletedDays().length;


    const currentDay =
        getCurrentDayRecord();


    /*
       NORMAL DAILY TARGET
    */

    const normalDaily =
        Math.min(

            Number(
                data.dailyAmount
            ) || 0,

            remaining

        );


    /*
       PREVIOUS REMAINING
    */

    const carryForward =
        Math.min(

            Number(
                data.carryForward
            ) || 0,

            remaining

        );


    /*
       TODAY TOTAL

       Normal + Carry
    */

    const todayTarget =
        currentDay

            ? Number(
                currentDay.planned
            ) || 0

            : getTodayTarget();


    /*
       SAVED TODAY

       Because currentDay is the next
       pending day after clicking,
       show the last amount entered.
    */

    const savedToday =
        data.lastSavedDay ===
        data.currentDay - 1

            ? Number(
                data.lastSavedAmount
            ) || 0

            : 0;


    /*
       TODAY'S REMAINING

       This is the CURRENT pending day's
       remaining amount.
    */

    const todayRemaining =
        currentDay

            ? Math.max(

                Number(
                    currentDay.remaining
                ) || 0,

                0

            )

            : 0;


    /*
       TOTAL DAYS

       Never reduce the original calculated
       number because of missed saving.

       If carry-forward causes the challenge
       to continue beyond original days,
       show the extra days too.
    */

    const effectiveTotalDays =
        Math.max(

            Number(
                data.totalDays
            ) || 0,

            data.days.length

        );


    const daysLeft =
        Math.max(

            effectiveTotalDays -
            completedDays,

            0

        );


    /* =========================================
       MAIN STATS
    ========================================= */

    $("targetAmount")
        .textContent =
        formatMoney(
            data.target
        );


    $("savedAmount")
        .textContent =
        formatMoney(
            data.saved
        );


    $("remainingAmount")
        .textContent =
        formatMoney(
            remaining
        );


    $("currentDay")
        .textContent =

        data.saved >=
        data.target

            ? "Completed 🎉"

            : `Day ${data.currentDay}`;


    /* =========================================
       PROGRESS
    ========================================= */

    $("progressText")
        .textContent =
        `${progress.toFixed(2)}% completed`;


    $("progressPercent")
        .textContent =
        `${progress.toFixed(2)}%`;


    $("progressFill")
        .style.width =
        `${progress}%`;


    /* =========================================
       DAYS
    ========================================= */

    $("completedDays")
        .textContent =
        completedDays
            .toLocaleString(
                "en-US"
            );


    $("totalDays")
        .textContent =
        effectiveTotalDays
            .toLocaleString(
                "en-US"
            );


    $("daysRemaining")
        .textContent =
        daysLeft
            .toLocaleString(
                "en-US"
            );


    /* =========================================
       TODAY
    ========================================= */

    $("todayAmount")
        .textContent =

        data.saved >=
        data.target

            ? "Goal Reached 🎉"

            : formatMoney(
                todayTarget
            );


    $("todayDescription")
        .textContent =

        data.saved >=
        data.target

            ? "You have completed this saving challenge."

            : `Today's target: ${formatMoney(
                todayTarget
            )}. Remaining: ${formatMoney(
                todayRemaining
            )}.`;


    /* =========================================
       ⭐ BREAKDOWN
    ========================================= */

    $("normalDailyTarget")
        .textContent =
        formatMoney(
            normalDaily
        );


    $("carryForwardAmount")
        .textContent =
        formatMoney(
            carryForward
        );


    $("todayTotalTarget")
        .textContent =
        formatMoney(
            todayTarget
        );


    $("savedToday")
        .textContent =
        formatMoney(
            savedToday
        );


    $("todayRemaining")
        .textContent =
        formatMoney(
            todayRemaining
        );


    /* =========================================
       SUMMARY
    ========================================= */

    $("summarySaved")
        .textContent =
        formatMoney(
            data.saved
        );


    $("summaryRemaining")
        .textContent =
        formatMoney(
            remaining
        );


    $("summaryProgress")
        .textContent =
        `${progress.toFixed(2)}%`;


    $("summaryDaily")
        .textContent =
        formatMoney(
            data.dailyAmount
        );


    /* =========================================
       TABLE
    ========================================= */

    $("tableCompleted")
        .textContent =
        completedDays
            .toLocaleString(
                "en-US"
            );


    $("tableTotal")
        .textContent =
        effectiveTotalDays
            .toLocaleString(
                "en-US"
            );


    /* =========================================
       BUTTON
    ========================================= */

    addSavingBtn.disabled =
        data.saved >=
        data.target;


    addSavingBtn.textContent =

        data.saved >=
        data.target

            ? "✓ Goal Completed"

            : "✓ Add Today's Saving";
}


/* =========================================
   TABLE
========================================= */

function renderTable() {

    savingTableBody.innerHTML =
        "";


    if (
        !data.target
    ) {

        return;
    }


    const visible =
        data.days.slice(-30);


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
                        Day ${Number(
                            day.day
                        ).toLocaleString(
                            "en-US"
                        )}
                    </strong>
                </td>

                <td>
                    ${formatMoney(
                        day.planned
                    )}
                </td>

                <td>
                    ${formatMoney(
                        day.saved
                    )}
                </td>

                <td>
                    ${formatMoney(
                        day.remaining
                    )}
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


    const hiddenCount =
        Math.max(

            data.days.length -
            visible.length,

            0

        );


    $("tableNote")
        .textContent =

        hiddenCount

            ? `Showing the latest 30 days. ${hiddenCount.toLocaleString(
                "en-US"
            )} older entries are hidden.`

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
        window.devicePixelRatio ||
        1;


    const width =
        Math.max(

            320,

            Math.floor(
                rect.width
            )

        );


    const height =
        280;


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.setTransform(

        dpr,
        0,
        0,
        dpr,
        0,
        0

    );


    ctx.clearRect(

        0,
        0,
        width,
        height

    );


    const completed =
        data.days.filter(

            day =>
                day.completed

        );


    if (
        !completed.length
    ) {

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

                item =>
                    Number(
                        item.saved
                    ) || 0

            ),

            Number(
                data.dailyAmount
            ) || 0,

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


    /* GRID */

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


        ctx.lineWidth =
            1;


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

            padding.left -
            8,

            y + 4

        );
    }


    /* BARS */

    items.forEach(

        (
            item,
            index
        ) => {

            const x =
                padding.left +
                index *
                step +
                (
                    step -
                    barW
                ) / 2;


            const barH =
                (
                    (
                        Number(
                            item.saved
                        ) || 0
                    ) /
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

                    height -
                    17

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

function formatCompact(
    value
) {

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


    return `Rs.${Math.round(
        value
    )}`;
}


/* =========================================
   COMPLETION
========================================= */

function updateCompletion() {

    const complete =

        data.target > 0 &&

        data.saved >=
        data.target;


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


    $("completionTarget")
        .textContent =
        formatMoney(
            data.target
        );


    $("completionSaved")
        .textContent =
        formatMoney(
            data.saved
        );
}


/* =========================================
   RENDER
========================================= */

function render() {

    if (
        !data.target
    ) {

        setupSection
            .classList
            .remove(
                "hidden"
            );


        challengeSection
            .classList
            .add(
                "hidden"
            );


        updatePreview();

        return;
    }


    setupSection
        .classList
        .add(
            "hidden"
        );


    challengeSection
        .classList
        .remove(
            "hidden"
        );


    /*
       Make sure today's record exists.
    */

    ensureCurrentDay();


    updateStats();


    renderTable();


    updateCompletion();


    drawChart();
}


/* =========================================
   RESET
========================================= */

function resetChallenge() {

    const confirmed =
        window.confirm(

            "🔄 Reset Saving Challenge?\n\n" +

            "All target, daily amount, saved money, " +

            "carry-forward data and saving history " +

            "will be deleted.\n\n" +

            "Press OK to start a new challenge."

        );


    if (!confirmed) {

        return;
    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    localStorage.removeItem(
        "customSavingChallenge_v2"
    );


    data =
        createDefaultData();


    targetInput.value =
        MIN_TARGET;


    dailyAmountInput.value =
        "";


    setupSection
        .classList
        .remove(
            "hidden"
        );


    challengeSection
        .classList
        .add(
            "hidden"
        );


    setupMessage.textContent =
        "";


    paymentMessage.textContent =
        "";


    updatePreview();
}


/* =========================================
   EVENTS
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

        if (
            data.target
        ) {

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
