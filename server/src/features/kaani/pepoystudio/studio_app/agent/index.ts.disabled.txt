import { Audience, Dialect, FlowType } from "../types";
import { KaAniAgent } from "./KaAniAgent";

/**
 * Factory/helper to create a default KaAni agent instance.
 * You can create multiple agents with different configurations if needed.
 */
export function createDefaultKaAniAgent() {
  return new KaAniAgent(
    Audience.Farmer,   // default: farmer-facing advice
    Dialect.Tagalog,   // default dialect
    "chat" as FlowType,
    false              // isCondensed = false (full explanations)
  );
}

export { KaAniAgent };
