import { useEffect, useRef, useState, type FormEvent } from 'react';
import { normalizeName } from '../../highscores/ranking';
import { Button } from '../Button/Button';
import { TextField } from '../TextField/TextField';
import styles from './NameEntry.module.css';

export interface NameEntryProps {
  /** The 1-based place in the top 30. */
  place: number;
  /** The last name used; empty on the very first game. */
  initialName: string;
  /** Called with the trimmed name, or „Gracz” when the field is empty. */
  onSave: (name: string) => void;
}

/** The name form of „Koniec gry”: the field opens focused with its text selected. */
export function NameEntry({ place, initialName, onSave }: NameEntryProps) {
  const [name, setName] = useState(initialName);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(normalizeName(name));
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.head}>
        {place === 1 && <span className={styles.badge}>Nowy rekord</span>}
        <p className={styles.place}>{place}. miejsce w najlepszych wynikach</p>
      </div>
      <TextField
        ref={input}
        id="name-entry"
        label="Twoje imię"
        value={name}
        onChange={setName}
        placeholder="Gracz"
        hint="Puste pole zapisze wynik jako „Gracz”."
        autoComplete="off"
        spellCheck={false}
      />
      <Button variant="primary" type="submit" block>
        Zapisz wynik
      </Button>
    </form>
  );
}
