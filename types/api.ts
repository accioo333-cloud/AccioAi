export interface ChatRequest {
  prompt: string;
}

export interface ChatResponse {
  success: boolean;
  data?: string;
  error?: {
    code: string;
    message: string;
  };
}
