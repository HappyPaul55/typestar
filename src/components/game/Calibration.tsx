/**
 * Sync calibration. Captions and the embedded player drift a little depending
 * on connection and buffering; the offset nudges every word in time.
 */

import { useT } from "../../i18n/react";

interface Props {
  offset: number;
  onChange(offset: number): void;
  onClose(): void;
}

export default function Calibration({ offset, onChange, onClose }: Props) {
  const t = useT();
  return (
    <div className="calibration">
      <p className="comment">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        {t("calibration.comment")}
      </p>
      <p className="calibration__help">{t("calibration.help")}</p>

      <label className="calibration__row">
        <span className="calibration__label">{t("calibration.offset")}</span>
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
          {t("calibration.reset")}
        </button>
        <button type="button" className="btn-game btn-game--primary" onClick={onClose}>
          {t("calibration.done")}
        </button>
      </div>
    </div>
  );
}
