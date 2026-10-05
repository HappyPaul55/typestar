/**
 * Sync calibration. Captions and the embedded player drift a little depending
 * on connection and buffering; the offset nudges every word in time.
 */

interface Props {
  offset: number;
  onChange(offset: number): void;
  onClose(): void;
}

export default function Calibration({ offset, onChange, onClose }: Props) {
  return (
    <div className="calibration">
      <p className="comment">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        sync
      </p>
      <p className="calibration__help">
        If the words run ahead of the music, nudge them later. If they lag,
        nudge them earlier.
      </p>

      <label className="calibration__row">
        <span className="calibration__label">offset</span>
        <input
          type="range"
          min={-0.6}
          max={0.6}
          step={0.02}
          value={offset}
          onChange={(event) => onChange(Number(event.target.value))}
          className="calibration__range"
        />
        <span className="calibration__value">
          {offset >= 0 ? "+" : ""}
          {offset.toFixed(2)}s
        </span>
      </label>

      <div className="calibration__actions">
        <button type="button" className="btn-game" onClick={() => onChange(0)}>
          Reset
        </button>
        <button type="button" className="btn-game btn-game--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
