export interface CourseStep {
  id: string;
  stageName: string;
  stageNum: string;
  stepNumLabel: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeType: "action" | "must" | "active" | "neutral";
  promptTitle?: string;
  promptContent?: string;
  stepIdx: number;
}

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}
