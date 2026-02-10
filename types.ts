
export enum ViewSection {
  SANCTUARY = 'SANCTUARY',
  CHRISTIAN = 'CHRISTIAN',
  SCRIPTORIUM = 'SCRIPTORIUM',
  GALLERY = 'GALLERY',
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface SavedImage {
  id?: number;
  blob: Blob;
  prompt: string;
  timestamp: number;
}

// Bible Types
export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapter {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
}

export interface BibleBookInfo {
  name: string;
  abbrev: string;
  chapters: number;
  testament: 'VT' | 'NT';
}

// For DB Cache
export interface CachedChapter {
  id?: string; // compound index: "BookName-ChapterNum"
  book: string;
  chapter: number;
  data: BibleChapter;
  timestamp: number;
}

export interface UserSetting {
  key: string;
  value: any;
}

export interface DailySaint {
  name: string;
  title: string;
  description: string;
  imageUrl: string; // Base64 or URL
}

// Refactored Liturgy Type for dynamic content
export interface Liturgy {
  date: string; // Date string ID
  formattedDate: string;
  liturgicalColor: string;
  liturgicalTime: string;
  reading1: string;
  reading1Reference: string;
  psalm: string;
  psalmReference: string;
  reading2?: string; // Optional (Sundays/Feasts)
  reading2Reference?: string;
  gospel: string;
  gospelReference: string;
  visualTheme: string; // 'bread' | 'cross' | 'light' | 'shepherd' | 'book' | 'spirit'
  generatedImage?: string; // Base64 of the interpreted liturgy visualization
  saint?: DailySaint; // Dynamic Saint of the Day
}

// User & Gamification Types
export interface UserProfile {
  id?: number;
  name: string;
  joinedAt: number;
}

export interface UserStats {
  id?: number;
  currentStreak: number;
  maxStreak: number;
  lastVisitDate: string; // YYYY-MM-DD
}

export interface LiturgyCache {
  date: string; // PK: YYYY-MM-DD
  data: Liturgy;
  timestamp: number;
}
