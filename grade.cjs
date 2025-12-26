#!/usr/bin/env node
/**
 * Lab — Songs API (Mongo/Mongoose CRUD) — Autograder (grade.cjs)
 *
 * Scoring:
 * - TODO 2 (Schema & Model): 15
 * - TODO 3 (POST /api/songs): 15
 * - TODO 4 (GET /api/songs):  15
 * - TODO 5 (PUT /api/songs/:id): 15
 * - TODO 6 (DELETE /api/songs/:id): 20
 * - Tasks total: 80
 * - Submission: 20 (on-time=20, late=10, missing/empty required file=0)
 * - Total: 100
 *
 * Due date: 11/19/2025 11:59 PM Riyadh (UTC+03:00)
 *
 * IMPORTANT (late check):
 * - Use the latest repo commit (HEAD) timestamp and compare to due date.
 * - If HEAD <= due: status=0, submission=20
 * - If HEAD  > due: status=1, submission=10
 * - If missing/empty required file: status=2, submission=0
 *
 * Outputs:
 * - artifacts/grade.csv  (structure unchanged)
 * - artifacts/feedback/README.md
 * - GitHub Actions Step Summary (GITHUB_STEP_SUMMARY)
 *
 * NOTE: In your workflow, make sure checkout uses full history:
 *   uses: actions/checkout@v4
 *   with: { fetch-depth: 0 }
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const LAB_NAME = "songs-api-mongoose-crud";

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

/** Due date: 11/19/2025 11:59 PM Riyadh (UTC+03:00) */
const DUE_ISO = "2025-11-19T23:59:00+03:00";
const DUE_EPOCH_MS = Date.parse(DUE_ISO);

/** Required file for "submission detected" */
const REQUIRED_SERVER_PATH = path.join("7-2-restful-api", "server", "index.js");

/** ---------- Student ID ---------- */
function getStudentId() {
  const repoFull = process.env.GITHUB_REPOSITORY || ""; // org/repo
  const repoName = repoFull.includes("/") ? repoFull.split("/")[1] : repoFull;
  const fromRepoSuffix =
    repoName && repoName.includes("-")
      ? repoName.split("-").slice(-1)[0]
      : "";
  return (
    process.env.STUDENT_USERNAME ||
    fromRepoSuffix ||
    process.env.GITHUB_ACTOR ||
    repoName ||
    "student"
  );
}

