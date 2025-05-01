export interface Message {
  id: number;
  type: string; // 'user' | 'bot'
  name?: string;
  text: string;
}
