// ================= CONFIG =================
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent";

const API_KEY = "AIzaSyDZfvvZmdE7ozwBwAmQApNXsWyrpPe--4M";

// ================= CORE FUNCTION =================
async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error("Gemini API error: " + errText);
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Raw Gemini Output:", text);
    throw new Error("Invalid JSON returned by Gemini");
  }
}

// ================= ROADMAP =================
export async function generateRoadmap({
  jobRole,
  jobDescription,
  experienceLevel,
  currentSkills,
}) {
  const systemPrompt = `You are an expert career coach and curriculum designer.
Return ONLY valid JSON.`;

  const input = jobRole
    ? `Job Role: ${jobRole}`
    : `Job Description: ${jobDescription}`;

  const userPrompt = `Generate a structured roadmap:
${input}
Level: ${experienceLevel}
Skills: ${currentSkills.join(", ")}

Return JSON with:
targetRole, totalWeeks, phases, courses, skillGap, stats`;

  return callClaude(systemPrompt, userPrompt);
}

// ================= SKILL GAP =================
export async function analyzeSkillGap({
  targetRole,
  currentSkills,
  experienceLevel,
}) {
  const systemPrompt = `Return ONLY valid JSON`;

  const userPrompt = `Analyze skill gap:
Role: ${targetRole}
Skills: ${currentSkills.join(", ")}
Level: ${experienceLevel}

Return JSON with skillGap and recommendations`;

  return callClaude(systemPrompt, userPrompt);
}