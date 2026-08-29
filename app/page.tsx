import Board from "@/components/Board";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl grow px-4 py-10">
      <h1 className="text-2xl font-semibold">stellar-contrib-board</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Manual XLM payouts to stellar-org contributors, on testnet.
      </p>
      <Board />
    </main>
  );
}
