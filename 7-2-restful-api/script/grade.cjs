#!/usr/bin/env node
/**
 * SWE 363 – Lab 7-2 RESTful APIs
 * Auto-grading script (grade.cjs)
 *
 * - Checks:
 *    • Submission timing (20 marks: on-time vs late)
 *    • TODO 1–6 implementation in:
 *        - server/.env
 *        - server/index.js
 *        - server/models/song.model.js
 * - Scoring:
 *    • Submission: 20 marks (20 if on-time, 10 if late)
 *    • Implementation: 80 marks total
 *        - TODO 1–5: 14 marks each  (5 completeness, 5 correctness, 4 quality)
 *        - TODO 6:   10 marks       (4 completeness, 3 correctness, 3 quality)
 *
 * Flexible rules:
 *   - If NO task is implemented → 0/80 (implementation)
 *   - If ALL tasks are fully correct → 80/80
 *   - If AT LEAST one task is attempted but raw total < 50 → bump to 50/80
 *
 * A detailed breakdown is printed to stdout and, if running in
 * GitHub Actions, also written to the job summary ($GITHUB_STEP_SUMMARY).
 */

const fs = require("fs");
const path = require("path");

// ------------------------
//  Helpers
// ------------------------

function safeRead(filePath) {
    try {
        return fs.readFileSync(filePath, "utf8");
    } catch (_err) {
        return null;
    }
}

function getEventTimestamp() {
    try {
        const eventPath = process.env.GITHUB_EVENT_PATH;
        if (!eventPath || !fs.existsSync(eventPath)) return null;
        const raw = fs.readFileSync(eventPath, "utf8");
        const evt = JSON.parse(raw);

        if (evt.head_commit && evt.head_commit.timestamp) {
            return new Date(evt.head_commit.timestamp);
        }
        if (evt.pull_request && evt.pull_request.updated_at) {
            return new Date(evt.pull_request.updated_at);
        }
        if (evt.workflow_run && evt.workflow_run.created_at) {
            return new Date(evt.workflow_run.created_at);
        }
        if (evt.repository && evt.repository.pushed_at) {
            return new Date(evt.repository.pushed_at);
        }
    } catch (_err) {
        return null;
    }
    return null;
}

function computeSubmissionMarks() {
    const dueStr = process.env.LAB_DUE_DATE; // ISO date string, set in workflow
    const result = {
        score: 20,
        max: 20,
        onTime: true,
        reason: "",
    };

    if (!dueStr) {
        result.score = 20;
        result.onTime = true;
        result.reason =
            "LAB_DUE_DATE not configured – awarding full 20/20 submission marks by default.";
        return result;
    }

    const dueDate = new Date(dueStr);
    const evtTime = getEventTimestamp();

    if (!evtTime || Number.isNaN(dueDate.getTime())) {
        result.score = 20;
        result.onTime = true;
        result.reason =
            "Unable to determine submission time or parse due date – awarding full 20/20 submission marks.";
        return result;
    }

    if (evtTime <= dueDate) {
        result.score = 20;
        result.onTime = true;
        result.reason = `Submission time (${evtTime.toISOString()}) is on or before due date (${dueDate.toISOString()}).`;
    } else {
        result.score = 10;
        result.onTime = false;
        result.reason = `Submission time (${evtTime.toISOString()}) is AFTER due date (${dueDate.toISOString()}) – late submission penalty applied.`;
    }

    return result;
}

function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
}

// ------------------------
//  Paths
// ------------------------

const LAB_ROOT = path.join(__dirname, ".."); // 7-2-restful-api
const SERVER_DIR = path.join(LAB_ROOT, "server");
const INDEX_FILE = path.join(SERVER_DIR, "index.js");
const MODEL_FILE = path.join(SERVER_DIR, "models", "song.model.js");
const ENV_FILE = path.join(SERVER_DIR, ".env");

// ------------------------
//  Read source files
// ------------------------

const indexCode = safeRead(INDEX_FILE) || "";
const envContent = safeRead(ENV_FILE) || "";

// ------------------------
//  Initialize report
// ------------------------

const report = {
    submission: null,
    tasks: [],
    implementationRaw: 0,
    implementationAdjusted: 0,
    implementationMax: 80,
    total: 0,
    totalMax: 100,
    attemptedTasks: 0,
    fullyCorrectTasks: 0,
};

