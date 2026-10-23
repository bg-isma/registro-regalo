import Link from "next/link";
import { Carta } from "@/components/Carta";
import { Entrada } from "@/components/Entrada";
import { RegistroForm } from "@/components/RegistroForm";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14">
      <header className="flex items-baseline justify-between border-b border-line pb-5">
        <p className="tipo-display text-3xl uppercase tracking-tight">Cuaderno</p>
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">Ejemplo</p>
      </header>

      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-12 lg:gap-6 lg:py-16">
        <Entrada className="order-2 lg:order-1 lg:col-span-7">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">Una nota, un correo</p>
          <h1 className="tipo-display mt-4 max-w-xl text-6xl leading-[0.9] font-bold uppercase tracking-tight text-balance sm:text-7xl lg:text-8xl">
            El <span className="marca px-1">conocimiento</span> llega a tu correo.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            Una persona, un email. Confirmas ese correo con un código y te escribimos con el conocimiento.
          </p>
          <RegistroForm />
        </Entrada>

        <Entrada className="order-1 lg:order-2 lg:col-span-5" delay={0.12}>
          <Carta />
        </Entrada>
      </div>

      <footer className="flex flex-col gap-3 border-t border-line pt-5 text-xs tracking-wide text-muted sm:flex-row sm:items-baseline sm:justify-between">
        <span>El conocimiento se envía a mano desde la hoja de registros.</span>
        <span className="flex gap-4">
          <span>El mismo email no puede apuntarse dos veces.</span>
          <Link className="underline" href="/privacidad">
            Privacidad
          </Link>
        </span>
      </footer>
    </main>
  );
}
