import { GoogleGenAI, Type } from "@google/genai";
import { Module, QuizQuestion, Resource, ForumPost, AnalyticsReport, Flashcard } from "../types";

// Fallback models in order of preference
const MODELS = [
  'gemini-2.5-flash',      // Primary - fast and capable
  'gemini-2.5-flash-lite', // Fallback 1 - lighter, may have different limits
  'gemini-2.0-flash',      // Fallback 2 - previous generation
];

let currentModelIndex = 0;
const modelFlash = MODELS[0]; // Default model for non-retry calls

// Helper: Lazy load AI client to prevent crash on module load if env vars are missing
let aiClient: GoogleGenAI | null = null;
const getAi = () => {
  if (!aiClient) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing VITE_GEMINI_API_KEY environment variable");
      throw new Error("API configuration missing. Please check your environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

// Helper function to retry API calls with exponential backoff and model fallback
const withRetry = async <T>(
  fn: (model: string) => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;

  // Try each model
  for (let modelIdx = 0; modelIdx < MODELS.length; modelIdx++) {
    const model = MODELS[(currentModelIndex + modelIdx) % MODELS.length];

    // Try with retries for each model
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await fn(model);
        // Success! Update the current model index if we switched
        if (modelIdx > 0) {
          currentModelIndex = (currentModelIndex + modelIdx) % MODELS.length;
          console.log(`Switched to model: ${model}`);
        }
        return result;
      } catch (error: any) {
        lastError = error;
        const isRateLimit = error?.message?.includes('503') ||
          error?.message?.includes('429') ||
          error?.message?.includes('overloaded') ||
          error?.message?.includes('UNAVAILABLE') ||
          error?.message?.includes('RESOURCE_EXHAUSTED');

        if (isRateLimit) {
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Model ${model} overloaded, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // If all retries failed for this model, try next model
          console.log(`Model ${model} exhausted, trying next model...`);
          break;
        }
        // Non-rate-limit error, throw immediately
        throw error;
      }
    }
  }

  throw lastError || new Error('All models exhausted');
};

// 1. Generate Roadmap Structure
export const generateRoadmapStructure = async (topic: string): Promise<Module[]> => {
  const prompt = `Create a comprehensive learning roadmap for the subject: "${topic}". 
  Break it down into logical modules. Each module should have a list of specific subtopics.
  Keep it practical and structured for a beginner to intermediate learner.`;

  const response = await withRetry((model) => getAi().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            subtopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  }));

  const rawModules = JSON.parse(response.text || "[]");

  // Hydrate with IDs
  return rawModules.map((m: any, idx: number) => ({
    id: `mod-${Date.now()}-${idx}`,
    title: m.title,
    description: m.description,
    subtopics: m.subtopics.map((s: any, sIdx: number) => ({
      id: `sub-${Date.now()}-${idx}-${sIdx}`,
      title: s.title,
      isCompleted: false,
      isStarted: false,
      timeSpentSeconds: 0
    })),
    quizCompleted: false
  }));
};

// Helper function to search YouTube and get real video links
const searchYouTube = async (query: string): Promise<{ title: string; videoId: string } | null> => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${apiKey}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return {
        title: data.items[0].snippet.title,
        videoId: data.items[0].id.videoId
      };
    }
    return null;
  } catch (e) {
    console.error('YouTube API error:', e);
    return null;
  }
};

// 2. Fetch Resources for Subtopic - Uses YouTube API for real video links
export const fetchResourcesForSubtopic = async (topic: string, subtopic: string): Promise<Resource[]> => {
  const prompt = `Suggest 3 different types of learning resources for "${subtopic}" in the context of "${topic}".
  
  For each resource, provide:
  - A descriptive title that describes what the learner will find
  - A search query that would find this resource
  - The type: "video" for video tutorials, "article" for written guides, "doc" for documentation
  
  Make sure to include at least one video resource.`;

  try {
    const response = await withRetry(() => getAi().models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['video', 'article', 'doc'] }
            }
          }
        }
      }
    }));

    const rawResources = JSON.parse(response.text || "[]");

    // Process resources - use YouTube API for videos
    const resources: Resource[] = [];

    for (const r of rawResources) {
      const query = r.searchQuery || `${subtopic} ${topic} tutorial`;

      if (r.type === 'video') {
        // Use YouTube API to get real video link
        const videoResult = await searchYouTube(query);
        if (videoResult) {
          resources.push({
            title: videoResult.title,
            url: `https://www.youtube.com/watch?v=${videoResult.videoId}`,
            type: 'video'
          });
        } else {
          // Fallback to search if API fails
          resources.push({
            title: r.title,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            type: 'video'
          });
        }
      } else if (r.type === 'doc') {
        resources.push({
          title: r.title,
          url: `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(query + " documentation")}`,
          type: 'doc'
        });
      } else {
        resources.push({
          title: r.title,
          url: `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(query)}`,
          type: 'article'
        });
      }
    }

    console.log("Generated resources:", resources);
    return resources;
  } catch (e) {
    console.error("Failed to fetch resources:", e);
    return [];
  }
};

