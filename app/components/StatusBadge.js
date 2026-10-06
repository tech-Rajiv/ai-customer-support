import { STATUS_LABELS, STATUS_STYLES } from "@/lib/format";

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
