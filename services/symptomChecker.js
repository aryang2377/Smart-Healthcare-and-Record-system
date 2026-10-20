import Groq from "groq-sdk";

export async function analyzeSymptoms(symptoms, description) {
  const client = new Groq({ apiKey: (process.env.GROQ_API_KEY || "").trim() });
  const symptomText = symptoms.length > 0 ? symptoms.join(", ") : "none specified";
  const descText = description?.trim() || "none provided";

  const response = await client.chat.completions.create({
    model: "qwen/qwen3.8-27b",
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content: "You are a hospital clinical triage AI. You ONLY respond with valid JSON objects — no markdown, no code fences, no extra text whatsoever.",
      },
      {
        role: "user",
        content: `Analyze these patient symptoms and return a JSON triage assessment.

Patient symptoms: ${symptomText}
Patient description: ${descText}

Return ONLY this JSON structure (no other text):
{
  "urgency": "high" | "moderate" | "low",
  "emergencyFlag": boolean,
  "emergencyReason": "describe emergency or empty string",
  "primaryConditions": ["condition 1", "condition 2"],
  "summary": "2-3 sentence patient-friendly assessment",
  "recommendedSpecialties": ["Specialty Name"],
  "keySymptoms": ["symptom 1", "symptom 2"],
  "homeRemedyNote": "self-care tip for low urgency only, empty string for moderate/high"
}

Urgency rules:
- "high": chest pain, severe breathlessness, stroke signs (facial droop/arm weakness/slurred speech), uncontrolled bleeding, unconsciousness, anaphylaxis, severe head trauma, suicidal ideation
- "moderate": fever >102°F, pain ≥7/10, symptoms worsening >48h, chronic condition flare
- "low": mild or stable symptoms manageable at home
emergencyFlag = true only when urgency is "high"
primaryConditions: 1-3 items max
recommendedSpecialties: 1-2 from this list ONLY: Cardiology, Neurology, Dermatology, Orthopedics, Gastroenterology, Pulmonology, Psychiatry, ENT, Ophthalmology, Gynecology, Urology, Endocrinology, General Medicine, Pediatrics, Emergency Medicine`,
      },
    ],
  });

  const raw = response.choices[0].message.content.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned invalid response format");
  return JSON.parse(match[0]);
}
