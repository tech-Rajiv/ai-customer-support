// Cancellation rules from knowledge/cancellation-policy.txt. Pure functions.

const BEFORE_SHIPPING = ["pending", "confirmed", "processing"];
const DELAY_WAIT_BUSINESS_DAYS = 3;

export const REFUND_BEFORE_SHIPPING =
  "The refund starts immediately and appears in your account within 3 to 5 business days.";
export const REFUND_DELAYED =
  "The refund of the full amount (including shipping) starts once the carrier confirms the package is recalled, at the latest after 10 business days, and then appears within 3 to 5 business days.";

const isWeekday = (d) => d.getDay() !== 0 && d.getDay() !== 6;
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Weekdays (Mon-Fri) after `from`, up to and including `to`.
export function businessDaysBetween(from, to) {
  let count = 0;
  const end = startOfDay(to);
  for (let d = startOfDay(from); ; ) {
    d.setDate(d.getDate() + 1);
    if (d > end) break;
    if (isWeekday(d)) count++;
  }
  return count;
}

export function addBusinessDays(from, n) {
  const d = startOfDay(from);
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (isWeekday(d)) n--;
  }
  return d;
}

// state: "allowed" | "wait" | "not_allowed"
export function getCancellationInfo(order, now = new Date()) {
  const { status } = order;
  if (BEFORE_SHIPPING.includes(status)) {
    return { state: "allowed", refund: REFUND_BEFORE_SHIPPING };
  }
  if (status === "delayed") {
    const late = businessDaysBetween(order.expected_delivery, now);
    if (late > DELAY_WAIT_BUSINESS_DAYS) {
      return { state: "allowed", delayed: true, businessDaysLate: late, refund: REFUND_DELAYED };
    }
    return {
      state: "wait",
      businessDaysLate: late,
      cancellableAfter: addBusinessDays(order.expected_delivery, DELAY_WAIT_BUSINESS_DAYS + 1),
      reason:
        "The order is delayed by 3 business days or less. Most delayed packages arrive within that time, so the policy recommends waiting. If it still hasn't arrived after the date below, it can be cancelled.",
    };
  }
  const reasons = {
    shipped: "Shipped orders can't be cancelled. The customer can refuse delivery, or return the product within the return window after delivery.",
    out_for_delivery: "The order is already out for delivery and can't be recalled.",
    delivered: "Delivered orders can't be cancelled. The customer can return the product while the return window is open.",
    cancelled: "This order is already cancelled.",
    return_requested: "A return has already been requested for this order.",
  };
  return { state: "not_allowed", reason: reasons[status] ?? "This order can't be cancelled." };
}
