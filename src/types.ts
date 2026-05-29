export interface CourseStep {
  id: string;
  stageName: string;
  stageNum: string;
  stepNumLabel: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeType: "action" | "must" | "active" | "neutral" | "theme";
  promptTitle?: string;
  promptContent?: string;
  promptsByTrack?: {
    external: string;
    internal: string;
    personal: string;
  };
  stepIdx: number;
}

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}
