import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON body parsing, increased limit for images
  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for secondary QC using Gemini
  app.post("/api/gemini/qc", async (req, res) => {
    try {
      const { image, mode } = req.body; // image should be base64 string
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Remove data:image/png;base64, prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      let prompt = "";
      if (mode === "YPD") {
        prompt = `
You are a microbiology QC assistant analyzing a YPD agar plate image.
Please assess the image for general quality and provide a presumptive classification of the microbial colonies seen.
On YPD, we are primarily looking for yeast-like colonies. 
Yeast colonies are typically cream, ivory, or pale yellow, opaque, and convex.

Provide an analysis including:
1. Is the image quality acceptable? (Focus, lighting, reflection, condensation, overlapping colonies)
2. Are there any obvious issues with the plate?
3. General observation of the colonies.
Do NOT attempt to determine the exact microbial species.
Respond in Korean.
`;
      } else {
        prompt = `
You are a microbiology QC assistant analyzing a MRS (dyed blue) agar plate image.
Please assess the image for general quality and provide a presumptive classification of the microbial colonies seen.
On MRS blue agar, we are looking for:
- Lactobacillus-like colonies
- Bacillus-like colonies
- Uncertain colonies

Provide an analysis including:
1. Is the image quality acceptable? (Focus, lighting, reflection, condensation, overlapping colonies, uneven blue dye)
2. Are there any obvious issues with the plate?
3. General observation of the colonies.
Do NOT attempt to determine the exact microbial species.
Respond in Korean.
`;
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: "image/jpeg",
                },
              },
              {
                text: prompt,
              },
            ],
          },
        });
      } catch (genError: any) {
        console.warn("Gemini API generation failed:", genError.message);
        return res.json({ analysis: "AI 품질 검증 서버 트래픽이 초과되었거나 응답할 수 없습니다. 수동으로 품질을 확인해주세요." });
      }

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
