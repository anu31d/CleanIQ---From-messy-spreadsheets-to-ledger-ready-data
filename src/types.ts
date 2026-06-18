export interface CountryRule {
  country: string;
  digits: number;
}

export interface ValidationError {
  column: string;
  type: "phone" | "date" | "missing" | "format" | "numeric" | "duplicate" | "other";
  message: string;
}

export interface RowResult {
  rowNum: number;
  status: "PASS" | "FAIL";
  errors: ValidationError[];
  data: Record<string, any>;
}

export interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  errorTypes: {
    phone: number;
    date: number;
    missing: number;
    format: number;
    numeric: number;
    duplicate: number;
    other: number;
  };
  errorsPerColumn: Record<string, number>;
}

export interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface NumericStats {
  column: string;
  min: number;
  max: number;
  avg: number;
}
