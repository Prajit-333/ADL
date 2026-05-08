/**
 * ADL ENTERPRISE FLOW TESTER — ULTRA EDITION
 *
 * BEFORE every request:
 * - explains what the request does
 * - explains why it is needed
 * - explains business importance
 * - animated countdown so you can read
 *
 * Then:
 * - sends request with timing
 * - logs syntax-highlighted response
 * - extracts IDs automatically
 * - shows final summary table
 *
 * Run:
 *   bun run test-flow.js
 *   node test-flow.js
 */

const BASE_URL = "http://localhost:3009/api/v1";
const TOTAL_STEPS = 10;

// ─── ANSI COLOURS & STYLES ───────────────────────────────────────────────────
const C = {
  reset:          "\x1b[0m",
  bold:           "\x1b[1m",
  dim:            "\x1b[2m",
  italic:         "\x1b[3m",
  underline:      "\x1b[4m",

  black:          "\x1b[30m",
  red:            "\x1b[31m",
  green:          "\x1b[32m",
  yellow:         "\x1b[33m",
  blue:           "\x1b[34m",
  magenta:        "\x1b[35m",
  cyan:           "\x1b[36m",
  white:          "\x1b[37m",

  brightBlack:    "\x1b[90m",
  brightRed:      "\x1b[91m",
  brightGreen:    "\x1b[92m",
  brightYellow:   "\x1b[93m",
  brightBlue:     "\x1b[94m",
  brightMagenta:  "\x1b[95m",
  brightCyan:     "\x1b[96m",
  brightWhite:    "\x1b[97m",

  bgBlack:        "\x1b[40m",
  bgRed:          "\x1b[41m",
  bgGreen:        "\x1b[42m",
  bgYellow:       "\x1b[43m",
  bgBlue:         "\x1b[44m",
  bgMagenta:      "\x1b[45m",
  bgCyan:         "\x1b[46m",
  bgWhite:        "\x1b[47m",
  bgBrightBlack:  "\x1b[100m",
  bgBrightBlue:   "\x1b[104m",
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function termWidth() {
  return process.stdout.columns || 80;
}

function repeat(char, n) {
  return char.repeat(Math.max(0, n));
}

function pad(str, width) {
  const visible = stripAnsi(str).length;
  return str + repeat(" ", Math.max(0, width - visible));
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function center(text, width) {
  const visible = stripAnsi(text).length;
  const total = width - visible;
  const left  = Math.floor(total / 2);
  const right = total - left;
  return repeat(" ", left) + text + repeat(" ", right);
}

// ─── STEP COLOUR PALETTE ─────────────────────────────────────────────────────
const STEP_COLORS = [
  C.brightCyan,
  C.brightBlue,
  C.brightMagenta,
  C.cyan,
  C.brightYellow,
  C.brightGreen,
  C.blue,
  C.magenta,
  C.brightRed,
  C.yellow,
];

// ─── JSON SYNTAX HIGHLIGHTER ─────────────────────────────────────────────────
function highlight(json) {
  return json
    .replace(/"([^"]+)"(\s*:)/g,
      `${C.brightCyan}"$1"${C.reset}$2`)           // keys
    .replace(/:\s*"([^"]*)"/g,
      `: ${C.brightGreen}"$1"${C.reset}`)           // string values
    .replace(/:\s*(-?\d+(\.\d+)?)/g,
      `: ${C.brightYellow}$1${C.reset}`)            // number values
    .replace(/:\s*(true|false)/g,
      `: ${C.brightMagenta}$1${C.reset}`)           // booleans
    .replace(/:\s*(null)/g,
      `: ${C.brightBlack}$1${C.reset}`);            // null
}

function prettyJson(obj) {
  return highlight(JSON.stringify(obj, null, 2));
}

// ─── BOX DRAWING HELPERS ─────────────────────────────────────────────────────
const B = {
  tl: "╔", tr: "╗", bl: "╚", br: "╝",
  h:  "═", v:  "║",
  ml: "╠", mr: "╣",
  tts:"╦", bbs:"╩",
  // thin
  tl2: "┌", tr2: "┐", bl2: "└", br2: "┘",
  h2:  "─", v2:  "│",
};

