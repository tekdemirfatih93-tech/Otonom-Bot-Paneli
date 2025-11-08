export interface SiteConfig {
    id: string;
    adapter: string;
    username: string;
    status: 'running' | 'stopped' | 'error';
    currentAction?: string;
    tasksCompleted: number;
    pointsEarned: number;
    country: string;
    persona: string;
}

// Fix: Add ChatMessage type definition for use in ChatBot component.
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}
