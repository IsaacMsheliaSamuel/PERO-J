import React, { useState } from "react";
import {
  SLIPPAGE_PRESETS,
  DEFAULT_SLIPPAGE_TOLERANCE,
  calculateMinOdds,
  formatOddsPercentage,
  formatOddsMultiplier,
  isHighSlippage,
} from "../lib/slippage";

export interface BetSlipProps {
  marketId: number | string;
  marketTitle: string;
  currentOddsBps?: number; // Defaults to 5000 bps (50%)
  onPlaceBet?: (params: {
    marketId: number | string;
    isYes: boolean;
    amount: number;
    minAcceptableOdds: number;
    slippageTolerance: number;
  }) => void;
}

export default function BetSlip({
  marketId,
  marketTitle,
  currentOddsBps = 5000,
  onPlaceBet,
}: BetSlipProps) {
  const [isYes, setIsYes] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>("10");
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE_TOLERANCE);
  const [customSlippage, setCustomSlippage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeSlippage = customSlippage !== "" ? parseFloat(customSlippage) || 0 : slippage;
  const minAcceptableOdds = calculateMinOdds(currentOddsBps, activeSlippage);
  const showWarning = isHighSlippage(activeSlippage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid bet amount greater than 0");
      return;
    }

    if (activeSlippage < 0 || activeSlippage > 50) {
      setErrorMessage("Slippage tolerance must be between 0% and 50%");
      return;
    }

    setIsSubmitting(true);
    try {
      onPlaceBet?.({
        marketId,
        isYes,
        amount: numericAmount,
        minAcceptableOdds,
        slippageTolerance: activeSlippage,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Betting Slip with Slippage Protection"
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "var(--bg-surface, #ffffff)",
        maxWidth: "420px",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase" }}>
          Bet Slip
        </span>
        <h4 style={{ margin: "4px 0 8px 0", fontSize: "15px" }}>{marketTitle}</h4>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Outcome Selector */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <button
            type="button"
            aria-pressed={isYes}
            onClick={() => setIsYes(true)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              fontWeight: 600,
              backgroundColor: isYes ? "#10b981" : "var(--bg-secondary, #f3f4f6)",
              color: isYes ? "#ffffff" : "inherit",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            YES ({formatOddsPercentage(currentOddsBps)})
          </button>
          <button
            type="button"
            aria-pressed={!isYes}
            onClick={() => setIsYes(false)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              fontWeight: 600,
              backgroundColor: !isYes ? "#ef4444" : "var(--bg-secondary, #f3f4f6)",
              color: !isYes ? "#ffffff" : "inherit",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            NO ({formatOddsPercentage(10000 - currentOddsBps)})
          </button>
        </div>

        {/* Bet Amount */}
        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="bet-amount-input"
            style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}
          >
            Bet Amount (XLM)
          </label>
          <input
            id="bet-amount-input"
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Slippage Tolerance Controls */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500 }}>Slippage Tolerance</span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              {activeSlippage.toFixed(1)}%
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {SLIPPAGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={customSlippage === "" && slippage === preset}
                onClick={() => {
                  setSlippage(preset);
                  setCustomSlippage("");
                }}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  backgroundColor:
                    customSlippage === "" && slippage === preset
                      ? "var(--primary, #3b82f6)"
                      : "transparent",
                  color: customSlippage === "" && slippage === preset ? "#ffffff" : "inherit",
                }}
              >
                {preset}%
              </button>
            ))}

            <input
              type="number"
              placeholder="Custom"
              aria-label="Custom slippage percentage"
              min="0.1"
              max="50"
              step="0.1"
              value={customSlippage}
              onChange={(e) => setCustomSlippage(e.target.value)}
              style={{
                width: "72px",
                padding: "6px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid var(--border)",
                textAlign: "right",
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>%</span>
          </div>

          {showWarning && (
            <div
              role="alert"
              style={{
                marginTop: "6px",
                padding: "6px 8px",
                fontSize: "11px",
                borderRadius: "4px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
              }}
            >
              ⚠️ High slippage tolerance increases risk of sandwich attacks.
            </div>
          )}
        </div>

        {/* Protection Summary */}
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            backgroundColor: "var(--bg-secondary, #f8fafc)",
            fontSize: "12px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ color: "var(--muted)" }}>Current Odds:</span>
            <span>
              {formatOddsPercentage(currentOddsBps)} ({formatOddsMultiplier(currentOddsBps)})
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
            <span>Min. Acceptable Odds:</span>
            <span>{formatOddsPercentage(minAcceptableOdds)}</span>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              marginBottom: "10px",
              padding: "6px 8px",
              fontSize: "12px",
              borderRadius: "4px",
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
            }}
          >
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            fontWeight: 600,
            backgroundColor: "var(--primary, #3b82f6)",
            color: "#ffffff",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Submitting Bet…" : "Place Protected Bet"}
        </button>
      </form>
    </div>
  );
}
