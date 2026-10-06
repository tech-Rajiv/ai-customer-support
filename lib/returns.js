// Return rules shared by the UI, the API and the agent. Pure functions, no server-only code.

export const RETURN_REASONS = [
  { value: "defective", label: "Product is defective or not working", defect: true },
  { value: "damaged", label: "Arrived damaged", defect: true },
  { value: "wrong_item", label: "Wrong item received", defect: true },
  { value: "not_as_described", label: "Not as described", defect: false },
  { value: "changed_mind", label: "No longer needed", defect: false },
  { value: "better_price", label: "Found a better price", defect: false },
];

export const reasonLabel = (value) => RETURN_REASONS.find((r) => r.value === value)?.label ?? value;

const DAY_MS = 24 * 60 * 60 * 1000;

// In-ear products (earphones) can only be returned for defect-type reasons.
export const hasDefectOnlyItems = (order) => order.items.some((i) => i.defect_only_return);

// order: { status, delivered_at, items: [{ return_days, defect_only_return }] }
// state: "not_delivered" | "eligible" | "expired" | "requested"
export function getReturnInfo(order, now = new Date()) {
  if (order.status === "return_requested") return { state: "requested" };
  if (order.status !== "delivered" || !order.delivered_at) return { state: "not_delivered" };

  const returnDays = Math.min(...order.items.map((i) => i.return_days));
  const deadline = new Date(new Date(order.delivered_at).getTime() + returnDays * DAY_MS);
  const daysLeft = Math.ceil((deadline - now) / DAY_MS);
  return {
    state: now <= deadline ? "eligible" : "expired",
    returnDays,
    deadline,
    daysLeft: Math.max(0, daysLeft),
    defectOnly: hasDefectOnlyItems(order),
  };
}
