import Dexie, { type Table } from 'dexie';
import { ChatMessage, SavedImage, CachedChapter, UserSetting, UserProfile, UserStats, LiturgyCache } from './types';

class ChristianAiDB extends Dexie {
  messages!: Table<ChatMessage, number>;
  images!: Table<SavedImage, number>;
  bibleCache!: Table<CachedChapter, string>;
  settings!: Table<UserSetting, string>;
  
  // New Tables
  userProfile!: Table<UserProfile, number>;
  userStats!: Table<UserStats, number>;
  liturgyCache!: Table<LiturgyCache, string>;

  constructor() {
    super('ChristianAiDB');
    
    // Define schemas
    // Version 3 adds user and liturgy tables
    (this as any).version(3).stores({
      messages: '++id, timestamp',
      images: '++id, timestamp',
      bibleCache: 'id, book, chapter',
      settings: 'key',
      userProfile: '++id',
      userStats: '++id', 
      liturgyCache: 'date'
    });
  }
}

export const db = new ChristianAiDB();