/**
 * The lyric highway: the right-hand pane of the game.
 *
 * Lines scroll so the active one sits in the middle; the active word is marked
 * in yellow and shows the player's typed progress letter by letter. Non-active
 * words are dimmed so the eye is drawn forward.
 */

import { Fragment, memo, useEffect, useRef } from "react";
import { requiredCharIndices, type GameMode, type WordResult } from "../../lib/game/engine";
import type { Track, TrackWord } from "../../lib/track/types";

interface WordProps {
  word: TrackWord;
  status: WordResult;
  isActive: boolean;
  isCued: boolean;
  input: string;
  mode: GameMode;
}

function Word({ word, status, isActive, isCued, input, mode }: WordProps) {
  if (status === "hit") {
    return <span className="lyric-word is-hit">{word.text}</span>;
  }
  if (status === "miss") {
    return <span className="lyric-word is-miss">{word.text}</span>;
  }
  if (isCued) {
    return <span className="lyric-word is-cued">{word.text}</span>;
  }
  if (!isActive) {
    return <span className="lyric-word">{word.text}</span>;
  }

  // Map each character of the display text to its position in the target (or
  // none, when it is punctuation that this mode ignores).
  const positions = new Map<number, number>();
  requiredCharIndices(word.text, mode).forEach((charIndex, position) => {
    positions.set(charIndex, position);
  });

  return (
    <span className="lyric-word is-active">
      {Array.from(word.text).map((char, index) => {
        const position = positions.get(index);
        if (position === undefined) {
          return (
            <span key={index} className="lyric-char is-extra">
              {char}
            </span>
          );
        }
        const typed = position < input.length;
        const next = position === input.length;
        return (
          <span
            key={index}
            className={
              "lyric-char is-required" +
              (typed ? " is-typed" : "") +
              (next ? " is-next" : "")
            }
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

interface LineProps {
  from: number;
  to: number;
  lineIndex: number;
  active: boolean;
  cued: boolean;
  words: TrackWord[];
  results: WordResult[];
  pointer: number;
  input: string;
  mode: GameMode;
}

const LyricLine = memo(function LyricLine({
  from,
  to,
  lineIndex,
  active,
  cued,
  words,
  results,
  pointer,
  input,
  mode,
}: LineProps) {
  return (
    <p data-line={lineIndex} className={"lyric-line" + (active ? " is-active" : "")}>
      {words.slice(from, to).map((word, offset) => {
        const index = from + offset;
        return (
          <Fragment key={index}>
            {offset > 0 ? " " : null}
            <Word
              word={word}
              status={results[index] ?? "pending"}
              isActive={index === pointer && !cued}
              isCued={index === pointer && cued}
              input={input}
              mode={mode}
            />
          </Fragment>
        );
      })}
    </p>
  );
});

interface Props {
  track: Track;
  results: WordResult[];
  pointer: number;
  input: string;
  mode: GameMode;
  /** True while the next word is still ahead of its typeable window. */
  cued: boolean;
}

export default function LyricHighway({
  track,
  results,
  pointer,
  input,
  mode,
  cued,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLine = track.words[pointer]?.line ?? track.lines.length - 1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const line = container.querySelector<HTMLElement>(`[data-line="${activeLine}"]`);
    if (!line) return;
    const top = line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [activeLine]);

  return (
    <div ref={containerRef} className="lyric-highway" aria-live="off">
      <div className="lyric-highway__inner">
        {track.lines.map((line, index) => (
          <LyricLine
            key={index}
            from={line.from}
            to={line.to}
            lineIndex={index}
            active={index === activeLine}
            cued={cued}
            words={track.words}
            results={results}
            pointer={pointer}
            input={input}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}
