export interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'doc';
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Subtopic {
  id: string;
  title: string;
  isCompleted: boolean;
  isStarted: boolean;
  timeSpentSeconds: number; // accumulated time
  resources?: Resource[];
  flashcards?: Flashcard[];
  lastSessionDate?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  subtopics: Subtopic[];
  quizCompleted: boolean;
  quizScore?: number;
  quizTotalQuestions?: number;
}

export interface Roadmap {
  id: string;
  topic: string;
  createdAt: string;
  modules: Module[];
  isCompleted: boolean;
  feedback?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: string;
}

export interface User {
  id: string; // Unique ID
  email: string; // For login
  password: string; // For login (stored simply for demo)
  name: string;
  roadmaps: Roadmap[];
  points: number;
  level: number;
  badges: Badge[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string; // The text of the correct option
  explanation: string;
}

export interface ForumPost {
  id: string;
  author: string;
  avatar: string; // emoji
  content: string;
  likes: number;
  replies: ForumPost[];
  isAiGenerated: boolean;
}

export interface AnalyticsReport {
  struggleAreas: string[];
  strongAreas: string[];
  recommendations: string;
  predictedChallenges: string;
}

export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED'
}