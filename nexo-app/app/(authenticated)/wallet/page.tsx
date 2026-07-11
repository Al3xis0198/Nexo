"use client";

import React, { useState } from 'react';
import { useTradingStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine,
  History, Eye, EyeOff, ShieldCheck, Clock, CheckCircle2,
  XCircle, AlertCircle, X
} from 'lucide-react';
import type { TransactionStatus } from '@/lib/store';

// ── Withdrawal 24h Notice Modal ───────────────────────────────────────────────
function WithdrawalNoticeModal({
  amount,
  onClose,
}: {
  amount: number;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #1A1D21, #13161A)',
          border: '1px solid rgba(240,185,11,0.3)',
          borderRadius: 24, padding: 36, width: '100%', maxWidth: 460,
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(240,185,11,0.05)',
          position: 'relative', animation: 'fadeInScale 0.25s ease',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C' }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(240,185,11,0.12)',
            border: '2px solid rgba(240,185,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={32} color="#F0B90B" />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EAECEF', margin: '0 0 8px 0' }}>
            Retiro en Proceso
          </h2>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'monospace', color: '#F0B90B', marginBottom: 12 }}>
            {formatCurrency(amount)}
          </div>
        </div>

        {/* Warning box */}
        <div style={{
          background: 'rgba(240,185,11,0.08)',
          border: '1px solid rgba(240,185,11,0.25)',
          borderRadius: 14, padding: '18px 20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Clock size={20} color="#F0B90B" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#F0B90B', marginBottom: 6 }}>
                Este retiro puede demorar hasta 24 horas
              </div>
              <div style={{ fontSize: '0.85rem', color: '#848E9C', lineHeight: 1.6 }}>
                Tu solicitud de retiro ha sido registrada y está siendo procesada por nuestro equipo de seguridad.
                Recibirás una notificación cuando el pago sea completado.
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { icon: CheckCircle2, color: '#0ECB81', label: 'Solicitud recibida', done: true },
            { icon: Clock, color: '#F0B90B', label: 'Verificación de seguridad en progreso', done: false },
            { icon: Clock, color: '#848E9C', label: 'Transferencia procesada', done: false },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <step.icon size={16} color={step.color} />
              <span style={{ fontSize: '0.83rem', color: step.done ? '#EAECEF' : '#848E9C' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #F0B90B, #F3BA2F)',
            color: '#000', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
          }}
        >
          Entendido
        </button>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = {
    completed: { bg: 'rgba(14,203,129,0.1)',  border: 'rgba(14,203,129,0.2)',  color: '#0ECB81',  icon: CheckCircle2, label: 'Completado' },
    pending:   { bg: 'rgba(240,185,11,0.1)',  border: 'rgba(240,185,11,0.2)',  color: '#F0B90B',  icon: Clock,        label: 'Pendiente' },
    failed:    { bg: 'rgba(246,70,93,0.1)',   border: 'rgba(246,70,93,0.2)',   color: '#F6465D',  icon: XCircle,      label: 'Rechazado' },
  }[status] ?? { bg: 'rgba(132,142,156,0.1)', border: 'rgba(132,142,156,0.2)', color: '#848E9C', icon: AlertCircle, label: status };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: '0.68rem',
      fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <cfg.icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const balance      = useTradingStore(state => state.balance);
  const transactions = useTradingStore(state => state.transactions);
  const deposit      = useTradingStore(state => state.deposit);
  const withdraw     = useTradingStore(state => state.withdraw);

  const [amount, setAmount]           = useState('');
  const [activeTab, setActiveTab]     = useState<'deposit' | 'withdraw'>('deposit');
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawalModal, setWithdrawalModal] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Por favor ingresa un monto válido');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (activeTab === 'withdraw' && numAmount > balance) {
      setErrorMsg('Saldo insuficiente');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (activeTab === 'deposit') {
      deposit(numAmount);
      setAmount('');
    } else {
      withdraw(numAmount);
      setWithdrawalModal(numAmount);
      setAmount('');
    }
  };

  return (
    <>
      {/* 24h Withdrawal Notice Modal */}
      {withdrawalModal !== null && (
        <WithdrawalNoticeModal
          amount={withdrawalModal}
          onClose={() => setWithdrawalModal(null)}
        />
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 24, boxSizing: 'border-box' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EAECEF', margin: '0 0 4px 0' }}>Fiat and Spot</h1>
          <p style={{ fontSize: '0.88rem', color: '#848E9C', margin: 0 }}>Deposit and withdraw fiat and crypto seamlessly in your account.</p>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>

          {/* Balance Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(240,185,11,0.15)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', minHeight: 240, boxSizing: 'border-box',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow orb */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,185,11,0.08) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#848E9C', marginBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Estimated Balance</span>
                <button onClick={() => setShowBalance(!showBalance)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C', display: 'flex', padding: 2 }}>
                  {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, fontFamily: 'monospace', color: '#EAECEF', letterSpacing: '-0.02em' }}>
                  {showBalance ? formatCurrency(balance) : '*******'}
                </span>
                <span style={{ fontSize: '1.1rem', color: '#848E9C', fontWeight: 700 }}>USD</span>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.25)', color: '#0ECB81', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 12px', borderRadius: 20 }}>
                <ShieldCheck size={13} /> Safu Protected
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setActiveTab('deposit')}
                style={{ flex: 1, padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #F0B90B, #F3BA2F)', color: '#000', fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(240,185,11,0.2)', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                style={{ flex: 1, padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#EAECEF', fontWeight: 700, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.2)', borderRadius: 16, padding: 24, boxSizing: 'border-box' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
              {(['deposit', 'withdraw'] as const).map(tab => (
                <button
                  key={tab}
                  style={{ flex: 1, padding: '10px 0', fontSize: '0.85rem', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === tab ? '#F0B90B' : '#848E9C' }}
                  onClick={() => { setActiveTab(tab); setErrorMsg(null); }}
                >
                  {tab === 'deposit'
                    ? <><ArrowDownToLine size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Deposit</>
                    : <><ArrowUpFromLine size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Withdraw</>
                  }
                </button>
              ))}
            </div>

            {/* Withdraw notice banner */}
            {activeTab === 'withdraw' && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <Clock size={16} color="#F0B90B" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: '0.78rem', color: '#848E9C', lineHeight: 1.5 }}>
                  <span style={{ color: '#F0B90B', fontWeight: 700 }}>Aviso: </span>
                  Los retiros pueden demorar hasta 24 horas en procesarse.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  Amount (USD)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#848E9C', fontWeight: 700, fontSize: '1.1rem' }}>$</span>
                  <input
                    type="number"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 14px 14px 28px', fontSize: '1.2rem', color: '#EAECEF', fontFamily: 'monospace', fontWeight: 700, outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#F0B90B')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min="0.01" step="0.01" required
                  />
                  <button
                    type="button"
                    onClick={() => activeTab === 'withdraw' ? setAmount(balance.toString()) : setAmount('1000')}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Quick selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[100, 500, 1000, 5000].map(val => (
                  <button
                    key={val} type="button"
                    style={{ padding: '8px 0', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#848E9C', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#EAECEF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#848E9C'; }}
                    onClick={() => setAmount(val.toString())}
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div style={{ fontSize: '0.8rem', textAlign: 'center', color: '#F6465D', background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.2)', padding: 10, borderRadius: 8 }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontSize: '0.95rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'deposit' ? 'linear-gradient(135deg, #0ECB81, #0AAD6D)' : 'linear-gradient(135deg, #F6465D, #D93B50)', color: '#fff', boxShadow: activeTab === 'deposit' ? '0 6px 20px rgba(14,203,129,0.25)' : '0 6px 20px rgba(246,70,93,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {activeTab === 'deposit' ? 'Confirm Deposit' : 'Request Withdrawal'}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={18} style={{ color: '#F0B90B' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#EAECEF', margin: 0 }}>Recent Transactions</h2>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            {transactions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center', color: '#848E9C' }}>
                <WalletIcon size={40} style={{ margin: '0 auto 12px', opacity: 0.15 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No transactions yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>
                      {['Date & Time', 'Type', 'Description', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: '#848E9C', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: h === 'Amount' || h === 'Status' ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr key={tx.id}
                        style={{ borderBottom: idx < transactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: '#848E9C', fontFamily: 'monospace' }}>
                          <span suppressHydrationWarning>{new Date(tx.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tx.type === 'deposit' ? '#0ECB81' : tx.type === 'withdrawal' ? '#F6465D' : tx.type === 'binary_win' ? '#9945FF' : '#848E9C', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize', color: '#EAECEF' }}>
                              {tx.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: '#848E9C', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || '-'}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem' }}>
                          <span style={{ color: tx.amount > 0 ? '#0ECB81' : tx.amount === 0 ? '#848E9C' : '#F6465D' }}>
                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <StatusBadge status={tx.status ?? 'completed'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
