export type PhysicsSystemType =
  | "projectile"
  | "pendulum"
  | "spring"
  | "collision"
  | "circuit"
  | "incline"
  | "orbital";

export interface ParameterDefinition {
  id: string;
  name: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description?: string;
}

export interface GoverningEquation {
  id: string;
  label: string;
  latex: string;
  explanation: string;
  evaluatesTo?: string;
}

export interface StepSolution {
  stepNumber: number;
  title: string;
  formula: string;
  calculation: string;
  explanation: string;
}

export interface PredictedMeasurement {
  id: string;
  label: string;
  symbol: string;
  value: number;
  formattedValue: string;
  unit: string;
  formula?: string;
  status?: "calculated" | "target" | "observed";
}

export interface ConceptualQuestion {
  question: string;
  hint: string;
  answerExplanation: string;
}

export interface PhysicsProblemDefinition {
  id: string;
  title: string;
  systemType: PhysicsSystemType;
  summary: string;
  targetGoal?: string;
  rawText?: string;
  parameters: ParameterDefinition[];
  governingEquations: GoverningEquation[];
  stepByStepSolution: StepSolution[];
  predictedMeasurements: PredictedMeasurement[];
  conceptualQuestions?: ConceptualQuestion[];
}

export interface GraphDataPoint {
  t: number;
  [key: string]: number;
}
