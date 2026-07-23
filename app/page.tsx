"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { makeRoomCode } from "@/lib/game";

export default function Home() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    setNome(localStorage.getItem("qse:nome") ?? "");
  }, []);

  function guardarNome(): boolean {
    const limpo = nome.trim().slice(0, 16);
    if (!limpo) {
      setErro("Escreva seu nome pra entrar na mesa.");
      return false;
    }
    localStorage.setItem("qse:nome", limpo);
    return true;
  }

  function criar() {
    if (!guardarNome()) return;
    router.push(`/sala/${makeRoomCode()}?criar=1`);
  }

  function entrar() {
    if (!guardarNome()) return;
    const c = codigo.trim().toUpperCase();
    if (c.length !== 5) {
      setErro("O código da sala tem 5 letras.");
      return;
    }
    router.push(`/sala/${c}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-8">
      <div className="fita h-1.5 w-full rounded-full" />

      <header className="mt-10">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-ambar">
          Mesa de amigos · celular de cada um
        </p>
        <h1 className="mt-3 font-display text-6xl leading-[0.88] font-extrabold">
          Quem
          <br />
          sou
          <br />
          <span className="text-ambar">eu?</span>
        </h1>
      </header>

      <div className="relative mx-auto mt-10 w-full max-w-[280px]">
        <div className="cartao cartao--fechado grid h-36 place-items-center px-6 text-center">
          <p className="font-display text-lg font-semibold">
            Sua palavra fica escondida
            <span className="mt-1 block text-sm font-normal opacity-70">
              — só os outros conseguem ver
            </span>
          </p>
        </div>
      </div>

      <section className="mt-12 space-y-6">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-papel/60">Seu nome</span>
          <input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setErro("");
            }}
            maxLength={16}
            placeholder="Como te chamam na mesa"
            className="mt-2 w-full rounded-xl border border-papel/15 bg-noite-2/70 px-4 py-3.5 text-lg placeholder:text-papel/30"
          />
        </label>

        <button
          onClick={criar}
          className="w-full rounded-xl bg-ambar px-4 py-4 font-display text-lg font-extrabold text-noite active:scale-[0.99]"
        >
          Criar uma sala
        </button>

        <div className="flex items-center gap-3 text-papel/35">
          <div className="h-px flex-1 bg-papel/15" />
          <span className="font-mono text-xs uppercase tracking-widest">ou</span>
          <div className="h-px flex-1 bg-papel/15" />
        </div>

        <div className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setErro("");
            }}
            maxLength={5}
            placeholder="CÓDIGO"
            inputMode="text"
            autoCapitalize="characters"
            className="w-full rounded-xl border border-papel/15 bg-noite-2/70 px-4 py-3.5 text-center font-mono text-2xl tracking-[0.35em] placeholder:tracking-[0.2em] placeholder:text-papel/25"
          />
          <button
            onClick={entrar}
            className="shrink-0 rounded-xl border border-papel/25 px-5 font-display font-semibold active:scale-[0.99]"
          >
            Entrar
          </button>
        </div>

        {erro && <p className="text-sm text-coral">{erro}</p>}
      </section>

      <p className="mt-auto pt-12 text-sm leading-relaxed text-papel/45">
        Junte de 3 a 10 pessoas na mesma mesa. Cada um entra pelo próprio celular, a tela mostra as
        palavras de todo mundo — menos a sua. Aí é só perguntar até descobrir.
      </p>
    </main>
  );
}
