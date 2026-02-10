import { db } from '../db';
import { BibleChapter, BibleBookInfo } from '../types';

const API_BASE = 'https://bible-api.com';
const TRANSLATION = 'almeida'; // João Ferreira de Almeida

export class BibleService {
  
  // Gera ID único para o cache
  private getCacheId(book: string, chapter: number): string {
    return `${book}-${chapter}`;
  }

  // Busca capítulo (Cache First Strategy)
  async getChapter(book: string, chapter: number): Promise<BibleChapter> {
    const cacheId = this.getCacheId(book, chapter);

    // 1. Verifica Cache
    const cached = await db.bibleCache.get(cacheId);
    if (cached) {
      return cached.data;
    }

    // 2. Busca na API
    try {
      // Encode book name for URL (e.g., "1 João" -> "1%20João")
      const response = await fetch(`${API_BASE}/${encodeURIComponent(book)}+${chapter}?translation=${TRANSLATION}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar capítulo: ${response.statusText}`);
      }

      const data: BibleChapter = await response.json();

      // 3. Salva no Cache (Fire and Forget promise, but we await to ensure consistency here)
      await db.bibleCache.put({
        id: cacheId,
        book: book,
        chapter: chapter,
        data: data,
        timestamp: Date.now()
      });

      return data;

    } catch (error) {
      console.error("Falha ao carregar Bíblia:", error);
      throw error;
    }
  }

  // Salva local de leitura
  async saveProgress(book: string, chapter: number) {
    await db.settings.put({ key: 'lastRead', value: { book, chapter } });
  }

  // Carrega local de leitura
  async getLastRead(): Promise<{ book: string, chapter: number } | null> {
    const setting = await db.settings.get('lastRead');
    return setting ? setting.value : null;
  }

  // Inicialização em Background (App Startup)
  async preloadGenesis() {
    const lastRead = await this.getLastRead();
    if (!lastRead) {
      console.log("Primeiro acesso detectado. Pré-carregando Gênesis 1...");
      // Não await para não bloquear a UI, roda em background
      this.getChapter('Gênesis', 1).then(() => {
        this.saveProgress('Gênesis', 1);
      }).catch(err => console.log("Erro no pré-carregamento:", err));
    }
  }
}

export const bibleService = new BibleService();