
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, GroundingLink, MapPlace, Location } from "../types";

const API_KEY = process.env.API_KEY || '';

export const sendMessageToGemini = async (
  prompt: string,
  history: Message[],
  userLocation: Location | null
): Promise<Partial<Message>> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Use gemini-2.5-flash for its superior Google Maps grounding capabilities
  const model = "gemini-2.5-flash"; 

  const tools: any[] = [{ googleSearch: {} }, { googleMaps: {} }];
  
  const toolConfig = userLocation ? {
    retrievalConfig: {
      latLng: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      }
    }
  } : undefined;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [
        ...history.slice(-10).map(m => ({ // Keep last 10 messages for context
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        tools: tools,
        toolConfig: toolConfig,
        systemInstruction: `You are MapGenie, an AI assistant specialized in locations, route planning, and real-time mapping.
        
        When a user asks for directions or a route:
        1. Use Google Maps grounding to find the best route.
        2. Provide a brief summary of the journey (estimated time, distance, and key roads).
        3. List clear, turn-by-turn directions.
        4. Always mention the destination and starting point clearly.
        5. If there are multiple ways, suggest the fastest one.
        
        For general location queries, provide helpful context and interesting facts using Google Search and Maps.`
      }
    });

    const text = response.text || "I couldn't generate a response.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const links: GroundingLink[] = [];
    const places: MapPlace[] = [];

    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        links.push({
          title: chunk.web.title,
          uri: chunk.web.uri,
          type: 'search'
        });
      }
      if (chunk.maps) {
        links.push({
          title: chunk.maps.title,
          uri: chunk.maps.uri,
          type: 'map'
        });
        places.push({
          title: chunk.maps.title,
          uri: chunk.maps.uri,
          snippet: chunk.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0]
        });
      }
    });

    return {
      content: text,
      groundingLinks: links,
      places: places
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