function boxTop(width, color, char = B.h) {
  process.stdout.write(
    `${color}${B.tl}${repeat(char, width - 2)}${B.tr}${C.reset}\n`
  );
}
function boxBottom(width, color, char = B.h) {
  process.stdout.write(
    `${color}${B.bl}${repeat(char, width - 2)}${B.br}${C.reset}\n`
  );
}
function boxMid(width, color, char = B.h) {
  process.stdout.write(
    `${color}${B.ml}${repeat(char, width - 2)}${B.mr}${C.reset}\n`
  );
}
function boxLine(content, width, borderColor) {
  const visLen = stripAnsi(content).length;
  const pad    = Math.max(0, width - 4 - visLen);
  process.stdout.write(
    `${borderColor}${B.v}${C.reset} ${content}${repeat(" ", pad)} ${borderColor}${B.v}${C.reset}\n`
  );
}

// ─── BANNER ───────────────────────────────────────────────────────────────────
function banner() {
  const w = Math.min(termWidth(), 80);
  console.log();

  const art = [
    `${C.brightCyan}${C.bold}  █████╗ ██████╗ ██╗     ${C.brightMagenta}  ████████╗███████╗███████╗████████╗`,
    `${C.brightCyan}${C.bold} ██╔══██╗██╔══██╗██║     ${C.brightMagenta}  ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝`,
    `${C.brightCyan}${C.bold} ███████║██║  ██║██║     ${C.brightMagenta}     ██║   █████╗  ███████╗   ██║   `,
    `${C.brightCyan}${C.bold} ██╔══██║██║  ██║██║     ${C.brightMagenta}     ██║   ██╔══╝  ╚════██║   ██║   `,
    `${C.brightCyan}${C.bold} ██║  ██║██████╔╝███████╗${C.brightMagenta}     ██║   ███████╗███████║   ██║   `,
    `${C.brightCyan}${C.bold} ╚═╝  ╚═╝╚═════╝ ╚══════╝${C.brightMagenta}    ╚═╝   ╚══════╝╚══════╝   ╚═╝   `,
  ];

  art.forEach((line) => console.log(line + C.reset));

  console.log();
  const sub = `${C.brightWhite}${C.bold}  ENTERPRISE TRANSPORT SYSTEM — FULL FLOW TESTER  ${C.reset}`;
  console.log(sub);
  const version = `${C.brightBlack}  v2.0  •  ${TOTAL_STEPS} steps  •  localhost:3009  ${C.reset}`;
  console.log(version);
  console.log();
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function progressBar(step, total, color) {
  const w        = Math.min(termWidth(), 80);
  const barWidth = w - 20;
  const filled   = Math.round((step / total) * barWidth);
  const empty    = barWidth - filled;

  const pct  = String(Math.round((step / total) * 100)).padStart(3);
  const bar  =
    `${color}${"█".repeat(filled)}${C.brightBlack}${"░".repeat(empty)}${C.reset}`;

  process.stdout.write(
    `  ${C.bold}${color}[${C.reset}${bar}${C.bold}${color}]${C.reset} ` +
    `${color}${C.bold}${pct}%${C.reset} ` +
    `${C.brightBlack}(${step}/${total})${C.reset}\n`
  );
}

// ─── STEP EXPLAIN PANEL ───────────────────────────────────────────────────────
async function explain(step, heading, what, why) {
  const color = STEP_COLORS[(step - 1) % STEP_COLORS.length];
  const w     = Math.min(termWidth(), 80);

  console.log();
  progressBar(step - 1, TOTAL_STEPS, color);
  console.log();

  boxTop(w, color);

  const stepLabel =
    `${color}${C.bold} STEP ${step}/${TOTAL_STEPS}${C.reset}  ` +
    `${C.brightWhite}${C.bold}${heading}${C.reset}`;
  boxLine(stepLabel, w, color);
  boxMid(w, color);

  // WHAT
  boxLine(`${C.brightBlue}${C.bold}◆ WHAT THIS DOES${C.reset}`, w, color);
  const whatLines = wrapText(what, w - 6);
  whatLines.forEach((l) =>
    boxLine(`  ${C.white}${l}${C.reset}`, w, color)
  );

  boxLine("", w, color);

  // WHY
  boxLine(`${C.brightMagenta}${C.bold}◆ WHY IT IS NEEDED${C.reset}`, w, color);
  const whyLines = wrapText(why, w - 6);
  whyLines.forEach((l) =>
    boxLine(`  ${C.white}${l}${C.reset}`, w, color)
  );

  boxMid(w, color);
  boxLine(
    `${C.brightYellow}${C.bold}⏳ Starting in 5 seconds…${C.reset}`,
    w,
    color
  );
  boxBottom(w, color);

  // Animated countdown
  await animatedCountdown(5, color);
}

function wrapText(text, maxLen) {
  const words  = text.split(" ");
  const lines  = [];
  let current  = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxLen) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function animatedCountdown(seconds, color) {
  for (let i = seconds; i >= 1; i--) {
    const filled = seconds - i + 1;
    const bar    = `${"▓".repeat(filled)}${"░".repeat(seconds - filled)}`;
    process.stdout.write(
      `\r  ${color}${C.bold}[${bar}]${C.reset}  ` +
      `${C.brightYellow}${C.bold}${i}s${C.reset}   `
    );
    await sleep(1000);
  }
  process.stdout.write(
    `\r  ${C.brightGreen}${C.bold}[${"▓".repeat(seconds)}] GO! 🚀${C.reset}   \n\n`
  );
}

// ─── REQUEST / RESPONSE ───────────────────────────────────────────────────────
async function api(method, endpoint, body = null) {
  const methodColors = {
    POST:  C.brightGreen,
    GET:   C.brightBlue,
    PATCH: C.brightYellow,
    PUT:   C.brightMagenta,
    DELETE:C.brightRed,
  };
  const mc  = methodColors[method] || C.white;
  const w   = Math.min(termWidth(), 80);

  // Request panel
  boxTop(w, C.brightBlue, B.h);
  boxLine(
    `${mc}${C.bold}▶ ${method}${C.reset}  ${C.brightWhite}${endpoint}${C.reset}`,
    w, C.brightBlue
  );

  if (body) {
    boxMid(w, C.brightBlue, B.h);
    boxLine(`${C.brightCyan}${C.bold}REQUEST BODY${C.reset}`, w, C.brightBlue);
    const jsonLines = prettyJson(body).split("\n");
    jsonLines.forEach((l) => boxLine(`  ${l}`, w, C.brightBlue));
  }
  boxBottom(w, C.brightBlue, B.h);

  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body:    body ? JSON.stringify(body) : undefined,
    });

    const elapsed = Date.now() - startTime;
    const json    = await response.json();

    const statusColor = response.ok ? C.brightGreen : C.brightRed;
    const statusIcon  = response.ok ? "✅" : "❌";

    // Response panel
    console.log();
    boxTop(w, statusColor, B.h);
    boxLine(
      `${statusIcon}  ${statusColor}${C.bold}${response.status} ${response.statusText}${C.reset}` +
      `   ${C.brightBlack}${elapsed}ms${C.reset}`,
      w, statusColor
    );
    boxMid(w, statusColor, B.h);
    boxLine(`${C.brightMagenta}${C.bold}RESPONSE BODY${C.reset}`, w, statusColor);
    const resLines = prettyJson(json).split("\n");
    resLines.forEach((l) => boxLine(`  ${l}`, w, statusColor));
    boxBottom(w, statusColor, B.h);
    console.log();

    if (!response.ok) {
      throw new Error(json.message || "API Failed");
    }

    return json;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.log();
    boxTop(w, C.brightRed, B.h);
    boxLine(
      `${C.brightRed}${C.bold}💥 REQUEST FAILED  ${C.brightBlack}${elapsed}ms${C.reset}`,
      w, C.brightRed
    );
    boxLine(`  ${C.white}${err.message}${C.reset}`, w, C.brightRed);
    boxBottom(w, C.brightRed, B.h);
    throw err;
  }
}

