import { useState } from "react";
import { Plus, Search, RotateCcw, ChevronUp, ChevronDown, List } from "lucide-react";
import mockProcesses from "@/data/mockProcesses.json";

const processTypes = ["-ללא-", "ניוד רגיל", "ניוד מהיר"];
const statuses = ["-ללא-", "בתהליך", "הושלם", "נדחה", "ממתין"];
const stages = ["-ללא-", "קליטה", "אימות", "בדיקה", "סיום"];
const numberFilters = ["-ללא-", "מתחיל ב", "מכיל", "שווה ל"];
const operatorFilters = ["-ללא-", "הוט מובייל", "פרטנר", "סלקום", "פלאפון", "גולן טלקום"];
const networkFilters = ["-ללא-", "הוט מובייל", "פרטנר", "סלקום", "פלאפון", "גולן טלקום"];
const profileFilters = ["-ללא-", "פרופיל A", "פרופיל B", "פרופיל C"];

type Process = typeof mockProcesses[number];

const statusColor: Record<string, string> = {
  "בתהליך": "bg-amber-100 text-amber-800",
  "הושלם": "bg-emerald-100 text-emerald-800",
  "נדחה": "bg-red-100 text-red-800",
  "ממתין": "bg-blue-100 text-blue-800",
};

export default function ProcessManagement() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [results, setResults] = useState<Process[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setResults(mockProcesses);
    setSearched(true);
  };

  const handleReset = () => {
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <List size={20} className="text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">ניהול תהליכים</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
          <Plus size={16} className="text-primary" />
          <span>הוסף חדש</span>
        </button>
      </div>

      {/* Filter card */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-6">
        {/* Filter header */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-primary font-semibold text-sm hover:bg-accent/50 transition-colors rounded-t-xl"
        >
          <span>סינון נוכחי</span>
          {filterOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {filterOpen && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              {/* Row 1 */}
              <FormField label="מזהה בקשה" type="text" />
              <FormField label="סנן לפי מספר" type="select" options={numberFilters} />
              <div />

              {/* Row 2 */}
              <FormField label="מספר קבוצה" type="text" />
              <FormField label="סינון לפי מפעיל" type="select" options={operatorFilters} />
              <div />

              {/* Row 3 */}
              <FormField label="מזהה לקוח" type="text" />
              <FormField label="סינון לפי רשת" type="select" options={networkFilters} />
              <div />

              {/* Row 4 */}
              <FormField label="מתאריך" type="datetime" />
              <FormField label="סוג תהליך" type="select" options={processTypes} />
              <div />

              {/* Row 5 */}
              <FormField label="עד תאריך" type="datetime" />
              <FormField label="סינון לפי מצב" type="select" options={statuses} />
              <div />

              {/* Row 6 */}
              <FormField label="מספר מוביל - מפעיל נותש" type="text" />
              <FormField label="סינון לפי שלב" type="select" options={stages} />
              <div />

              {/* Row 7 */}
              <FormField label="מספר מוביל - מפעיל קולט" type="text" />
              <FormField label="סינון לפי פרופיל לקוח" type="select" options={profileFilters} />
              <div />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border justify-start">
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                <Search size={16} />
                <span>בצע חיפוש</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <RotateCcw size={16} />
                <span>איפוס</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results table */}
      {searched && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              תוצאות ({results.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מזהה</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מספר קבוצה</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מספר טלפון</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מפעיל מקור</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מפעיל יעד</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">סוג</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מצב</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">שלב</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {results.map((proc) => (
                  <tr key={proc.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{proc.id}</td>
                    <td className="px-4 py-3">{proc.groupNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{proc.mobileNumber}</td>
                    <td className="px-4 py-3">{proc.sourceOperator}</td>
                    <td className="px-4 py-3">{proc.targetOperator}</td>
                    <td className="px-4 py-3">{proc.processType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[proc.status] || "bg-muted text-muted-foreground"}`}>
                        {proc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{proc.stage}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(proc.date).toLocaleDateString("he-IL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  type,
  options,
}: {
  label: string;
  type: "text" | "select" | "datetime";
  options?: string[];
}) {
  if (type === "select" && options) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm text-foreground font-medium whitespace-nowrap min-w-[140px] text-right">
          {label}
        </label>
        <select className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow">
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "datetime") {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm text-foreground font-medium whitespace-nowrap min-w-[140px] text-right">
          {label}
        </label>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="date"
            defaultValue="2026-03-11"
            className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
          />
          <span className="text-sm text-muted-foreground">שעה:</span>
          <select className="w-16 h-10 px-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
            ))}
          </select>
          <select className="w-16 h-10 px-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
            {[0, 15, 30, 45, 59].map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-foreground font-medium whitespace-nowrap min-w-[140px] text-right">
        {label}
      </label>
      <input
        type="text"
        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow placeholder:text-muted-foreground"
      />
    </div>
  );
}
