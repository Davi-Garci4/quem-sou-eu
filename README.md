# Quem sou eu?

Jogo de mesa presencial em que cada pessoa joga pelo próprio celular. A palavra
de cada jogador aparece na tela de todo mundo — menos na dele.

## Stack

- Next.js 15 (App Router) + React 19 + Tailwind v4 → deploy na Vercel
- Firebase Realtime Database (sincronização) + Auth anônima (identidade)
- Sem backend próprio: o cliente do host conduz as transições de fase

## Rodar local

```bash
npm install
cp .env.local.example .env.local   # preencha com as chaves do seu projeto Firebase
npm run dev
```

## Firebase, passo a passo

1. Crie um projeto no console do Firebase.
2. Ative **Authentication → Sign-in method → Anônimo**.
3. Crie um **Realtime Database** (não o Firestore).
4. Publique o conteúdo de `database.rules.json` em Realtime Database → Regras.
5. Copie as chaves do app web para o `.env.local` e para as Environment
   Variables da Vercel.

## Como a palavra fica escondida de você

As palavras vivem em `secrets/{sala}/{jogador}`. A regra
`auth.uid != $pid` faz o Firebase recusar a leitura do próprio nó — por isso
os segredos ficam **fora** do nó da sala (permissão de leitura em RTDB cascateia
para os filhos e não pode ser revogada abaixo).

Ninguém sorteia a própria palavra. A cada rodada o app monta um *derangement*
(permutação sem ponto fixo) dos jogadores: cada um é responsável por escrever ou
sortear a palavra de outra pessoa e escreve direto no nó dela. Nem o host lê a
palavra que vai receber.

Para validar o palpite sem ler a resposta, o app compara o SHA-256 do chute com
um hash público salgado com sala + jogador + rodada.

Limite conhecido: como o banco de palavras é público, o hash é teoricamente
quebrável por força bruta nos modos por tema. É jogo entre amigos numa mesa —
não vale a pena o servidor que resolveria isso agora.

## Modos

**Clássico** — melhor de 1, 3 ou 5. Fonte livre: 30 segundos para cada um
escrever um nome para outra pessoa; quem não enviar recebe um sorteio. A rodada
acaba quando alguém acerta a própria palavra.

**Competição** — cronômetro de 5, 10 ou 15 minutos, palavras sorteadas por tema
sem repetição. Acertou, ganha ponto e recebe outra na hora.

## Estrutura

```
app/page.tsx              entrada: nome, criar ou entrar
app/sala/[code]/page.tsx  todas as fases da sala
lib/useRoom.ts            sincronização e motor de estados
lib/game.ts               regras puras: derangement, hash, validação, pódio
lib/words.ts              bancos de palavras por tema
database.rules.json       regras do Realtime Database
```

## Próximos passos sugeridos

- Reconexão: hoje o motor de fases mora no cliente do host; se ele fechar a aba
  no meio da partida, a sala trava. Migrar para Cloud Functions resolve.
- Banco de palavras maior (~150 por tema) e curadoria de dificuldade.
- Histórico de partidas para os vídeos: quantas perguntas até acertar.
