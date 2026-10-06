// Human-in-the-loop: actions listed here are never performed by the agent on its own.
// The tool only checks the rules and returns a proposal; the chat shows a confirmation card
// and the customer's click calls the real API.
//
// To let Zee perform an action immediately, remove it from this array.
export const HITL_ACTIONS = ["cancel_order", "return_order"];

export const needsConfirmation = (action) => HITL_ACTIONS.includes(action);
