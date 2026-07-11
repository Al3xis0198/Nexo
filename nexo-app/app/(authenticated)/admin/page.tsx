"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, ShieldAlert, Loader2, Search, RefreshCw,
  TrendingUp, DollarSign, Activity, Edit2, X, CheckCircle2,
  AlertTriangle, BarChart2, Clock, Filter, Plus, Minus,
  Trash2, Eye, ChevronRight, ArrowUpRight, ArrowDownLeft,
  UserCog, FileText, Ban, Shield, Zap, Hourglass
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingStore } from '@/lib/store';
import type { Transaction, TransactionStatus } from '@/lib/store';
import { toast } from 'sonner';
import type { Profile } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminTab = 'users' | 'withdrawals' | 'deposits' | 'transactions' | 'config';

interface EditBalanceModal {
  user: Profile;
  mode: 'set' | 'add' | 'subtract';
  value: string;
  note: string;
}

interface EditUserModal {
  user: Profile;
  fullName: string;
  email: string;
}

interface EditTxModal {
  tx: Transaction;
  amount: string;
  description: string;
  status: TransactionStatus;
  type: Transaction['type'];
}

interface AddTxModal {
  userId: string;
  userEmail: string;
  type: Transaction['type'];
  amount: string;
  description: string;
  status: TransactionStatus;
}

