export type ChatRole = "user" | "agent";
export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  at: string;
}

export const INITIAL_THREAD: ChatMessage[] = [
  { id: "m1", role: "agent", text: "Hi! I'm Maya, your Rapidual driver. Just picked up your laundry — it'll be ready soon!", at: "4:02 PM" },
  { id: "m2", role: "agent", text: "I've checked your order status. Everything looks good!", at: "4:03 PM" },
];

export const QUICK_REPLIES = [
  "How long until pickup?",
  "I'm ready for pickup",
  "I need to change my address",
  "Issue with my laundry",
  "Billing question",
];

export function cannedReply(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("how long") || m.includes("pickup")) return "I'll be there in about 5 minutes for pickup!";
  if (m.includes("ready")) return "Thanks for the message! I'm on my way.";
  if (m.includes("address")) return "No problem — tap your order to update the address and I'll reroute.";
  if (m.includes("issue") || m.includes("laundry")) return "I understand your concern. Let me help you with that.";
  if (m.includes("billing")) return "Happy to help with billing. Is there anything else I can help you with?";
  return "Got it! Is there anything else I can help you with?";
}
