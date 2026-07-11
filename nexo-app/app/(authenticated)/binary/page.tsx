"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTradingStore } from '@/lib/store';
import type { BinaryOption } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
  DollarSign, Zap, Target, History, RefreshCw, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useBinanceLivePrice } from '@/lib/hooks/useBinanceMarket';

// ── Types ─────────────────────────────────────────────────────────────────────
type Direction = 'call' | 'put';
type Expiry = { label: string; seconds: number };

const ASSETS = [
  { symbol: 'BTC/USD',  name: 'Bitcoin',    base: 67000 },
  { symbol: 'ETH/USD',  name: 'Ethereum',   base: 3500  },
  { symbol: 'XAU/USD',  name: 'Gold',       base: 2345  },
  { symbol: 'EUR/USD',  name: 'Euro/USD',   base: 1.085 },
  { symbol: 'AAPL',     name: 'Apple',      base: 189   },
  { symbol: 'NVDA',     name: 'NVIDIA',     base: 890   },
];

const EXPIRIES: Expiry[] = [
  { label: '30s', seconds: 30  },
  { label: '1m',  seconds: 60  },
  { label: '2m',  seconds: 120 },
  { label: '5m',  seconds: 300 },
  { label: '15m', seconds: 900 },
];

const PAYOUTS: Record<number, number> = {
  30:  0.75,
  60:  0.82,
  120: 0.85,
  300: 0.88,
  900: 0.92,
};

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

// ── Countdown Ring ────────────────────────────────────────────────────────────
function CountdownRing({ expiresAt, totalSeconds }: { expiresAt: string; totalSeconds: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const secs = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(secs);
    };
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [expiresAt]);

  const pct   = remaining / totalSeconds;
  const size  = 52;
  const r     = 22;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * pct;
  const color = remaining > totalSeconds * 0.5 ? '#0ECB81' : remaining > totalSeconds * 0.25 ? '#F0B90B' : '#F6465D';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(43,49,57,0.6)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.2s, stroke 0.5s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace', color }}>
        {remaining}s
      </div>
    </div>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────────
