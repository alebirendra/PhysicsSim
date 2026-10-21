import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Physics Problem Parsing & Solver API
app.post("/api/solve-physics", async (req, res) => {
  try {
    const { problemText } = req.body;
    if (!problemText || typeof problemText !== "string" || !problemText.trim()) {
      return res.status(400).json({ error: "Physics problem text is required." });
    }

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Falling back to local physics engine.",
        isFallback: true,
      });
    }

    const systemPrompt = `You are an expert theoretical and computational physics engine for an educational simulation platform (PhysiCraft).
Your goal is to parse ANY physics problem into an exact, mathematically rigorous, interactive simulation specification.

Identify the primary domain among:
- "projectile" (ballistics, throwing, gravity + drag, 2D kinematics)
- "pendulum" (simple, damped, or driven pendulum)
- "spring" (mass-spring-damper oscillator, simple harmonic motion, resonance)
- "collision" (1D or 2D momentum, elastic, inelastic, impulse)
- "circuit" (RLC, RC, RL, LC alternating or direct current)
- "incline" (inclined plane, ramps, static/kinetic friction, sliding blocks)
- "orbital" (celestial gravity, satellites, planetary orbits)

Extract all variables as adjustable parameters with reasonable min, max, step, and current values parsed or inferred from the problem.
Generate the governing physical equations in standard LaTeX notation with clear physical descriptions.
Produce step-by-step mathematical calculations resolving the problem's questions.
Generate predicted measurements that will be tested live in the numerical simulation.
Provide 2 conceptual "what if" questions for students to experiment with.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Parse this physics problem into simulation parameters and mathematical solution:\n\n"${problemText}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Concise descriptive title of the physical scenario" },
            systemType: {
              type: Type.STRING,
              description: "One of: projectile, pendulum, spring, collision, circuit, incline, orbital",
            },
            summary: { type: Type.STRING, description: "A clear physics overview of what is happening" },
            targetGoal: { type: Type.STRING, description: "What the problem is asking to find or calculate" },
            parameters: {
              type: Type.ARRAY,
              description: "Extracted physical parameters for interactive sliders",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "variable identifier like m, v0, theta, k, R, etc." },
                  name: { type: Type.STRING, description: "Human friendly label e.g. Initial Velocity" },
                  symbol: { type: Type.STRING, description: "Symbol e.g. v_0, \\theta, m_1" },
                  value: { type: Type.NUMBER, description: "Extracted or default numeric value" },
                  min: { type: Type.NUMBER, description: "Sensible minimum for slider" },
                  max: { type: Type.NUMBER, description: "Sensible maximum for slider" },
                  step: { type: Type.NUMBER, description: "Slider step" },
                  unit: { type: Type.STRING, description: "Physical unit e.g. m/s, kg, deg, N/m, Ohm, H, uF" },
                  description: { type: Type.STRING, description: "Physical meaning of this parameter" },
                },
                required: ["id", "name", "symbol", "value", "min", "max", "step", "unit"],
              },
            },
            governingEquations: {
              type: Type.ARRAY,
              description: "Core physical laws and governing differential or algebraic equations",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING, description: "Name of the equation (e.g. Newton's Second Law, Trajectory Equation)" },
                  latex: { type: Type.STRING, description: "LaTeX formula without dollar signs" },
                  explanation: { type: Type.STRING, description: "Why this equation applies to this system" },
                  evaluatesTo: { type: Type.STRING, description: "Symbolic or numerical evaluation formula" },
                },
                required: ["id", "label", "latex", "explanation"],
              },
            },
            stepByStepSolution: {
              type: Type.ARRAY,
              description: "Step-by-step mathematical derivation for student understanding",
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  formula: { type: Type.STRING, description: "Formula in LaTeX or math text" },
                  calculation: { type: Type.STRING, description: "Substitute values and arithmetic" },
                  explanation: { type: Type.STRING, description: "Conceptual intuition" },
                },
                required: ["stepNumber", "title", "formula", "calculation", "explanation"],
              },
            },
            predictedMeasurements: {
              type: Type.ARRAY,
              description: "Key numerical predictions that should match the simulation",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING, description: "e.g. Maximum Height, Time of Flight, Range, Resonance Freq" },
                  symbol: { type: Type.STRING },
                  value: { type: Type.NUMBER, description: "Calculated numeric value" },
                  formattedValue: { type: Type.STRING, description: "e.g. 24.32 m" },
                  unit: { type: Type.STRING },
                  formula: { type: Type.STRING, description: "LaTeX formula for this measurement" },
                  status: { type: Type.STRING, description: "target or calculated" },
                },
                required: ["id", "label", "symbol", "value", "formattedValue", "unit"],
              },
            },
            conceptualQuestions: {
              type: Type.ARRAY,
              description: "2-3 interactive conceptual questions for students",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  answerExplanation: { type: Type.STRING },
                },
                required: ["question", "hint", "answerExplanation"],
              },
            },
          },
          required: [
            "title",
            "systemType",
            "summary",
            "parameters",
            "governingEquations",
            "stepByStepSolution",
            "predictedMeasurements",
          ],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    return res.json(parsedJson);
  } catch (error: any) {
    console.error("Gemini physics solver error:", error);
    return res.status(500).json({
      error: error.message || "Failed to parse physics problem with AI.",
      isFallback: true,
    });
  }
});

// Vite middleware for development or static build in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PhysiCraft simulation engine server running on port ${PORT}`);
  });
}

startServer();