/** ---------- Git helpers: latest repo commit time (HEAD) ---------- */
function getHeadCommitInfo() {
  try {
    const out = execSync("git log -1 --format=%H|%ct|%an|%ae|%s", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    if (!out) return null;

    const [sha, ct, an, ae, ...subjParts] = out.split("|");
    const seconds = Number(ct);
    const epochMs = Number.isFinite(seconds) ? seconds * 1000 : null;

    return {
      sha: sha || "unknown",
      epochMs,
      iso: epochMs ? new Date(epochMs).toISOString() : "unknown",
      author: an || "unknown",
      email: ae || "unknown",
      subject: subjParts.join("|") || "",
    };
  } catch {
    return null;
  }
}

function wasSubmittedLateStrict(headEpochMs) {
  // If we cannot read time, treat as late (prevents incorrectly giving on-time)
  if (!headEpochMs) return true;
  return headEpochMs > DUE_EPOCH_MS;
}

/** ---------- File helpers ---------- */
function readTextSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function stripJsComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

function compactWs(s) {
  return s.replace(/\s+/g, " ").trim();
}

function isEmptyCode(code) {
  const stripped = compactWs(stripJsComments(code));
  return stripped.length < 10;
}

/** ---------- Very light detectors ---------- */
function hasRegex(code, re) {
  try {
    return re.test(code);
  } catch {
    return false;
  }
}

function any(code, regexes) {
  return regexes.some((re) => hasRegex(code, re));
}

/**
 * Utility: award points proportionally to passed requirements.
 * - Uses Math.round like original.
 */
function score(max, reqs) {
  const passed = reqs.filter((r) => r.ok).length;
  const total = reqs.length || 1;
  const earned = Math.round((max * passed) / total);
  return { earned, max, reqs };
}

/** ---------- TODO 2: Schema & Model (server/models/song.model.js OR song.mode.js) ---------- */
function checkSchemaModel(modelCode) {
  const reqs = [];

  const importsMongoose = any(modelCode, [
    /require\s*\(\s*["'`]mongoose["'`]\s*\)/i,
    /import\s+mongoose\s+from\s+["'`]mongoose["'`]/i,
  ]);

  const definesSchema = any(modelCode, [
    /new\s+mongoose\s*\.\s*Schema\s*\(/i,
    /mongoose\s*\.\s*Schema\s*\(/i,
  ]);

  const hasTitleField = any(modelCode, [
    /title\s*:\s*\{\s*type\s*:\s*String/i,
    /title\s*:\s*String/i,
  ]);

  const titleRequired = any(modelCode, [
    /title\s*:\s*\{[^}]*required\s*:\s*true/i,
  ]);

  const hasArtistField = any(modelCode, [
    /artist\s*:\s*\{\s*type\s*:\s*String/i,
    /artist\s*:\s*String/i,
  ]);

  const artistRequired = any(modelCode, [
    /artist\s*:\s*\{[^}]*required\s*:\s*true/i,
  ]);

  const hasYearNumber = any(modelCode, [
    /year\s*:\s*\{\s*type\s*:\s*Number/i,
    /year\s*:\s*Number/i,
  ]);

  const exportsSongModel = any(modelCode, [
    /mongoose\s*\.\s*model\s*\(\s*["'`]Song["'`]\s*,/i,
    /export\s+default\s+mongoose\s*\.\s*model\s*\(\s*["'`]Song["'`]/i,
    /module\s*\.\s*exports\s*=\s*Song/i,
    /exports\s*\.\s*Song\s*=\s*Song/i,
  ]);

  reqs.push({ label: "Imports mongoose", ok: importsMongoose });
  reqs.push({ label: "Defines a mongoose.Schema", ok: definesSchema });
  reqs.push({ label: "Schema includes title field", ok: hasTitleField });
  reqs.push({ label: "title is required", ok: titleRequired });
  reqs.push({ label: "Schema includes artist field", ok: hasArtistField });
  reqs.push({ label: "artist is required", ok: artistRequired });
  reqs.push({ label: "Schema includes year (Number)", ok: hasYearNumber });
  reqs.push({ label: 'Creates & exports model named "Song"', ok: exportsSongModel });

  return score(15, reqs);
}

/** ---------- TODO 3: POST /api/songs ---------- */
function checkPostSongs(serverCode) {
  const reqs = [];

  const hasRoute = any(serverCode, [
    /app\s*\.\s*post\s*\(\s*["'`]\/api\/songs["'`]\s*,/i,
    /router\s*\.\s*post\s*\(\s*["'`]\/api\/songs["'`]\s*,/i,
  ]);

  const usesAsyncHandler = any(serverCode, [
    /app\s*\.\s*post\s*\([^)]*async\s*\(/i,
    /router\s*\.\s*post\s*\([^)]*async\s*\(/i,
  ]);

  const readsBody = any(serverCode, [
    /req\s*\.body/i,
    /const\s*\{\s*title[^}]*artist[^}]*year/i,
  ]);

  const callsCreate = any(serverCode, [
    /Song\s*\.\s*create\s*\(/i,
    /new\s+Song\s*\(/i,
    /\.save\s*\(\s*\)/i,
  ]);

  const responds201 = any(serverCode, [
    /res\s*\.\s*status\s*\(\s*201\s*\)\s*\.\s*json\s*\(/i,
    /status\s*\(\s*201\s*\)/i,
  ]);

  const handlesValidation400 = any(serverCode, [
    /catch\s*\(\s*\w+\s*\)\s*\{[\s\S]*status\s*\(\s*400\s*\)\s*\.json/i,
    /res\s*\.\s*status\s*\(\s*400\s*\)\s*\.\s*json/i,
  ]);

  reqs.push({ label: 'Defines POST "/api/songs"', ok: hasRoute });
  reqs.push({ label: "Uses async handler", ok: usesAsyncHandler });
  reqs.push({ label: "Reads JSON body (title, artist, year)", ok: readsBody });
  reqs.push({ label: "Inserts song into DB (Song.create/save)", ok: callsCreate });
  reqs.push({ label: "Responds with 201 + created song JSON", ok: responds201 });
  reqs.push({ label: "On error responds 400 + {message}", ok: handlesValidation400 });

  return score(15, reqs);
}

/** ---------- TODO 4: GET /api/songs (read all) ---------- */
function checkGetSongs(serverCode) {
  const reqs = [];

  const hasRouteAll = any(serverCode, [
    /app\s*\.\s*get\s*\(\s*["'`]\/api\/songs["'`]\s*,/i,
    /router\s*\.\s*get\s*\(\s*["'`]\/api\/songs["'`]\s*,/i,
  ]);

  const usesFind = any(serverCode, [
    /Song\s*\.\s*find\s*\(\s*\)/i,
    /Song\s*\.\s*find\s*\(/i,
  ]);

  const sortsNewest = any(serverCode, [
    /\.sort\s*\(\s*\{\s*createdAt\s*:\s*-1\s*\}\s*\)/i,
    /\.sort\s*\(\s*\{\s*createdAt\s*:\s*-\s*1\s*\}\s*\)/i,
  ]);

  const returnsJsonArray = any(serverCode, [
    /res\s*\.\s*json\s*\(\s*\w+\s*\)\s*;/i,
    /return\s+res\s*\.\s*json\s*\(/i,
  ]);

  // Optional but hinted: GET /api/songs/:id
  const hasRouteById = any(serverCode, [
    /app\s*\.\s*get\s*\(\s*["'`]\/api\/songs\/:id["'`]\s*,/i,
    /router\s*\.\s*get\s*\(\s*["'`]\/api\/songs\/:id["'`]\s*,/i,
  ]);

  const usesFindById = any(serverCode, [
    /Song\s*\.\s*findById\s*\(\s*req\s*\.\s*params\s*\.\s*id\s*\)/i,
    /Song\s*\.\s*findById\s*\(\s*req\.params\.id\s*\)/i,
    /Song\s*\.\s*findById\s*\(\s*req\s*\.\s*params\s*\.\s*\w+\s*\)/i,
  ]);

  const notFound404 = any(serverCode, [
    /status\s*\(\s*404\s*\)\s*\.json\s*\(\s*\{\s*message\s*:\s*["'`]Song not found["'`]\s*\}\s*\)/i,
    /return\s+res\s*\.\s*status\s*\(\s*404\s*\)\s*\.\s*json/i,
  ]);

  reqs.push({ label: 'Defines GET "/api/songs"', ok: hasRouteAll });
  reqs.push({ label: "Uses Song.find()", ok: usesFind });
  reqs.push({ label: "Sorts newest first (createdAt desc)", ok: sortsNewest });
  reqs.push({ label: "Returns JSON list", ok: returnsJsonArray });
  reqs.push({ label: '(Optional) Defines GET "/api/songs/:id"', ok: hasRouteById });
  reqs.push({ label: "(Optional) Uses Song.findById()", ok: usesFindById });
  reqs.push({ label: '(Optional) 404 {message:"Song not found"} when missing', ok: notFound404 });

  return score(15, reqs);
}

/** ---------- TODO 5: PUT /api/songs/:id ---------- */
function checkPutSong(serverCode) {
  const reqs = [];

  const hasRoute = any(serverCode, [
    /app\s*\.\s*put\s*\(\s*["'`]\/api\/songs\/:id["'`]\s*,/i,
    /router\s*\.\s*put\s*\(\s*["'`]\/api\/songs\/:id["'`]\s*,/i,
  ]);

  const usesFindByIdAndUpdate = any(serverCode, [
    /Song\s*\.\s*findByIdAndUpdate\s*\(/i,
  ]);

  const usesNewTrue = any(serverCode, [
    /\{\s*new\s*:\s*true/i,
  ]);

  const usesRunValidators = any(serverCode, [
    /runValidators\s*:\s*true/i,
  ]);

  const hasNotFound404 = any(serverCode, [
    /return\s+res\s*\.\s*status\s*\(\s*404\s*\)\s*\.\s*json\s*\(\s*\{\s*message\s*:\s*["'`]Song not found["'`]\s*\}\s*\)/i,
    /status\s*\(\s*404\s*\)\s*\.json\s*\(\s*\{\s*message\s*:\s*["'`]Song not found["'`]\s*\}\s*\)/i,
  ]);

  const handlesBadUpdate400 = any(serverCode, [
    /catch\s*\(\s*\w+\s*\)\s*\{[\s\S]*status\s*\(\s*400\s*\)\s*\.json/i,
    /res\s*\.\s*status\s*\(\s*400\s*\)\s*\.\s*json/i,
  ]);

  reqs.push({ label: 'Defines PUT "/api/songs/:id"', ok: hasRoute });
  reqs.push({ label: "Uses Song.findByIdAndUpdate()", ok: usesFindByIdAndUpdate });
  reqs.push({ label: "Passes { new: true }", ok: usesNewTrue });
  reqs.push({ label: "Passes { runValidators: true }", ok: usesRunValidators });
  reqs.push({ label: 'If not found -> 404 {message:"Song not found"}', ok: hasNotFound404 });
  reqs.push({ label: "On validation error -> 400 {message}", ok: handlesBadUpdate400 });

  return score(15, reqs);
}

/** ---------- TODO 6: DELETE /api/songs/:id ---------- */
function checkDeleteSong(serverCode) {
  const reqs = [];

  const hasRoute = any(serverCode, [
    /app\s*\.\s*delete\s*\(\s*["'`]\/api\/songs\/:id["'`]\s*,/i,
    /router\s*\.\s*delete\s*\(\s*["'`]\/api\/songs\/:id["'`]\s*,/i,
  ]);

  const usesFindByIdAndDelete = any(serverCode, [
    /Song\s*\.\s*findByIdAndDelete\s*\(\s*req\s*\.\s*params\s*\.\s*id\s*\)/i,
    /Song\s*\.\s*findByIdAndDelete\s*\(\s*req\.params\.id\s*\)/i,
    /Song\s*\.\s*findByIdAndDelete\s*\(/i,
  ]);

  const notFound404 = any(serverCode, [
    /status\s*\(\s*404\s*\)\s*\.json\s*\(\s*\{\s*message\s*:\s*["'`]Song not found["'`]\s*\}\s*\)/i,
    /return\s+res\s*\.\s*status\s*\(\s*404\s*\)\s*\.\s*json/i,
  ]);

  const returns204 = any(serverCode, [
    /res\s*\.\s*status\s*\(\s*204\s*\)\s*\.\s*end\s*\(\s*\)/i,
    /res\s*\.\s*sendStatus\s*\(\s*204\s*\)/i,
    /status\s*\(\s*204\s*\)/i,
  ]);

  reqs.push({ label: 'Defines DELETE "/api/songs/:id"', ok: hasRoute });
  reqs.push({ label: "Uses Song.findByIdAndDelete()", ok: usesFindByIdAndDelete });
  reqs.push({ label: 'If not found -> 404 {message:"Song not found"}', ok: notFound404 });
  reqs.push({ label: "On success -> 204 No Content", ok: returns204 });

  // TODO 6 worth 20
  return score(20, reqs);
}

/** ---------- Locate submission files ---------- */
const studentId = getStudentId();
const serverPath = REQUIRED_SERVER_PATH;
const hasServer = fs.existsSync(serverPath) && fs.statSync(serverPath).isFile();
const serverCode = hasServer ? readTextSafe(serverPath) : "";
const serverEmpty = hasServer ? isEmptyCode(serverCode) : true;

const fileNote = hasServer
  ? serverEmpty
    ? `⚠️ Found \`${serverPath}\` but it appears empty (or only comments).`
    : `✅ Found \`${serverPath}\`.`
  : `❌ Required file not found: \`${serverPath}\`.`;

const modelPaths = [
  path.join("server", "models", "song.model.js"),
  path.join("server", "models", "song.mode.js"), // tolerate the lab typo
];
const modelPathFound = modelPaths.find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) || "";
const modelCode = modelPathFound ? readTextSafe(modelPathFound) : "";

/** ---------- Submission validation ---------- */
const headInfo = getHeadCommitInfo();

let status = 0;
if (!hasServer || serverEmpty) status = 2;
else status = wasSubmittedLateStrict(headInfo ? headInfo.epochMs : null) ? 1 : 0;

const submissionMarks = status === 2 ? 0 : status === 1 ? 10 : 20;

const submissionStatusText =
  status === 2
    ? "No submission detected (missing/empty required file): submission marks = 0/20."
    : status === 1
      ? `Late submission (latest repo commit is after due): 10/20. (HEAD: ${headInfo ? headInfo.sha : "unknown"} @ ${headInfo ? headInfo.iso : "unknown"})`
      : `On-time submission (latest repo commit is within due): 20/20. (HEAD: ${headInfo ? headInfo.sha : "unknown"} @ ${headInfo ? headInfo.iso : "unknown"})`;

/** ---------- Grade TODOs (2..6 only) ---------- */
let todo2 = { earned: 0, max: 15, reqs: [] };
let todo3 = { earned: 0, max: 15, reqs: [] };
let todo4 = { earned: 0, max: 15, reqs: [] };
let todo5 = { earned: 0, max: 15, reqs: [] };
let todo6 = { earned: 0, max: 20, reqs: [] };

if (status === 2) {
  const r = [{ label: "No submission / empty required file → cannot grade TODOs", ok: false }];
  todo2.reqs = r;
  todo3.reqs = r;
  todo4.reqs = r;
  todo5.reqs = r;
  todo6.reqs = r;
} else {
  // TODO 2 uses model file if present; otherwise fails its checks naturally
  todo2 = checkSchemaModel(modelCode);

  // TODO 3..6 from server/index.js
  todo3 = checkPostSongs(serverCode);
  todo4 = checkGetSongs(serverCode);
  todo5 = checkPutSong(serverCode);
  todo6 = checkDeleteSong(serverCode);
}

const earnedTasks = todo2.earned + todo3.earned + todo4.earned + todo5.earned + todo6.earned;
const totalEarned = Math.min(earnedTasks + submissionMarks, 100);

/** ---------- Feedback formatting ---------- */
function formatReqs(reqs) {
  return reqs.map((r) => (r.ok ? `- ✅ ${r.label}` : `- ❌ ${r.label}`)).join("\n");
}

/** ---------- Build Summary ---------- */
const now = new Date().toISOString();

const modelNote = modelPathFound
  ? `✅ Model file found: \`${modelPathFound}\``
  : `⚠️ Model file not found (looked for: ${modelPaths.map((p) => `\`${p}\``).join(", ")})`;

let summary = `# Lab | ${LAB_NAME} | Autograding Summary

- Student: \`${studentId}\`
- ${fileNote}
- ${modelNote}
- ${submissionStatusText}
- Due (Riyadh): \`${DUE_ISO}\`

- Repo HEAD commit:
  - SHA: \`${headInfo ? headInfo.sha : "unknown"}\`
  - Author: \`${headInfo ? headInfo.author : "unknown"}\` <${headInfo ? headInfo.email : "unknown"}>
  - Time (UTC ISO): \`${headInfo ? headInfo.iso : "unknown"}\`

- Status: **${status}** (0=on time, 1=late, 2=no submission/empty)
- Run: \`${now}\`

## Marks Breakdown

| Item | Marks |
|------|------:|
| TODO 2: Schema & Model (Song) | ${todo2.earned}/${todo2.max} |
| TODO 3: POST /api/songs | ${todo3.earned}/${todo3.max} |
| TODO 4: GET /api/songs | ${todo4.earned}/${todo4.max} |
| TODO 5: PUT /api/songs/:id | ${todo5.earned}/${todo5.max} |
| TODO 6: DELETE /api/songs/:id | ${todo6.earned}/${todo6.max} |
| Submission | ${submissionMarks}/20 |

## Total Marks

**${totalEarned} / 100**

## Detailed Feedback

### TODO 2: Schema & Model (Song)
${formatReqs(todo2.reqs)}

### TODO 3: POST /api/songs
${formatReqs(todo3.reqs)}

### TODO 4: GET /api/songs
${formatReqs(todo4.reqs)}

### TODO 5: PUT /api/songs/:id
${formatReqs(todo5.reqs)}

### TODO 6: DELETE /api/songs/:id
${formatReqs(todo6.reqs)}
`;

/** ---------- Write outputs ---------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

/** DO NOT change CSV structure */
const csv = `student_username,obtained_marks,total_marks,status
${studentId},${totalEarned},100,${status}
`;

fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), summary);

console.log(`✔ Lab graded: ${totalEarned}/100 (status=${status})`);
