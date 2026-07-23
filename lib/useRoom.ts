"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ref,
  onValue,
  update,
  get,
  set,
  onDisconnect,
  runTransaction,
  serverTimestamp,
} from "firebase/database";
import { db, ensureUid } from "./firebase";
import {
  COLLECT_SECONDS,
  GameStatus,
  Mode,
  ROUND_END_SECONDS,
  Source,
  derange,
  drawWords,
  hashWord,
  normalize,
} from "./game";
import type { ThemeId } from "./words";

export type Player = { nome: string; score: number };

export type Room = {
  hostId: string;
  status: GameStatus;
  mode: Mode;
  source: Source;
  theme: ThemeId;
  bestOf: number;
  durationSec: number;
  round: number;
  deadline?: number;
  players?: Record<string, Player>;
  map?: Record<string, string>; // quem recebe -> quem escreve
  nonce?: Record<string, number>;
  hashes?: Record<string, string>;
  entregue?: Record<string, boolean>;
  digitando?: Record<string, boolean>;
  reveal?: Record<string, string>;
  usadas?: Record<string, boolean>;
  vencedorRodada?: string | null;
};

const ROOM = (code: string) => ref(db, `rooms/${code}`);
const SECRET = (code: string, pid: string) => ref(db, `secrets/${code}/${pid}`);

