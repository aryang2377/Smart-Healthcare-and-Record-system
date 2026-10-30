/**
 * CareSync Clinical Vitals Rules Engine
 * Non-ML Deterministic Classification based on WHO, AHA, and ADA Guidelines
 */

export function evaluateBloodPressure(systolic, diastolic) {
  if (!systolic || !diastolic) return { category: "Unrecorded", badgeClass: "secondary", alert: false };

  const s = Number(systolic);
  const d = Number(diastolic);

  if (s > 180 || d > 120) {
    return { category: "Hypertensive Crisis", badgeClass: "danger", alert: true, note: "Emergency medical evaluation needed immediately." };
  }
  if (s >= 140 || d >= 90) {
    return { category: "Hypertension Stage 2", badgeClass: "danger", alert: true, note: "Consult your doctor for medication review." };
  }
  if (s >= 130 || d >= 80) {
    return { category: "Hypertension Stage 1", badgeClass: "warning", alert: false, note: "Lifestyle changes & dietary sodium monitoring recommended." };
  }
  if (s >= 120 && d < 80) {
    return { category: "Elevated", badgeClass: "info", alert: false, note: "Pre-hypertension stage. Monitor regularly." };
  }
  if (s < 90 || d < 60) {
    return { category: "Hypotension (Low)", badgeClass: "warning", alert: false, note: "Stay hydrated and consult physician if dizzy." };
  }
  return { category: "Normal", badgeClass: "success", alert: false, note: "Optimal blood pressure." };
}

export function evaluateBloodSugar(sugar, type = "Fasting") {
  if (!sugar) return { category: "Unrecorded", badgeClass: "secondary", alert: false };

  const g = Number(sugar);

  if (type === "Fasting") {
    if (g < 70) return { category: "Hypoglycemia (Low)", badgeClass: "warning", alert: true, note: "Blood sugar is low. Consume fast-acting glucose." };
    if (g <= 99) return { category: "Normal Fasting", badgeClass: "success", alert: false, note: "Optimal healthy fasting range." };
    if (g <= 125) return { category: "Pre-Diabetes", badgeClass: "warning", alert: false, note: "Elevated fasting glucose. Dietary changes recommended." };
    return { category: "Diabetic / Elevated", badgeClass: "danger", alert: true, note: "Consult your doctor for diabetes management." };
  } else {
    // Post-Meal or Random
    if (g < 70) return { category: "Hypoglycemia (Low)", badgeClass: "warning", alert: true, note: "Blood sugar is low. Consume fast-acting glucose." };
    if (g < 140) return { category: "Normal Post-Meal", badgeClass: "success", alert: false, note: "Optimal healthy post-meal range." };
    if (g <= 199) return { category: "Pre-Diabetes", badgeClass: "warning", alert: false, note: "Impaired glucose tolerance." };
    return { category: "Diabetic / Elevated", badgeClass: "danger", alert: true, note: "Post-prandial glucose is elevated. Physician consult needed." };
  }
}

export function evaluateHeartRate(pulse) {
  if (!pulse) return { category: "Unrecorded", badgeClass: "secondary", alert: false };
  const p = Number(pulse);

  if (p < 60) return { category: "Bradycardia (Low)", badgeClass: "warning", alert: false, note: "Resting pulse is below 60 bpm." };
  if (p <= 100) return { category: "Normal", badgeClass: "success", alert: false, note: "Normal resting heart rate." };
  return { category: "Tachycardia (High)", badgeClass: "danger", alert: true, note: "Resting pulse is elevated above 100 bpm." };
}

export function evaluateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return { bmi: null, category: "Unrecorded", badgeClass: "secondary" };
  const w = Number(weightKg);
  const hMeters = Number(heightCm) / 100;
  if (hMeters <= 0) return { bmi: null, category: "Unrecorded", badgeClass: "secondary" };

  const bmi = Math.round((w / (hMeters * hMeters)) * 10) / 10;

  if (bmi < 18.5) return { bmi, category: "Underweight", badgeClass: "warning" };
  if (bmi <= 24.9) return { bmi, category: "Normal Weight", badgeClass: "success" };
  if (bmi <= 29.9) return { bmi, category: "Overweight", badgeClass: "warning" };
  return { bmi, category: "Obese", badgeClass: "danger" };
}

export function evaluateOxygen(spo2) {
  if (!spo2) return { category: "Unrecorded", badgeClass: "secondary", alert: false };
  const ox = Number(spo2);

  if (ox >= 95) return { category: "Normal (95-100%)", badgeClass: "success", alert: false, note: "Normal blood oxygenation." };
  if (ox >= 90) return { category: "Mild Hypoxia (90-94%)", badgeClass: "warning", alert: true, note: "Oxygen is slightly low. Rest and monitor." };
  return { category: "Critical Hypoxia (<90%)", badgeClass: "danger", alert: true, note: "Critical oxygen saturation! Seek emergency medical care." };
}

export function evaluateTemperature(tempF) {
  if (!tempF) return { category: "Unrecorded", badgeClass: "secondary", alert: false };
  const t = Number(tempF);

  if (t > 100.4) return { category: "Fever / Pyrexia", badgeClass: "danger", alert: true };
  if (t < 96.0) return { category: "Hypothermia", badgeClass: "warning", alert: true };
  return { category: "Normal", badgeClass: "success", alert: false };
}
