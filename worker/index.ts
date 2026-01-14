import { Hono } from "hono";
import { ChatAgent } from "./agents/chat-agent";
import { agentsMiddleware } from "hono-agents";
import { streamText, convertToCoreMessages, Message as VercelMessage } from "ai";
import { createWorkersAI } from "workers-ai-provider";

export { ChatAgent };

const app = new Hono<{ Bindings: Env }>();

app.post("/api/chat", async (c) => {
  const { messages, agentId } = await c.req.json<{ messages: VercelMessage[], agentId?: string }>();
  
  // 1. Connect to the specific Agent instance (Session)
  // In a real app, agentId would be the user's session ID
  const chatAgentStub = c.env.ChatAgent.get(
    c.env.ChatAgent.idFromName(agentId || "global-session")
  );

  // 2. Save the incoming user message to the Agent's state
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg?.role === "user") {
    await chatAgentStub.addMessage({
        id: lastUserMsg.id,
        role: "user",
        content: lastUserMsg.content
    });
  }

  // 3. Configure Workers AI Provider
  const workersai = createWorkersAI({
    binding: c.env.AI,
  });

  // 4. Stream response using Llama 3
  const result = streamText({
    model: workersai("@cf/meta/llama-3-8b-instruct"),
    messages: convertToCoreMessages(messages),
    onFinish: async (event) => {
        // 5. Save the AI's response to the Agent's state
        await chatAgentStub.addMessage({
            id: event.response.id ?? crypto.randomUUID(),
            role: "assistant",
            content: event.text,
        });
    },
  });

  return result.toDataStreamResponse();
});

// Middleware for direct Agent access (if needed)
app.use("*", agentsMiddleware());

export default app;