export function useRoom(code: string, criar: boolean) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoExiste, setNaoExiste] = useState(false);
  const [palavrasDosOutros, setPalavras] = useState<Record<string, string>>({});
  const [agora, setAgora] = useState(() => Date.now());

  const meuNome = useMemo(
    () => (typeof window === "undefined" ? "" : localStorage.getItem("qse:nome") || "Jogador"),
    []
  );

  // relógio compartilhado por toda a UI
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 400);
    return () => clearInterval(t);
  }, []);

  // login anônimo + entrada na sala
  useEffect(() => {
    let vivo = true;
    ensureUid().then(async (id) => {
      if (!vivo) return;
      setUid(id);
      const snap = await get(ROOM(code));
      if (!snap.exists()) {
        if (!criar) {
          setNaoExiste(true);
          setCarregando(false);
          return;
        }
        await set(ROOM(code), {
          hostId: id,
          status: "lobby",
          mode: "classico",
          source: "livre",
          theme: "aleatorio",
          bestOf: 3,
          durationSec: 600,
          round: 0,
          criadaEm: serverTimestamp(),
        });
      }
      await update(ref(db, `rooms/${code}/players/${id}`), { nome: meuNome, score: 0 });
      onDisconnect(ref(db, `rooms/${code}/digitando/${id}`)).remove();
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, [code, criar, meuNome]);

  // estado da sala
  useEffect(() => {
    return onValue(ROOM(code), (snap) => {
      setRoom(snap.exists() ? (snap.val() as Room) : null);
    });
  }, [code]);

  // palavras dos outros jogadores (a minha as regras bloqueiam)
  const ids = useMemo(() => Object.keys(room?.players ?? {}), [room?.players]);
  useEffect(() => {
    if (!uid) return;
    const stops = ids
      .filter((id) => id !== uid)
      .map((id) =>
        onValue(SECRET(code, id), (snap) => {
          setPalavras((prev) => ({ ...prev, [id]: snap.val()?.word ?? "" }));
        })
      );
    return () => stops.forEach((s) => s());
  }, [code, uid, ids.join(",")]);

  const souHost = !!uid && room?.hostId === uid;
  const jogadores = room?.players ?? {};
  const totalJogadores = ids.length;

  /* ---------------------------------------------------------------- ações */

  const configurar = useCallback(
    (patch: Partial<Room>) => update(ROOM(code), patch),
    [code]
  );

  const iniciar = useCallback(async () => {
    if (totalJogadores < 3) return;
    await update(ROOM(code), {
      status: room?.source === "livre" ? "collecting" : "playing",
      round: 1,
      map: derange(ids),
      nonce: Object.fromEntries(ids.map((i) => [i, 1])),
      hashes: null,
      entregue: null,
      digitando: null,
      reveal: null,
      usadas: null,
      vencedorRodada: null,
      deadline:
        room?.mode === "competicao"
          ? Date.now() + (room?.durationSec ?? 600) * 1000
          : Date.now() + COLLECT_SECONDS * 1000,
    });
  }, [code, ids, room?.source, room?.mode, room?.durationSec, totalJogadores]);

  /** Entrega uma palavra para quem eu sou responsável. */
  const entregar = useCallback(
    async (destinatario: string, palavra: string, n: number) => {
      const hash = await hashWord(palavra, `${code}:${destinatario}:${n}`);
      await set(SECRET(code, destinatario), { word: palavra, fromId: uid });
      await update(ROOM(code), {
        [`hashes/${destinatario}`]: hash,
        [`entregue/${destinatario}`]: true,
        [`usadas/${normalize(palavra)}`]: true,
        [`digitando/${uid}`]: null,
      });
    },
    [code, uid]
  );

  const marcarDigitando = useCallback(
    (v: boolean) => uid && set(ref(db, `rooms/${code}/digitando/${uid}`), v || null),
    [code, uid]
  );

  /** Confere o palpite contra o hash da minha própria palavra. */
  const palpitar = useCallback(
    async (palpite: string): Promise<boolean> => {
      if (!uid || !room) return false;
      const n = room.nonce?.[uid] ?? 1;
      const hash = await hashWord(palpite, `${code}:${uid}:${n}`);
      if (hash !== room.hashes?.[uid]) return false;

      if (room.mode === "classico") {
        const r = await runTransaction(ref(db, `rooms/${code}/vencedorRodada`), (atual) =>
          atual ? atual : uid
        );
        if (r.snapshot.val() !== uid) return true; // acertou, mas outro chegou antes
        await runTransaction(ref(db, `rooms/${code}/players/${uid}/score`), (s) => (s ?? 0) + 1);
      } else {
        await runTransaction(ref(db, `rooms/${code}/players/${uid}/score`), (s) => (s ?? 0) + 1);
        // pede uma palavra nova a outra pessoa
        const outros = ids.filter((i) => i !== uid);
        const novoGiver = outros[Math.floor(Math.random() * outros.length)];
        await update(ROOM(code), {
          [`map/${uid}`]: novoGiver,
          [`nonce/${uid}`]: n + 1,
          [`entregue/${uid}`]: null,
          [`hashes/${uid}`]: null,
        });
      }
      return true;
    },
    [code, uid, room, ids]
  );

  /* ------------------------------------------------- entrega automática */
  // Sou responsável por alguém e ainda não entreguei? Se o modo é por tema,
  // sorteio na hora. No modo livre, quem digita é o jogador.
  const entregandoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!uid || !room || room.status === "lobby" || room.status === "finished") return;
    if (room.source !== "tema") return;
    const destino = Object.entries(room.map ?? {}).find(([, giver]) => giver === uid)?.[0];
    if (!destino || room.entregue?.[destino]) return;
    const chave = `${destino}:${room.nonce?.[destino] ?? 1}`;
    if (entregandoRef.current === chave) return;
    entregandoRef.current = chave;
    const usadas = Object.keys(room.usadas ?? {});
    const [palavra] = drawWords(room.theme, 1, usadas);
    entregar(destino, palavra, room.nonce?.[destino] ?? 1);
  }, [uid, room, entregar]);

  /* ------------------------------------------------------- motor do host */
  useEffect(() => {
    if (!souHost || !room) return;
    const tick = async () => {
      const t = Date.now();
      const entregues = Object.keys(room.entregue ?? {}).length;

      if (room.status === "collecting") {
        if (entregues >= totalJogadores) {
          await update(ROOM(code), { status: "playing", deadline: null });
        } else if (room.deadline && t > room.deadline + 3000) {
          // alguém caiu: completa o que faltou com sorteio
          const faltando = ids.filter((id) => !room.entregue?.[id]);
          const usadas = Object.keys(room.usadas ?? {});
          const sorteadas = drawWords("aleatorio", faltando.length, usadas);
          await Promise.all(
            faltando.map((id, i) => entregar(id, sorteadas[i], room.nonce?.[id] ?? 1))
          );
        }
      }

      if (room.status === "playing" && room.mode === "classico" && room.vencedorRodada) {
        await update(ROOM(code), { status: "roundEnd", deadline: t + ROUND_END_SECONDS * 1000 });
      }

      if (room.status === "playing" && room.mode === "competicao" && room.deadline && t > room.deadline) {
        await update(ROOM(code), { status: "finished", deadline: null });
      }

      if (room.status === "roundEnd" && room.deadline && t > room.deadline) {
        if (room.round >= room.bestOf) {
          await update(ROOM(code), { status: "finished", deadline: null });
        } else {
          await update(ROOM(code), {
            status: room.source === "livre" ? "collecting" : "playing",
            round: room.round + 1,
            map: derange(ids),
            nonce: Object.fromEntries(ids.map((i) => [i, (room.nonce?.[i] ?? 1) + 1])),
            hashes: null,
            entregue: null,
            digitando: null,
            reveal: null,
            vencedorRodada: null,
            deadline: room.source === "livre" ? Date.now() + COLLECT_SECONDS * 1000 : null,
          });
        }
      }
    };
    const t = setInterval(tick, 700);
    return () => clearInterval(t);
  }, [souHost, room, code, ids, totalJogadores, entregar]);

  /* --------------------------------------- revelação no fim da rodada */
  // Cada um publica a palavra que entregou, pra todo mundo ver o resultado.
  useEffect(() => {
    if (!uid || !room) return;
    if (room.status !== "roundEnd" && room.status !== "finished") return;
    const destino = Object.entries(room.map ?? {}).find(([, giver]) => giver === uid)?.[0];
    if (!destino || room.reveal?.[destino]) return;
    get(SECRET(code, destino)).then((s) => {
      const w = s.val()?.word;
      if (w) update(ROOM(code), { [`reveal/${destino}`]: w });
    });
  }, [uid, room, code]);

  const jogarNovamente = useCallback(async () => {
    await update(ROOM(code), {
      status: "lobby",
      round: 0,
      map: null,
      hashes: null,
      entregue: null,
      reveal: null,
      usadas: null,
      vencedorRodada: null,
      deadline: null,
      ...Object.fromEntries(ids.map((i) => [`players/${i}/score`, 0])),
    });
  }, [code, ids]);

  const segundosRestantes = room?.deadline
    ? Math.max(0, Math.ceil((room.deadline - agora) / 1000))
    : null;

  return {
    uid,
    room,
    jogadores,
    ids,
    souHost,
    carregando,
    naoExiste,
    palavrasDosOutros,
    segundosRestantes,
    configurar,
    iniciar,
    entregar,
    palpitar,
    marcarDigitando,
    jogarNovamente,
  };
}
