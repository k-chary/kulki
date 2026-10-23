// Reads tokens.css as text so the Storybook „Tokens” page renders the real
// file and cannot drift from it.

export type TokenContext = 'base' | 'light' | 'dark' | 'motion' | 'reduced';

export interface Token {
  name: string;
  value: string;
  /** The trailing comment on the declaration, if any. */
  note?: string;
}

export interface TokenGroup {
  /** The comment heading inside the block, e.g. „Type”; empty before the first one. */
  title: string;
  tokens: Token[];
}

export interface TokenBlock {
  selector: string;
  context: TokenContext;
  groups: TokenGroup[];
}

/**
 * Splits tokens.css into its rule blocks. Blocks inside @media are skipped:
 * they repeat the values of the matching data-theme / data-motion blocks.
 */
export function parseTokens(css: string): TokenBlock[] {
  const blocks: TokenBlock[] = [];
  let i = 0;
  let prelude = '';

  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      i = skipComment(css, i);
      continue;
    }
    const char = css[i];
    if (char === '{') {
      const end = matchingBrace(css, i);
      const selector = prelude.trim().replace(/\s+/g, ' ');
      if (!selector.startsWith('@')) {
        blocks.push({
          selector,
          context: contextOf(selector),
          groups: parseBody(css.slice(i + 1, end)),
        });
      }
      prelude = '';
      i = end + 1;
      continue;
    }
    prelude += char;
    i++;
  }
  return blocks;
}

/** All tokens of the first block in a context, keyed by name. */
export function tokenValues(blocks: TokenBlock[], context: TokenContext): Map<string, Token> {
  const block = blocks.find((b) => b.context === context);
  const map = new Map<string, Token>();
  for (const group of block?.groups ?? []) {
    for (const token of group.tokens) map.set(token.name, token);
  }
  return map;
}

function contextOf(selector: string): TokenContext {
  if (selector.includes('data-theme="dark"')) return 'dark';
  if (selector.includes('data-theme="light"')) return 'light';
  if (selector.includes('data-motion="reduced"')) return 'reduced';
  if (selector.includes('data-motion="full"')) return 'motion';
  return 'base';
}

function parseBody(body: string): TokenGroup[] {
  let current: TokenGroup = { title: '', tokens: [] };
  const groups = [current];
  let declaration = '';
  let depth = 0;
  let i = 0;
  let pendingNote: string | undefined;

  const finish = () => {
    const match = /^(--[\w-]+)\s*:\s*([\s\S]*)$/.exec(declaration.trim());
    const [, name, value] = match ?? [];
    if (name && value !== undefined) {
      const token: Token = { name, value: value.trim().replace(/\s+/g, ' ') };
      if (pendingNote) token.note = pendingNote;
      pendingNote = undefined;
      current.tokens.push(token);
    }
    declaration = '';
  };

  while (i < body.length) {
    if (body.startsWith('/*', i)) {
      const end = skipComment(body, i);
      const text = body.slice(i + 2, end - 2).trim();
      const lineStart = body.lastIndexOf('\n', i - 1) + 1;
      const ownLine = body.slice(lineStart, i).trim() === '';
      const last = current.tokens.at(-1);
      if (ownLine && declaration.trim() === '' && text.endsWith('.')) {
        // A sentence on its own line explains the token below it.
        pendingNote = text;
      } else if (ownLine && declaration.trim() === '') {
        // A short label on its own line starts a new group.
        current = { title: text, tokens: [] };
        groups.push(current);
      } else if (last && declaration.trim() === '' && !last.note) {
        last.note = text;
      }
      i = end;
      continue;
    }
    const char = body.charAt(i);
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ';' && depth === 0) {
      finish();
    } else {
      declaration += char;
    }
    i++;
  }
  finish();
  return groups.filter((g) => g.tokens.length > 0);
}

function skipComment(css: string, start: number): number {
  const end = css.indexOf('*/', start + 2);
  return end === -1 ? css.length : end + 2;
}

function matchingBrace(css: string, open: number): number {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css.startsWith('/*', i)) {
      i = skipComment(css, i) - 1;
      continue;
    }
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return i;
  }
  throw new Error('Unbalanced braces in tokens.css');
}
