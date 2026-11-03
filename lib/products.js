
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

function text(cell) {
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
  if (!value) return null;

  const n = Number(
    String(value).replace(/[₹,\s]/g, "")
  );

  return Number.isFinite(n) ? n : null;
}

export async function getProducts() {
  const filePath = path.join(
    process.cwd(),
    "Price Data.xlsx"
  );

  const buffer = await readFile(filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];

  if (!sheet) {
    throw new Error("Excel sheet not found");
  }

  const headers = {};

  sheet.getRow(1).eachCell((cell, index) => {
    headers[text(cell).toUpperCase()] = index;
  });

  function get(row, heading) {
    const index = headers[heading.toUpperCase()];
    return index ? text(row.getCell(index)) : "";
  }

  const products = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const brand = get(row, "BRAND");
    const name = get(row, "NAME");
    const category = get(row, "PRODUCT CATEGORY");
    const price = number(get(row, "MOP"));

    if (!brand || !name || !category || price === null) {
      return;
    }

    const specifications = {
      Processor: get(row, "PROCESSOR"),
      Chipset: get(row, "CHIPSET"),
      OS: get(row, "OS"),
      Resolution: get(row, "RESOLUTION"),
      "Screen Size": get(row, "SIZE"),
      "Display Type": get(row, "TYPE"),
      "External Memory": get(row, "EXTERNAL MEMORY SUPPORT"),
      RAM: get(row, "RAM"),
      ROM: get(row, "ROM"),
      "Rear Camera": get(row, "REAR CAMERA"),
      "Front Camera": get(row, "FRONT CAMERA"),
      Battery: get(row, "BATTERY CAPACITY"),
      Charging: get(row, "CHARGING TYPE")
    };

    for (const key of ["RAM", "ROM"]) {
      if (/^\d+(\.\d+)?$/.test(specifications[key])) {
        specifications[key] += " GB";
      }
    }

    const cashback = number(get(row, "CB"));
    const netLanding = number(
      get(row, "* Net Landing (After Cashback)")
    );

    const stock = get(row, "STOCK").toUpperCase();

    const image = get(row, "IMAGE URL");

    products.push({
      id: String(rowNumber),
      brand,
      name,
      category,
      segment: get(row, "SEGMENT CRITERIA"),
      colors: get(row, "COLORS"),
      price,
      mrp: number(get(row, "MRP")),
      cashback,
      net_price: netLanding ?? Math.max(
        0, price - (cashback || 0)
      ),
      bank_name: get(row, "BANK NAME"),
      in_stock: ["YES", "TRUE", "1", "IN STOCK"].includes(stock),
      image_url: /^https:\/\//i.test(image) ? image : null,
      specifications,
      offers: {
        cashback,
        bank: get(row, "BANK NAME"),
        tenure: get(row, "CB Tenure"),
        spike_support: number(get(row, "SPIKE SUPPORT"))
      }
    });
  });

  return products;
}
