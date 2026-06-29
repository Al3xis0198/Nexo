"use client";

import React, { useState, useMemo } from 'react';
import { useTradingStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface OrderPanelProps {
  symbol: string;
  currentPrice: number;
}

const FEE_RATE = 0.001; // 0.1%
const LEVERAGE_PRESETS = [1, 2, 5, 10, 20, 50, 100];

// Risk color based on leverage
function getRiskColor(lev: number) {
  if (lev <= 5)  return { color: '#0ECB81', label: 'Low Risk' };
  if (lev <= 20) return { color: '#F0B90B', label: 'Medium Risk' };
  return           { color: '#F6465D', label: 'High Risk' };
}

// Calculate liquidation price
function calcLiqPrice(entryPrice: number, leverage: number, type: 'buy' | 'sell') {
  const pct = 1 / leverage; // 100% margin loss
  return type === 'buy'
    ? entryPrice * (1 - pct)
    : entryPrice * (1 + pct);
}

export default function OrderPanel({ symbol, currentPrice }: OrderPanelProps) {
  const [type, setType]           = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount]       = useState('');
  const [leverage, setLeverage]   = useState(10);
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slPrice, setSlPrice]     = useState('');
  const [tpPrice, setTpPrice]     = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const balance      = useTradingStore((s) => s.balance);
  const openPosition = useTradingStore((s) => s.openPosition);

  // ── Computed values ──────────────────────────────────────────────────────
  const numAmount     = parseFloat(amount) || 0;
  const margin        = numAmount > 0 ? numAmount / leverage : 0;
  const fee           = numAmount * FEE_RATE;
  const totalCost     = margin + fee;
  const potentialProfit = margin * leverage; // 100% move profit
  const liqPrice      = currentPrice > 0 ? calcLiqPrice(currentPrice, leverage, type) : 0;
  const risk          = getRiskColor(leverage);
  const insufficient  = totalCost > balance;

  const canSubmit = numAmount > 0 && !insufficient && currentPrice > 0;

  // ── Quick amount buttons ─────────────────────────────────────────────────
  const handlePercent = (pct: number) => {
    const maxMargin = balance * pct;
    const notional  = maxMargin * leverage;
    setAmount(notional.toFixed(2));
  };

  // ── Preset amounts ───────────────────────────────────────────────────────
  const QUICK_AMOUNTS = useMemo(() => [10, 50, 100, 500].map(v => ({
    val: v,
    disabled: (v / leverage) + (v * FEE_RATE) > balance,
  })), [balance, leverage]);

  // ── Submit: show confirmation modal ─────────────────────────────────────
  const handleClickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  // ── Confirm: actually open position ─────────────────────────────────────
  const handleConfirm = () => {
    const success = openPosition({
      symbol,
      type,
      amount: numAmount,
      margin,
      fee,
      entryPrice: currentPrice,
      leverage,
      stopLoss:   slEnabled && slPrice  ? parseFloat(slPrice)  : undefined,
      takeProfit: tpEnabled && tpPrice  ? parseFloat(tpPrice)  : undefined,
    });

    setShowConfirm(false);

    if (success) {
      toast.success(
        `✅ ${type === 'buy' ? 'LONG' : 'SHORT'} ${symbol} opened! Margin $${margin.toFixed(2)} debited.`,
        { duration: 4000 }
      );
      setAmount('');
      setSlPrice('');
      setTpPrice('');
    } else {
      toast.error('Insufficient balance to open this position.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Confirmation Modal ────────────────────────────────────────── */}
      {showConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{ background: '#1A1D21', border: `1px solid ${type === 'buy' ? 'rgba(14,203,129,0.35)' : 'rgba(246,70,93,0.35)'}`, borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: type === 'buy' ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {type === 'buy' ? <TrendingUp size={18} color="#0ECB81" /> : <TrendingDown size={18} color="#F6465D" />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>Confirm Order</div>
                  <div style={{ fontSize: '0.75rem', color: '#848E9C' }}>{symbol} · Market · {leverage}x</div>
                </div>
              </div>
              <button onClick={() => setShowConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Direction badge */}
            <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
              <span style={{ display: 'inline-block', padding: '8px 28px', borderRadius: 30, fontWeight: 800, fontSize: '1.1rem', background: type === 'buy' ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)', color: type === 'buy' ? '#0ECB81' : '#F6465D', border: `1px solid ${type === 'buy' ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'}` }}>
                {type === 'buy' ? '▲ BUY / LONG' : '▼ SELL / SHORT'}
              </span>
            </div>

            {/* Details table */}
            <div style={{ background: '#13161A', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              {[
                { label: 'Market Price',       value: formatCurrency(currentPrice, true), highlight: false },
                { label: 'Position Size',      value: formatCurrency(numAmount),          highlight: false },
                { label: 'Leverage',           value: `${leverage}x`,                    highlight: false },
                { label: 'Margin Required',    value: formatCurrency(margin),             highlight: true  },
                { label: 'Trading Fee (0.1%)', value: formatCurrency(fee),                highlight: false },
                { label: 'Total Debit',        value: formatCurrency(totalCost),          highlight: true  },
                { label: 'Liquidation Price',  value: formatCurrency(liqPrice, true),     highlight: false },
              ].map((row, i) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < 6 ? '1px solid rgba(43,49,57,0.5)' : 'none' }}>
                  <span style={{ fontSize: '0.83rem', color: '#848E9C' }}>{row.label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: row.highlight ? 700 : 500, fontFamily: 'monospace', color: row.highlight ? '#EAECEF' : '#EAECEF' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* SL/TP if set */}
            {(slEnabled && slPrice) || (tpEnabled && tpPrice) ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {slEnabled && slPrice && (
                  <div style={{ flex: 1, background: 'rgba(246,70,93,0.08)', border: '1px solid rgba(246,70,93,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: '#F6465D' }}>
                    🛑 Stop Loss<br /><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(parseFloat(slPrice), true)}</span>
                  </div>
                )}
                {tpEnabled && tpPrice && (
                  <div style={{ flex: 1, background: 'rgba(14,203,129,0.08)', border: '1px solid rgba(14,203,129,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: '#0ECB81' }}>
                    ✅ Take Profit<br /><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(parseFloat(tpPrice), true)}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Risk warning */}
            {leverage > 20 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(246,70,93,0.08)', border: '1px solid rgba(246,70,93,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.78rem', color: '#F6465D' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                High leverage ({leverage}x) significantly increases liquidation risk. Ensure you understand the risks.
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                Cancel
              </button>
              <button onClick={handleConfirm} style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: type === 'buy' ? '#0ECB81' : '#F6465D', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={16} />
                Confirm {type === 'buy' ? 'Buy' : 'Sell'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Panel ───────────────────────────────────────────────── */}
      <div className="card h-full flex flex-col" style={{ gap: 0, padding: '20px' }}>

        {/* ── Direction Tabs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 18 }}>
          <button
            onClick={() => setType('buy')}
            style={{ padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
              background: type === 'buy' ? '#0ECB81' : 'rgba(14,203,129,0.08)',
              color:      type === 'buy' ? '#000'    : '#0ECB81',
              boxShadow:  type === 'buy' ? '0 4px 20px rgba(14,203,129,0.3)' : 'none',
            }}
          >
            ▲ BUY / LONG
          </button>
          <button
            onClick={() => setType('sell')}
            style={{ padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
              background: type === 'sell' ? '#F6465D' : 'rgba(246,70,93,0.08)',
              color:      type === 'sell' ? '#fff'    : '#F6465D',
              boxShadow:  type === 'sell' ? '0 4px 20px rgba(246,70,93,0.3)' : 'none',
            }}
          >
            ▼ SELL / SHORT
          </button>
        </div>

        {/* ── Available Balance ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '10px 12px', background: 'rgba(43,49,57,0.3)', borderRadius: 10 }}>
          <span style={{ fontSize: '0.8rem', color: '#848E9C' }}>Available Balance</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: insufficient ? '#F6465D' : '#EAECEF' }}>
            {formatCurrency(balance)}
          </span>
        </div>

        <form onSubmit={handleClickSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

          {/* ── Market Price (readonly) ── */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Entry Price</span>
              <span style={{ color: '#F0B90B', fontWeight: 700 }}>Market</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                value={currentPrice > 0 ? formatCurrency(currentPrice, true) : '—'}
                className="input"
                style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', fontFamily: 'monospace', fontWeight: 700, color: type === 'buy' ? '#0ECB81' : '#F6465D' }}
              />
            </div>
          </div>

          {/* ── Amount ── */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Investment Amount (USD)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#848E9C', fontWeight: 700 }}>$</span>
              <input
                type="number"
                className="input"
                style={{ paddingLeft: 28, fontFamily: 'monospace', fontWeight: 600, borderColor: insufficient && numAmount > 0 ? 'rgba(246,70,93,0.5)' : undefined }}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>
            {/* Quick amount buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {QUICK_AMOUNTS.map(({ val, disabled }) => (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  onClick={() => setAmount(val.toString())}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(43,49,57,0.8)', background: parseFloat(amount) === val ? 'rgba(240,185,11,0.15)' : 'rgba(43,49,57,0.4)', color: parseFloat(amount) === val ? '#F0B90B' : '#848E9C', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: disabled ? 0.4 : 1, transition: 'all 0.15s' }}
                >
                  ${val}
                </button>
              ))}
            </div>
            {/* % of balance buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {[0.25, 0.5, 0.75, 1].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercent(pct)}
                  style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: '1px solid rgba(43,49,57,0.6)', background: 'transparent', color: '#5E6673', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#EAECEF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5E6673')}
                >
                  {pct * 100}%
                </button>
              ))}
            </div>
          </div>

          {/* ── Leverage ── */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Leverage</span>
              <span style={{ color: risk.color, fontFamily: 'monospace', fontWeight: 800 }}>{leverage}x &nbsp;<span style={{ fontSize: '0.68rem' }}>{risk.label}</span></span>
            </label>
            {/* Preset buttons */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
              {LEVERAGE_PRESETS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLeverage(l)}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: `1px solid ${leverage === l ? risk.color + '60' : 'rgba(43,49,57,0.6)'}`, background: leverage === l ? risk.color + '18' : 'transparent', color: leverage === l ? risk.color : '#5E6673', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s' }}
                >
                  {l}x
                </button>
              ))}
            </div>
            <input
              type="range" min="1" max="100" value={leverage}
              onChange={e => setLeverage(Number(e.target.value))}
              className="leverage-slider"
            />
          </div>

          {/* ── SL / TP ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#848E9C', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: slEnabled ? '#F6465D' : '#848E9C' }}>🛑 Stop Loss</span>
                <button type="button" onClick={() => setSlEnabled(!slEnabled)} style={{ width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', background: slEnabled ? '#F6465D' : 'rgba(43,49,57,0.8)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: slEnabled ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </label>
              <input
                type="number"
                className="input"
                style={{ padding: '8px 10px', fontSize: '0.83rem', opacity: slEnabled ? 1 : 0.4 }}
                placeholder={currentPrice > 0 ? (type === 'buy' ? (currentPrice * 0.97).toFixed(2) : (currentPrice * 1.03).toFixed(2)) : '0.00'}
                value={slPrice}
                disabled={!slEnabled}
                onChange={e => setSlPrice(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#848E9C', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: tpEnabled ? '#0ECB81' : '#848E9C' }}>✅ Take Profit</span>
                <button type="button" onClick={() => setTpEnabled(!tpEnabled)} style={{ width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', background: tpEnabled ? '#0ECB81' : 'rgba(43,49,57,0.8)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: tpEnabled ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </label>
              <input
                type="number"
                className="input"
                style={{ padding: '8px 10px', fontSize: '0.83rem', opacity: tpEnabled ? 1 : 0.4 }}
                placeholder={currentPrice > 0 ? (type === 'buy' ? (currentPrice * 1.05).toFixed(2) : (currentPrice * 0.95).toFixed(2)) : '0.00'}
                value={tpPrice}
                disabled={!tpEnabled}
                onChange={e => setTpPrice(e.target.value)}
              />
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div style={{ background: 'rgba(43,49,57,0.25)', borderRadius: 12, padding: '14px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#848E9C' }}>Margin Required</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(margin)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#848E9C' }}>Fee (0.1%)</span>
              <span style={{ fontFamily: 'monospace', color: '#848E9C' }}>{formatCurrency(fee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#848E9C' }}>Liquidation Price</span>
              <span style={{ fontFamily: 'monospace', color: '#F6465D' }}>{currentPrice > 0 ? formatCurrency(liqPrice, true) : '—'}</span>
            </div>
            <div style={{ height: 1, background: 'rgba(43,49,57,0.6)', margin: '2px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#EAECEF', fontWeight: 600 }}>Total Debit</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: insufficient ? '#F6465D' : '#EAECEF' }}>{formatCurrency(totalCost)}</span>
            </div>
          </div>

          {/* ── Insufficient balance warning ── */}
          {insufficient && numAmount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.25)', borderRadius: 10, fontSize: '0.78rem', color: '#F6465D' }}>
              <AlertTriangle size={14} /> Insufficient balance. Need {formatCurrency(totalCost - balance)} more.
            </div>
          )}

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontWeight: 800, fontSize: '1rem', marginTop: 'auto',
              background: !canSubmit
                ? 'rgba(43,49,57,0.6)'
                : type === 'buy' ? 'linear-gradient(135deg, #0ECB81, #0AAD6D)' : 'linear-gradient(135deg, #F6465D, #D93B50)',
              color: canSubmit ? (type === 'buy' ? '#000' : '#fff') : '#5E6673',
              boxShadow: canSubmit ? (type === 'buy' ? '0 6px 24px rgba(14,203,129,0.3)' : '0 6px 24px rgba(246,70,93,0.3)') : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {type === 'buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {canSubmit
              ? `${type === 'buy' ? 'Buy / Long' : 'Sell / Short'} ${symbol}`
              : numAmount <= 0 ? 'Enter Amount' : 'Insufficient Balance'
            }
          </button>

          {/* Disclaimer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#5E6673', textAlign: 'center', justifyContent: 'center' }}>
            <Info size={11} />
            Demo platform — no real funds. Margin debited on open.
          </div>
        </form>
      </div>
    </>
  );
}
