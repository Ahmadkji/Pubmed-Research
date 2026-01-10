
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, EvidenceGrade, StudyType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 5 refined medical research query suggestions for: "${query}". Return only a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Suggestions error:", error);
    return [];
  }
};

export const performEvidenceSearch = async (query: string): Promise<SearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for clinical evidence from PubMed regarding: "${query}". 
      Return a structured JSON object representing a synthesized medical search result. 
      Include a summary, key takeaways, an evidence matrix of at least 6 relevant studies (mocked details but realistic), 
      outcomes grouped by category (e.g., mortality, side effects), and clinical limitations.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            evidenceMatrix: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  authors: { type: Type.STRING },
                  journal: { type: Type.STRING },
                  year: { type: Type.INTEGER },
                  type: { type: Type.STRING, description: "RCT, Meta-Analysis, etc." },
                  sampleSize: { type: Type.INTEGER },
                  population: { type: Type.STRING },
                  intervention: { type: Type.STRING },
                  outcome: { type: Type.STRING },
                  grade: { type: Type.STRING, description: "STRONG, MODERATE, WEAK, CONFLICTING" },
                  pubmedId: { type: Type.STRING },
                  url: { type: Type.STRING },
                  abstractSnippet: { type: Type.STRING },
                  riskOfBias: { type: Type.STRING, description: "Low, Moderate, High" }
                },
                required: ["id", "title", "year", "grade", "type"]
              }
            },
            outcomes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  studies: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "keyTakeaways", "evidenceMatrix"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}') as SearchResult;
    return result;
  } catch (error) {
    console.error("Evidence search error:", error);
    throw error;
  }
};
