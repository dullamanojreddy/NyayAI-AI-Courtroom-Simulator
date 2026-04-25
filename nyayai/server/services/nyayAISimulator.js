const { GoogleGenerativeAI } = require('@google/generative-ai');

let currentApiIndex = 0;

class NyayAISimulator {
    constructor(apiKeys) {
        this.apiKeys = apiKeys;
        if (currentApiIndex >= this.apiKeys.length) {
            currentApiIndex = 0;
        }
        this.genAI = new GoogleGenerativeAI(this.apiKeys[currentApiIndex]);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    }

    rotateKey() {
        if (this.apiKeys.length > 0) {
            currentApiIndex = (currentApiIndex + 1) % this.apiKeys.length;
            this.genAI = new GoogleGenerativeAI(this.apiKeys[currentApiIndex]);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
            console.log(`Switched to API Key ${currentApiIndex + 1}`);
        }
    }

    async simulateCourtroom(caseDetails) {
        const systemPrompt = `You are NyayAI, a highly intelligent virtual courtroom AI assistant. Simulate a realistic legal case in India. Follow these rules strictly:

1. Structure:
   - Left side: User responses (evidence, statements, or "No valid answer available" if missing).
   - Right side: Opponent AI counter questions — challenging, probing, and covering all legal angles.
   - Simulate at least 10–15 rounds for comprehensive cases.
   - Each round should follow a question/answer format.

2. User answers:
   - Reference **realistic evidence** (dates, witnesses, bank statements, transaction receipts, WhatsApp messages, alibis, contracts, digital evidence).
   - If proof is missing, respond with "No valid answer available".
   - Keep answers clear, concise, and in bullet points.

3. Opponent counter questions:
   - Force user to admit gaps.
   - Cover all legal angles: IPC sections, intent, contradictions, prior disputes, witnesses, digital proof, financial loss, and procedural compliance.
   - Avoid simple or repetitive questions.

4. Verdict Calculation:
   - At the end, provide:
     - Winner (User vs Opponent)
     - Chance of Winning (percentage)
     - Reasoning
     - IPC / legal sections favorable to user
     - IPC / legal sections or laws against user
     - Detailed suggestions to improve the case (what documents, witnesses, or evidence to add).

5. Transcript:
   - Show **all rounds clearly** with Q1/A1 … Q15/A15 format.
   - Include **final verdict summary**, strengths, weaknesses, and actionable suggestions.

6. Style:
   - Professional and formal courtroom language.
   - Avoid repetition and generic responses.
   - Answers must vary per round and be realistic, even if some gaps exist.

7. Input:
   - Case Details (bullet points):
     - Allegation
     - Alibi / defenses
     - Evidence available (screenshots, bank statements, messages, witnesses)
     - Dates, times, and locations
   - Use these details to generate the simulation.

8. Output:
   - Provide **full courtroom transcript**.
   - Provide **verdict summary with actionable suggestions**.
   - Clearly identify where gaps exist in evidence.`;

        const userPrompt = `Case Details:\n${caseDetails.map(detail => `- ${detail}`).join('\n')}`;

        let attempts = 0;
        const maxAttempts = this.apiKeys ? this.apiKeys.length : 1;

        while (attempts < maxAttempts) {
            try {
                const result = await this.model.generateContent([systemPrompt, userPrompt]);
                return result.response.text();
            } catch (error) {
                console.error(`Gemini Simulator Error (Key Index ${currentApiIndex}):`, error.message);
                if (error.status === 429 || error.message.includes('429') || error.message.includes('503') || error.message.includes('quota') || error.message.includes('limit') || error.message.includes('API key')) {
                    this.rotateKey();
                    attempts++;
                } else {
                    throw new Error(`Simulation failed: ${error.message}`);
                }
            }
        }
        throw new Error('Simulation failed: All API keys have exceeded their quota or limits.');
    }
}

module.exports = NyayAISimulator;