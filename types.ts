
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  groundingLinks?: GroundingLink[];
  places?: MapPlace[];
  isRoute?: boolean;
}

export interface GroundingLink {
  title: string;
  uri: string;
  type: 'search' | 'map';
}

export interface MapPlace {
  title: string;
  uri: string;
  latitude?: number;
  longitude?: number;
  snippet?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface RouteInfo {
  start: string;
  destination: string;
  steps?: string[];
}
