import type { UndoStatus } from '../rules';

const MINUS = '\u2212';

/** The cost chip: „−20 pkt”, or „−20” in the short form of a phone. */
export function formatUndoCost(cost: number, short = false): string {
  return short ? `${MINUS}${cost}` : `${MINUS}${cost} pkt`;
}

/** The accessible name of the undo button. */
export function formatUndoName(cost: number): string {
  return `Cofnij ostatni ruch, minus ${cost} punktów`;
}

/** The tooltip, and the status line when Ctrl+Z is blocked: what undo does or why it cannot. */
export function formatUndoReason(status: UndoStatus, cost: number): string {
  switch (status) {
    case 'ok':
      return `Cofnij ostatni ruch (${formatUndoCost(cost)}, Ctrl+Z)`;
    case 'tooFewPoints':
      return `Za mało punktów: cofnięcie kosztuje ${cost} pkt`;
    case 'nothing':
      return 'Brak ruchu do cofnięcia';
    case 'gameOver':
      return 'Gra skończona';
  }
}

/** The status line after an undo. */
export function formatUndone(cost: number): string {
  return `Cofnięto ruch (${formatUndoCost(cost)})`;
}
