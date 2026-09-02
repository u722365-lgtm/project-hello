# ShadowTalk AI

**The AI workspace that doesn't just answer—it acts.**

ShadowTalk is an elite, minimal agentic AI workspace focused entirely on doing three things exceptionally well: background automation, deep contextual reasoning, and hyper-personalized execution. Powered by the proprietary **Turbo Engine** (intelligently routing between OpenAI GPT-4o and Groq), ShadowTalk is designed for users who want a distraction-free, powerful AI that gets things done.

**[Launch workspace →](https://shadowtalk-ai-7a513.web.app/chatbot)** · **[Marketing site](https://shadowtalk-ai-7a513.web.app/home)**

---

## What is ShadowTalk?

Unlike bloated AI platforms with dozens of confusing hubs and marketplaces, ShadowTalk focuses on the "Big Three" autonomous capabilities:

1. **Shadow DreamState**: Autonomous background processing. While you are away, your AI continues to work—researching, monitoring data, and synthesizing reports for when you return.
2. **Shadow Omniscience**: Total contextual awareness. An AI that connects the dots across all your uploaded documents, past conversations, and data silos to give you answers based on *your* reality.
3. **Shadow Twin**: Your digital clone. An AI fine-tuned to your exact writing style, logic, and operational preferences that can act on your behalf.

### The Turbo Engine Architecture

Under the hood, ShadowTalk uses a proprietary routing engine to optimize for speed and intelligence:
- **Low Complexity Tasks**: Routed to Groq (Llama-3) for blazing fast, low-latency chat.
- **High Complexity Tasks**: Seamlessly routed to OpenAI (GPT-4o) for deep reasoning, complex coding, and strategic analysis.

---

## How to use it

1. **Launch the app**: Navigate to [shadowtalk-ai-7a513.web.app/chatbot](https://shadowtalk-ai-7a513.web.app/chatbot).
2. **Authenticate**: Sign in via the `/auth` page to ensure your history and sessions are saved.
3. **Chat**: Use the main composer to ask questions or trigger tasks. The Turbo Engine will automatically route your request to the best model.
4. **Leverage the Big Three**:
   - Ask the AI to run a long-term research task to trigger **DreamState**.
   - Upload documents and ask complex synthesized questions to leverage **Omniscience**.
   - Ask the AI to write an email or document in your exact tone to utilize your **Twin**.

---

## For Developers

To run ShadowTalk locally:

```bash
git clone https://github.com/u722365-lgtm/project-hello.git
cd project-hello
npm install
npm run dev
```

### Environment Variables

You must supply your API keys in a `.env` file at the root of the project to utilize the Turbo Engine:

```env
VITE_GROQ_API_KEY="your_groq_api_key"
VITE_OPENAI_API_KEY="your_openai_api_key"
```

Open [http://localhost:5173](http://localhost:5173) to see the app running locally.

---

*Note: ShadowTalk recently underwent a massive architecture pivot (v3.0.0) to strip away 40+ legacy pages and focus exclusively on the core agentic features described above.*