// ------------------------
//  Grade TODO 1
// ------------------------

function gradeTodo1() {
    const task = {
        id: 1,
        label: "TODO 1 – MongoDB connection (.env & index.js)",
        max: 14,
        completeness: 0,
        correctness: 0,
        quality: 0,
        score: 0,
        details: [],
    };

    const hasEnvMongo = /MONGO_URL\s*=/.test(envContent);
    const hasPlaceholder = /<\s*db_username\s*>|<\s*db_password\s*>/i.test(
        envContent
    );
    const hasMongoUrlFilled = hasEnvMongo && !hasPlaceholder;

    const hasConnectSnippet = /mongoose\.connect\s*\(\s*process\.env\.MONGO_URL/.test(
        indexCode
    );
    const logsConnected = /Mongo connected/i.test(indexCode);
    const logsError = /Connection error/i.test(indexCode);

    // Completeness (5)
    let c = 0;
    if (hasEnvMongo) {
        c += 2;
        task.details.push("Found MONGO_URL in server/.env.");
    } else {
        task.details.push("Missing MONGO_URL in server/.env.");
    }

    if (hasMongoUrlFilled) {
        c += 3;
        task.details.push(
            "Placeholders <db_username> / <db_password> appear to be replaced."
        );
    } else if (hasEnvMongo) {
        task.details.push(
            "MONGO_URL still contains <db_username> / <db_password> placeholders."
        );
    }

    c = clamp(c, 0, 5);

    // Correctness (5)
    let r = 0;
    if (hasConnectSnippet) {
        r += 3;
        task.details.push(
            "Found mongoose.connect(process.env.MONGO_URL) in index.js."
        );
    } else {
        task.details.push(
            "Could not find mongoose.connect(process.env.MONGO_URL) in index.js."
        );
    }

    if (logsConnected) {
        r += 1;
        task.details.push('Found "Mongo connected" log message.');
    }
    if (logsError) {
        r += 1;
        task.details.push('Found "Connection error" log message.');
    }

    r = clamp(r, 0, 5);

    // Quality (4)
    let q = 0;
    const hasTryCatchAroundConnect =
        /try\s*{[\s\S]*mongoose\.connect[\s\S]*}\s*catch\s*\(/.test(indexCode);
    if (hasTryCatchAroundConnect) {
        q = 4;
        task.details.push(
            "Uses async/await with try/catch around mongoose.connect – good error handling."
        );
    } else if (hasConnectSnippet) {
        q = 2;
        task.details.push(
            "Has mongoose.connect but limited structured error handling around it."
        );
    } else {
        q = 0;
    }

    task.completeness = c;
    task.correctness = r;
    task.quality = q;
    task.score = clamp(c + r + q, 0, task.max);

    return task;
}

// ------------------------
//  Grade TODO 2
// ------------------------

function gradeTodo2() {
    const task = {
        id: 2,
        label: 'TODO 2 – Song schema & model ("Song")',
        max: 14,
        completeness: 0,
        correctness: 0,
        quality: 0,
        score: 0,
        details: [],
    };

    let Song = null;
    let mongoose = null;

    try {
        mongoose = require("mongoose");
    } catch (err) {
        task.details.push(
            "Could not require mongoose. Make sure mongoose is installed."
        );
    }

    try {
        const modelPath = MODEL_FILE;
        if (fs.existsSync(modelPath)) {
            Song = require(modelPath);
        } else {
            task.details.push(
                "song.model.js not found at server/models/song.model.js."
            );
        }
    } catch (err) {
        task.details.push(
            `Error requiring Song model: ${(err && err.message) || err}`
        );
    }

    if (!Song || !Song.schema) {
        task.details.push(
            "Song model could not be inspected – schema/model might be missing or incorrectly exported."
        );
        task.score = 0;
        return task;
    }

    const schema = Song.schema;
    const titlePath = schema.path("title");
    const artistPath = schema.path("artist");
    const yearPath = schema.path("year");

    // Completeness (5)
    let c = 0;
    if (titlePath) {
        c += 2;
        task.details.push("Found 'title' field in Song schema.");
    } else {
        task.details.push("Missing 'title' field in Song schema.");
    }

    if (artistPath) {
        c += 2;
        task.details.push("Found 'artist' field in Song schema.");
    } else {
        task.details.push("Missing 'artist' field in Song schema.");
    }

    if (yearPath) {
        c += 1;
        task.details.push("Found 'year' field in Song schema.");
    } else {
        task.details.push("Missing 'year' field in Song schema.");
    }

    c = clamp(c, 0, 5);

    // Correctness (5)
    let r = 0;
    const isStringPath = (p) => p && p.instance === "String";
    const isNumberPath = (p) => p && p.instance === "Number";

    if (isStringPath(titlePath) && titlePath.options.required) {
        r += 2;
        task.details.push(
            "title: String with required:true (matches specification)."
        );
    }
    if (isStringPath(artistPath) && artistPath.options.required) {
        r += 2;
        task.details.push(
            "artist: String with required:true (matches specification)."
        );
    }
    if (isNumberPath(yearPath)) {
        r += 1;
        task.details.push("year: Number (matches specification).");
    }

    r = clamp(r, 0, 5);

    // Quality (4)
    let q = 0;
    const timestamps = schema.options && schema.options.timestamps;
    const hasTrimOnTitle = titlePath && titlePath.options.trim;
    const hasTrimOnArtist = artistPath && artistPath.options.trim;
    const hasMinMaxYear =
        yearPath && yearPath.options && yearPath.options.min && yearPath.options.max;

    if (timestamps) {
        q += 2;
        task.details.push("Schema uses timestamps: true.");
    }
    if (hasTrimOnTitle && hasTrimOnArtist) {
        q += 1;
        task.details.push("title and artist fields use trim: true.");
    }
    if (hasMinMaxYear) {
        q += 1;
        task.details.push("year field has min & max validators.");
    }

    q = clamp(q, 0, 4);

    task.completeness = c;
    task.correctness = r;
    task.quality = q;
    task.score = clamp(c + r + q, 0, task.max);

    return task;
}

// ------------------------
//  Regex helpers for index.js routes
// ------------------------

function gradeTodo3(indexCode) {
    const task = {
        id: 3,
        label: "TODO 3 – POST /api/songs (create)",
        max: 14,
        completeness: 0,
        correctness: 0,
        quality: 0,
        score: 0,
        details: [],
    };

    const hasPost = /app\.post\s*\(\s*["']\/api\/songs["']\s*,/m.test(indexCode);
    const usesSongCreate = /Song\.create\s*\(/m.test(indexCode);
    const usesStatus201 = /\.status\s*\(\s*201\s*\)/m.test(indexCode);
    const has400 = /\.status\s*\(\s*400\s*\)/m.test(indexCode);

    // Completeness (5)
    let c = 0;
    if (hasPost && usesSongCreate) {
        c = 5;
        task.details.push(
            "Found POST /api/songs route using Song.create(...) (good)."
        );
    } else if (hasPost) {
        c = 3;
        task.details.push("Found POST /api/songs route, but Song.create(...) not clearly detected.");
    } else if (usesSongCreate) {
        c = 2;
        task.details.push("Found Song.create(...) but POST /api/songs route not clearly detected.");
    }

    // Correctness (5)
    let r = 0;
    if (hasPost && usesSongCreate && usesStatus201) {
        r = 5;
        task.details.push(
            "POST /api/songs sends 201 status when creating a song."
        );
    } else if (hasPost && usesSongCreate) {
        r = 3;
        task.details.push(
            "POST /api/songs uses Song.create but 201 status code not clearly detected."
        );
    }

    if (has400) {
        task.details.push("Found 400 status usage (validation/error handling).");
    }

    // Quality (4)
    let q = 0;
    const hasTryCatchPost = /app\.post[\s\S]*try\s*{[\s\S]*Song\.create[\s\S]*}\s*catch\s*\(/m.test(
        indexCode
    );
    if (hasTryCatchPost && has400) {
        q = 4;
        task.details.push(
            "POST handler wraps Song.create in try/catch and returns 400 on errors."
        );
    } else if (hasPost) {
        q = 2;
        task.details.push(
            "POST handler exists but error handling could be more robust."
        );
    }

    c = clamp(c, 0, 5);
    r = clamp(r, 0, 5);
    q = clamp(q, 0, 4);

    task.completeness = c;
    task.correctness = r;
    task.quality = q;
    task.score = clamp(c + r + q, 0, task.max);
    return task;
}

function gradeTodo4(indexCode) {
    const task = {
        id: 4,
        label: "TODO 4 – GET /api/songs & GET /api/songs/:id",
        max: 14,
        completeness: 0,
        correctness: 0,
        quality: 0,
        score: 0,
        details: [],
    };

    const hasGetAll = /app\.get\s*\(\s*["']\/api\/songs["']\s*,/m.test(indexCode);
    const hasFindAll = /Song\.find\s*\(/m.test(indexCode);
    const hasSortCreatedAtDesc = /\.sort\s*\(\s*{\s*createdAt\s*:\s*-1\s*}\s*\)/m.test(
        indexCode
    );

    const hasGetById = /app\.get\s*\(\s*["']\/api\/songs\/:id["']\s*,/m.test(
        indexCode
    );
    const hasFindById = /Song\.findById\s*\(/m.test(indexCode);
    const has404Msg = /"Song not found"/m.test(indexCode);

    // Completeness (5)
    let c = 0;
    if (hasGetAll) {
        c += 3;
        task.details.push("Found GET /api/songs route.");
    } else {
        task.details.push("Missing GET /api/songs route.");
    }

    if (hasGetById) {
        c += 2;
        task.details.push("Found GET /api/songs/:id route.");
    } else {
        task.details.push("Missing GET /api/songs/:id route.");
    }

    c = clamp(c, 0, 5);

    // Correctness (5)
    let r = 0;
    if (hasGetAll && hasFindAll) {
        r += 3;
        task.details.push("GET /api/songs uses Song.find() to get data.");
    }
    if (hasSortCreatedAtDesc) {
        r += 1;
        task.details.push("GET /api/songs sorts by createdAt descending.");
    }
    if (hasGetById && hasFindById && has404Msg) {
        r += 1;
        task.details.push(
            "GET /api/songs/:id uses Song.findById and returns 404 when not found."
        );
    }

    r = clamp(r, 0, 5);

    // Quality (4)
    let q = 0;
    if (hasGetAll && hasSortCreatedAtDesc) {
        q += 2;
        task.details.push(
            "GET /api/songs returns newest songs first (good UX / API design)."
        );
    }
    if (hasGetById && has404Msg) {
        q += 2;
        task.details.push(
            'GET /api/songs/:id returns clear "Song not found" message when needed.'
        );
    }

    q = clamp(q, 0, 4);

    task.completeness = c;
    task.correctness = r;
    task.quality = q;
    task.score = clamp(c + r + q, 0, task.max);
    return task;
}

function gradeTodo5(indexCode) {
    const task = {
        id: 5,
        label: "TODO 5 – PUT /api/songs/:id (update)",
        max: 14,
        completeness: 0,
        correctness: 0,
        quality: 0,
        score: 0,
        details: [],
    };

    const hasPut = /app\.put\s*\(\s*["']\/api\/songs\/:id["']\s*,/m.test(
        indexCode
    );
    const usesFindByIdAndUpdate = /Song\.findByIdAndUpdate\s*\(/m.test(indexCode);
    const hasOpts = /findByIdAndUpdate\s*\([\s\S]*{\s*[^}]*new\s*:\s*true[^}]*runValidators\s*:\s*true[^}]*}/m.test(
        indexCode
    );
    const has404Msg = /"Song not found"/m.test(indexCode);
    const has400 = /\.status\s*\(\s*400\s*\)/m.test(indexCode);

    // Completeness (5)
    let c = 0;
    if (hasPut && usesFindByIdAndUpdate) {
        c = 5;
        task.details.push(
            "Found PUT /api/songs/:id route using Song.findByIdAndUpdate."
        );
    } else if (hasPut) {
        c = 3;
        task.details.push(
            "Found PUT /api/songs/:id route, but Song.findByIdAndUpdate not clearly detected."
        );
    }

    // Correctness (5)
    let r = 0;
    if (hasPut && usesFindByIdAndUpdate && hasOpts) {
        r = 5;
        task.details.push(
            "PUT /api/songs/:id uses (new:true, runValidators:true) in findByIdAndUpdate."
        );
    } else if (hasPut && usesFindByIdAndUpdate) {
        r = 3;
        task.details.push(
            "PUT /api/songs/:id uses findByIdAndUpdate but without full options (new:true, runValidators:true)."
        );
    }

    // Quality (4)
    let q = 0;
    const hasTryCatch = /app\.put[\s\S]*try\s*{[\s\S]*findByIdAndUpdate[\s\S]*}\s*catch\s*\(/m.test(
        indexCode
    );
    if (hasPut && has404Msg) {
        q += 2;
        task.details.push(
            'PUT /api/songs/:id returns 404 with "Song not found" when ID is invalid.'
        );
    }
    if (hasTryCatch && has400) {
        q += 2;
        task.details.push(
            "PUT /api/songs/:id handler uses try/catch and returns 400 on validation errors."
        );
    }

    c = clamp(c, 0, 5);
    r = clamp(r, 0, 5);
    q = clamp(q, 0, 4);

    task.completeness = c;
    task.correctness = r;
    task.quality = q;
    task.score = clamp(c + r + q, 0, task.max);
    return task;
}

function gradeTodo6(indexCode) {
    const task = {
        id: 6,
        label: "TODO 6 – DELETE /api/songs/:id (delete)",
        max: 10,
        completeness: 0,
        correctness: 0,
        quality: 0,
        score: 0,
        details: [],
    };

    const hasDelete = /app\.delete\s*\(\s*["']\/api\/songs\/:id["']\s*,/m.test(
        indexCode
    );
    const usesFindByIdAndDelete = /Song\.findByIdAndDelete\s*\(/m.test(indexCode);
    const has204 = /\.status\s*\(\s*204\s*\)/m.test(indexCode);
    const has404Msg = /"Song not found"/m.test(indexCode);

    // Completeness (4)
    let c = 0;
    if (hasDelete && usesFindByIdAndDelete) {
        c = 4;
        task.details.push(
            "Found DELETE /api/songs/:id route using Song.findByIdAndDelete."
        );
    } else if (hasDelete) {
        c = 2;
        task.details.push(
            "Found DELETE /api/songs/:id route, but Song.findByIdAndDelete not clearly detected."
        );
    }

    // Correctness (3)
    let r = 0;
    if (hasDelete && usesFindByIdAndDelete && has204) {
        r = 3;
        task.details.push(
            "DELETE /api/songs/:id returns 204 No Content on successful deletion."
        );
    } else if (hasDelete && usesFindByIdAndDelete) {
        r = 2;
        task.details.push(
            "DELETE /api/songs/:id uses Song.findByIdAndDelete but 204 status not clearly detected."
        );
    }

    // Quality (3)
    let q = 0;
    if (hasDelete && has404Msg) {
        q += 2;
        task.details.push(
            'DELETE /api/songs/:id returns 404 with "Song not found" when ID is invalid.'
        );
    }
    if (hasDelete) {
        q += 1;
        task.details.push(
            "DELETE handler exists with basic error handling / response logic."
        );
    }

    c = clamp(c, 0, 4);
    r = clamp(r, 0, 3);
    q = clamp(q, 0, 3);

    task.completeness = c;
    task.correctness = r;
    task.quality = q;
    task.score = clamp(c + r + q, 0, task.max);
    return task;
}

// ------------------------
//  Run grading
// ------------------------

(function main() {
    // Submission timing
    report.submission = computeSubmissionMarks();

    // Implementation tasks
    const todo1 = gradeTodo1();
    const todo2 = gradeTodo2();
    const todo3 = gradeTodo3(indexCode);
    const todo4 = gradeTodo4(indexCode);
    const todo5 = gradeTodo5(indexCode);
    const todo6 = gradeTodo6(indexCode);

    report.tasks = [todo1, todo2, todo3, todo4, todo5, todo6];

    // Aggregate implementation score
    let rawImpl = 0;
    let attempted = 0;
    let fullyCorrect = 0;

    for (const t of report.tasks) {
        rawImpl += t.score;
        if (t.score > 0) attempted += 1;
        if (t.score >= t.max) fullyCorrect += 1;
    }

    report.implementationRaw = rawImpl;
    report.attemptedTasks = attempted;
    report.fullyCorrectTasks = fullyCorrect;

    // Flexible rules for implementation part (80/80)
    let adjustedImpl = rawImpl;

    if (attempted === 0) {
        adjustedImpl = 0;
    } else if (fullyCorrect === report.tasks.length) {
        adjustedImpl = report.implementationMax; // 80/80
    } else if (rawImpl < 50) {
        // At least one task attempted or partially implemented
        adjustedImpl = 50;
    }

    adjustedImpl = clamp(adjustedImpl, 0, report.implementationMax);
    report.implementationAdjusted = adjustedImpl;

    // Overall total
    const submissionScore = report.submission.score;
    report.totalMax = report.implementationMax + report.submission.max;
    report.total = submissionScore + adjustedImpl;

    // ------------------------
    //  Build feedback messages
    // ------------------------

    const lines = [];

    lines.push("==============================================");
    lines.push(" SWE 363 – Lab 7-2 RESTful APIs: Grade Report");
    lines.push("==============================================");
    lines.push("");

    // Submission
    lines.push("Submission (20 marks)");
    lines.push("---------------------");
    lines.push(
        `Score: ${submissionScore} / ${report.submission.max} ` +
        (report.submission.onTime ? "(on time)" : "(late)")
    );
    if (report.submission.reason) {
        lines.push(`Note: ${report.submission.reason}`);
    }
    lines.push("");

    // Implementation summary
    lines.push("Implementation (80 marks)");
    lines.push("-------------------------");
    lines.push(
        `Raw implementation score:      ${report.implementationRaw} / ${report.implementationMax}`
    );
    if (report.implementationRaw !== report.implementationAdjusted) {
        lines.push(
            `Adjusted implementation score: ${report.implementationAdjusted} / ${report.implementationMax} (flexible rules applied)`
        );
    } else {
        lines.push(
            `Adjusted implementation score: ${report.implementationAdjusted} / ${report.implementationMax}`
        );
    }
    lines.push(
        `Tasks attempted: ${report.attemptedTasks} / ${report.tasks.length}`
    );
    lines.push(
        `Tasks fully correct: ${report.fullyCorrectTasks} / ${report.tasks.length}`
    );
    lines.push("");

    // Per-task breakdown
    for (const t of report.tasks) {
        lines.push(`Task ${t.id}: ${t.label}`);
        lines.push(
            `  Score: ${t.score} / ${t.max} (Completeness: ${t.completeness}, Correctness: ${t.correctness}, Quality: ${t.quality})`
        );
        if (t.details.length > 0) {
            lines.push("  Details:");
            for (const d of t.details) {
                lines.push(`    - ${d}`);
            }
        }
        lines.push("");
    }

    // Overall
    lines.push("Overall Result");
    lines.push("--------------");
    lines.push(
        `Total score: ${report.total} / ${report.totalMax} (Submission: ${submissionScore}, Implementation: ${report.implementationAdjusted})`
    );
    lines.push("");

    const output = lines.join("\n");

    // Print to console
    console.log(output);

    // Also write to GitHub Actions job summary if available
    // Also write to GitHub Actions job summary if available
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
        const mdLines = [];
        mdLines.push("# Lab 7-2 RESTful APIs – Auto Grade Report");
        mdLines.push("");

        // TOTAL ONLY
        mdLines.push(`## **Total score: \`${report.total} / ${report.totalMax}\`**`);
        mdLines.push("");

        // Submission
        mdLines.push("## Submission (20 marks)");
        mdLines.push(`- **Score:** ${submissionScore} / ${report.submission.max}`);
        if (report.submission.reason) {
            mdLines.push(`- ${report.submission.reason}`);
        }
        mdLines.push("");

        // Implementation (cleaned)
        mdLines.push("## Implementation (80 marks)");
        mdLines.push(`- **Score:** ${report.implementationAdjusted} / ${report.implementationMax}`);
        mdLines.push("");

        // Per-task breakdown
        mdLines.push("## Task Breakdown");
        for (const t of report.tasks) {
            mdLines.push(`### Task ${t.id}: ${t.label}`);
            mdLines.push(
                `**Score:** ${t.score} / ${t.max} ` +
                `(C: ${t.completeness}, Corr: ${t.correctness}, Q: ${t.quality})`
            );
            if (t.details.length > 0) {
                mdLines.push("**Details:**");
                for (const d of t.details) mdLines.push(`- ${d}`);
            }
            mdLines.push("");
        }

        fs.writeFileSync(summaryPath, mdLines.join("\n"), "utf8");
    }

    // Always exit 0 so students always see feedback
    process.exit(0);
})();
