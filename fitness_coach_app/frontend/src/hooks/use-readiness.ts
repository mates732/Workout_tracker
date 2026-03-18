export const calculateReadinessLabel = (score: number): string => {
  if (score >= 75) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
};
