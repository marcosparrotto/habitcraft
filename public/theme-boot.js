// Aplica o ciclo dia/noite antes da primeira pintura, pra não piscar tema errado.
// A lógica canônica vive em src/theme/daylight.ts — aqui é só o espelho mínimo.
//
// Fica em arquivo próprio, e não inline no HTML, para o Content-Security-Policy
// poder usar script-src 'self' sem precisar liberar 'unsafe-inline'.
(function () {
  try {
    var mode = localStorage.getItem("habitcraft:theme-mode") || "auto";
    var light;
    if (mode === "light") light = 1;
    else if (mode === "dark") light = 0;
    else {
      var now = new Date();
      var h = now.getHours() + now.getMinutes() / 60;
      var step = function (t) {
        var x = Math.min(1, Math.max(0, t));
        return x * x * (3 - 2 * x);
      };
      if (h <= 5.5 || h >= 19) light = 0;
      else if (h >= 7 && h <= 17.5) light = 1;
      else if (h < 7) light = step((h - 5.5) / 1.5);
      else light = 1 - step((h - 17.5) / 1.5);
    }
    var root = document.documentElement;
    root.style.setProperty("--night-mix", (1 - light) * 100 + "%");
    root.dataset.theme = light >= 0.5 ? "light" : "dark";
  } catch (e) {
    /* tema cai no padrão noturno do CSS */
  }
})();
