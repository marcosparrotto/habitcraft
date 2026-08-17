/**
 * A antiga aba "Horário" virou a visão "Grade de horários" dentro da aba
 * "Semana" (routes/Week.tsx), pra não ter duas superfícies com o mesmo dado.
 * Mantido só como ponte para imports antigos — pode ser apagado.
 */
export { Week as Schedule } from "./Week";
