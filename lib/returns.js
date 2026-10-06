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

// Single source of truth for "can this order be returned for this reason?". Used by the
// return API and by the agent's return tool. { ok: true } or { ok: false, error, status }.
export function validateReturn(order, reason) {
  const reasonInfo = RETURN_REASONS.find((r) => r.value === reason);
  if (!reasonInfo) return { ok: false, status: 400, error: "Please choose a reason for the return." };

  const info = getReturnInfo(order);
  if (info.state === "requested") return { ok: false, status: 409, error: "A return has already been requested for this order." };
  if (info.state === "not_delivered") return { ok: false, status: 409, error: "Only delivered orders can be returned." };
  if (info.state === "expired") {
    return { ok: false, status: 409, error: `The ${info.returnDays}-day return window for this order has closed.` };
  }
  if (info.defectOnly && !reasonInfo.defect) {
    return {
      ok: false,
      status: 422,
      error: "In-ear products can only be returned if they are defective, damaged or the wrong item.",
    };
  }
  return { ok: true, info };
}
