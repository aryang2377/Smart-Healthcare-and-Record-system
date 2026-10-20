import Groq from "groq-sdk";

// Clinical rule-based fallback when external AI API is unreachable or key is invalid
function clinicalRuleBasedTriage(symptoms = [], description = "") {
  const symLower = symptoms.map((s) => s.toLowerCase());
  const descLower = (description || "").toLowerCase();
  const text = `${symLower.join(" ")} ${descLower}`;

  let urgency = "low";
  let emergencyFlag = false;
  let emergencyReason = "";
  const primaryConditions = [];
  const recommendedSpecialties = new Set();
  const keySymptoms = [...symptoms];

  // 1. High Urgency / Emergency Red Flag Checks
  const cardiacRedFlags = ["chest pain", "heart palpitations", "fainting"];
  const neuroRedFlags = ["confusion", "fainting", "vision changes", "slurred speech", "facial droop", "paralysis"];
  const respRedFlags = ["shortness of breath", "severe breathlessness", "wheezing"];

  const hasCardiacRed = cardiacRedFlags.some((f) => text.includes(f));
  const hasNeuroRed = neuroRedFlags.some((f) => text.includes(f));
  const hasRespRed = respRedFlags.some((f) => text.includes(f));

  if (text.includes("chest pain") && (text.includes("shortness of breath") || text.includes("sweating") || text.includes("radiating"))) {
    urgency = "high";
    emergencyFlag = true;
    emergencyReason = "Acute chest discomfort with associated systemic symptoms warrants immediate emergency evaluation for acute coronary syndrome.";
    primaryConditions.push("Suspected Acute Coronary Syndrome", "Angina Pectoris");
    recommendedSpecialties.add("Cardiology");
    recommendedSpecialties.add("General Medicine");
  } else if (hasNeuroRed && (text.includes("confusion") || text.includes("fainting"))) {
    urgency = "high";
    emergencyFlag = true;
    emergencyReason = "Neurological impairment (confusion/fainting/vision changes) requires prompt clinical assessment to rule out acute neurological events.";
    primaryConditions.push("Transient Ischemic Attack / Syncope", "Acute Neurological Dysfunction");
    recommendedSpecialties.add("Neurology");
    recommendedSpecialties.add("General Medicine");
  } else if (text.includes("shortness of breath") && (text.includes("wheezing") || text.includes("chest pain") || text.includes("cough"))) {
    urgency = "high";
    emergencyFlag = true;
    emergencyReason = "Severe dyspnea and compromised airflow requires urgent respiratory stabilization.";
    primaryConditions.push("Acute Asthmatic Exacerbation / COPD Flare", "Lower Respiratory Infection");
    recommendedSpecialties.add("Pulmonology");
    recommendedSpecialties.add("General Medicine");
  } else if (hasCardiacRed) {
    urgency = "moderate";
    primaryConditions.push("Cardiovascular Arrhythmia / Dysrhythmia", "Hypertensive Discomfort");
    recommendedSpecialties.add("Cardiology");
  } else if (text.includes("headache") || text.includes("migraine") || text.includes("dizziness") || text.includes("memory issues")) {
    urgency = text.includes("severe") || text.includes("unbearable") ? "moderate" : "low";
    primaryConditions.push("Vascular / Tension Headache", "Vestibular Dysfunction");
    recommendedSpecialties.add("Neurology");
    recommendedSpecialties.add("General Medicine");
  }

  // 2. Respiratory & Pulmonary
  if (text.includes("cough") || text.includes("wheezing") || text.includes("sore throat") || text.includes("runny nose") || text.includes("nasal congestion")) {
    if (text.includes("wheezing") || text.includes("shortness of breath")) {
      recommendedSpecialties.add("Pulmonology");
      if (!primaryConditions.includes("Acute Bronchitis")) primaryConditions.push("Acute Bronchitis", "Upper Respiratory Infection");
    } else {
      recommendedSpecialties.add("ENT");
      recommendedSpecialties.add("General Medicine");
      if (!primaryConditions.includes("Pharyngitis / Rhinosinusitis")) primaryConditions.push("Pharyngitis / Rhinosinusitis");
    }
    if (urgency === "low" && (text.includes("fever") || text.includes("chills"))) urgency = "moderate";
  }

  // 3. Digestive & Gastrointestinal
  if (text.includes("abdominal pain") || text.includes("nausea") || text.includes("vomiting") || text.includes("diarrhea") || text.includes("constipation") || text.includes("bloating")) {
    recommendedSpecialties.add("Gastroenterology");
    primaryConditions.push("Acute Gastroenteritis", "Functional Dyspepsia");
    if (text.includes("vomiting") && text.includes("abdominal pain")) urgency = "moderate";
  }

  // 4. Dermatology / Skin
  if (text.includes("skin rash") || text.includes("itching") || text.includes("hives") || text.includes("discoloration") || text.includes("dry skin")) {
    recommendedSpecialties.add("Dermatology");
    primaryConditions.push("Acute Allergic Dermatitis", "Urticaria / Eczema");
    if (urgency === "low") urgency = "low";
  }

  // 5. Musculoskeletal & Orthopedic
  if (text.includes("joint pain") || text.includes("back pain") || text.includes("muscle weakness") || text.includes("swelling") || text.includes("stiffness")) {
    recommendedSpecialties.add("Orthopedics");
    primaryConditions.push("Musculoskeletal Strain", "Arthralgia / Lumbar Syndrome");
    if (text.includes("swelling") && text.includes("severe")) urgency = "moderate";
  }

  // 6. Urinary & Nephrology
  if (text.includes("frequent urination") || text.includes("dysuria") || text.includes("urination")) {
    recommendedSpecialties.add("Urology");
    primaryConditions.push("Urinary Tract Infection", "Renal Colic Risk");
    urgency = "moderate";
  }

  // 7. Endocrine & Metabolic
  if (text.includes("excessive thirst") || text.includes("weight loss") || text.includes("severe fatigue") && text.includes("night sweats")) {
    recommendedSpecialties.add("Endocrinology");
    primaryConditions.push("Metabolic / Glycemic Imbalance", "Thyroid Dysregulation");
    if (urgency === "low") urgency = "moderate";
  }

  // 8. Vision / Ophthalmology
  if (text.includes("vision changes") || text.includes("eye") || text.includes("blurred vision")) {
    recommendedSpecialties.add("Ophthalmology");
    if (!primaryConditions.includes("Acute Visual Disturbance")) primaryConditions.push("Acute Visual Disturbance");
    if (urgency === "low") urgency = "moderate";
  }

  // 9. Mental Health / Psychiatry
  if (text.includes("anxiety") || text.includes("depression") || text.includes("insomnia") || text.includes("panic")) {
    recommendedSpecialties.add("Psychiatry");
    primaryConditions.push("Acute Anxiety Response", "Adjustment Syndrome");
  }

  // Default fallback if no category matched
  if (recommendedSpecialties.size === 0) {
    recommendedSpecialties.add("General Medicine");
    primaryConditions.push("Undifferentiated Clinical Symptoms");
  }

  const specArray = Array.from(recommendedSpecialties).slice(0, 2);
  const condArray = primaryConditions.slice(0, 3);

  let summary = `Clinical triage assessment indicates ${urgency.toUpperCase()} priority for reported symptoms (${symptoms.slice(0, 4).join(", ") || "unspecified"}). Evaluation with a specialist in ${specArray.join(" or ")} is recommended for definitive diagnosis.`;
  if (emergencyFlag) {
    summary = `CRITICAL ALERT: Presenting symptoms require prompt emergency medical attention. Please proceed to the nearest emergency medical facility or consult ${specArray[0]} urgently.`;
  }

  const homeRemedyNote = urgency === "low"
    ? "Rest comfortably, stay well hydrated, and monitor your symptoms. If symptoms persist beyond 48 hours or intensify, consult a physician."
    : "";

  return {
    urgency,
    emergencyFlag,
    emergencyReason,
    primaryConditions: condArray,
    summary,
    recommendedSpecialties: specArray,
    keySymptoms,
    homeRemedyNote,
  };
}

export async function analyzeSymptoms(symptoms = [], description = "") {
  const symptomText = symptoms.length > 0 ? symptoms.join(", ") : "none specified";
  const descText = description?.trim() || "none provided";
  const apiKey = (process.env.GROQ_API_KEY || "").trim();

  // If Groq key is present and appears formatted, attempt AI completion
  if (apiKey && apiKey.startsWith("gsk_") && apiKey !== "your_groq_api_key_here") {
    try {
      const client = new Groq({ apiKey });
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
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
recommendedSpecialties: 1-2 from this list ONLY: Cardiology, Neurology, Dermatology, Orthopedics, Gastroenterology, Pulmonology, Psychiatry, ENT, Ophthalmology, Gynecology, Urology, Endocrinology, General Medicine, Pediatrics`,
          },
        ],
      });

      const raw = response.choices[0].message.content.trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (apiErr) {
      console.warn("Groq AI API unavailable (" + (apiErr?.status || apiErr?.message) + "), executing clinical rule-based triage fallback.");
    }
  }

  // Seamless fallback to expert clinical triage rules
  return clinicalRuleBasedTriage(symptoms, description);
}
