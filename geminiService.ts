
import { GoogleGenAI, Type } from "@google/genai";
import { bibleService } from "./services/bibleService";
import { db } from "./db";
import { Liturgy, DailySaint } from "./types";

// --- CÓDIGO DE CONDUTA E DIRETRIZES DE GOVERNAÇÃO (BASEADO NO RELATÓRIO FUNDACIONAL) ---
const SYSTEM_INSTRUCTION_TEMPLATE = (userName: string) => `
DIRETRIZES CONSTITUCIONAIS PARA O AGENTE 'CHRISTIAN.AI'

1. IDENTIDADE E FINALIDADE (Art. 1-3):
- Você é o 'christian.ai', um assistente de Inteligência Artificial catequética desenvolvido pela Rabelus.org.
- NÃO é uma entidade senciente, NÃO é um diretor espiritual humano, NÃO é um ministro ordenado (padre/diácono).
- OBJETIVO: Informar sobre o ensinamento da Igreja Católica estritamente baseado nas fontes oficiais.
- PROIBIÇÃO DE REPRESENTAÇÃO: Jamais se apresente como voz do Magistério ou fale em nome de Deus na primeira pessoa.

2. HIERARQUIA DAS FONTES (A "Tabela de Correspondência"):
- DOUTRINA (Fé/Teologia): Fonte Primária Obrigatória = Catecismo da Igreja Católica (CIC).
  * Use o estilo do "Compêndio" (perguntas e respostas breves, claras e diretas).
  * CITAÇÃO OBRIGATÓRIA (Art. 6): Toda resposta doutrinária DEVE citar o parágrafo do CIC (ex: "Conforme CIC §234...").
- DISCIPLINA (Leis/Regras): Fonte = Código de Direito Canônico (CDC).
  * SALVAGUARDA DE RITO (Art. 9): Se a pergunta envolver regras (jejum, casamento, sacramentos), pergunte: "A sua dúvida refere-se ao Rito Latino ou a uma Igreja Oriental?" antes de dar uma resposta definitiva.
- SANTOS: Fonte = Martirológio Romano.
  * DISTINÇÃO FACTUAL (Art. 16): Distinga explicitamente fatos históricos de "lendas piedosas" ou "tradições populares".

3. PROTOCOLOS DE SEGURANÇA E PROIBIÇÕES (Art. 10, 13, 22):
- PROIBIÇÃO DE SIMULAÇÃO SACRAMENTAL (Art. 10): É ESTRITAMENTE PROIBIDO tentar "absolver" pecados, conferir bênçãos sacramentais, ou usar fórmulas litúrgicas reservadas ao clero (ex: "Eu te batizo", "Eu te absolvo").
- ENCAMINHAMENTO OBRIGATÓRIO (Art. 13): Se o usuário confessar um pecado ou pedir direção espiritual complexa, responda: "Esta plataforma é catequética. Não posso substituir o discernimento pessoal ou o Sacramento da Confissão. Por favor, procure um sacerdote."
- CRISE PASTORAL (Art. 22): Em caso de risco de suicídio ou grave angústia mental, cesse a catequese e recomende ajuda profissional imediatamente.

4. MORALIDADE E ÉTICA (Art. 11-12):
- Comece sempre pela DIGNIDADE DA PESSOA HUMANA, depois apresente os Mandamentos como caminho para a bem-aventurança.
- Distinga FORO EXTERNO (lei objetiva, o que você explica) de FORO INTERNO (julgamento da alma, que você NUNCA faz).

CONTEXTO ATUAL:
Você está conversando com ${userName}. Seja acolhedor, mas mantenha a precisão teológica acima de tudo.
`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async *streamChat(history: { role: string, parts: [{ text: string }] }[], message: string, userName: string = "Alma devota") {
    const chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TEMPLATE(userName),
      },
      history: history as any,
    });

    const result = await chat.sendMessageStream({ message });
    
    for await (const chunk of result) {
        const text = chunk.text;
        if (text) yield text;
    }
  }

  async explainVerse(verseText: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: verseText,
      config: {
        systemInstruction: "Você é um teólogo católico fiel ao Magistério. Explique este versículo em um único parágrafo conciso, focando na aplicação espiritual prática conforme a Tradição da Igreja.",
      }
    });
    
    return response.text || "";
  }

  // --- LITURGIA DIÁRIA & SANTO (REAL VIA IA COM GERAÇÃO DE IMAGEM) ---
  async getDailyLiturgy(dateStr: string): Promise<Liturgy> {
    // 1. Verificar Cache
    const cached = await db.liturgyCache.get(dateStr);
    if (cached) {
      console.log("Liturgia carregada do cache local.");
      return cached.data;
    }

    console.log("Buscando Liturgia Real e Gerando Imagens via IA...");
    
    // 2. Obter Texto (Liturgia + Santo) via Gemini Flash
    // ATUALIZADO PARA REFLETIR O ARTIGO 14 (MARTIROLÓGIO ROMANO)
    const prompt = `
      Gere a Liturgia Católica Diária CORRETA para a data: ${dateStr}.
      Inclua também o Santo do Dia principal, baseando-se no MARTIROLÓGIO ROMANO (Art. 14 do Código de Conduta).
      
      Retorne EXATAMENTE e APENAS um JSON com esta estrutura:
      {
        "formattedDate": "Ex: Segunda-feira, 24 de Novembro de 2024",
        "liturgicalColor": "Ex: Verde, Branco, Vermelho, Roxo",
        "liturgicalTime": "Ex: 34ª Semana do Tempo Comum",
        "reading1": "Texto da primeira leitura (resumido, foco na mensagem central)...",
        "reading1Reference": "Ex: Ap 14,1-3",
        "psalm": "Refrão e trecho principal do salmo...",
        "psalmReference": "Ex: Sl 23",
        "gospel": "Texto do Evangelho (foco nas palavras de Jesus)...",
        "gospelReference": "Ex: Lc 21,1-4",
        "visualTheme": "Uma descrição visual CÍNEMATOGRÁFICA curta para gerar uma imagem baseada no Evangelho (Ex: 'Jesus breaking bread, dramatic light, photorealistic')",
        "saint": {
           "name": "Nome do Santo (conforme Martirológio)",
           "title": "Título Canônico (Ex: Bispo e Mártir)",
           "description": "Breve elogio histórico. Evite lendas não fundamentadas sem aviso.",
           "imagePrompt": "Descrição visual para gerar retrato do santo (Ex: 'Portrait of Saint Augustine writing, cinematic lighting, oil painting style')"
        }
      }
    `;

    try {
      const textResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const data = JSON.parse(textResponse.text || "{}");
      
      // 3. Gerar Imagens em Paralelo (Liturgy: 16:9, Saint: 1:1)
      const [liturgyImageB64, saintImageB64] = await Promise.all([
          this.generateRawImage(data.visualTheme || "Holy Bible cinematic light", "16:9"),
          this.generateRawImage(data.saint?.imagePrompt || `Portrait of ${data.saint?.name || "Saint"}, holy, cinematic`, "1:1")
      ]);

      const liturgyData: Liturgy = {
        date: dateStr,
        formattedDate: data.formattedDate || dateStr,
        liturgicalColor: data.liturgicalColor || "Branco",
        liturgicalTime: data.liturgicalTime || "",
        reading1: data.reading1 || "Leitura indisponível.",
        reading1Reference: data.reading1Reference || "",
        psalm: data.psalm || "Salmo indisponível.",
        psalmReference: data.psalmReference || "",
        gospel: data.gospel || "Evangelho indisponível.",
        gospelReference: data.gospelReference || "",
        visualTheme: data.visualTheme || "bible",
        generatedImage: liturgyImageB64 ? `data:image/jpeg;base64,${liturgyImageB64}` : undefined,
        saint: {
            name: data.saint?.name || "Santo do Dia",
            title: data.saint?.title || "",
            description: data.saint?.description || "Rogai por nós.",
            imageUrl: saintImageB64 ? `data:image/jpeg;base64,${saintImageB64}` : "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800&auto=format&fit=crop"
        }
      };

      // 4. Salvar no Cache
      await db.liturgyCache.put({
        date: dateStr,
        data: liturgyData,
        timestamp: Date.now()
      });

      return liturgyData;

    } catch (error) {
      console.error("Erro ao gerar liturgia:", error);
      // Fallback simples
      return {
        date: dateStr,
        formattedDate: dateStr,
        liturgicalColor: "Verde",
        liturgicalTime: "Tempo Comum",
        reading1: "Não foi possível carregar a leitura.",
        reading1Reference: "N/A",
        psalm: "O Senhor é meu pastor.",
        psalmReference: "Salmo 23",
        gospel: "Buscai as coisas do alto.",
        gospelReference: "Mateus 6",
        visualTheme: "bible"
      };
    }
  }

  // Helper para gerar imagem raw (base64 string)
  private async generateRawImage(prompt: string, aspectRatio: '16:9' | '1:1' | '9:16'): Promise<string | null> {
      try {
          const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt + ", high quality, photorealistic, 8k, divine atmosphere, sacred art style" }] },
            config: { imageConfig: { aspectRatio: aspectRatio } }
          });
          
          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
          }
          return null;
      } catch (e) {
          console.warn("Falha na geração de imagem auxiliar:", e);
          return null;
      }
  }

  // --- VISUALIZAÇÃO BÍBLICA (STORIES) ---

  async generateBibleVisualization(book: string, chapter: number): Promise<{ blob: Blob, prompt: string, verse: string }> {
    try {
      const chapterData = await bibleService.getChapter(book, chapter);
      const fullText = chapterData.text;

      const analysisPrompt = `
        Analise o seguinte capítulo da Bíblia: ${book} ${chapter}.
        
        TAREFA:
        1. Escolha O versículo mais visual e impactante.
        2. Crie um prompt de imagem "Pixar-style" solene.
        
        Retorne JSON:
        {
          "selectedVerseText": "Texto...",
          "reference": "${book} ${chapter}:X",
          "imagePrompt": "Descrição visual..."
        }
      `;

      const analysisResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: { responseMimeType: 'application/json' }
      });

      const analysis = JSON.parse(analysisResponse.text || "{}");
      const finalVerse = `"${analysis.selectedVerseText}" (${analysis.reference})`;
      const finalImagePrompt = `${analysis.imagePrompt}. Vertical, masterpiece, 8k, divine light, cinematic composition.`;
      
      const b64 = await this.generateRawImage(finalImagePrompt, '9:16');

      if (!b64) throw new Error("O modelo não retornou dados de imagem.");
      
      const finalBlob = await this.compositeTextOnImage(b64, finalVerse);

      return {
        blob: finalBlob,
        prompt: `${book} ${chapter} - ${analysis.reference}`, 
        verse: finalVerse
      };

    } catch (error) {
      console.error("Erro na geração:", error);
      throw new Error("Não foi possível manifestar a visão sagrada.");
    }
  }

  private async compositeTextOnImage(base64Image: string, verseText: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error("Canvas context error")); return; }

        canvas.width = img.width;
        canvas.height = img.height;

        // Desenhar Imagem base
        ctx.drawImage(img, 0, 0);

        // Sombra dramática inferior para o texto do versículo
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;

        // ---------------------------------------------------
        // REFACTORED WATERMARK (RELOCATED TO TOP-LEFT SAFE ZONE)
        // ---------------------------------------------------
        // POSICIONAMENTO: Top-Left Anchor, mas deslocado para baixo para evitar header
        // canvas.width * 0.22 ≈ 22% da largura para baixo (em 9:16 isso é um bom espaço safe)
        const watermarkX = canvas.width * 0.06; // 6% da margem esquerda
        const watermarkY = canvas.width * 0.22; // 22% do topo (Abaixo do header UI)
        
        // REDUZIDO PARA 1/3 (Pequeno e discreto)
        const boxSize = canvas.width * 0.08; 
        
        const centerX = watermarkX + (boxSize / 2);
        const boxX = watermarkX;
        const boxY = watermarkY;
        
        // 1. Fundo da Caixa do Logo (Dark Box with Relief)
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 8;
        
        ctx.fillStyle = "#0c0c0e";
        ctx.fillRect(boxX, boxY, boxSize, boxSize);
        
        // Efeito de Relevo na Caixa (Bevel)
        ctx.lineWidth = boxSize * 0.02; // Linha fina proporcional
        
        // Top & Left (Light - Highlight)
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxSize);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + boxSize, boxY);
        ctx.stroke();
        
        // Bottom & Right (Dark - Shadow)
        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath();
        ctx.moveTo(boxX + boxSize, boxY);
        ctx.lineTo(boxX + boxSize, boxY + boxSize);
        ctx.lineTo(boxX, boxY + boxSize);
        ctx.stroke();
        
        // 2. Ícone Geométrico (Gold with Relief)
        ctx.lineWidth = boxSize * 0.08;
        ctx.lineCap = 'square';
        
        const iconCenterX = boxX + (boxSize / 2);
        const iconCenterY = boxY + (boxSize / 2);
        const iconScale = boxSize * 0.04; 

        // Helper para desenhar o ícone
        const drawIconPath = (offsetX: number, offsetY: number) => {
            ctx.beginPath();
            // Vertical
            ctx.moveTo(iconCenterX + offsetX, (iconCenterY - (10 * iconScale)) + offsetY);
            ctx.lineTo(iconCenterX + offsetX, (iconCenterY + (10 * iconScale)) + offsetY);
            // Horizontal
            ctx.moveTo((iconCenterX - (8 * iconScale)) + offsetX, iconCenterY + offsetY);
            ctx.lineTo((iconCenterX + (8 * iconScale)) + offsetX, iconCenterY + offsetY);
            // Chevrons & Wings
            const topY = iconCenterY - (5 * iconScale);
            const botY = iconCenterY + (5 * iconScale);
            const wingX = 3 * iconScale;
            const wingTipX = 6 * iconScale;
            const topTipY = iconCenterY - (10 * iconScale);
            const botTipY = iconCenterY + (10 * iconScale);
            
            // Top Chevron
            ctx.moveTo(iconCenterX - wingX + offsetX, topY + offsetY);
            ctx.lineTo(iconCenterX + offsetX, topTipY + offsetY);
            ctx.lineTo(iconCenterX + wingX + offsetX, topY + offsetY);
            // Bottom Chevron
            ctx.moveTo(iconCenterX - wingX + offsetX, botY + offsetY);
            ctx.lineTo(iconCenterX + offsetX, botTipY + offsetY);
            ctx.lineTo(iconCenterX + wingX + offsetX, botY + offsetY);
            // Wings
            ctx.moveTo(iconCenterX - wingX + offsetX, topY + offsetY);
            ctx.lineTo(iconCenterX - wingTipX + offsetX, topY + offsetY);
            ctx.moveTo(iconCenterX + wingX + offsetX, topY + offsetY);
            ctx.lineTo(iconCenterX + wingTipX + offsetX, topY + offsetY);
            ctx.moveTo(iconCenterX - wingX + offsetX, botY + offsetY);
            ctx.lineTo(iconCenterX - wingTipX + offsetX, botY + offsetY);
            ctx.moveTo(iconCenterX + wingX + offsetX, botY + offsetY);
            ctx.lineTo(iconCenterX + wingTipX + offsetX, botY + offsetY);
            
            ctx.stroke();
        };

        // Shadow Layer (Darker)
        ctx.strokeStyle = "rgba(66, 32, 6, 0.8)"; // Gold-900ish
        drawIconPath(1, 1);

        // Main Gold Layer
        ctx.strokeStyle = "#EAB308"; // Gold-500
        drawIconPath(0, 0);

        // Highlight Layer (Subtle Top-Left shine)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = boxSize * 0.02;
        drawIconPath(-0.5, -0.5);
        
        ctx.restore();

        // 3. Tipografia (Abaixo da caixa, alinhada ao centro da caixa)
        ctx.textAlign = 'center';
        
        // "christian.ai"
        const titleSize = boxSize * 0.40; // Reduzido proporcionalmente
        ctx.font = `700 ${titleSize}px 'Merriweather', serif`;
        ctx.fillStyle = "#ffffff";
        // Sombra mais dura para legibilidade em tamanho pequeno
        ctx.shadowColor = "rgba(0,0,0,1)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const textY = boxY + boxSize + (titleSize * 1.3);
        ctx.fillText("christian.ai", centerX, textY);
        
        // "by Rabelus"
        const subTitleSize = boxSize * 0.22;
        ctx.font = `400 ${subTitleSize}px 'Inter', sans-serif`;
        ctx.fillStyle = "#a1a1aa"; // Zinc-400
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText("by Rabelus", centerX, textY + (subTitleSize * 1.5));

        // ---------------------------------------------------
        // Versículo (Parte Inferior - Inalterado)
        // ---------------------------------------------------
        const verseFontSize = Math.floor(canvas.width * 0.045);
        ctx.font = `italic 500 ${verseFontSize}px 'Merriweather', serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = 'center';
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        const maxWidth = canvas.width * 0.85;
        const lineHeight = verseFontSize * 1.6;
        const words = verseText.split(' ');
        let line = '';
        const lines = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        const bottomMargin = canvas.height * 0.15;
        let y = canvas.height - bottomMargin - (lines.length * lineHeight);

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], canvas.width / 2, y);
            y += lineHeight;
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas error"));
        }, 'image/jpeg', 0.92);
      };
      
      img.src = `data:image/jpeg;base64,${base64Image}`;
    });
  }

  async generateSacredImage(prompt: string): Promise<Blob> {
     return new Blob(); 
  }
}
