# Implementation Plan: Claude Code Integration & Agent Enhancement

This plan outlines how to integrate the state-of-the-art agentic capabilities from the `claude-code` project into the **TukTuk Platform** (Professor Witthaya AI).

## Objectives
1.  **Local Development**: Enable the use of Claude Code CLI within the `caculateapp` project for automated coding and debugging.
2.  **Agentic Upgrade**: Re-implement the Professor Witthaya assistant (currently a simple RAG) as a fully autonomous **Agent** capable of using specialized tools.
3.  **Local Knowledge Link**: Connect the injection molding knowledge base directly to the agent's tools.

---

## Phase 1: Environment & CLI Setup (Completed ✅)
- [x] **Fix CLI Path**: Corrected `package.json` to point to the actual `D:\claude-code` directory.
- [x] **Project Identity**: Created `CLAUDE.md` to identify the project structure and tech stack for the agent.
- [ ] **Dependency Sync**: Run `bun install` in `D:\claude-code` to ensure the reverse-engineered tool is ready to run.

## Phase 2: Building the "Professor Witthaya" Agent (Proposed)
The current assistant in `functions/index.js` is a "talker". We will make it a "doer".

### 2.1 Tool Definitions
We will create a series of tools (functions) that the AI can call.
- **`search_knowledge_base`**: Search through the Firestore injection molding documents.
- **`calculate_cooling_time`**: Calculate parameters based on thickness, material, and temperature.
- **`analyze_mold_defect`**: Use Gemini Vision to identify issues from user-uploaded photos.
- **`get_machine_specs`**: Retrieve technical data for specific injection machines (e.g. Engel, Nissei).

### 2.2 The Agent Loop (`functions/agent.js`)
Implement a loop similar to `claude-code/src/query.ts`:
1.  **Input**: User prompt.
2.  **Model Call**: Call Gemini with `tools` property.
3.  **Tool Check**: If the model wants to call a tool, execute the JS function.
4.  **Observation**: Send the tool results back to Gemini.
5.  **Final Response**: Return the final answer to the user once the task is complete.

## Phase 3: Gemini Integration in Claude Code (Optional)
If you wish to use your current Gemini API keys directly in the CLI:
- Create `D:\claude-code\src\services\api\gemini.ts`.
- Port the `queryModel` logic to use the Google Generative AI SDK instead of Anthropic SDK.

---

## Next Steps
1.  **Deploy Agent Foundation**: Create the first "Tool" for Professor Witthaya.
2.  **Update UI**: Modify `chat-app.js` to handle tool-call status updates (e.g., "AI is searching knowledge base...").
3.  **Verification**: Test the `bun run dev` command to see if the CLI agent can help with code changes.

> [!IMPORTANT]
> To use the CLI, ensure you have **Bun** installed on your system. You can run `npm run dev` to start the assistant.
