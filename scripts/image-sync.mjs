
import fs from "node:fs/promises";
import ExcelJS from "exceljs";

const XLSX = "Price Data.xlsx";
const CSV = "image_candidates.csv";

const MODE = process.env.MODE || "discover";
const START = Math.max(
  0,
  Number(process.env.BATCH_START || 0)
);
const COUNT = Math.max(
  1,
  Math.min(250, Number(process.env.BATCH_COUNT || 50))
);

const HEADERS = [
  "BRAND",
  "MODEL",
  "ROWS",
  "IMAGE_TITLE",
  "IMAGE_URL",
  "SOURCE_PAGE",
  "LICENSE",
  "SCORE",
  "APPROVE",
  "RIGHTS_PROOF"
];

const COLUMNS = [
  "IMAGE URL",
  "IMAGE URL 2",
  "IMAGE URL 3",
  "IMAGE URL 4",
  "IMAGE URL 5"
];

const delay = ms =>
  new Promise(done => setTimeout(done, ms));

// REMOVE RAM / STORAGE FROM MODEL NAME
function modelName(value) {
  return String(value || "")
    .replace(
      /\s*\(\s*(?:(?:\d+(?:\.\d+)?\s*(?:GB|TB)?\s*[\/+ ]\s*\d+(?:\.\d+)?\s*(?:GB|TB)?)|(?:\d+(?:\.\d+)?\s*(?:GB|TB)))\s*\)\s*$/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

const keyOf = (brand, model) =>
  `${brand.trim().toUpperCase()}|${model.trim().toUpperCase()}`;

const norm = value =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const safe = value => String(value ?? "");

// CSV FILE WRITER
function csvEncode(rows) {
  return rows
    .map(row =>
      row
        .map(value =>
          `"${safe(value).replaceAll('"', '""')}"`
        )
        .join(",")
    )
    .join("\r\n") + "\r\n";
}

// CSV FILE READER
function csvDecode(input) {
  const result = [];

  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (quoted) {
      if (c === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      result.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field || row.length) {
    row.push(field);
    result.push(row);
  }

  const [heads = [], ...records] = result;

  const names = heads.map(h =>
    h.replace(/^\uFEFF/, "").trim().toUpperCase()
  );

  return records
    .filter(r => r.some(Boolean))
    .map(r =>
      Object.fromEntries(
        names.map((name, i) => [
          name,
          r[i] || ""
        ])
      )
    );
}

async function csvRows() {
  try {
    return csvDecode(
      await fs.readFile(CSV, "utf8")
    );
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// EXTRACT WIKIMEDIA LICENSE METADATA
function metadata(info, key) {
  return String(
    info?.extmetadata?.[key]?.value || ""
  )
    .replace(/<[^>]*>/g, "")
    .trim();
}

// ONLY CC0 / PUBLIC DOMAIN CANDIDATES
function publicLicense(value) {
  return /^(?:CC0(?:\b|\s)|PUBLIC DOMAIN\b|PUBLIC DOMAIN MARK\b)/i
    .test(String(value || "").trim());
}

function httpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// BRAND ALIASES
function brandAliases(brand) {
  const aliases = {
    MI: ["xiaomi", "redmi", "poco"],
    SAMSUNG: ["samsung"],
    APPLE: ["apple", "iphone", "ipad"],
    "ONE PLUS": ["oneplus", "one plus"],
    GOOGLE: ["google", "pixel"],
    MOTOROLA: ["motorola", "moto"]
  };

  return aliases[brand.toUpperCase()] ||
    [brand.toLowerCase()];
}

// CONSERVATIVE MODEL NAME CHECK
function matchScore(brand, model, title) {
  const titleText =
    ` ${norm(title.replace(/^File:/i, ""))} `;

  const modelText = norm(model);

  if (
    !modelText ||
    !titleText.includes(` ${modelText} `)
  ) {
    return 0;
  }

  const brandFound = brandAliases(brand)
    .some(alias =>
      titleText.includes(` ${norm(alias)} `)
    );

  if (!brandFound) return 0;

  if (
    /\b5g\b/.test(modelText) &&
    /\b4g\b/.test(titleText) &&
    !/\b5g\b/.test(titleText)
  ) {
    return 0;
  }

  if (
    /\b4g\b/.test(modelText) &&
    /\b5g\b/.test(titleText) &&
    !/\b4g\b/.test(titleText)
  ) {
    return 0;
  }

  const end =
    titleText.indexOf(` ${modelText} `) +
    modelText.length + 2;

  const after = titleText
    .slice(end)
    .trim()
    .split(" ")
    .slice(0, 2)
    .join(" ");

  // Avoid suggesting Pro / Ultra photos for base model
  if (
    !/\b(pro|plus|ultra|lite|fe|max|mini)\b/.test(modelText) &&
    /^(pro|plus|ultra|lite|fe|max|mini)( |$)/.test(after)
  ) {
    return 0;
  }

  return 95;
}

// SEARCH WIKIMEDIA COMMONS
async function searchCommons(brand, model) {
  const brandNames = {
    MI: "Xiaomi",
    "ONE PLUS": "OnePlus",
    APPLE: "Apple"
  };

  const brandText =
    brandNames[brand.toUpperCase()] || brand;

  const query = norm(model).includes(norm(brandText))
    ? model
    : `${brandText} ${model}`;

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "800",
    format: "json",
    formatversion: "2"
  });

  const url =
    `https://commons.wikimedia.org/w/api.php?${params}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "GadgetKartBulkImageMatcher/1.0 " +
            `(https://github.com/${process.env.GITHUB_REPOSITORY || "GadgetKart/project"})`
        },
        signal: AbortSignal.timeout(20000)
      });

      if (
        response.status === 429 ||
        response.status >= 500
      ) {
        await delay(1000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Commons API HTTP ${response.status}`
        );
      }

      const data = await response.json();

      return (data.query?.pages || [])
        .map(page => {
          const info = page.imageinfo?.[0] || {};

          const license = metadata(
            info,
            "LicenseShortName"
          );

          const img =
            info.thumburl || info.url || "";

          const source =
            info.descriptionurl || "";

          const score = matchScore(
            brand,
            model,
            page.title
          );

          if (
            !/image\/(jpeg|png|webp)/i
              .test(info.mime || "")
          ) {
            return null;
          }

          if (
            !publicLicense(license) ||
            !httpsUrl(img) ||
            !httpsUrl(source)
          ) {
            return null;
          }

          if (
            new URL(img).hostname !==
            "upload.wikimedia.org"
          ) {
            return null;
          }

          if (
            new URL(source).hostname !==
            "commons.wikimedia.org"
          ) {
            return null;
          }

          if (score < 90) return null;

          return {
            IMAGE_TITLE: page.title,
            IMAGE_URL: img,
            SOURCE_PAGE: source,
            LICENSE: license,
            SCORE: String(score)
          };
        })
        .filter(Boolean)
        .slice(0, 3);

    } catch (error) {
      if (attempt === 2) {
        console.warn(
          `Search failed: ${brand} ${model}: ${error.message}`
        );
      } else {
        await delay(1000 * (attempt + 1));
      }
    }
  }

  return [];
}

// MAIN PROGRAM
async function run() {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(XLSX);

  const sheet = workbook.worksheets[0];

  if (!sheet) {
    throw new Error("Excel sheet missing");
  }

  const cols = new Map();

  sheet.getRow(1).eachCell((cell, index) => {
    cols.set(
      String(cell.value || "")
        .trim()
        .toUpperCase(),
      index
    );
  });

  for (const need of ["BRAND", "NAME"]) {
    if (!cols.has(need)) {
      throw new Error(`Column missing: ${need}`);
    }
  }

  const get = (row, name) =>
    String(
      row.getCell(cols.get(name))?.value ?? ""
    ).trim();

  // GROUP EXCEL VARIANTS INTO MODEL FAMILIES
  const families = new Map();

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    const brand = get(row, "BRAND")
      .toUpperCase();

    const model = modelName(
      get(row, "NAME")
    );

    if (!brand || !model) continue;

    const key = keyOf(brand, model);

    if (!families.has(key)) {
      families.set(key, {
        brand,
        model,
        rows: []
      });
    }

    families.get(key).rows.push(i);
  }

  const all = [...families.values()]
    .sort((a, b) =>
      keyOf(a.brand, a.model)
        .localeCompare(keyOf(b.brand, b.model))
    );

  console.log(
    `Products: ${sheet.rowCount - 1}; ` +
    `unique model groups: ${all.length}`
  );

  const existing = await csvRows();

  // MODE 1: DISCOVER IMAGE CANDIDATES
  if (MODE === "discover") {
    const output = [...existing];

    const seen = new Set(
      output.map(r =>
        `${keyOf(r.BRAND || "", r.MODEL || "")}|${r.IMAGE_URL || ""}`
      )
    );

    const batch = all.slice(
      START,
      START + COUNT
    );

    for (let i = 0; i < batch.length; i++) {
      const family = batch[i];

      console.log(
        `Searching ${START + i + 1}/${all.length}: ` +
        `${family.brand} ${family.model}`
      );

      const matches = await searchCommons(
        family.brand,
        family.model
      );

      const candidates = matches.length
        ? matches
        : [{
            IMAGE_TITLE:
              "NO MATCH - add authorized image URL if available"
          }];

      for (const match of candidates) {
        const record = {
          BRAND: family.brand,
          MODEL: family.model,
          ROWS: family.rows.join(";"),
          IMAGE_TITLE: match.IMAGE_TITLE || "",
          IMAGE_URL: match.IMAGE_URL || "",
          SOURCE_PAGE: match.SOURCE_PAGE || "",
          LICENSE: match.LICENSE || "",
          SCORE: match.SCORE || "",
          APPROVE: "",
          RIGHTS_PROOF: ""
        };

        const key =
          `${keyOf(record.BRAND, record.MODEL)}|${record.IMAGE_URL}`;

        if (!seen.has(key)) {
          output.push(record);
          seen.add(key);
        }
      }

      await delay(250);
    }

    output.sort((a, b) =>
      keyOf(a.BRAND, a.MODEL)
        .localeCompare(keyOf(b.BRAND, b.MODEL)) ||
      Number(b.SCORE || 0) -
      Number(a.SCORE || 0)
    );

    await fs.writeFile(
      CSV,
      csvEncode([
        HEADERS,
        ...output.map(r =>
          HEADERS.map(h => r[h] || "")
        )
      ]),
      "utf8"
    );

    console.log(
      `Candidate file saved: ${CSV}, ` +
      `${output.length} rows`
    );

    return;
  }

  // MODE 2: APPLY HUMAN-APPROVED IMAGES
  if (MODE !== "apply") {
    throw new Error(
      "MODE must be discover or apply"
    );
  }

  const approved = new Map();

  for (const row of existing) {
    if (
      !/^(yes|y)$/i.test(
        (row.APPROVE || "").trim()
      )
    ) {
      continue;
    }

    const key = keyOf(
      row.BRAND || "",
      row.MODEL || ""
    );

    if (!families.has(key)) {
      throw new Error(
        `Unknown model in approvals: ${key}`
      );
    }

    const link = String(
      row.IMAGE_URL || ""
    ).trim();

    if (!httpsUrl(link)) {
      throw new Error(
        `Approved URL must be https: ${key}`
      );
    }

    const license = String(
      row.LICENSE || ""
    ).trim();

    if (publicLicense(license)) {
      if (
        new URL(link).hostname !==
          "upload.wikimedia.org" ||
        !httpsUrl(row.SOURCE_PAGE || "") ||
        new URL(row.SOURCE_PAGE).hostname !==
          "commons.wikimedia.org"
      ) {
        throw new Error(
          `Commons source URL invalid: ${key}`
        );
      }

    } else if (
      license.toUpperCase() === "AUTHORIZED"
    ) {
      if (
        String(row.RIGHTS_PROOF || "")
          .trim().length < 10
      ) {
        throw new Error(
          "Provide actual supplier permission " +
          `reference in RIGHTS_PROOF: ${key}`
        );
      }

    } else {
      throw new Error(
        `Unsupported license for ${key}: ${license}`
      );
    }

    if (!approved.has(key)) {
      approved.set(key, []);
    }

    if (!approved.get(key).includes(link)) {
      approved.get(key).push(link);
    }
  }

  if (!approved.size) {
    console.log(
      "No rows marked APPROVE=YES. No Excel changes."
    );
    return;
  }

  // CREATE IMAGE COLUMNS IF MISSING
  let nextCol = sheet.columnCount;

  for (const name of COLUMNS) {
    if (!cols.has(name)) {
      nextCol++;

      cols.set(name, nextCol);

      sheet.getRow(1)
        .getCell(nextCol).value = name;
    }
  }

  let updated = 0;

  // APPLY TO EVERY RAM / STORAGE VARIANT
  for (const [key, links] of approved) {
    const family = families.get(key);

    for (const rowNum of family.rows) {
      const row = sheet.getRow(rowNum);

      const prior = COLUMNS
        .map(col =>
          String(
            row.getCell(cols.get(col)).value || ""
          ).trim()
        )
        .filter(httpsUrl);

      const combined = [
        ...new Set([
          ...prior,
          ...links
        ])
      ].slice(0, 5);

      if (
        combined.join("|") ===
        prior.join("|")
      ) {
        continue;
      }

      COLUMNS.forEach((col, i) => {
        row.getCell(cols.get(col)).value =
          combined[i] || null;
      });

      updated++;
    }
  }

  if (updated) {
    await workbook.xlsx.writeFile(XLSX);
  }

  console.log(
    `Applied ${approved.size} approved model groups ` +
    `across ${updated} Excel rows. Saved ${XLSX}`
  );
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
