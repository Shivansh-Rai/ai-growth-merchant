/** "batteryLifeHours" → "Battery life hours". Specs keys are camelCase (spec registry). */
function labelFor(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function valueFor(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function SpecList({ specs }: { specs: Record<string, string | number | boolean> }) {
  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <dl className="divide-y divide-line rounded-lg border border-line bg-canvas">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm">
          <dt className="text-ink-muted">{labelFor(key)}</dt>
          <dd className="font-medium text-navy">{valueFor(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
