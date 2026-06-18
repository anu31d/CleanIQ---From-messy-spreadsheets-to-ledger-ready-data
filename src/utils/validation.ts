import { CountryRule, RowResult, ValidationError, ValidationSummary, NumericStats } from "../types";

// Helper to check standard email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper to validate date values
export function validateDate(val: string, format: string): boolean {
  if (!val) return false;
  const cleanVal = val.trim();
  
  // Basic numeric check bounds
  let year = 0;
  let month = 0;
  let day = 0;

  if (format === "YYYY-MM-DD") {
    const match = cleanVal.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    year = parseInt(match[1]);
    month = parseInt(match[2]);
    day = parseInt(match[3]);
  } else if (format === "DD/MM/YYYY") {
    const match = cleanVal.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;
    day = parseInt(match[1]);
    month = parseInt(match[2]);
    year = parseInt(match[3]);
  } else if (format === "MM/DD/YYYY") {
    const match = cleanVal.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;
    month = parseInt(match[1]);
    day = parseInt(match[2]);
    year = parseInt(match[3]);
  } else if (format === "ISO 8601") {
    // Basic ISO 8601 check e.g. 2024-12-31T23:59:59Z, or 2024-12-31
    const d = new Date(cleanVal);
    if (isNaN(d.getTime())) return false;
    year = d.getUTCFullYear();
    month = d.getUTCMonth() + 1;
    day = d.getUTCDate();
  } else {
    // Fallback date parse
    const d = new Date(cleanVal);
    if (isNaN(d.getTime())) return false;
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  
  // Check days per month accurately
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  return true;
}

export function validateDataset(
  headers: string[],
  rows: Record<string, string>[],
  countryRules: CountryRule[],
  dateFormat: string,
  onProgress?: (percent: number) => void
): { results: RowResult[]; summary: ValidationSummary } {
  const results: RowResult[] = [];
  const totalRows = rows.length;

  // Let's identify special columns by header name
  const phoneCol = headers.find(h => /phone|mobile|tel|contact/i.test(h)) || "";
  const countryCol = headers.find(h => /country|nation|cntry/i.test(h)) || "";
  const dateCol = headers.find(h => /date|time|created|updated|timestamp/i.test(h)) || "";
  const emailCols = headers.filter(h => /email|mail/i.test(h));
  const amountCols = headers.filter(h => /amount|price|cost|qty|quantity/i.test(h));

  // Determine numeric columns: column values (at least 80% of non-empty) must be numbers
  const numericThreshold = 0.8;
  const numericCols: string[] = [];
  
  headers.forEach(header => {
    let nonEmptyCount = 0;
    let numericCount = 0;
    
    rows.forEach(row => {
      const val = (row[header] || "").trim();
      if (val) {
        nonEmptyCount++;
        const num = Number(val);
        if (!isNaN(num)) {
          numericCount++;
        }
      }
    });

    if (nonEmptyCount > 0 && (numericCount / nonEmptyCount) >= numericThreshold) {
      numericCols.push(header);
    }
  });

  // Keep track of exact row hashes to spot duplicates
  const rowHashes = new Set<string>();

  // Error frequency counters
  const errorTypes = {
    phone: 0,
    date: 0,
    missing: 0,
    format: 0,
    numeric: 0,
    duplicate: 0,
    other: 0,
  };
  const errorsPerColumn: Record<string, number> = {};

  // Initialize errorsPerColumn
  headers.forEach(h => {
    errorsPerColumn[h] = 0;
  });

  // Loop through rows
  for (let i = 0; i < totalRows; i++) {
    const rawRow = rows[i];
    const errors: ValidationError[] = [];
    const rowNum = i + 1;

    // Stringify row to find complete duplicates
    const rowString = JSON.stringify(rawRow);
    const isDuplicate = rowHashes.has(rowString);
    if (isDuplicate) {
      errors.push({
        column: "ALL",
        type: "duplicate",
        message: "Duplicate row: exact duplicate of another row within file.",
      });
      errorTypes.duplicate++;
    } else {
      rowHashes.add(rowString);
    }

    // Check cells
    headers.forEach(header => {
      const val = (rawRow[header] || "").trim();

      // 1. Missing Check
      if (val === "") {
        errors.push({
          column: header,
          type: "missing",
          message: `Field '${header}' is missing or empty.`,
        });
        errorTypes.missing++;
        errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
        return; // skip further checks on missing cell
      }

      // 2. String Length Check
      if (val.length > 500) {
        errors.push({
          column: header,
          type: "other",
          message: `Field '${header}' exceeds maximum allowed length of 500 characters.`,
        });
        errorTypes.other++;
        errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
      }

      // 3. Phone Number Validation
      if (header === phoneCol) {
        const countryVal = countryCol ? (rawRow[countryCol] || "").trim() : "";
        const cleanPhone = val.replace(/\D/g, ""); // strip all non-digits

        if (countryCol && countryVal) {
          // Look up rule
          const matchedRule = countryRules.find(
            rule => rule.country.toLowerCase() === countryVal.toLowerCase()
          );

          if (matchedRule) {
            if (cleanPhone.length !== matchedRule.digits) {
              errors.push({
                column: header,
                type: "phone",
                message: `Phone: expected ${matchedRule.digits} digits for ${matchedRule.country}, got ${cleanPhone.length}`,
              });
              errorTypes.phone++;
              errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
            }
          } else {
            // E.164 wide search format
            if (cleanPhone.length < 7 || cleanPhone.length > 15) {
              errors.push({
                column: header,
                type: "phone",
                message: `Phone: number is outside the standard range of 7-15 digits.`,
              });
              errorTypes.phone++;
              errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
            }
          }
        } else {
          // Standard range check 7-15
          if (cleanPhone.length < 7 || cleanPhone.length > 15) {
            errors.push({
              column: header,
              type: "phone",
              message: `Phone: number is outside the standard range of 7-15 digits.`,
            });
            errorTypes.phone++;
            errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
          }
        }
      }

      // 4. Date and Time Check
      if (header === dateCol) {
        const isValidDate = validateDate(val, dateFormat);
        if (!isValidDate) {
          errors.push({
            column: header,
            type: "date",
            message: `Date in '${header}': '${val}' is invalid or doesn't match '${dateFormat}' format.`,
          });
          errorTypes.date++;
          errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
        }
      }

      // 5. Email Check
      if (emailCols.includes(header)) {
        if (!EMAIL_REGEX.test(val)) {
          errors.push({
            column: header,
            type: "format",
            message: `Invalid email address format in '${header}'.`,
          });
          errorTypes.format++;
          errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
        }
      }

      // 6. Numeric column values check
      if (numericCols.includes(header)) {
        const parsedNum = Number(val);
        if (isNaN(parsedNum)) {
          errors.push({
            column: header,
            type: "numeric",
            message: `Expected metric number in '${header}', but got text.`,
          });
          errorTypes.numeric++;
          errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
        } else {
          // 7. Order Amount check (positive checking)
          if (amountCols.includes(header) && parsedNum < 0) {
            errors.push({
              column: header,
              type: "numeric",
              message: `Value in '${header}' cannot be negative (${val}).`,
            });
            errorTypes.numeric++;
            errorsPerColumn[header] = (errorsPerColumn[header] || 0) + 1;
          }
        }
      }
    });

    results.push({
      rowNum,
      status: errors.length === 0 ? "PASS" : "FAIL",
      errors,
      data: rawRow,
    });

    // Fire progress update once every 100 rows to keep UI extremely responsive
    if (onProgress && (i % 100 === 0 || i === totalRows - 1)) {
      onProgress(Math.min(100, Math.ceil((i / totalRows) * 100)));
    }
  }

  const passedCount = results.filter(r => r.status === "PASS").length;
  const failedCount = totalRows - passedCount;
  const passRate = totalRows > 0 ? Number(((passedCount / totalRows) * 100).toFixed(1)) : 0;

  return {
    results,
    summary: {
      total: totalRows,
      passed: passedCount,
      failed: failedCount,
      passRate,
      errorTypes,
      errorsPerColumn,
    },
  };
}

// Simple statistics tracker for export summaries
export function calculateNumericStats(
  headers: string[],
  rows: Record<string, string>[]
): NumericStats[] {
  const stats: NumericStats[] = [];

  headers.forEach(header => {
    let numericCount = 0;
    const values: number[] = [];

    rows.forEach(row => {
      const val = (row[header] || "").trim();
      if (val) {
        const num = Number(val);
        if (!isNaN(num)) {
          numericCount++;
          values.push(num);
        }
      }
    });

    // If at least 80% entries are numeric and there is some data
    if (values.length > 0 && (numericCount / rows.length) >= 0.5) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const totalSum = values.reduce((acc, curr) => acc + curr, 0);
      const avg = Number((totalSum / values.length).toFixed(2));

      stats.push({
        column: header,
        min,
        max,
        avg,
      });
    }
  });

  return stats;
}
