// ShifaHub Agent Registry
// Tum ajanlar burada register edilir

import { authAgent } from "./auth-agent.js";
import { bookingAgent } from "./booking-agent.js";
import { clinicalAgent } from "./clinical-agent.js";
import { notificationAgent } from "./notification-agent.js";
import { calendarAgent } from "./calendar-agent.js";
import { complianceAgent } from "./compliance-agent.js";
import { emergencyAgent } from "./emergency-agent.js";
import type { BaseAgent } from "./base-agent.js";

// Agent Registry
export const agents: Record<string, BaseAgent> = {
  auth: authAgent,
  booking: bookingAgent,
  clinical: clinicalAgent,
  notification: notificationAgent,
  calendar: calendarAgent,
  compliance: complianceAgent,
  emergency: emergencyAgent,
  // Faz 3:
  // media: mediaAgent,
  // knowledge: knowledgeAgent,
  // whatsapp: whatsappAgent,
  // telegram: telegramAgent,
  // inventory: inventoryAgent,
  // finance: financeAgent,
  // analytics: analyticsAgent,
};

// Agent'a event gonder
export async function dispatchEvent(agentName: string, event: { type: string; payload: Record<string, unknown> }) {
  const agent = agents[agentName];
  if (!agent) {
    console.warn(`Agent not found: ${agentName}`);
    return;
  }

  await agent.handle({
    ...event,
    timestamp: new Date(),
    source: "dispatcher",
  });
}

// Export individual agents
export { authAgent, bookingAgent, clinicalAgent, notificationAgent, calendarAgent, complianceAgent, emergencyAgent };
