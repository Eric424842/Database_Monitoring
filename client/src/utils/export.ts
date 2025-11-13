// src/utils/export.ts
// Utility functions cho export CSV/JSON

// CSV với BOM để Excel mở đúng font
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (data.length === 0) {
    alert("Không có dữ liệu để export");
    return;
  }

  // Lấy headers từ object đầu tiên nếu không có headers truyền vào
  const csvHeaders = headers || Object.keys(data[0]);

  // Tạo CSV content với BOM (UTF-8 BOM: EF BB BF)
  const BOM = "\uFEFF";
  let csvContent = BOM;

  // Thêm headers
  csvContent += csvHeaders.map((h) => escapeCSVField(String(h))).join(",") + "\n";

  // Thêm data rows
  data.forEach((row) => {
    const values = csvHeaders.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      return escapeCSVField(String(value));
    });
    csvContent += values.join(",") + "\n";
  });

  // Download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Escape CSV field (xử lý dấu phẩy, quotes, newlines)
function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Export to JSON
export function exportToJSON(data: any[], filename: string) {
  if (data.length === 0) {
    alert("Không có dữ liệu để export");
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback cho browsers cũ
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