// ─── ID LOG ───────────────────────────────────────────────────────────────────
function idLog(name, value) {
  console.log(
    `  ${C.brightYellow}${C.bold}🆔 ${name}${C.reset}` +
    `${C.brightBlack} ──────► ${C.reset}` +
    `${C.bgBrightBlack}${C.brightGreen}${C.bold} ${value} ${C.reset}`
  );
}

// ─── FINAL SUMMARY TABLE ──────────────────────────────────────────────────────
function summaryTable(ids) {
  const w = Math.min(termWidth(), 80);
  console.log();

  // Gradient-ish header
  const colors = [
    C.brightCyan, C.brightBlue, C.brightMagenta,
    C.magenta, C.yellow, C.brightYellow,
  ];
  let titleStr = "";
  const titleText = "  🏁  FINAL GENERATED IDs  🏁  ";
  for (let i = 0; i < titleText.length; i++) {
    titleStr += colors[i % colors.length] + C.bold + titleText[i];
  }
  titleStr += C.reset;

  boxTop(w, C.brightCyan);
  boxLine(titleStr, w, C.brightCyan);
  boxMid(w, C.brightCyan);

  const nameW = 16;
  ids.forEach(([name, value], i) => {
    const rowColor = STEP_COLORS[i % STEP_COLORS.length];
    const badge    = `${rowColor}${C.bold}${name.padEnd(nameW)}${C.reset}`;
    const val      = `${C.brightGreen}${C.bold}${value}${C.reset}`;
    boxLine(`  ${badge}  ${val}`, w, C.brightCyan);
  });

  boxMid(w, C.brightCyan);
  boxLine(
    `${C.brightBlack}  Generated at: ${new Date().toLocaleString()}${C.reset}`,
    w, C.brightCyan
  );
  boxBottom(w, C.brightCyan);
  console.log();
}

