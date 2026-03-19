/**
 * DepEd Base-50 Transmutation Table
 * 
 * In the Philippine public school system (DepEd), raw scores are converted to a percentage score:
 * PS = (Total Raw Score / Highest Possible Score) * 100
 * 
 * Then, a Weighted Score (WS) is computed based on the component's weight (e.g., 30% for Written Works).
 * Initial Grade = Sum of all WS (Written Works + Performance Tasks + Quarterly Assessment).
 * 
 * Finally, the Initial Grade is transmuted into the final Quarter Grade using a standard transmutation table.
 */

export function transmuteGrade(initialGrade: number): number {
  const grade = Math.round(initialGrade * 100) / 100; // Round to 2 decimal places

  if (grade === 100) return 100;
  if (grade >= 98.40) return 99;
  if (grade >= 96.80) return 98;
  if (grade >= 95.20) return 97;
  if (grade >= 93.60) return 96;
  if (grade >= 92.00) return 95;
  if (grade >= 90.40) return 94;
  if (grade >= 88.80) return 93;
  if (grade >= 87.20) return 92;
  if (grade >= 85.60) return 91;
  if (grade >= 84.00) return 90;
  if (grade >= 82.40) return 89;
  if (grade >= 80.80) return 88;
  if (grade >= 79.20) return 87;
  if (grade >= 77.60) return 86;
  if (grade >= 76.00) return 85;
  if (grade >= 74.40) return 84;
  if (grade >= 72.80) return 83;
  if (grade >= 71.20) return 82;
  if (grade >= 69.60) return 81;
  if (grade >= 68.00) return 80;
  if (grade >= 66.40) return 79;
  if (grade >= 64.80) return 78;
  if (grade >= 63.20) return 77;
  if (grade >= 61.60) return 76;
  if (grade >= 60.00) return 75; // Passing standard

  // Failing grades (below 60 initial becomes 60-74 quarter)
  if (grade >= 56.00) return 74;
  if (grade >= 52.00) return 73;
  if (grade >= 48.00) return 72;
  if (grade >= 44.00) return 71;
  if (grade >= 40.00) return 70;
  if (grade >= 36.00) return 69;
  if (grade >= 32.00) return 68;
  if (grade >= 28.00) return 67;
  if (grade >= 24.00) return 66;
  if (grade >= 20.00) return 65;
  if (grade >= 16.00) return 64;
  if (grade >= 12.00) return 63;
  if (grade >= 8.00) return 62;
  if (grade >= 4.00) return 61;
  
  return 60; // Absolute lowest transmuted grade
}

/**
 * Computes the complete ECR grading path for a single student.
 */
export function computeDepEdGrade(
  studentRaw: { ww: number, pt: number, qa: number },
  hps: { ww: number, pt: number, qa: number },
  weights: { ww: number, pt: number, qa: number } // e.g. { ww: 0.30, pt: 0.50, qa: 0.20 }
) {
  // 1. Percentage Scores
  const psWW = hps.ww > 0 ? (studentRaw.ww / hps.ww) * 100 : 0;
  const psPT = hps.pt > 0 ? (studentRaw.pt / hps.pt) * 100 : 0;
  const psQA = hps.qa > 0 ? (studentRaw.qa / hps.qa) * 100 : 0;

  // 2. Weighted Scores
  const wsWW = psWW * weights.ww;
  const wsPT = psPT * weights.pt;
  const wsQA = psQA * weights.qa;

  // 3. Initial Grade
  const initialGrade = wsWW + wsPT + wsQA;

  // 4. Transmuted Quarter Grade
  const quarterGrade = transmuteGrade(initialGrade);

  return {
    psWW, wsWW,
    psPT, wsPT,
    psQA, wsQA,
    initialGrade,
    quarterGrade
  };
}
