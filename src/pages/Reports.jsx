import ReportsCenter from "./reports/ReportsCenter";

/* Scoped to the supervisor report hero. Report content and print styles stay
   in ReportsCenter; these overrides apply only on screen. */
const REPORTS_HERO_STYLES = `
@media screen {
  .sadiq-reports-hero-refresh .reports-hero {
    --hero-green: #0b4a3c;
    --hero-ink: #ffffff;
    --hero-gold: #e4cc92;
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: 25px;
    min-height: 0;
    padding: 30px 32px 22px;
    overflow: hidden;
    border: 1px solid #256250;
    border-radius: 22px;
    color: var(--hero-ink);
    background: linear-gradient(115deg, #083c32 0%, #0c5041 50%, #14624d 100%);
    box-shadow: 0 8px 26px rgba(8, 44, 33, .14);
  }

  .sadiq-reports-hero-refresh .reports-hero::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: linear-gradient(to left, #5c947d 0%, #91b298 24%, #d1b77a 66%, #e8d9b8 100%);
    pointer-events: none;
  }

  .sadiq-reports-hero-refresh .reports-hero-pattern {
    position: absolute;
    inset: 0 auto 0 0;
    width: min(45%, 460px);
    opacity: .19;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 112 112'%3E%3Cg fill='none' stroke='%23e4cc92' stroke-width='.8'%3E%3Cpath d='M56 12 69 25 87 25 87 43 100 56 87 69 87 87 69 87 56 100 43 87 25 87 25 69 12 56 25 43 25 25 43 25Z'/%3E%3Cpath d='M56 28 84 56 56 84 28 56Z M0 0 25 25 M112 0 87 25 M112 112 87 87 M0 112 25 87'/%3E%3C/g%3E%3C/svg%3E");
    background-position: left top;
    background-size: 112px 112px;
    -webkit-mask-image: linear-gradient(to right, #000, transparent);
    mask-image: linear-gradient(to right, #000, transparent);
    pointer-events: none;
  }

  .sadiq-reports-hero-refresh .reports-hero-copy {
    position: relative;
    z-index: 1;
    min-width: 0;
    padding-inline-start: 17px;
    border-inline-start: 2px solid #d3bb84;
  }

  .sadiq-reports-hero-refresh .reports-hero .reports-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    color: #ecd69d;
    background: transparent;
    font-size: calc(12px * var(--app-font-scale, 1));
    font-weight: 700;
    line-height: 1.6;
  }

  .sadiq-reports-hero-refresh .reports-hero .reports-kicker svg {
    width: 16px;
    height: 16px;
    stroke-width: 1.7;
  }

  .sadiq-reports-hero-refresh .reports-hero h1 {
    max-width: 900px;
    margin: 10px 0 0;
    color: var(--hero-ink);
    font-size: calc(clamp(25px, 2.3vw, 34px) * var(--app-font-scale, 1));
    font-weight: 800;
    line-height: 1.65;
    text-wrap: balance;
  }

  .sadiq-reports-hero-refresh .reports-hero p {
    max-width: 770px;
    margin: 5px 0 0;
    color: #d6e8dc;
    font-size: calc(13px * var(--app-font-scale, 1));
    font-weight: 500;
    line-height: 1.95;
  }

  .sadiq-reports-hero-refresh .reports-hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .sadiq-reports-hero-refresh .reports-hero-meta span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    min-height: 29px;
    padding: 4px 10px;
    border: 1px solid rgba(235, 247, 238, .18);
    border-radius: 7px;
    color: #edf5ee;
    background: rgba(255, 255, 255, .07);
    font-size: calc(11px * var(--app-font-scale, 1));
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .sadiq-reports-hero-refresh .reports-hero-meta svg {
    flex-shrink: 0;
    color: var(--hero-gold);
  }

  .sadiq-reports-hero-refresh .reports-hero-stats {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    align-items: center;
    gap: 0;
    padding: 15px 8px;
    border: 1px solid rgba(225, 240, 228, .18);
    border-radius: 14px;
    background: rgba(2, 31, 24, .26);
    box-shadow: 0 3px 12px rgba(0, 20, 14, .08);
    backdrop-filter: none;
  }

  .sadiq-reports-hero-refresh .reports-hero-stat {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: center;
    gap: 11px;
    min-width: 0;
    min-height: 56px;
    padding: 2px 17px;
    border: 0;
    border-inline-end: 1px solid rgba(225, 240, 228, .15);
    border-radius: 0;
    background: transparent;
  }

  .sadiq-reports-hero-refresh .reports-hero-stat > svg {
    width: 38px;
    height: 38px;
    padding: 9px;
    border: 1px solid rgba(230, 241, 226, .17);
    border-radius: 11px;
    color: var(--hero-gold);
    background: rgba(255, 255, 255, .07);
    stroke-width: 1.65;
  }

  .sadiq-reports-hero-refresh .reports-hero-stat strong {
    color: var(--hero-ink);
    font-size: calc(25px * var(--app-font-scale, 1));
    font-weight: 800;
    line-height: 1.25;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }

  .sadiq-reports-hero-refresh .reports-hero-stat span {
    margin-top: 5px;
    color: #ccdfcf;
    font-size: calc(11px * var(--app-font-scale, 1));
    font-weight: 600;
    line-height: 1.6;
  }

  .sadiq-reports-hero-refresh .reports-hero-stats > button {
    grid-column: auto;
    justify-self: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 43px;
    margin-inline: 15px 9px;
    padding: 9px 17px;
    border: 1px solid #e9d8b1;
    border-radius: 10px;
    color: #203d30;
    background: #f5edda;
    box-shadow: 0 4px 10px rgba(0, 25, 17, .16);
    font-family: inherit;
    font-size: calc(12px * var(--app-font-scale, 1));
    font-weight: 700;
    line-height: 1.5;
    transition: box-shadow .18s ease, opacity .18s ease;
  }

  .sadiq-reports-hero-refresh .reports-hero-stats > button:hover:not(:disabled) {
    box-shadow: 0 5px 16px rgba(0, 25, 17, .26);
  }

  .sadiq-reports-hero-refresh .reports-hero-stats > button:focus-visible {
    outline: 2px solid var(--hero-gold);
    outline-offset: 4px;
  }

  .sadiq-reports-hero-refresh .reports-hero-stats > button:disabled {
    opacity: .6;
    cursor: wait;
  }
}

@media screen and (max-width: 1100px) {
  .sadiq-reports-hero-refresh .reports-hero {
    padding: 26px 24px 20px;
  }
  .sadiq-reports-hero-refresh .reports-hero-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    row-gap: 16px;
  }
  .sadiq-reports-hero-refresh .reports-hero-stat {
    gap: 8px;
    padding-inline: 10px;
  }
  .sadiq-reports-hero-refresh .reports-hero-stat:nth-child(4) {
    border-inline-end: 0;
  }
  .sadiq-reports-hero-refresh .reports-hero-stats > button {
    grid-column: 1 / -1;
    justify-self: end;
    margin-inline: 10px;
  }
}

@media screen and (max-width: 680px) {
  .sadiq-reports-hero-refresh .reports-hero {
    gap: 20px;
    padding: 23px 17px 16px;
    border-radius: 18px;
  }
  .sadiq-reports-hero-refresh .reports-hero-copy {
    padding-inline-start: 12px;
  }
  .sadiq-reports-hero-refresh .reports-hero h1 {
    margin-top: 8px;
    font-size: calc(24px * var(--app-font-scale, 1));
    line-height: 1.65;
  }
  .sadiq-reports-hero-refresh .reports-hero p {
    font-size: calc(12px * var(--app-font-scale, 1));
    line-height: 1.9;
  }
  .sadiq-reports-hero-refresh .reports-hero-pattern {
    width: 70%;
    opacity: .12;
  }
  .sadiq-reports-hero-refresh .reports-hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 0;
    padding: 15px 8px 13px;
  }
  .sadiq-reports-hero-refresh .reports-hero-stat:nth-child(even) {
    border-inline-end: 0;
  }
  .sadiq-reports-hero-refresh .reports-hero-stat strong {
    font-size: calc(23px * var(--app-font-scale, 1));
  }
  .sadiq-reports-hero-refresh .reports-hero-stats > button {
    width: calc(100% - 20px);
    justify-self: center;
    margin: 0;
  }
}

@media screen and (prefers-reduced-motion: reduce) {
  .sadiq-reports-hero-refresh .reports-hero-stats > button {
    transition: none;
  }
}
`;

export default function Reports() {
  return (
    <div className="sadiq-reports-hero-refresh" style={{ display: "contents" }}>
      <ReportsCenter mode="supervisor" />
      <style>{REPORTS_HERO_STYLES}</style>
    </div>
  );
}