// ─── VICTORY / FAILURE BANNERS ────────────────────────────────────────────────
function victoryBanner() {
  const lines = [
    `${C.brightGreen}${C.bold}`,
    `  ███████╗██╗   ██╗ ██████╗ ██████╗███████╗███████╗███████╗`,
    `  ██╔════╝██║   ██║██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝`,
    `  ███████╗██║   ██║██║     ██║     █████╗  ███████╗███████╗`,
    `  ╚════██║██║   ██║██║     ██║     ██╔══╝  ╚════██║╚════██║`,
    `  ███████║╚██████╔╝╚██████╗╚██████╗███████╗███████║███████║`,
    `  ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝╚══════╝╚══════╝╚══════╝`,
    `${C.reset}`,
  ];
  lines.forEach((l) => console.log(l));
  console.log(
    `  ${C.brightYellow}${C.bold}🔥  ADL FULL SYSTEM FLOW COMPLETED SUCCESSFULLY  🔥${C.reset}\n`
  );
}

function failureBanner() {
  console.log();
  console.log(`  ${C.brightRed}${C.bold}💀  FLOW STOPPED DUE TO ERROR  💀${C.reset}\n`);
}

// ─── SECTION DIVIDER ──────────────────────────────────────────────────────────
function sectionDivider(label, color = C.brightBlack) {
  const w        = Math.min(termWidth(), 80);
  const labelStr = `  ${label}  `;
  const lv       = stripAnsi(labelStr).length;
  const side     = Math.max(0, Math.floor((w - lv) / 2));
  console.log(
    `\n${color}${repeat("─", side)}${C.bold}${labelStr}${C.reset}${color}${repeat("─", w - side - lv)}${C.reset}\n`
  );
}

