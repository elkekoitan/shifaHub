import pino from "pino";
const logger = pino({ level: "info" });

export interface AgentEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  source: string;
}

export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly description: string;

  protected log = logger.child({ agent: this.constructor.name });

  abstract handle(event: AgentEvent): Promise<void>;

  protected emit(type: string, payload: Record<string, unknown>): AgentEvent {
    const event: AgentEvent = {
      type,
      payload,
      timestamp: new Date(),
      source: this.name,
    };
    this.log.info({ event: type }, `Event emitted: ${type}`);
    return event;
  }

  protected logAction(action: string, details?: Record<string, unknown>) {
    this.log.info({ action, ...details }, `[${this.name}] ${action}`);
  }
}