interface UserDetailDrawer {
  user: Profile;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KYC_BADGE: Record<string, string> = {
  verified: 'badge-verified',
  rejected: 'badge-rejected',
  pending:  'badge-pending',
};

const STATUS_COLOR: Record<string, string> = {
  active:    'rgba(14,203,129,0.2)',
  suspended: 'rgba(240,185,11,0.2)',
  banned:    'rgba(246,70,93,0.2)',
};
const STATUS_TEXT: Record<string, string> = {
  active:    '#0ECB81',
  suspended: '#F0B90B',
  banned:    '#F6465D',
};

const TX_TYPE_OPTIONS: Transaction['type'][] = [
  'deposit', 'withdrawal', 'trade_open', 'trade_close', 'admin_adjustment', 'binary_win', 'binary_loss'
];

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub?: string; color: string; icon: React.ElementType }) {
  return (
    <div className="card p-5" style={{ borderColor: `${color}30` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="text-secondary text-xs uppercase tracking-wider mb-2">{label}</div>
          <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
          {sub && <div className="text-xs text-secondary mt-1">{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

function StatusBadgeTx({ status }: { status: TransactionStatus }) {
  const cfg = {
    completed: { color: '#0ECB81', bg: 'rgba(14,203,129,0.1)',  label: 'Completado' },
    pending:   { color: '#F0B90B', bg: 'rgba(240,185,11,0.1)',  label: 'Pendiente' },
    failed:    { color: '#F6465D', bg: 'rgba(246,70,93,0.1)',   label: 'Rechazado' },
  }[status] ?? { color: '#848E9C', bg: 'rgba(132,142,156,0.1)', label: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const storeTransactions   = useTradingStore(s => s.transactions);
  const storePositions      = useTradingStore(s => s.positions);
  const adminAdjust         = useTradingStore(s => s.adminAdjustBalance);
  const adminEditTx         = useTradingStore(s => s.adminEditTransaction);
  const adminAddTx          = useTradingStore(s => s.adminAddTransaction);
  const adminDeleteTx       = useTradingStore(s => s.adminDeleteTransaction);
  const approveWithdrawal   = useTradingStore(s => s.approveWithdrawal);
  const rejectWithdrawal    = useTradingStore(s => s.rejectWithdrawal);
  const approveDeposit      = useTradingStore(s => s.approveDeposit);
  const rejectDeposit       = useTradingStore(s => s.rejectDeposit);

  const [activeTab, setActiveTab]       = useState<AdminTab>('users');
  const [users, setUsers]               = useState<Profile[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [editBalModal, setEditBalModal]     = useState<EditBalanceModal | null>(null);
  const [editUserModal, setEditUserModal]   = useState<EditUserModal | null>(null);
  const [editTxModal, setEditTxModal]       = useState<EditTxModal | null>(null);
  const [addTxModal, setAddTxModal]         = useState<AddTxModal | null>(null);
  const [userDrawer, setUserDrawer]         = useState<UserDetailDrawer | null>(null);
  const [saving, setSaving]                 = useState(false);

  // Config state
  const [cfgFee, setCfgFee]             = useState('0.10');
  const [cfgMaxLev, setCfgMaxLev]       = useState('100');
  const [cfgMaintenance, setCfgMaintenance] = useState(false);
  const [cfgPayoutMin, setCfgPayoutMin] = useState('75');
  const [cfgPayoutMax, setCfgPayoutMax] = useState('92');

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/dashboard');
  }, [isAdmin, authLoading, router]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else if (data) setUsers(data as Profile[]);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 0);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles')
      // @ts-expect-error loose update
      .update({ status: newStatus }).eq('id', userId);
    if (!err) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, status: newStatus as any } : x));
      toast.success(`Estado actualizado a ${newStatus}`);
    } else toast.error(err.message);
  };

  const handleUpdateLevel = async (userId: string, newLevel: string) => {
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles')
      // @ts-expect-error loose update
      .update({ level: newLevel }).eq('id', userId);
    if (!err) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, level: newLevel as any } : x));
      toast.success(`Nivel actualizado a ${newLevel}`);
    } else toast.error(err.message);
  };

  const handleUpdateKyc = async (userId: string, kyc: string) => {
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles')
      // @ts-expect-error loose update
      .update({ kyc_status: kyc }).eq('id', userId);
    if (!err) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, kyc_status: kyc as any } : x));
      toast.success(`KYC actualizado a ${kyc}`);
    } else toast.error(err.message);
  };

  const handleSaveBalance = async () => {
    if (!editBalModal) return;
    const num = parseFloat(editBalModal.value);
    if (isNaN(num) || num < 0) { toast.error('Monto inválido'); return; }
    setSaving(true);
    const supabase = createClient();
    let newBalance = num;
    if (editBalModal.mode === 'add')      newBalance = editBalModal.user.balance + num;
    if (editBalModal.mode === 'subtract') newBalance = Math.max(0, editBalModal.user.balance - num);
    const { error: err } = await supabase.from('profiles')
      // @ts-expect-error loose update
      .update({ balance: newBalance }).eq('id', editBalModal.user.id);
    if (!err) {
      setUsers(u => u.map(x => x.id === editBalModal.user.id ? { ...x, balance: newBalance } : x));
      adminAdjust(editBalModal.user.id, newBalance, editBalModal.note || 'Admin balance adjustment');
      toast.success(`Balance actualizado a ${formatCurrency(newBalance)}`);
      setEditBalModal(null);
    } else toast.error(err.message);
    setSaving(false);
  };

  const handleSaveUser = async () => {
    if (!editUserModal) return;
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles')
      // @ts-expect-error loose update
      .update({ full_name: editUserModal.fullName, email: editUserModal.email })
      .eq('id', editUserModal.user.id);
    if (!err) {
      setUsers(u => u.map(x => x.id === editUserModal.user.id ? { ...x, full_name: editUserModal.fullName, email: editUserModal.email } : x));
      toast.success('Datos del usuario actualizados');
      setEditUserModal(null);
    } else toast.error(err.message);
    setSaving(false);
  };

  const handleSaveEditTx = () => {
    if (!editTxModal) return;
    const num = parseFloat(editTxModal.amount);
    if (isNaN(num)) { toast.error('Monto inválido'); return; }
    adminEditTx(editTxModal.tx.id, {
      amount: num,
      description: editTxModal.description,
      status: editTxModal.status,
      type: editTxModal.type,
    });
    toast.success('Transacción actualizada');
    setEditTxModal(null);
  };

  const handleAddTx = () => {
    if (!addTxModal) return;
    const num = parseFloat(addTxModal.amount);
    if (isNaN(num)) { toast.error('Monto inválido'); return; }
    adminAddTx({
      type: addTxModal.type,
      amount: num,
      date: new Date().toISOString(),
      description: addTxModal.description || `Admin: ${addTxModal.type}`,
      status: addTxModal.status,
      userId: addTxModal.userId,
    });
    toast.success('Transacción añadida');
    setAddTxModal(null);
  };

  const handleDeleteTx = (txId: string) => {
    if (!window.confirm('¿Eliminar esta transacción?')) return;
    adminDeleteTx(txId);
    toast.success('Transacción eliminada');
  };

  const handleApproveWithdrawal = (txId: string) => {
    approveWithdrawal(txId);
    toast.success('Retiro aprobado');
  };

  const handleRejectWithdrawal = (txId: string) => {
    rejectWithdrawal(txId);
    toast.success('Retiro rechazado y fondos devueltos');
  };

  const handleApproveDeposit = (txId: string) => {
    approveDeposit(txId);
    toast.success('Depósito aprobado y fondos acreditados');
  };

  const handleRejectDeposit = (txId: string) => {
    rejectDeposit(txId);
    toast.success('Depósito rechazado');
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalBalance  = users.reduce((a, u) => a + u.balance, 0);
  const activeUsers   = users.filter(u => u.status === 'active').length;
  const verifiedUsers = users.filter(u => u.kyc_status === 'verified').length;
  const pendingWithdrawals = storeTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');
  const pendingDeposits = storeTransactions.filter(t => t.type === 'deposit' && t.status === 'pending');

  if (authLoading) return <div className="flex-center h-full"><Loader2 size={32} className="animate-spin text-accent" /></div>;
  if (!isAdmin)    return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ══ Edit Balance Modal ═══════════════════════════════════════════ */}
      {editBalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setEditBalModal(null)}>
          <div style={{ background: '#1A1D21', border: '1px solid rgba(240,185,11,0.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(240,185,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={20} color="#F0B90B" /></div>
                <div>
                  <div style={{ fontWeight: 800 }}>Editar Balance</div>
                  <div style={{ fontSize: '0.8rem', color: '#848E9C' }}>{editBalModal.user.email || editBalModal.user.full_name}</div>
                </div>
              </div>
              <button onClick={() => setEditBalModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#13161A', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#848E9C', fontSize: '0.85rem' }}>Balance Actual</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(editBalModal.user.balance)}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {([['set', 'Establecer', '#1890FF'], ['add', 'Añadir', '#0ECB81'], ['subtract', 'Restar', '#F6465D']] as const).map(([m, label, color]) => (
                <button key={m} onClick={() => setEditBalModal(e => e ? { ...e, mode: m } : null)}
                  style={{ padding: '9px 0', borderRadius: 10, border: `1px solid ${editBalModal.mode === m ? color + '60' : 'rgba(43,49,57,0.7)'}`, background: editBalModal.mode === m ? color + '18' : 'transparent', color: editBalModal.mode === m ? color : '#848E9C', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s' }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#848E9C', fontWeight: 700 }}>$</span>
              <input type="number" className="input" style={{ paddingLeft: 32, fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }} placeholder="0.00" value={editBalModal.value} onChange={e => setEditBalModal(m => m ? { ...m, value: e.target.value } : null)} min="0" step="0.01" autoFocus />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[100, 500, 1000, 5000, 10000].map(v => (
                <button key={v} onClick={() => setEditBalModal(m => m ? { ...m, value: v.toString() } : null)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(43,49,57,0.7)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                  ${v >= 1000 ? `${v/1000}k` : v}
                </button>
              ))}
            </div>

            {editBalModal.value && (
              <div style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#848E9C' }}>Nuevo balance</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F0B90B' }}>
                  {formatCurrency(
                    editBalModal.mode === 'set'      ? parseFloat(editBalModal.value) || 0 :
                    editBalModal.mode === 'add'      ? editBalModal.user.balance + (parseFloat(editBalModal.value) || 0) :
                    Math.max(0, editBalModal.user.balance - (parseFloat(editBalModal.value) || 0))
                  )}
                </span>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Nota Admin (motivo)</label>
              <input type="text" className="input" placeholder="ej. Bono, corrección manual..." value={editBalModal.note} onChange={e => setEditBalModal(m => m ? { ...m, note: e.target.value } : null)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditBalModal(null)} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSaveBalance} disabled={saving || !editBalModal.value}
                style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: saving || !editBalModal.value ? 'rgba(43,49,57,0.5)' : '#F0B90B', color: saving || !editBalModal.value ? '#5E6673' : '#000', cursor: saving || !editBalModal.value ? 'not-allowed' : 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {saving ? 'Guardando...' : 'Guardar Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Edit User Info Modal ═══════════════════════════════════════════ */}
      {editUserModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setEditUserModal(null)}>
          <div style={{ background: '#1A1D21', border: '1px solid rgba(24,144,255,0.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(24,144,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCog size={20} color="#1890FF" /></div>
                <div>
                  <div style={{ fontWeight: 800 }}>Editar Datos de Usuario</div>
                  <div style={{ fontSize: '0.8rem', color: '#848E9C' }}>{editUserModal.user.id.slice(0, 12)}…</div>
                </div>
              </div>
              <button onClick={() => setEditUserModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Nombre Completo</label>
                <input type="text" className="input" value={editUserModal.fullName} onChange={e => setEditUserModal(m => m ? { ...m, fullName: e.target.value } : null)} placeholder="Nombre completo" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" className="input" value={editUserModal.email} onChange={e => setEditUserModal(m => m ? { ...m, email: e.target.value } : null)} placeholder="email@ejemplo.com" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditUserModal(null)} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSaveUser} disabled={saving}
                style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: saving ? 'rgba(43,49,57,0.5)' : '#1890FF', color: saving ? '#5E6673' : '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Edit Transaction Modal ════════════════════════════════════════ */}
      {editTxModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setEditTxModal(null)}>
          <div style={{ background: '#1A1D21', border: '1px solid rgba(153,69,255,0.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(153,69,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} color="#9945FF" /></div>
                <div><div style={{ fontWeight: 800 }}>Editar Transacción</div><div style={{ fontSize: '0.8rem', color: '#848E9C' }}>ID: {editTxModal.tx.id}</div></div>
              </div>
              <button onClick={() => setEditTxModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Tipo</label>
                <select className="input" value={editTxModal.type} onChange={e => setEditTxModal(m => m ? { ...m, type: e.target.value as any } : null)}>
                  {TX_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Monto (USD)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#848E9C', fontWeight: 700 }}>$</span>
                  <input type="number" className="input" style={{ paddingLeft: 28 }} value={editTxModal.amount} onChange={e => setEditTxModal(m => m ? { ...m, amount: e.target.value } : null)} step="0.01" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Descripción</label>
                <input type="text" className="input" value={editTxModal.description} onChange={e => setEditTxModal(m => m ? { ...m, description: e.target.value } : null)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Estado</label>
                <select className="input" value={editTxModal.status} onChange={e => setEditTxModal(m => m ? { ...m, status: e.target.value as TransactionStatus } : null)}>
                  <option value="completed">Completado</option>
                  <option value="pending">Pendiente</option>
                  <option value="failed">Fallido</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditTxModal(null)} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSaveEditTx} style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: '#9945FF', color: '#fff', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Add Transaction Modal ══════════════════════════════════════════ */}
      {addTxModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setAddTxModal(null)}>
          <div style={{ background: '#1A1D21', border: '1px solid rgba(14,203,129,0.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(14,203,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} color="#0ECB81" /></div>
                <div>
                  <div style={{ fontWeight: 800 }}>Añadir Transacción</div>
                  <div style={{ fontSize: '0.8rem', color: '#848E9C' }}>{addTxModal.userEmail}</div>
                </div>
              </div>
              <button onClick={() => setAddTxModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Tipo</label>
                <select className="input" value={addTxModal.type} onChange={e => setAddTxModal(m => m ? { ...m, type: e.target.value as any } : null)}>
                  {TX_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Monto</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#848E9C', fontWeight: 700 }}>$</span>
                  <input type="number" className="input" style={{ paddingLeft: 28 }} placeholder="0.00" value={addTxModal.amount} onChange={e => setAddTxModal(m => m ? { ...m, amount: e.target.value } : null)} step="0.01" autoFocus />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Descripción</label>
                <input type="text" className="input" placeholder="Descripción de la transacción..." value={addTxModal.description} onChange={e => setAddTxModal(m => m ? { ...m, description: e.target.value } : null)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Estado</label>
                <select className="input" value={addTxModal.status} onChange={e => setAddTxModal(m => m ? { ...m, status: e.target.value as TransactionStatus } : null)}>
                  <option value="completed">Completado</option>
                  <option value="pending">Pendiente</option>
                  <option value="failed">Fallido</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAddTxModal(null)} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleAddTx} style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: '#0ECB81', color: '#000', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={16} /> Añadir Transacción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Page ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6 animate-fade-in" style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div className="page-header border-b border-border pb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title flex items-center gap-2 text-accent">
              <ShieldAlert size={24} /> Admin Control Panel
            </h1>
            <p className="page-subtitle">Gestión completa de usuarios, transacciones, balances y configuración.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {pendingWithdrawals.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.3)', color: '#F0B90B', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('withdrawals')}>
                <Clock size={14} /> {pendingWithdrawals.length} retiro(s) pendiente(s)
              </div>
            )}
            <button onClick={fetchUsers} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-[rgba(246,70,93,0.1)] border border-[rgba(246,70,93,0.3)] text-bear rounded-lg">⚠️ {error}</div>}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Usuarios"    value={loading ? '…' : String(users.length)}          sub={`${activeUsers} activos`}       color="#1890FF" icon={Users} />
          <StatCard label="Balance Plataforma" value={loading ? '…' : formatCurrency(totalBalance)} sub="todas las cuentas"               color="#F0B90B" icon={DollarSign} />
          <StatCard label="KYC Verificados"   value={loading ? '…' : String(verifiedUsers)}          sub={`de ${users.length} total`}     color="#9945FF" icon={Shield} />
          <StatCard label="Retiros Pendientes" value={String(pendingWithdrawals.length)}             sub="requieren aprobación"            color={pendingWithdrawals.length > 0 ? '#F0B90B' : '#0ECB81'} icon={Clock} />
        </div>

        {/* Tab Navigation */}
        <div className="card p-0 overflow-hidden">
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {([
              { id: 'users',       label: '👥 Usuarios',              count: filteredUsers.length },
              { id: 'withdrawals', label: '💸 Retiros Pendientes',    count: pendingWithdrawals.length },
              { id: 'deposits',    label: '📥 Depósitos Pendientes',  count: pendingDeposits.length },
              { id: 'transactions',label: '💰 Transacciones',         count: storeTransactions.length },
              { id: 'config',      label: '⚙️ Configuración',         count: null },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)}
                style={{ padding: '14px 20px', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#F0B90B' : 'transparent'}`, background: 'transparent', color: activeTab === tab.id ? '#F0B90B' : '#848E9C', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                {tab.label}
                {tab.count !== null && (
                  <span style={{ background: activeTab === tab.id ? 'rgba(240,185,11,0.2)' : 'rgba(43,49,57,0.6)', color: activeTab === tab.id ? '#F0B90B' : '#5E6673', borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
                    {tab.count}
                  </span>
                )}
                {((tab.id === 'withdrawals' && pendingWithdrawals.length > 0) || (tab.id === 'deposits' && pendingDeposits.length > 0)) && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F0B90B', flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {/* ════ TAB: USERS ════ */}
          {activeTab === 'users' && (
            <div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#848E9C' }} />
                  <input type="text" className="input" style={{ paddingLeft: 34, fontSize: '0.85rem' }} placeholder="Buscar por email o nombre..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input" style={{ width: 'auto', fontSize: '0.85rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="banned">Bloqueado</option>
                </select>
              </div>

              <div className="table-wrapper border-0 rounded-none" style={{ maxHeight: 560, overflowY: 'auto' }}>
                <table className="table w-full">
                  <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Usuario</th>
                      <th>Balance</th>
                      <th>Nivel</th>
                      <th>Estado</th>
                      <th>KYC</th>
                      <th>Registro</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12"><Loader2 size={24} className="animate-spin text-accent mx-auto" /></td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-secondary">No hay usuarios con esos filtros.</td></tr>
                    ) : filteredUsers.map(user => (
                      <tr key={user.id} className="group">
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(240,185,11,0.12)', border: '1px solid rgba(240,185,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#F0B90B', fontSize: '0.8rem', flexShrink: 0 }}>
                              {(user.email || user.full_name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.full_name || '—'}</div>
                              <div style={{ color: '#848E9C', fontSize: '0.75rem' }}>{user.email || user.id.slice(0,12) + '…'}</div>
                            </div>
                          </div>
                        </td>
                        <td><div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(user.balance)}</div></td>
                        <td>
                          <select style={{ appearance: 'none', background: '#1A1D21', color: '#EAECEF', border: '1px solid rgba(43,49,57,0.8)', borderRadius: 6, padding: '4px 20px 4px 8px', fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }} value={user.level} onChange={e => handleUpdateLevel(user.id, e.target.value)}>
                            <option style={{ background: '#13161A' }} value="standard">Standard</option>
                            <option style={{ background: '#13161A' }} value="pro">Pro</option>
                            <option style={{ background: '#13161A' }} value="vip">VIP</option>
                          </select>
                        </td>
                        <td>
                          <select style={{ appearance: 'none', background: STATUS_COLOR[user.status] || 'transparent', color: STATUS_TEXT[user.status] || '#848E9C', border: `1px solid ${STATUS_TEXT[user.status]}40`, borderRadius: 6, padding: '4px 20px 4px 8px', fontSize: '0.75rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }} value={user.status} onChange={e => handleUpdateStatus(user.id, e.target.value)}>
                            <option style={{ background: '#13161A', color: '#fff' }} value="active">Activo</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="suspended">Suspendido</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="banned">Bloqueado</option>
                          </select>
                        </td>
                        <td>
                          <select className={`badge ${KYC_BADGE[user.kyc_status] || 'badge-pending'}`} style={{ appearance: 'none', border: 'none', outline: 'none', cursor: 'pointer', paddingRight: 16 }} value={user.kyc_status} onChange={e => handleUpdateKyc(user.id, e.target.value)}>
                            <option style={{ background: '#13161A', color: '#fff' }} value="pending">Pendiente</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="verified">Verificado</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="rejected">Rechazado</option>
                          </select>
                        </td>
                        <td style={{ color: '#848E9C', fontSize: '0.78rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditBalModal({ user, mode: 'set', value: String(user.balance), note: '' })}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: 7, border: '1px solid rgba(240,185,11,0.3)', background: 'rgba(240,185,11,0.08)', color: '#F0B90B', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.2s' }}
                              title="Editar balance">
                              <DollarSign size={11} /> Balance
                            </button>
                            <button onClick={() => setEditUserModal({ user, fullName: user.full_name || '', email: user.email || '' })}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: 7, border: '1px solid rgba(24,144,255,0.3)', background: 'rgba(24,144,255,0.08)', color: '#1890FF', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.2s' }}
                              title="Editar datos">
                              <Edit2 size={11} /> Editar
                            </button>
                            <button onClick={() => setAddTxModal({ userId: user.id, userEmail: user.email || user.full_name || user.id, type: 'admin_adjustment', amount: '', description: '', status: 'completed' })}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: 7, border: '1px solid rgba(14,203,129,0.3)', background: 'rgba(14,203,129,0.08)', color: '#0ECB81', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.2s' }}
                              title="Añadir transacción">
                              <Plus size={11} /> TX
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ TAB: WITHDRAWALS ════ */}
          {activeTab === 'withdrawals' && (
            <div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} style={{ color: '#F0B90B' }} />
                <span style={{ fontSize: '0.85rem', color: '#848E9C' }}>{pendingWithdrawals.length} retiro(s) pendientes de aprobación</span>
              </div>
              <div className="table-wrapper border-0 rounded-none" style={{ maxHeight: 520 }}>
                <table className="table w-full">
                  <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th className="text-right">Monto</th>
                      <th className="text-right">Estado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingWithdrawals.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-secondary">
                        <CheckCircle2 size={24} className="mx-auto mb-2 text-bull" />
                        No hay retiros pendientes
                      </td></tr>
                    ) : pendingWithdrawals.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ color: '#848E9C', fontSize: '0.78rem' }}><span suppressHydrationWarning>{new Date(tx.date).toLocaleString()}</span></td>
                        <td style={{ fontSize: '0.83rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</td>
                        <td className="text-right font-mono font-semibold">
                          <span style={{ color: '#F6465D' }}>{formatCurrency(Math.abs(tx.amount))}</span>
                        </td>
                        <td className="text-right"><StatusBadgeTx status={tx.status ?? 'pending'} /></td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => handleApproveWithdrawal(tx.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(14,203,129,0.3)', background: 'rgba(14,203,129,0.08)', color: '#0ECB81', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                              <CheckCircle2 size={13} /> Aprobar
                            </button>
                            <button onClick={() => handleRejectWithdrawal(tx.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(246,70,93,0.3)', background: 'rgba(246,70,93,0.08)', color: '#F6465D', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                              <X size={13} /> Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ TAB: DEPOSITS ════ */}
          {activeTab === 'deposits' && (
            <div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Hourglass size={16} style={{ color: '#1890FF' }} />
                <span style={{ fontSize: '0.85rem', color: '#848E9C' }}>{pendingDeposits.length} depósito(s) pendientes de aprobación</span>
              </div>
              <div className="table-wrapper border-0 rounded-none" style={{ maxHeight: 520 }}>
                <table className="table w-full">
                  <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th className="text-right">Monto</th>
                      <th className="text-right">Estado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeposits.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-secondary">
                        <CheckCircle2 size={24} className="mx-auto mb-2 text-bull" />
                        No hay depósitos pendientes
                      </td></tr>
                    ) : pendingDeposits.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ color: '#848E9C', fontSize: '0.78rem' }}><span suppressHydrationWarning>{new Date(tx.date).toLocaleString()}</span></td>
                        <td style={{ fontSize: '0.83rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</td>
                        <td className="text-right font-mono font-semibold">
                          <span style={{ color: '#1890FF' }}>{formatCurrency(tx.amount)}</span>
                        </td>
                        <td className="text-right"><StatusBadgeTx status={tx.status ?? 'pending'} /></td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => handleApproveDeposit(tx.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(14,203,129,0.3)', background: 'rgba(14,203,129,0.08)', color: '#0ECB81', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                              <CheckCircle2 size={13} /> Aprobar
                            </button>
                            <button onClick={() => handleRejectDeposit(tx.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(246,70,93,0.3)', background: 'rgba(246,70,93,0.08)', color: '#F6465D', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                              <X size={13} /> Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ TAB: TRANSACTIONS ════ */}
          {activeTab === 'transactions' && (
            <div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={15} style={{ color: '#848E9C' }} />
                  <span style={{ fontSize: '0.85rem', color: '#848E9C' }}>{storeTransactions.length} transacciones totales</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Depósitos',    count: storeTransactions.filter(t => t.type === 'deposit').length,               color: '#0ECB81' },
                    { label: 'Retiros',      count: storeTransactions.filter(t => t.type === 'withdrawal').length,             color: '#F6465D' },
                    { label: 'Trades',       count: storeTransactions.filter(t => t.type.startsWith('trade')).length,         color: '#F0B90B' },
                    { label: 'Pendientes',   count: storeTransactions.filter(t => t.status === 'pending').length,             color: '#F0B90B' },
                    { label: 'Admin',        count: storeTransactions.filter(t => t.type === 'admin_adjustment').length,      color: '#1890FF' },
                  ].map(s => (
                    <div key={s.label} style={{ fontSize: '0.72rem', color: s.color, background: s.color + '15', borderRadius: 8, padding: '3px 10px', fontWeight: 700 }}>
                      {s.label}: {s.count}
                    </div>
                  ))}
                </div>
              </div>

              <div className="table-wrapper border-0 rounded-none" style={{ maxHeight: 520, overflowY: 'auto' }}>
                <table className="table w-full">
                  <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th className="text-right">Monto</th>
                      <th className="text-right">Estado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeTransactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-secondary">No hay transacciones.</td></tr>
                    ) : storeTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ color: '#848E9C', fontSize: '0.78rem' }}><span suppressHydrationWarning>{new Date(tx.date).toLocaleString()}</span></td>
                        <td>
                          <span className={`badge ${tx.type === 'deposit' ? 'badge-bull' : tx.type === 'withdrawal' ? 'badge-bear' : tx.type === 'admin_adjustment' ? 'badge-verified' : 'badge-neutral'}`}>
                            {tx.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.83rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</td>
                        <td className="text-right font-mono font-semibold">
                          <span style={{ color: tx.amount >= 0 ? '#0ECB81' : '#F6465D' }}>
                            {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="text-right"><StatusBadgeTx status={tx.status ?? 'completed'} /></td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditTxModal({ tx, amount: String(tx.amount), description: tx.description || '', status: tx.status ?? 'completed', type: tx.type })}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(153,69,255,0.3)', background: 'rgba(153,69,255,0.08)', color: '#9945FF', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                              title="Editar">
                              <Edit2 size={11} />
                            </button>
                            <button onClick={() => handleDeleteTx(tx.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(246,70,93,0.3)', background: 'rgba(246,70,93,0.08)', color: '#F6465D', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                              title="Eliminar">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ TAB: CONFIG ════ */}
          {activeTab === 'config' && (
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Configuración de Plataforma</h3>
                <p style={{ color: '#848E9C', fontSize: '0.85rem' }}>Controla todos los parámetros globales. Los cambios se aplican a todos los usuarios.</p>
              </div>

              {/* Fee */}
              <div style={{ background: '#13161A', border: '1px solid rgba(43,49,57,0.7)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Tasa de Comisión por Trade (%)</div>
                <div style={{ color: '#848E9C', fontSize: '0.82rem', marginBottom: 12 }}>Comisión cobrada al abrir posición. Se aplica al tamaño nocional.</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="number" className="input" style={{ width: 120 }} value={cfgFee} onChange={e => setCfgFee(e.target.value)} min="0" max="5" step="0.01" />
                  <span style={{ color: '#848E9C' }}>% por trade</span>
                  <span style={{ color: '#848E9C', fontSize: '0.8rem' }}>(actual: {cfgFee}% = ${(1000 * parseFloat(cfgFee || '0') / 100).toFixed(2)} por cada $1,000)</span>
                </div>
              </div>

              {/* Max leverage */}
              <div style={{ background: '#13161A', border: '1px solid rgba(43,49,57,0.7)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Apalancamiento Máximo</div>
                <div style={{ color: '#848E9C', fontSize: '0.82rem', marginBottom: 12 }}>Apalancamiento máximo disponible para los usuarios.</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="number" className="input" style={{ width: 120 }} value={cfgMaxLev} onChange={e => setCfgMaxLev(e.target.value)} min="1" max="500" step="1" />
                  <span style={{ color: '#848E9C' }}>x</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[10, 20, 50, 100, 200, 500].map(l => (
                      <button key={l} type="button" onClick={() => setCfgMaxLev(String(l))}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${cfgMaxLev === String(l) ? '#F0B90B60' : 'rgba(43,49,57,0.7)'}`, background: cfgMaxLev === String(l) ? 'rgba(240,185,11,0.1)' : 'transparent', color: cfgMaxLev === String(l) ? '#F0B90B' : '#848E9C', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        {l}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Binary payout range */}
              <div style={{ background: '#13161A', border: '1px solid rgba(43,49,57,0.7)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Pago Opciones Binarias (%)</div>
                <div style={{ color: '#848E9C', fontSize: '0.82rem', marginBottom: 12 }}>Rango de payout para opciones binarias según expiración.</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#848E9C', display: 'block', marginBottom: 4 }}>Mínimo</label>
                    <input type="number" className="input" style={{ width: 100 }} value={cfgPayoutMin} onChange={e => setCfgPayoutMin(e.target.value)} min="50" max="99" />
                  </div>
                  <span style={{ color: '#848E9C', marginTop: 20 }}>—</span>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#848E9C', display: 'block', marginBottom: 4 }}>Máximo</label>
                    <input type="number" className="input" style={{ width: 100 }} value={cfgPayoutMax} onChange={e => setCfgPayoutMax(e.target.value)} min="50" max="99" />
                  </div>
                  <span style={{ color: '#848E9C', marginTop: 20 }}>%</span>
                </div>
              </div>

              {/* Maintenance */}
              <div style={{ background: cfgMaintenance ? 'rgba(246,70,93,0.08)' : '#13161A', border: `1px solid ${cfgMaintenance ? 'rgba(246,70,93,0.3)' : 'rgba(43,49,57,0.7)'}`, borderRadius: 14, padding: 24, transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: cfgMaintenance ? '#F6465D' : '#EAECEF' }}>🔧 Modo Mantenimiento</div>
                    <div style={{ color: '#848E9C', fontSize: '0.82rem' }}>Cuando está activo, los usuarios verán una página de mantenimiento.</div>
                  </div>
                  <button onClick={() => { setCfgMaintenance(v => !v); toast(cfgMaintenance ? 'Mantenimiento DESACTIVADO' : '⚠️ Modo Mantenimiento ACTIVADO'); }}
                    style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: cfgMaintenance ? '#F6465D' : 'rgba(43,49,57,0.8)', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 4, left: cfgMaintenance ? 26 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                </div>
              </div>

              <button onClick={() => toast.success('Configuración guardada correctamente')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 32px', borderRadius: 12, border: 'none', background: '#F0B90B', color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', alignSelf: 'flex-start' }}>
                <CheckCircle2 size={16} /> Guardar Configuración
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