// 3. Generate Quiz
export const generateQuizForModule = async (moduleTitle: string, subtopics: string[]): Promise<QuizQuestion[]> => {
  const prompt = `Generate a 5-question multiple choice quiz to test knowledge on the module: "${moduleTitle}".
  Cover these subtopics: ${subtopics.join(', ')}.
  Provide 4 options for each question.`;

  const response = await getAi().models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

// 4. Generate Feedback Summary
export const generateFeedback = async (
  topic: string,
  performanceData: {
    module: string;
    quizScore: number;
    quizTotal: number;
    subtopics: { title: string; time: number }[];
  }[]
): Promise<string> => {
  const prompt = `The user is studying "${topic}". 
  Here is the detailed performance data for the modules they have completed:
  ${JSON.stringify(performanceData, null, 2)}
  
  Based on this data, provide a comprehensive and personalized performance review.
  1. Highlight specific modules where they performed well (high quiz scores).
  2. Identify specific areas where they might be struggling. Look for low quiz scores or subtopics where they spent significantly more time compared to others (suggesting difficulty).
  3. Provide specific, actionable advice based on their struggle areas and the nature of the topic.
  4. If they are doing well everywhere, challenge them to go deeper into advanced concepts.
  
  Keep the feedback personal, referencing specific module titles and subtopics. Output plain text.`;

  const response = await getAi().models.generateContent({
    model: modelFlash,
    contents: prompt
  });

  return response.text || "Keep up the great work!";
};

// 5. Chatbot
export const chatWithAssistant = async (history: { role: 'user' | 'model', text: string }[], message: string, context: string) => {
  const chat = getAi().chats.create({
    model: modelFlash,
    config: {
      systemInstruction: `You are a helpful tutor assistant for a course on: ${context}. Keep answers brief and helpful.`
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

// 6. Generate Social Discussion Threads
export const generateCommunityThreads = async (topic: string): Promise<ForumPost[]> => {
  const prompt = `Generate 3 realistic forum discussion starter posts for students learning "${topic}".
  Each post should have a persona (name, emoji avatar) and a question or insight a beginner might have.
  Also include 1 helpful reply for each post from another "student".`;

  const response = await getAi().models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            author: { type: Type.STRING },
            avatar: { type: Type.STRING },
            content: { type: Type.STRING },
            likes: { type: Type.INTEGER },
            replies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  author: { type: Type.STRING },
                  avatar: { type: Type.STRING },
                  content: { type: Type.STRING },
                  isAiGenerated: { type: Type.BOOLEAN }
                }
              }
            },
            isAiGenerated: { type: Type.BOOLEAN }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

// 7. Deep Analysis
export const generateDeepAnalysis = async (topic: string, moduleData: Module[]): Promise<AnalyticsReport> => {
  // Flatten data for prompt
  const subtopicsData = moduleData.flatMap(m => m.subtopics.map(s => ({
    title: s.title,
    time: s.timeSpentSeconds,
    completed: s.isCompleted
  })));

  const prompt = `Analyze this study data for the topic "${topic}".
    Data: ${JSON.stringify(subtopicsData)}.
    Identify specific struggle areas (took long time) and strong areas.
    Predict future challenges based on the topic nature.
    Suggest recommendations.`;

  const response = await getAi().models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          struggleAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
          strongAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.STRING },
          predictedChallenges: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

// 8. Generate Flashcards
export const generateFlashcards = async (topic: string, subtopic: string): Promise<Flashcard[]> => {
  const prompt = `Create 5 study flashcards for the subtopic "${subtopic}" within the subject "${topic}".
  Return a JSON array of objects with "front" (question, term, or code snippet) and "back" (answer, definition, or explanation).
  Keep them concise and focused on key concepts.`;

  const response = await getAi().models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};