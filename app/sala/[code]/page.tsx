"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRoom } from "@/lib/useRoom";
import { MAX_CHARS, podium, validateWord } from "@/lib/game";
import { THEMES, ThemeId } from "@/lib/words";

export default function Sala(props: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<Aviso texto="Entrando na mesa…" />}>
      <SalaConteudo {...props} />
    </Suspense>
  );
}

function SalaConteudo({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const criar = useSearchParams().get("criar") === "1";
  const sala = useRoom(code.toUpperCase(), criar);
  const { room, uid, jogadores, ids, souHost, carregando, naoExiste } = sala;

  if (carregando) return <Aviso texto="Entrando na mesa…" />;
  if (naoExiste)
    return (
      <Aviso texto={`Nenhuma sala com o código ${code.toUpperCase()}.`}>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-ambar px-5 py-3 font-display font-bold text-noite">
          Voltar ao início
        </Link>
      </Aviso>
    );
  if (!room || !uid) return <Aviso texto="Sincronizando…" />;

  const lista = podium(ids.map((id) => ({ id, score: jogadores[id]?.score ?? 0 })));

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-6">
      <Cabecalho code={code.toUpperCase()} room={room} restante={sala.segundosRestantes} />

      {room.status === "lobby" && <Lobby sala={sala} />}
      {room.status === "collecting" && <Coleta sala={sala} />}
      {room.status === "playing" && <Jogo sala={sala} />}
      {room.status === "roundEnd" && <FimDeRodada sala={sala} />}
      {room.status === "finished" && <Podio sala={sala} lista={lista} />}

      {room.status !== "finished" && room.status !== "lobby" && (
        <Placar sala={sala} lista={lista} />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ peças */

function Aviso({ texto, children }: { texto: string; children?: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-xl">{texto}</p>
        {children}
      </div>
    </main>
  );
}

function Cabecalho({ code, room, restante }: { code: string; room: any; restante: number | null }) {
  const fase =
    room.status === "lobby"
      ? "Montando a mesa"
      : room.mode === "classico"
        ? `Rodada ${room.round} de ${room.bestOf}`
        : "Corrida por pontos";
  return (
    <header className="mb-6">
      <div className="fita h-1.5 w-full rounded-full" />
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-papel/45">Sala</p>
          <p className="font-mono text-2xl tracking-[0.3em] text-ambar">{code}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-semibold">{fase}</p>
          {restante !== null && (
            <p className={`font-mono text-3xl ${restante <= 5 ? "text-coral" : "text-papel/70"}`}>
              {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

function Placar({ sala, lista }: { sala: any; lista: any[] }) {
  return (
    <section className="mt-10 border-t border-papel/10 pt-5">
      <p className="font-mono text-xs uppercase tracking-widest text-papel/45">Pontos</p>
      <ul className="mt-3 space-y-2">
        {lista.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-sm">
            <span className={p.id === sala.uid ? "font-semibold text-ambar" : "text-papel/75"}>
              {sala.jogadores[p.id]?.nome ?? "—"}
              {p.id === sala.uid && " (você)"}
            </span>
            <span className="font-mono">{p.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ lobby */

function Lobby({ sala }: { sala: any }) {
  const { room, ids, jogadores, souHost, configurar, iniciar } = sala;
  const poucos = ids.length < 3;

  const Opcao = ({ ativo, onClick, children }: any) => (
    <button
      onClick={onClick}
      disabled={!souHost}
      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
        ativo ? "border-ambar bg-ambar/15 text-ambar" : "border-papel/15 text-papel/70"
      } disabled:opacity-60`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-papel/45">
          Na mesa · {ids.length}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ids.map((id: string) => (
            <li
              key={id}
              className="rounded-full border border-papel/15 bg-noite-2/60 px-3.5 py-1.5 text-sm"
            >
              {jogadores[id]?.nome}
              {id === room.hostId && <span className="ml-1.5 text-ambar">★</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-papel/50">
          Passe o código lá de cima pra galera. Mínimo de 3 pessoas.
        </p>
      </section>

      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-papel/45">Modo</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Opcao ativo={room.mode === "classico"} onClick={() => configurar({ mode: "classico" })}>
            Clássico
            <span className="mt-0.5 block text-xs font-normal opacity-70">Melhor de 1, 3 ou 5</span>
          </Opcao>
          <Opcao
            ativo={room.mode === "competicao"}
            onClick={() => configurar({ mode: "competicao", source: "tema" })}
          >
            Competição
            <span className="mt-0.5 block text-xs font-normal opacity-70">Pontos no cronômetro</span>
          </Opcao>
        </div>
      </section>

      {room.mode === "classico" ? (
        <section>
          <p className="font-mono text-xs uppercase tracking-widest text-papel/45">Partidas</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[1, 3, 5].map((n) => (
              <Opcao key={n} ativo={room.bestOf === n} onClick={() => configurar({ bestOf: n })}>
                {n === 1 ? "Partida única" : `Melhor de ${n}`}
              </Opcao>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <p className="font-mono text-xs uppercase tracking-widest text-papel/45">Duração</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[300, 600, 900].map((s) => (
              <Opcao key={s} ativo={room.durationSec === s} onClick={() => configurar({ durationSec: s })}>
                {s / 60} min
              </Opcao>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-papel/45">
          De onde vêm as palavras
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Opcao
            ativo={room.source === "livre"}
            onClick={() => room.mode === "classico" && configurar({ source: "livre" })}
          >
            Livre
            <span className="mt-0.5 block text-xs font-normal opacity-70">
              {room.mode === "classico" ? "Cada um escreve uma" : "Só no clássico"}
            </span>
          </Opcao>
          <Opcao ativo={room.source === "tema"} onClick={() => configurar({ source: "tema" })}>
            Por tema
            <span className="mt-0.5 block text-xs font-normal opacity-70">O jogo sorteia</span>
          </Opcao>
        </div>

        {room.source === "tema" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <Opcao
                key={t.id}
                ativo={room.theme === t.id}
                onClick={() => configurar({ theme: t.id as ThemeId })}
              >
                {t.emoji} {t.label}
                <span className="mt-0.5 block text-xs font-normal opacity-70">{t.hint}</span>
              </Opcao>
            ))}
          </div>
        )}
      </section>

      {souHost ? (
        <button
          onClick={iniciar}
          disabled={poucos}
          className="w-full rounded-xl bg-ambar px-4 py-4 font-display text-lg font-extrabold text-noite disabled:bg-papel/15 disabled:text-papel/40"
        >
          {poucos ? "Faltam jogadores" : "Começar"}
        </button>
      ) : (
        <p className="rounded-xl border border-papel/15 px-4 py-4 text-center text-sm text-papel/60">
          {jogadores[room.hostId]?.nome} está escolhendo as regras.
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- coleta */

function Coleta({ sala }: { sala: any }) {
  const { room, uid, ids, jogadores, entregar, marcarDigitando } = sala;
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  const destino = Object.entries(room.map ?? {}).find(([, g]) => g === uid)?.[0] as string | undefined;

  useEffect(() => {
    setTexto("");
    setEnviado(false);
    setErro("");
  }, [room.round]);

  // envio automático quando o tempo acaba
  useEffect(() => {
    if (enviado || !destino) return;
    if (sala.segundosRestantes === 0 && validateWord(texto).ok) enviar();
  }, [sala.segundosRestantes]);

  async function enviar() {
    if (!destino || enviado) return;
    const v = validateWord(texto);
    if (!v.ok) return setErro(v.error!);
    setEnviado(true);
    await entregar(destino, texto.trim(), room.nonce?.[destino] ?? 1);
  }

  if (!destino) return <Aviso texto="Preparando a rodada…" />;

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-3xl font-extrabold leading-tight">
          Escreva um nome para{" "}
          <span className="text-ambar">{jogadores[destino]?.nome}</span>
        </h2>
        <p className="mt-2 text-sm text-papel/55">
          Pessoa real, personagem, o que você quiser. Ela nunca vai ver — todos os outros sim.
        </p>
      </div>

      {enviado ? (
        <div className="rounded-xl border border-menta/40 bg-menta/10 px-4 py-5 text-center">
          <p className="font-display text-lg font-semibold text-menta">Enviado</p>
          <p className="mt-1 text-sm text-papel/60">Esperando o resto da mesa.</p>
        </div>
      ) : (
        <div>
          <input
            autoFocus
            value={texto}
            maxLength={MAX_CHARS}
            onChange={(e) => {
              setTexto(e.target.value);
              setErro("");
              marcarDigitando(e.target.value.length > 0);
            }}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
            placeholder="Ex.: Goku, Anitta, Darth Vader…"
            className="w-full rounded-xl border border-papel/15 bg-noite-2/70 px-4 py-4 text-lg placeholder:text-papel/30"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-coral">{erro}</span>
            <span className="font-mono text-papel/40">
              {texto.length}/{MAX_CHARS}
            </span>
          </div>
          <button
            onClick={enviar}
            className="mt-4 w-full rounded-xl bg-ambar px-4 py-4 font-display text-lg font-extrabold text-noite"
          >
            Enviar palavra
          </button>
        </div>
      )}

      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-papel/45">A mesa</p>
        <ul className="mt-3 space-y-2 text-sm">
          {ids.map((id: string) => {
            const alvo = Object.entries(room.map ?? {}).find(([, g]) => g === id)?.[0] as string;
            const pronto = alvo && room.entregue?.[alvo];
            return (
              <li key={id} className="flex items-center justify-between">
                <span className="text-papel/75">{jogadores[id]?.nome}</span>
                <span className={pronto ? "text-menta" : "text-papel/40"}>
                  {pronto
                    ? "já escolheu"
                    : room.digitando?.[id]
                      ? "está digitando…"
                      : "pensando…"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- jogo */

function Jogo({ sala }: { sala: any }) {
  const { room, uid, ids, jogadores, palavrasDosOutros, palpitar } = sala;
  const [palpite, setPalpite] = useState("");
  const [errou, setErrou] = useState(false);
  const [acertou, setAcertou] = useState(false);

  const minhaProntaPronta = !!room.hashes?.[uid];

  useEffect(() => {
    setPalpite("");
    setAcertou(false);
    setErrou(false);
  }, [room.round, room.nonce?.[uid]]);

  async function tentar() {
    if (!palpite.trim()) return;
    const ok = await palpitar(palpite);
    if (ok) setAcertou(true);
    else {
      setErrou(true);
      setPalpite("");
      setTimeout(() => setErrou(false), 900);
    }
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto w-full max-w-[300px]">
        <div className="cartao cartao--fechado grid h-40 place-items-center px-6 text-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] opacity-60">Você é</p>
            <p className="mt-2 font-display text-2xl font-extrabold">
              {minhaProntaPronta ? "??????" : "recebendo…"}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-center text-sm text-papel/55">
          Faça perguntas de sim ou não pra mesa. Quando achar que sabe, chuta aqui.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={palpite}
            onChange={(e) => setPalpite(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tentar()}
            disabled={acertou}
            placeholder="Eu sou…"
            className={`w-full rounded-xl border bg-noite-2/70 px-4 py-3.5 text-lg transition ${
              errou ? "border-coral" : "border-papel/15"
            }`}
          />
          <button
            onClick={tentar}
            disabled={acertou}
            className="shrink-0 rounded-xl bg-ambar px-5 font-display font-extrabold text-noite disabled:opacity-40"
          >
            Chutar
          </button>
        </div>
        {errou && <p className="mt-2 text-sm text-coral">Não é essa. Continua tentando.</p>}
        {acertou && (
          <p className="mt-2 text-sm text-menta">Acertou! Ponto seu.</p>
        )}
      </div>

      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-papel/45">
          Quem é quem na mesa
        </p>
        <ul className="mt-3 space-y-2">
          {ids
            .filter((id: string) => id !== uid)
            .map((id: string) => (
              <li
                key={id}
                className="flex items-center justify-between rounded-xl border border-papel/12 bg-noite-2/50 px-4 py-3"
              >
                <span className="text-sm text-papel/60">{jogadores[id]?.nome}</span>
                <span className="font-display font-bold text-ambar">
                  {palavrasDosOutros[id] || "…"}
                </span>
              </li>
            ))}
        </ul>
        <p className="mt-3 text-xs text-papel/40">
          Não conte em voz alta. Responda só sim ou não.
        </p>
      </section>
    </div>
  );
}

/* --------------------------------------------------------- fim de rodada */

function FimDeRodada({ sala }: { sala: any }) {
  const { room, jogadores, uid } = sala;
  const vencedor = room.vencedorRodada;
  return (
    <div className="space-y-7 text-center">
      <div className="mx-auto w-full max-w-[300px]">
        <div className="cartao grid h-40 place-items-center px-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] opacity-55">Você era</p>
            <p className="mt-2 font-display text-3xl font-extrabold">
              {room.reveal?.[uid] ?? "…"}
            </p>
          </div>
        </div>
      </div>
      <p className="font-display text-xl">
        {vencedor === uid ? (
          <span className="text-menta">Você fechou a rodada.</span>
        ) : (
          <>
            <span className="text-ambar">{jogadores[vencedor]?.nome}</span> adivinhou primeiro.
          </>
        )}
      </p>
      <p className="text-sm text-papel/50">
        {room.round >= room.bestOf ? "Fechando o pódio…" : "Próxima rodada em instantes."}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- pódio */

function Podio({ sala, lista }: { sala: any; lista: any[] }) {
  const { jogadores, souHost, jogarNovamente, uid } = sala;
  const medalha = ["🥇", "🥈", "🥉"];
  return (
    <div className="space-y-8">
      <h2 className="font-display text-4xl font-extrabold leading-none">
        Fim de
        <br />
        <span className="text-ambar">jogo</span>
      </h2>

      <ul className="space-y-2">
        {lista.map((p) => (
          <li
            key={p.id}
            className={`flex items-center gap-4 rounded-xl border px-4 py-4 ${
              p.place === 1 ? "border-ambar bg-ambar/10" : "border-papel/12"
            }`}
          >
            <span className="w-8 text-center text-2xl">{medalha[p.place - 1] ?? p.place}</span>
            <span className="flex-1 font-display font-bold">
              {jogadores[p.id]?.nome}
              {p.id === uid && <span className="ml-1 text-papel/45">(você)</span>}
            </span>
            <span className="font-mono text-lg">{p.score}</span>
          </li>
        ))}
      </ul>

      {souHost ? (
        <button
          onClick={jogarNovamente}
          className="w-full rounded-xl bg-ambar px-4 py-4 font-display text-lg font-extrabold text-noite"
        >
          Jogar de novo
        </button>
      ) : (
        <p className="text-center text-sm text-papel/55">
          {jogadores[sala.room.hostId]?.nome} pode começar outra.
        </p>
      )}

      <Link href="/" className="block text-center text-sm text-papel/45 underline">
        Sair da sala
      </Link>
    </div>
  );
}