function OptionCard({ option }: { option: BinaryOption }) {
  const totalSeconds = Math.round(
    (new Date(option.expiresAt).getTime() - new Date(option.openedAt).getTime()) / 1000
  );

  const statusCfg = {
    open:    { color: '#F0B90B', label: 'En curso',  bg: 'rgba(240,185,11,0.08)'  },
    won:     { color: '#0ECB81', label: '✓ Ganado',   bg: 'rgba(14,203,129,0.08)'  },
    lost:    { color: '#F6465D', label: '✗ Perdido',  bg: 'rgba(246,70,93,0.08)'   },
    expired: { color: '#848E9C', label: 'Expirado',  bg: 'rgba(132,142,156,0.08)' },
  }[option.status];

  return (
    <div style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.color}25`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s' }}>
      {/* Direction icon */}
      <div style={{ width: 40, height: 40, borderRadius: 10, background: option.direction === 'call' ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {option.direction === 'call'
          ? <TrendingUp size={18} color="#0ECB81" />
          : <TrendingDown size={18} color="#F6465D" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{option.symbol}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: option.direction === 'call' ? '#0ECB81' : '#F6465D', background: option.direction === 'call' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.12)', padding: '2px 8px', borderRadius: 20 }}>
            {option.direction === 'call' ? '▲ CALL' : '▼ PUT'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: '#848E9C' }}>
          <span>Entrada <span style={{ color: '#EAECEF', fontFamily: 'monospace' }}>{formatCurrency(option.entryPrice, true)}</span></span>
          <span>Monto <span style={{ color: '#EAECEF', fontFamily: 'monospace' }}>{formatCurrency(option.amount)}</span></span>
          {option.status !== 'open' && option.closePrice && (
            <span>Cierre <span style={{ color: '#EAECEF', fontFamily: 'monospace' }}>{formatCurrency(option.closePrice, true)}</span></span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {option.status === 'open' ? (
          <CountdownRing expiresAt={option.expiresAt} totalSeconds={totalSeconds} />
        ) : (
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, fontFamily: 'monospace', color: option.status === 'won' ? '#0ECB81' : '#F6465D' }}>
              {option.status === 'won'
                ? `+${formatCurrency(option.amount * option.payoutRate)}`
                : `-${formatCurrency(option.amount)}`}
            </div>
            <div style={{ fontSize: '0.7rem', color: statusCfg.color, fontWeight: 700 }}>{statusCfg.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Simulated live prices ─────────────────────────────────────────────────────
// Removido a favor de useBinanceLivePrice

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BinaryPage() {
  const balance         = useTradingStore(s => s.balance);
  const binaryOptions   = useTradingStore(s => s.binaryOptions);
  const openBinaryOption  = useTradingStore(s => s.openBinaryOption);
  const settleBinaryOption = useTradingStore(s => s.settleBinaryOption);

  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [direction, setDirection]  = useState<Direction>('call');
  const [amount, setAmount]        = useState('');
  const [expiry, setExpiry]        = useState<Expiry>(EXPIRIES[1]);
  const [submitting, setSubmitting] = useState(false);

  const rawLivePrice = useBinanceLivePrice(selectedAsset.symbol);
  // Fallback to base price initially until websocket connects
  const livePrice = rawLivePrice || selectedAsset.base;

  const payout    = PAYOUTS[expiry.seconds] ?? 0.85;
  const numAmount = parseFloat(amount) || 0;
  const potential = numAmount * (1 + payout);
  const profit    = numAmount * payout;

  // ── Auto-settle expired options ───────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      binaryOptions
        .filter(o => o.status === 'open' && new Date(o.expiresAt).getTime() <= now)
        .forEach(o => {
          // Simulate close price with small random walk from entry
          const elapsed = (now - new Date(o.openedAt).getTime()) / 1000;
          const drift   = o.entryPrice * 0.001 * (Math.random() - 0.49) * Math.sqrt(elapsed);
          const closePrice = o.entryPrice + drift;
          settleBinaryOption(o.id, closePrice);

          const isWin = (o.direction === 'call' && closePrice > o.entryPrice)
            || (o.direction === 'put' && closePrice < o.entryPrice);

          if (isWin) {
            toast.success(`🎯 Opción GANADA +${formatCurrency(o.amount * o.payoutRate)}`, { duration: 5000 });
          } else {
            toast.error(`❌ Opción perdida -${formatCurrency(o.amount)}`, { duration: 5000 });
          }
        });
    }, 500);
    return () => clearInterval(id);
  }, [binaryOptions, settleBinaryOption]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) { toast.error('Ingresa un monto válido'); return; }
    if (numAmount > balance) { toast.error('Saldo insuficiente'); return; }

    setSubmitting(true);
    const expiresAt = new Date(Date.now() + expiry.seconds * 1000).toISOString();
    const success = await openBinaryOption({
      symbol:      selectedAsset.symbol,
      direction,
      amount:      numAmount,
      payoutRate:  payout,
      entryPrice:  livePrice,
      expiresAt,
    });

    setSubmitting(false);

    if (success) {
      toast.success(`✅ Opción ${direction.toUpperCase()} abierta — expira en ${expiry.label}`, { duration: 3000 });
      setAmount('');
    } else {
      toast.error('Error al abrir operación o saldo insuficiente');
    }
  };

  const openOptions    = binaryOptions.filter(o => o.status === 'open');
  const closedOptions  = binaryOptions.filter(o => o.status !== 'open');
  const totalWon       = binaryOptions.filter(o => o.status === 'won').length;
  const totalLost      = binaryOptions.filter(o => o.status === 'lost').length;
  const winRate        = binaryOptions.length > 0 ? ((totalWon / (totalWon + totalLost || 1)) * 100).toFixed(1) : '—';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">

      {/* Header */}
      <div className="page-header border-b border-border pb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Zap size={22} style={{ color: '#9945FF' }} /> Trading Binario
          </h1>
          <p className="page-subtitle">Opciones de alta frecuencia · Resultados en segundos</p>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Balance',        value: formatCurrency(balance), color: '#F0B90B', icon: DollarSign },
          { label: 'Opciones abiertas', value: String(openOptions.length), color: '#1890FF', icon: Clock },
          { label: 'Ganadas',        value: String(totalWon),  color: '#0ECB81', icon: CheckCircle2 },
          { label: 'Perdidas',       value: String(totalLost), color: '#F6465D', icon: XCircle },
          { label: 'Win Rate',       value: `${winRate}%`,     color: '#9945FF', icon: Target },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4" style={{ borderColor: `${color}25` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'monospace', color }}>{value}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* Left: Open + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Open options */}
          <div className="card p-0 overflow-hidden">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={16} color="#F0B90B" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Opciones Activas</span>
              {openOptions.length > 0 && (
                <span style={{ background: 'rgba(240,185,11,0.2)', color: '#F0B90B', borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {openOptions.length}
                </span>
              )}
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 100 }}>
              {openOptions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#848E9C', padding: '32px 0', fontSize: '0.88rem' }}>
                  <Clock size={28} style={{ opacity: 0.2, margin: '0 auto 10px', display: 'block' }} />
                  No hay opciones activas. Abre una en el panel derecho.
                </div>
              ) : (
                openOptions.map(opt => <OptionCard key={opt.id} option={opt} />)
              )}
            </div>
          </div>

          {/* History */}
          {closedOptions.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={16} color="#848E9C" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Historial</span>
                <span style={{ background: 'rgba(132,142,156,0.15)', color: '#848E9C', borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {closedOptions.length}
                </span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {closedOptions.slice(0, 20).map(opt => <OptionCard key={opt.id} option={opt} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Trading panel */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>

          {/* Live price */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {selectedAsset.symbol}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', color: '#EAECEF', letterSpacing: '-0.02em' }}>
              {formatCurrency(livePrice, selectedAsset.symbol.includes('EUR') || selectedAsset.symbol.includes('USD/') || selectedAsset.symbol.includes('GBP'))}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(14,203,129,0.1)', borderRadius: 20, padding: '4px 12px', marginTop: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0ECB81', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '0.7rem', color: '#0ECB81', fontWeight: 700 }}>LIVE</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Asset selector */}
            <div>
              <label style={{ fontSize: '0.72rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Activo</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ASSETS.map(asset => (
                  <button key={asset.symbol} type="button" onClick={() => setSelectedAsset(asset)}
                    style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${selectedAsset.symbol === asset.symbol ? '#F0B90B60' : 'rgba(43,49,57,0.7)'}`, background: selectedAsset.symbol === asset.symbol ? 'rgba(240,185,11,0.1)' : 'transparent', color: selectedAsset.symbol === asset.symbol ? '#F0B90B' : '#848E9C', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s', textAlign: 'left' }}>
                    <div style={{ fontWeight: 800 }}>{asset.symbol}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{asset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div>
              <label style={{ fontSize: '0.72rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Dirección</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button type="button" onClick={() => setDirection('call')}
                  style={{ padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.2s', background: direction === 'call' ? '#0ECB81' : 'rgba(14,203,129,0.08)', color: direction === 'call' ? '#000' : '#0ECB81', boxShadow: direction === 'call' ? '0 4px 20px rgba(14,203,129,0.3)' : 'none' }}>
                  <TrendingUp size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  CALL ▲
                </button>
                <button type="button" onClick={() => setDirection('put')}
                  style={{ padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.2s', background: direction === 'put' ? '#F6465D' : 'rgba(246,70,93,0.08)', color: direction === 'put' ? '#fff' : '#F6465D', boxShadow: direction === 'put' ? '0 4px 20px rgba(246,70,93,0.3)' : 'none' }}>
                  <TrendingDown size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  PUT ▼
                </button>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label style={{ fontSize: '0.72rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Expiración · Pago {Math.round(payout * 100)}%</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {EXPIRIES.map(exp => (
                  <button key={exp.seconds} type="button" onClick={() => setExpiry(exp)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${expiry.seconds === exp.seconds ? '#9945FF60' : 'rgba(43,49,57,0.7)'}`, background: expiry.seconds === exp.seconds ? 'rgba(153,69,255,0.12)' : 'transparent', color: expiry.seconds === exp.seconds ? '#9945FF' : '#848E9C', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s' }}>
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label style={{ fontSize: '0.72rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Inversión (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#848E9C', fontWeight: 700 }}>$</span>
                <input
                  type="number" className="input"
                  style={{ paddingLeft: 28, fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}
                  placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                  min="1" step="1"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
                {QUICK_AMOUNTS.map(v => (
                  <button key={v} type="button" onClick={() => setAmount(v.toString())}
                    style={{ padding: '6px 0', borderRadius: 7, border: `1px solid ${parseFloat(amount) === v ? '#F0B90B60' : 'rgba(43,49,57,0.7)'}`, background: parseFloat(amount) === v ? 'rgba(240,185,11,0.1)' : 'transparent', color: parseFloat(amount) === v ? '#F0B90B' : '#848E9C', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s' }}>
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout preview */}
            {numAmount > 0 && (
              <div style={{ background: 'rgba(43,49,57,0.25)', borderRadius: 12, padding: '14px 16px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#848E9C', fontWeight: 600 }}>Pago esperado (Ingreso)</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', color: '#0ECB81' }}>{formatCurrency(potential)}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#5E6673', textAlign: 'right' }}>
                  Beneficio neto de la operación: <span style={{ color: '#0ECB81', fontWeight: 700 }}>+{formatCurrency(profit)}</span>
                </div>
              </div>
            )}

            {numAmount > balance && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.25)', borderRadius: 10, fontSize: '0.78rem', color: '#F6465D' }}>
                <AlertTriangle size={14} /> Saldo insuficiente
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting || numAmount <= 0 || numAmount > balance}
              style={{ width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: '1rem', cursor: submitting || numAmount <= 0 || numAmount > balance ? 'not-allowed' : 'pointer', transition: 'all 0.2s', background: submitting || numAmount <= 0 || numAmount > balance ? 'rgba(43,49,57,0.5)' : direction === 'call' ? 'linear-gradient(135deg, #0ECB81, #0AAD6D)' : 'linear-gradient(135deg, #F6465D, #D93B50)', color: submitting || numAmount <= 0 || numAmount > balance ? '#5E6673' : direction === 'call' ? '#000' : '#fff', boxShadow: submitting ? 'none' : direction === 'call' ? '0 6px 24px rgba(14,203,129,0.3)' : '0 6px 24px rgba(246,70,93,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting
                ? <><RefreshCw size={16} className="animate-spin" /> Abriendo...</>
                : direction === 'call'
                  ? <><TrendingUp size={18} /> Abrir CALL ▲</>
                  : <><TrendingDown size={18} /> Abrir PUT ▼</>
              }
            </button>

            <div style={{ fontSize: '0.68rem', color: '#5E6673', textAlign: 'center' }}>
              Operación de alto riesgo. Puede perder toda la inversión.
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
