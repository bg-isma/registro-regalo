import { Carta } from "./Carta";
import { RegistroForm } from "./RegistroForm";

export function Pagina() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14">
      <div className="grid flex-1 items-start gap-y-0 py-6 lg:grid-cols-12 lg:gap-x-8 lg:py-10">
        <div className="order-2 lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <h1 className="tipo-display max-w-xl text-6xl leading-[0.9] font-bold uppercase tracking-tight text-balance sm:text-7xl lg:text-8xl">
            El <span className="marca px-1">conocimiento</span> llega a tu casa.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            Una persona, una dirección. Confirmas el email con un código y te enviamos el conocimiento.
          </p>
        </div>

        <div className="order-1 hidden lg:col-span-5 lg:col-start-8 lg:row-span-6 lg:row-start-1 lg:block lg:self-center">
          <Carta />
        </div>

        <RegistroForm />
      </div>
    </main>
  );
}
