import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.googleApiKey });

const SYSTEM_PROMPT = `Eres un asistente documental inteligente. Respondes preguntas basándote EXCLUSIVAMENTE en los fragmentos de documentos proporcionados.

Reglas:
- Si la información no está en los fragmentos, di "No encuentro esa información en los documentos del proyecto."
- Cita las fuentes cuando sea relevante.
- Responde en el mismo idioma que la pregunta.
- Sé conciso y directo.`;

export async function generateAnswer(
  question: string,
  chunks: { text: string; fileId: string; score: number }[],
): Promise<string> {
  const context = chunks
    .map((c, i) => `[Fragmento ${i + 1}]:\n${c.text}`)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: config.llmModel,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n--- DOCUMENTOS ---\n${context}\n\n--- PREGUNTA ---\n${question}`,
          },
        ],
      },
    ],
  });

  return response.text ?? 'No se pudo generar una respuesta.';
}
