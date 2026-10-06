import "server-only";
import { ChatGroq } from "@langchain/groq";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { SYSTEM_PROMPT } from "@/lib/agent/prompt";
import { getMyOrdersTool } from "@/lib/agent/tools/getMyOrders";
import { searchKnowledgeTool } from "@/lib/agent/tools/searchKnowledge";
import { searchProductsTool } from "@/lib/agent/tools/searchProducts";

// Register new tools here (cancelOrder, createSupportTicket, ...).
export const tools = [searchProductsTool, searchKnowledgeTool, getMyOrdersTool];

const MAX_TOOL_ROUNDS = 2;

let compiled;

// Flow:  START -> agent (LLM) -> [tool call?] -> tools -> agent -> ... -> END
export function getAgent() {
  if (compiled) return compiled;

  const llm = new ChatGroq({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    temperature: 0.2,
    // gpt-oss models "think" before answering; low effort keeps replies fast and saves
    // tokens on Groq's free-tier per-minute limit.
    reasoningEffort: "low",
  });
  const modelWithTools = llm.bindTools(tools);

  async function callModel(state) {
    // Tool rounds since the customer's latest message. After MAX_TOOL_ROUNDS, stop
    // offering tools so the model must answer with what it already has.
    const lastHuman = state.messages.findLastIndex((m) => m.type === "human");
    const toolRounds = state.messages.slice(lastHuman).filter((m) => m.type === "tool").length;
    const messages = [new SystemMessage(SYSTEM_PROMPT), ...state.messages];

    if (toolRounds >= MAX_TOOL_ROUNDS) {
      const response = await llm.invoke([
        ...messages,
        new HumanMessage("(System note: do not search again. Answer the customer now using the results you already have.)"),
      ]);
      return { messages: [response] };
    }
    return { messages: [await modelWithTools.invoke(messages)] };
  }

  compiled = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", new ToolNode(tools))
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolsCondition, { tools: "tools", [END]: END })
    .addEdge("tools", "agent")
    .compile();

  return compiled;
}
