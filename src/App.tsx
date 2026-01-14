import { useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { useAgent } from "agents/react";
import type { ChatAgent, ChatAgentState } from "../worker/agents/chat-agent";

export default function App() {
  // 1. Vercel AI SDK handles the streaming UI
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    body: { agentId: "global-session" }, // Pass context to the server
  });

  // 2. Cloudflare Agent SDK handles initial state synchronization
  const agent = useAgent<ChatAgent, ChatAgentState>({
    agent: "chat-agent",
    name: "global-session", 
    onStateUpdate(state) {
      // If UI is empty but Agent has history (e.g., refresh), restore it
      if (messages.length === 0 && state.messages.length > 0) {
        setMessages(state.messages.map(m => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content
        })));
      }
    }
  });

  // Auto-scroll logic
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100 font-sans">
      <header className="border-b border-gray-800 bg-gray-900/50 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="flex items-center gap-2 font-bold text-orange-500">
            <span className="text-xl">⚡</span> Cloudflare AI
          </h1>
          <button 
            onClick={() => { agent.stub.clearHistory(); setMessages([]); }}
            className="rounded px-3 py-1 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Clear History
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-20">
          {messages.length === 0 && (
            <div className="mt-20 text-center text-gray-500">
              <p>Powered by Workers AI & Durable Objects</p>
            </div>
          )}
          
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                m.role === 'user' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-800 text-gray-200'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="animate-pulse rounded-2xl bg-gray-800 px-4 py-2 text-gray-400">
                AI is thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="border-t border-gray-800 bg-gray-900 p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="relative">
            <input
              className="w-full rounded-full border border-gray-700 bg-gray-950 px-4 py-3 pr-12 text-sm focus:border-orange-500 focus:outline-none"
              value={input}
              placeholder="Ask anything..."
              onChange={handleInputChange}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-2 rounded-full bg-orange-600 p-1.5 text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
