import { Carta } from "@/components/Carta";
import { Entrada } from "@/components/Entrada";
import { RegistroForm } from "@/components/RegistroForm";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14">
      <header className="flex items-baseline justify-between">
        <p className="font-serif text-2xl tracking-tight">Senda</p>
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted">Ejemplo</p>
      </header>

      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-12 lg:gap-6 lg:py-16">
        <Entrada className="order-2 lg:order-1 lg:col-span-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted">Taller de papel</p>
          <h1 className="mt-4 max-w-xl font-serif text-[2.7rem] leading-[0.96] font-light tracking-[-0.03em] text-balance sm:text-6xl lg:text-[4.5rem]">
            El regalo llega a tu <em className="italic">correo.</em>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            Una persona, un email. Confirmas ese correo con un código y te escribimos nosotros con el detalle.
          </p>
          <RegistroForm />
        </Entrada>

        <Entrada className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8" delay={0.12}>
          <Carta />
        </Entrada>
      </div>

      <footer className="flex flex-col gap-2 border-t border-line pt-5 text-xs tracking-wide text-muted sm:flex-row sm:items-baseline sm:justify-between">
        <span>El regalo se envía a mano desde la hoja de registros.</span>
        <span>El mismo email no puede apuntarse dos veces.</span>
      </footer>
    </main>
  );
}
