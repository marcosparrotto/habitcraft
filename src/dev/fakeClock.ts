/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Congela o relógio num horário do dia de hoje, só no sandbox — é assim que dá
 * pra ver o tema automático às 8h e às 21h sem esperar o dia passar.
 * Nada disso existe no app real.
 */
export function installFakeClock(hour: number): void {
  const RealDate = Date;
  const frozen = new RealDate();
  frozen.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);

  class FakeDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(frozen.getTime());
      } else {
        // @ts-expect-error repassa a assinatura original do Date
        super(...args);
      }
    }
    static now(): number {
      return frozen.getTime();
    }
  }

  (globalThis as any).Date = FakeDate;
}
