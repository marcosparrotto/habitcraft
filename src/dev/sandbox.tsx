import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { installFakeClock } from "./fakeClock";

// ?hora=8 / ?hora=21 congela o relógio pra testar o tema automático
const hora = new URLSearchParams(location.search).get("hora");
if (hora !== null) installFakeClock(parseFloat(hora));

// o router do app espera "/" na raiz; "/sandbox.html" não casa com nenhuma rota
history.replaceState({}, "", `/${location.search}`);

// importados depois dos patches pra que os módulos já os enxerguem
const { installFakeSupabase } = await import("./fakeSupabase");
installFakeSupabase();

const { default: App } = await import("../App");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
