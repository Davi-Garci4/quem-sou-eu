import { poolFor, ThemeId } from "./words";

export type GameStatus = "lobby" | "collecting" | "playing" | "roundEnd" | "finished";
export type Mode = "classico" | "competicao";
export type Source = "livre" | "tema";

export const MAX_CHARS = 50;
export const COLLECT_SECONDS = 30;
export const ROUND_END_SECONDS = 6;

/** Tira acentos, pontuação, artigos soltos e espaços extras. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(o|a|os|as|de|do|da|dos|das|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hash público do palpite. Salgado com sala+rodada pra não vazar entre partidas. */
export async function hashWord(word: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}::${normalize(word)}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function validateWord(raw: string): { ok: boolean; error?: string } {
  const word = raw.trim();
  if (!word) return { ok: false, error: "Escreva um nome antes de enviar." };
  if (word.length > MAX_CHARS) return { ok: false, error: `Máximo de ${MAX_CHARS} caracteres.` };
  if (!normalize(word)) return { ok: false, error: "Use pelo menos uma letra ou número." };
  return { ok: true };
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Distribui as palavras: cada jogador recebe a palavra escrita por outro.
 * Retorna { jogadorQueRecebe: quemEscreveu }. Nunca devolve a própria.
 */
export function derange(ids: string[]): Record<string, string> {
  if (ids.length < 2) throw new Error("Precisa de pelo menos 2 jogadores.");
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const from = shuffle(ids);
    if (ids.every((id, i) => from[i] !== id)) {
      return Object.fromEntries(ids.map((id, i) => [id, from[i]]));
    }
  }
  // Fallback determinístico: rotação simples, que nunca tem ponto fixo.
  const rot = shuffle(ids);
  return Object.fromEntries(rot.map((id, i) => [id, rot[(i + 1) % rot.length]]));
}

/** Sorteia `count` palavras do tema, ignorando as já usadas na partida. */
export function drawWords(theme: ThemeId, count: number, used: string[] = []): string[] {
  const usados = new Set(used.map(normalize));
  const disponiveis = poolFor(theme).filter((w) => !usados.has(normalize(w)));
  const fonte = disponiveis.length >= count ? disponiveis : poolFor(theme);
  return shuffle(fonte).slice(0, count);
}

export function makeRoomCode(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1
  return Array.from({ length: 5 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}

/** Ordena por pontos e devolve colocação com empate compartilhado. */
export function podium<T extends { id: string; score: number }>(players: T[]) {
  const ordenado = [...players].sort((a, b) => b.score - a.score);
  let posicao = 0;
  let anterior: number | null = null;
  return ordenado.map((p, i) => {
    if (anterior === null || p.score < anterior) posicao = i + 1;
    anterior = p.score;
    return { ...p, place: posicao };
  });
}
