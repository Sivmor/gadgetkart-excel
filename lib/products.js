
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

function cellText(cell) {
  let value = cell?.value;

  if (value == null) return "";

  if (typeof value === "object") {
    if ("result" in value) value = value.result;
    else if ("richText" in value) {
      value = value.richText.map(x => x.text).join("");
    } else if ("text" in value) {
      value = value.text;
    } else {
      return "";
    }
  }

  return String(value ?? "").trim();
}

function number(value) {
  if (value === "" || value == null) return null;

  const parsed = Number(
    String(value).replace(/[₹,\s]/g, "")
  );

  return Number.isFinite(parsed) ? parsed : null;
}

function storageText(value) {
  if (!value) return "";

  return /^\d+(?:\.\d+)?$/.test(value)
    ? `${value} GB`
    : value;
}

function validImage(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function getProducts() {
  const filename = path.join(
    process.cwd(),
    "Price Data.xlsx"
  );

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(
    await readFile(filename)
  );

  const sheet = workbook.worksheets[0];

  if (!sheet) {
    throw new Error("Excel sheet not found");
  }

  const headers = new Map();

  sheet.getRow(1).eachCell((cell, index) => {
    headers.set(
      cellText(cell).replace(/\s+/g, " ").toUpperCase(),
      index
    );
  });

  function get(row, column) {
    const index = headers.get(column.toUpperCase());

    return index
      ? cellText(row.getCell(index))
      : "";
  }

  const products = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const brand = get(row, "BRAND");
    const name = get(row, "NAME");
    const category = get(row, "PRODUCT CATEGORY");
    const price = number(get(row, "MOP"));

    if (
      !brand ||
      !name ||
      !category ||
      price === null ||
      price < 0
    ) {
      return;
    }

    const specs = {
      Processor: get(row, "PROCESSOR"),
      Chipset: get(row, "CHIPSET"),
      OS: get(row, "OS"),
      Resolution: get(row, "RESOLUTION"),
      "Screen Size": get(row, "SIZE"),
      "Display Type": get(row, "TYPE"),
      "External Memory": get(row, "EXTERNAL MEMORY SUPPORT"),
      RAM: storageText(get(row, "RAM")),
      ROM: storageText(get(row, "ROM")),
      "Rear Camera": get(row, "REAR CAMERA"),
      "Front Camera": get(row, "FRONT CAMERA"),
      Battery: get(row, "BATTERY CAPACITY"),
      Charging: get(row, "CHARGING TYPE")
    };

    // OPTIONAL IMAGE COLUMNS
    const imageColumns = [
      "IMAGE URL",
      "IMAGE URL 2",
      "IMAGE URL 3",
      "IMAGE URL 4",
      "IMAGE URL 5"
    ];

    const images = [
      ...new Set(
        imageColumns
          .map(column => get(row, column))
          .filter(validImage)
      )
    ];

    const cashback = number(get(row, "CB"));

    const netLanding = number(
      get(row, "* Net Landing (After Cashback)")
    );

    const stock = get(row, "STOCK").toUpperCase();

    products.push({
      id: String(rowNumber),
      brand,
      category,
      segment: get(row, "SEGMENT CRITERIA"),
      name,
      colors: get(row, "COLORS"),

      mrp: number(get(row, "MRP")),
      price,
      cashback,

      net_price:
        netLanding ??
        Math.max(0, price - (cashback || 0)),

      bank_name: get(row, "BANK NAME"),

      in_stock: [
        "YES",
        "TRUE",
        "1",
        "IN STOCK"
      ].includes(stock),

      image_url: images[0] || null,
      images,

      specifications: specs,

      offers: {
        cashback,
        bank: get(row, "BANK NAME"),
        tenure: get(row, "CB Tenure"),
        spike_support: number(
          get(row, "SPIKE SUPPORT")
        )
      }
    });
  });

  return products;
}
