import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad — Cuaderno",
  description: "Qué datos recoge esta página de ejemplo y para qué se usan.",
};

const bloques = [
  {
    titulo: "1. Responsable",
    texto:
      "Esta página es un ejemplo. El responsable del tratamiento es la persona que la publica y administra la hoja de registros. No es una empresa identificada en este texto: sustituye este apartado por tu nombre, tu dirección y un email de contacto antes de usarla con personas reales.",
  },
  {
    titulo: "2. Datos que se recogen",
    texto:
      "Nombre, email y la casilla de aceptación. También se guardan la fecha del registro y, de forma temporal, un código de seis cifras para comprobar que el buzón es tuyo. No se pide dirección postal, teléfono ni documento de identidad.",
  },
  {
    titulo: "3. Para qué se usan",
    texto:
      "Para enviarte el código de comprobación y, si lo confirmas, el conocimiento que pediste. La hoja sirve para no escribir dos veces a la misma persona y para anotar cuándo se envió. No se usa para publicidad ni para ceder la lista a terceros con ese fin.",
  },
  {
    titulo: "4. Por qué es lícito",
    texto:
      "Porque tú solicitas el envío. La casilla deja constancia de que aceptas recibir el código y el conocimiento en ese email.",
  },
  {
    titulo: "5. Qué es obligatorio",
    texto:
      "El nombre, el email y la casilla. Sin ellos no se puede comprobar el buzón ni hacer el envío. El resto de la web se puede ver sin registrarse.",
  },
  {
    titulo: "6. Cuánto tiempo se conservan",
    texto:
      "El código de comprobación caduca a los 30 minutos y se borra al confirmar o al caducar. El nombre y el email se conservan el tiempo necesario para hacer el envío y revisar que no se repita, como máximo 12 meses desde el registro, salvo que pidas el borrado antes.",
  },
  {
    titulo: "7. Quién más interviene",
    texto:
      "Los datos se guardan en una hoja de Google y el código se envía por el correo de la cuenta que administra el ejemplo. La casilla «No soy un robot» la presta Google reCAPTCHA. Esos proveedores tratan los datos para prestar ese servicio. La hoja no es pública.",
  },
  {
    titulo: "8. Tus derechos",
    texto:
      "Puedes pedir acceso, rectificación, supresión, limitación u oposición escribiendo al contacto que figure en el apartado 1 cuando lo completes. También puedes reclamar ante la Agencia Española de Protección de Datos.",
  },
  {
    titulo: "9. Comunicaciones comerciales",
    texto:
      "El mensaje con el código y el mensaje con el conocimiento responden a tu solicitud. No autorizan un boletín ni otras ofertas.",
  },
  {
    titulo: "10. Datos de otras personas",
    texto:
      "Escribe solo tu propio email. Si facilitas el de otra persona, debes contar con su autorización.",
  },
  {
    titulo: "11. Menores",
    texto:
      "El formulario no está dirigido a menores de 14 años. No envíes sus datos.",
  },
  {
    titulo: "12. Decisiones automatizadas",
    texto:
      "La comprobación del código y de la casilla es automática y solo decide si el email entra en la lista. No produce una decisión sobre tu persona más allá de ese envío.",
  },
  {
    titulo: "13. Seguridad",
    texto:
      "La hoja permanece en una cuenta privada. La clave secreta de reCAPTCHA no se publica en la web. Aun así, ningún envío por internet es infalible.",
  },
  {
    titulo: "14. Cambios",
    texto:
      "Si cambia el uso de los datos, esta página se actualizará. La versión visible aquí es la que está en vigor.",
  },
];

export default function Privacidad() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8 sm:px-10">
      <header className="flex items-baseline justify-between border-b border-line pb-5">
        <Link className="tipo-display text-3xl uppercase tracking-tight" href="/">
          Cuaderno
        </Link>
        <Link className="text-[0.68rem] uppercase tracking-[0.22em] text-muted" href="/">
          Volver
        </Link>
      </header>

      <h1 className="tipo-display mt-10 text-5xl leading-[0.9] font-bold uppercase sm:text-7xl">
        Política de <span className="marca px-1">privacidad</span>
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-muted">
        Texto de ejemplo para esta página. No copies una política ajena: los datos, el responsable y la finalidad tienen que ser los tuyos.
      </p>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {bloques.map((bloque) => (
          <section className="py-6" key={bloque.titulo}>
            <h2 className="tipo-display text-2xl uppercase">{bloque.titulo}</h2>
            <p className="mt-3 text-sm leading-relaxed">{bloque.texto}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
