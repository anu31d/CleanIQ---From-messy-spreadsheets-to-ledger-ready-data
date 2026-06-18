import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API router for Gemini Chat & Auto-Fixes
  app.post("/api/chat", async (req: any, res: any) => {
    try {
      const { userQuestion, validationContext, promptType, customApiKey } = req.body;
      
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        res.status(400).json({ 
          error: "Your Gemini API Key is not configured. Please add GEMINI_API_KEY in the Secrets panel or provide a valid override key in the Input box on the upper right of this tab." 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemContext = "";
      let userPromptInput = "";

      if (promptType === "autofix") {
        systemContext = `You are a professional transactional data analyst. 
You are given the first 5 failing rows of a dataset. Your task is to suggest precise corrections/fixes for each row.
For each row, provide:
1. Row number, what errors/failing fields were found.
2. The specific corrected fields (such as phone numbers formatted with correct length, valid dates, fixed spelling/emails, or non-empty placeholders).
3. A brief explanation of what was corrected.

Format your response in a very clean, structured, and elegant Markdown list. Make it easy to read.`;

        userPromptInput = `Here are the top failing rows:
${JSON.stringify(validationContext.failedSamples ? validationContext.failedSamples.slice(0, 5) : [], null, 2)}

Provide clear correction suggestions for these rows or as many as available.`;
      } else {
        systemContext = `You are a data quality analyst assistant. 
You have access to the following validation results for a transaction dataset:
- Total rows processed: ${validationContext.total || 0}
- Passed rows: ${validationContext.passed || 0}
- Failed rows with errors: ${validationContext.failed || 0}
- Error types breakdown: ${JSON.stringify(validationContext.errorTypes || {})}
- Sample failed rows (first 10): ${JSON.stringify(validationContext.failedSamples ? validationContext.failedSamples.slice(0, 10) : [])}

Answer the user's question about this data concisely, professionally, and helpfully.
Use elegant Markdown with clear headings or bullet points where appropriate. Keep explanations clear.`;

        userPromptInput = userQuestion;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: systemContext + "\n\nUser Request: " + userPromptInput,
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: err.message || "Internal server error during chat processing." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