// ─── MAIN FLOW ─────────────────────────────────────────────────────────────────
async function run() {
  console.clear();
  banner();
  sectionDivider("STARTING FLOW", C.brightCyan);

  const collectedIds = [];

  try {
    // ── STEP 1 ────────────────────────────────────────────────────────────────
    await explain(
      1, "CREATE COLLEGE",
      "This request creates the parent organization (College). Every user, vehicle, route, and trip belongs to a college in this multi-tenant system.",
      "Without College, the system has no root entity. Since this is a transport platform for institutions, everything starts from College creation."
    );

    const college = await api("POST", "/colleges", {
      name:     "MIT Institute of Technology",
      domain:   `mit-${Date.now()}.edu`,
      isActive: true,
    });

    const COLLEGE_ID = college.data.id;
    idLog("COLLEGE_ID", COLLEGE_ID);
    collectedIds.push(["COLLEGE_ID", COLLEGE_ID]);

    // ── STEP 2 ────────────────────────────────────────────────────────────────
    await explain(
      2, "CREATE DRIVER USER",
      "This request creates the main system login account for the driver. Authentication, login, permissions, and access control happen through User.",
      "DriverProfile cannot exist without User. First create authentication identity, then create business profile."
    );

    const user = await api("POST", "/users", {
      email:     `driver.${Date.now()}@example.com`,
      password:  "securePassword123",
      name:      "John Doe",
      role:      "DRIVER",
      collegeId: COLLEGE_ID,
    });

    const USER_ID = user.data.id;
    idLog("USER_ID", USER_ID);
    collectedIds.push(["USER_ID", USER_ID]);

    // ── STEP 3 ────────────────────────────────────────────────────────────────
    await explain(
      3, "CREATE DRIVER PROFILE",
      "This request creates the transport-specific driver profile like phone number and driving license details.",
      "User handles authentication. DriverProfile handles transport operations. This separation is industry standard and follows clean architecture."
    );

    const driver = await api("POST", "/drivers", {
      userId:    USER_ID,
      phone:     "+1234567890",
      licenseNo: `DL-${Date.now()}`,
    });

    const DRIVER_ID = driver.data.id;
    idLog("DRIVER_ID", DRIVER_ID);
    collectedIds.push(["DRIVER_ID", DRIVER_ID]);

    // ── STEP 4 ────────────────────────────────────────────────────────────────
    await explain(
      4, "CREATE VEHICLE",
      "This request registers the physical bus into the system including registration number, GPS device mapping, and operational status.",
      "Without Vehicle, no trip can happen. GPS tracking, trip management, and assignments depend on Vehicle."
    );

    const vehicle = await api("POST", "/vehicles", {
      collegeId:    COLLEGE_ID,
      registration: `BUS-${Date.now()}`,
      type:         "Electric Bus",
      capacity:     45,
      gpsDeviceId:  `GPS-${Date.now()}`,
      status:       "ACTIVE",
    });

    const VEHICLE_ID = vehicle.data.id;
    idLog("VEHICLE_ID", VEHICLE_ID);
    collectedIds.push(["VEHICLE_ID", VEHICLE_ID]);

    // ── STEP 5 ────────────────────────────────────────────────────────────────
    await explain(
      5, "CREATE ROUTE",
      "This request creates the travel route the bus will follow such as pickup zones and destination flow.",
      "Trips always require a Route. Without Route, there is no destination planning or ETA calculation."
    );

    const route = await api("POST", "/routes", {
      collegeId: COLLEGE_ID,
      code:      `R-${Date.now()}`,
      name:      "Downtown Express",
      city:      "New York",
    });

    const ROUTE_ID = route.data.id;
    idLog("ROUTE_ID", ROUTE_ID);
    collectedIds.push(["ROUTE_ID", ROUTE_ID]);

    // ── STEP 6 ────────────────────────────────────────────────────────────────
    await explain(
      6, "ADD ROUTE STOP",
      "This request adds individual stops inside the route such as stations or pickup points.",
      "A route without stops is incomplete. Stops are needed for live ETA, nearest stop detection, and student pickup management."
    );

    await api("POST", `/routes/${ROUTE_ID}/stops`, {
      name:      "Central Park Station",
      latitude:  40.785091,
      longitude: -73.968285,
      sequence:  1,
    });

    // ── STEP 7 ────────────────────────────────────────────────────────────────
    await explain(
      7, "VEHICLE ASSIGNMENT",
      "This request connects Vehicle + Driver + Route together into one operational assignment.",
      "Until assignment happens, the system does not know which driver is driving which bus on which route."
    );

    const assignment = await api("POST", "/assignments", {
      vehicleId: VEHICLE_ID,
      driverId:  DRIVER_ID,
      routeId:   ROUTE_ID,
      startDate: new Date().toISOString(),
    });

    const ASSIGNMENT_ID = assignment.data.id;
    idLog("ASSIGNMENT_ID", ASSIGNMENT_ID);
    collectedIds.push(["ASSIGNMENT_ID", ASSIGNMENT_ID]);

    // ── STEP 8 ────────────────────────────────────────────────────────────────
    await explain(
      8, "START TRIP",
      "This request starts the live operational trip. The bus is now officially in motion.",
      "Trip state is the heart of real-time tracking. Kafka events, WebSocket updates, and ETA logic depend on active trips."
    );

    const trip = await api("POST", "/trips/start", {
      collegeId: COLLEGE_ID,
      vehicleId: VEHICLE_ID,
      routeId:   ROUTE_ID,
    });

    const TRIP_ID = trip.data.id;
    idLog("TRIP_ID", TRIP_ID);
    collectedIds.push(["TRIP_ID", TRIP_ID]);

    // ── STEP 9 ────────────────────────────────────────────────────────────────
    await explain(
      9, "LIVE LOCATION UPDATE",
      "This request stores real-time GPS coordinates of the moving bus.",
      "This powers the entire live tracking system for parents, students, admins, and transport office monitoring."
    );

    await api("POST", "/location/update", {
      vehicleId: VEHICLE_ID,
      latitude:  40.7128,
      longitude: -74.0060,
      speed:     65.5,
    });

    // ── STEP 10 ───────────────────────────────────────────────────────────────
    await explain(
      10, "END TRIP",
      "This request marks the trip as completed and stores the trip end timestamp.",
      "Without proper trip closure, reporting, analytics, attendance, and historical tracking become inaccurate."
    );

    await api("PATCH", `/trips/${TRIP_ID}/end`);

    // ── DONE ──────────────────────────────────────────────────────────────────
    progressBar(TOTAL_STEPS, TOTAL_STEPS, C.brightGreen);
    console.log();
    summaryTable(collectedIds);
    victoryBanner();
  } catch (err) {
    failureBanner();
  }
}

run();
