import { Carta } from "@/components/Carta";
import { Entrada } from "@/components/Entrada";
import { RegistroForm } from "@/components/RegistroForm";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14">
      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-12 lg:gap-6 lg:py-16">
        <Entrada className="order-2 lg:order-1 lg:col-span-7">
          <h1 className="tipo-display max-w-xl text-6xl leading-[0.9] font-bold uppercase tracking-tight text-balance sm:text-7xl lg:text-8xl">
            El <span className="marca px-1">conocimiento</span> llega a tu casa.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            Una persona, una dirección. Confirmas el email con un código y te enviamos el conocimiento.
          </p>
          <RegistroForm />
        </Entrada>

        <Entrada className="order-1 lg:order-2 lg:col-span-5" delay={0.12}>
          <Carta />
        </Entrada>
      </div>

    </main>
  );
}
