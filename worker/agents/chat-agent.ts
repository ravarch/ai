import { Agent, callable } from "agents";

export type Message = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: string;
};

export type ChatAgentState = {
    messages: Message[];
}

export class ChatAgent extends Agent<Env, ChatAgentState> {
    initialState: ChatAgentState = {
        messages: []
    }

    /**
     * Appends a message to the persistent log.
     */
    @callable()
    async addMessage(message: Message) {
        this.setState({
            messages: [...this.state.messages, { ...message, createdAt: new Date().toISOString() }]
        });
    }

    /**
     * Returns the full conversation history.
     */
    @callable()
    async getHistory() {
        return this.state.messages;
    }

    /**
     * Clears history for a fresh start.
     */
    @callable()
    async clearHistory() {
        this.setState({ messages: [] });
    }
}
