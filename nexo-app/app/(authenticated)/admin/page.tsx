"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, ShieldAlert, Loader2, Search, RefreshCw,
  TrendingUp, TrendingDown, DollarSign, Activity,
  Edit2, X, CheckCircle2, AlertTriangle, Plus, Minus,
  BarChart2, ArrowUpDown, Clock, Filter
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Profile } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminTab = 'users' | 'positions' | 'transactions' | 'config';

interface EditBalanceModal {
  user: Profile;
  mode: 'set' | 'add' | 'subtract';
  value: string;
  note: string;
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Store (local state for demo positions/transactions)
  const storePositions    = useTradingStore(s => s.positions);
  const storeTransactions = useTradingStore(s => s.transactions);
  const adminAdjust       = useTradingStore(s => s.adminAdjustBalance);

  // ── State ──
  const [activeTab, setActiveTab]   = useState<AdminTab>('users');
  const [users, setUsers]           = useState<Profile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModal, setEditModal]   = useState<EditBalanceModal | null>(null);
  const [saving, setSaving]         = useState(false);

  // Config state
  const [cfgFee, setCfgFee]         = useState('0.10');
  const [cfgMaxLev, setCfgMaxLev]   = useState('100');
  const [cfgMaintenance, setCfgMaintenance] = useState(false);

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/dashboard');
  }, [isAdmin, authLoading, router]);

  // ── Fetch users ──
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
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // ── Handlers ──
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      // @ts-expect-error loose update
      .update({ status: newStatus as 'active' | 'suspended' | 'banned' })
      .eq('id', userId);
    if (!err) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, status: newStatus as 'active' | 'suspended' | 'banned' } : x));
      toast.success(`Status updated to ${newStatus}`);
    } else {
      toast.error(err.message);
    }
  };

  const handleUpdateLevel = async (userId: string, newLevel: string) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      // @ts-expect-error loose update
      .update({ level: newLevel as 'standard' | 'pro' | 'vip' })
      .eq('id', userId);
    if (!err) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, level: newLevel as 'standard' | 'pro' | 'vip' } : x));
      toast.success(`Level updated to ${newLevel}`);
    } else {
      toast.error(err.message);
    }
  };

  const handleUpdateKyc = async (userId: string, kyc: string) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      // @ts-expect-error loose update
      .update({ kyc_status: kyc as 'pending' | 'verified' | 'rejected' })
      .eq('id', userId);
    if (!err) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, kyc_status: kyc as 'pending' | 'verified' | 'rejected' } : x));
      toast.success(`KYC status updated to ${kyc}`);
    } else {
      toast.error(err.message);
    }
  };

  const handleSaveBalance = async () => {
    if (!editModal) return;
    const num = parseFloat(editModal.value);
    if (isNaN(num) || num < 0) { toast.error('Enter a valid amount'); return; }

    setSaving(true);
    const supabase = createClient();

    let newBalance = num;
    if (editModal.mode === 'add')      newBalance = editModal.user.balance + num;
    if (editModal.mode === 'subtract') newBalance = Math.max(0, editModal.user.balance - num);

    const { error: err } = await supabase
      .from('profiles')
      // @ts-expect-error loose update
      .update({ balance: newBalance })
      .eq('id', editModal.user.id);

    if (!err) {
      setUsers(u => u.map(x => x.id === editModal.user.id ? { ...x, balance: newBalance } : x));
      adminAdjust(editModal.user.id, newBalance, editModal.note || 'Admin balance adjustment');
      toast.success(`Balance updated to ${formatCurrency(newBalance)}`);
      setEditModal(null);
    } else {
      toast.error(err.message);
    }
    setSaving(false);
  };

  // ── Derived values ──
  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      (u.email?.toLowerCase().includes(search.toLowerCase())) ||
      (u.full_name?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalBalance  = users.reduce((a, u) => a + u.balance, 0);
  const activeUsers   = users.filter(u => u.status === 'active').length;
  const verifiedUsers = users.filter(u => u.kyc_status === 'verified').length;
  const totalTxs      = storeTransactions.length;

  // ── Loading state ──
  if (authLoading || (!isAdmin && !error)) {
    return <div className="flex-center h-full"><Loader2 size={32} className="animate-spin text-accent" /></div>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ══ Edit Balance Modal ═══════════════════════════════════════════ */}
      {editModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setEditModal(null)}
        >
          <div
            style={{ background: '#1A1D21', border: '1px solid rgba(240,185,11,0.3)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(240,185,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} color="#F0B90B" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>Edit Balance</div>
                  <div style={{ fontSize: '0.8rem', color: '#848E9C' }}>{editModal.user.email || editModal.user.full_name}</div>
                </div>
              </div>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#848E9C' }}>
                <X size={20} />
              </button>
            </div>

            {/* Current balance */}
            <div style={{ background: '#13161A', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#848E9C', fontSize: '0.85rem' }}>Current Balance</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(editModal.user.balance)}</span>
            </div>

            {/* Mode selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {([['set','Set to','#1890FF'],['add','Add funds','#0ECB81'],['subtract','Subtract','#F6465D']] as const).map(([m, label, color]) => (
                <button key={m} onClick={() => setEditModal(e => e ? { ...e, mode: m } : null)}
                  style={{ padding: '9px 0', borderRadius: 10, border: `1px solid ${editModal.mode === m ? color + '60' : 'rgba(43,49,57,0.7)'}`, background: editModal.mode === m ? color + '18' : 'transparent', color: editModal.mode === m ? color : '#848E9C', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s' }}>
                  {editModal.mode === m && (m === 'add' ? '+' : m === 'subtract' ? '−' : '=')} {label}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#848E9C', fontWeight: 700, fontSize: '1.1rem' }}>$</span>
              <input
                type="number"
                className="input"
                style={{ paddingLeft: 32, fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }}
                placeholder="0.00"
                value={editModal.value}
                onChange={e => setEditModal(m => m ? { ...m, value: e.target.value } : null)}
                min="0"
                step="0.01"
                autoFocus
              />
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[100, 500, 1000, 5000].map(v => (
                <button key={v} onClick={() => setEditModal(m => m ? { ...m, value: v.toString() } : null)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(43,49,57,0.7)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#EAECEF'; e.currentTarget.style.borderColor = 'rgba(240,185,11,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#848E9C'; e.currentTarget.style.borderColor = 'rgba(43,49,57,0.7)'; }}>
                  ${v}
                </button>
              ))}
            </div>

            {/* Preview */}
            {editModal.value && (
              <div style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#848E9C' }}>New balance will be</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F0B90B' }}>
                  {formatCurrency(
                    editModal.mode === 'set'      ? parseFloat(editModal.value) || 0 :
                    editModal.mode === 'add'      ? editModal.user.balance + (parseFloat(editModal.value) || 0) :
                    Math.max(0, editModal.user.balance - (parseFloat(editModal.value) || 0))
                  )}
                </span>
              </div>
            )}

            {/* Admin note */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.75rem', color: '#848E9C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Admin Note (reason)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Bonus deposit, manual correction..."
                value={editModal.note}
                onChange={e => setEditModal(m => m ? { ...m, note: e.target.value } : null)}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSaveBalance} disabled={saving || !editModal.value}
                style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: saving || !editModal.value ? 'rgba(43,49,57,0.5)' : '#F0B90B', color: saving || !editModal.value ? '#5E6673' : '#000', cursor: saving || !editModal.value ? 'not-allowed' : 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {saving ? 'Saving...' : 'Save Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Page ═════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6 animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div className="page-header border-b border-border pb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title flex items-center gap-2 text-accent">
              <ShieldAlert size={24} /> Admin Control Panel
            </h1>
            <p className="page-subtitle">Manage users, balances, positions and platform settings.</p>
          </div>
          <button onClick={fetchUsers} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(43,49,57,0.8)', background: 'transparent', color: '#848E9C', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-[rgba(246,70,93,0.1)] border border-[rgba(246,70,93,0.3)] text-bear rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users"      value={loading ? '…' : String(users.length)}      sub={`${activeUsers} active`}    color="#1890FF" icon={Users}      />
          <StatCard label="Platform Balance" value={loading ? '…' : formatCurrency(totalBalance)} sub="all accounts"              color="#F0B90B" icon={DollarSign} />
          <StatCard label="Open Positions"   value={String(storePositions.length)}              sub="current session"               color="#0ECB81" icon={Activity}   />
          <StatCard label="Verified KYC"     value={loading ? '…' : String(verifiedUsers)}      sub={`of ${users.length} total`} color="#9945FF" icon={CheckCircle2} />
        </div>

        {/* ── Tab Navigation ── */}
        <div className="card p-0 overflow-hidden">
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {([
              { id: 'users',        label: '👥 Users',        count: filteredUsers.length },
              { id: 'positions',    label: '📊 Positions',    count: storePositions.length },
              { id: 'transactions', label: '💰 Transactions', count: totalTxs },
              { id: 'config',       label: '⚙️ Config',       count: null },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '14px 20px', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#F0B90B' : 'transparent'}`, background: 'transparent', color: activeTab === tab.id ? '#F0B90B' : '#848E9C', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                {tab.label}
                {tab.count !== null && (
                  <span style={{ background: activeTab === tab.id ? 'rgba(240,185,11,0.2)' : 'rgba(43,49,57,0.6)', color: activeTab === tab.id ? '#F0B90B' : '#5E6673', borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ════ TAB: USERS ════ */}
          {activeTab === 'users' && (
            <div>
              {/* Search / Filter bar */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#848E9C' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: 34, fontSize: '0.85rem' }}
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="input"
                  style={{ width: 'auto', fontSize: '0.85rem', paddingRight: 32 }}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div className="table-wrapper border-0 rounded-none" style={{ maxHeight: 520, overflowY: 'auto' }}>
                <table className="table w-full">
                  <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>User</th>
                      <th>Balance</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>KYC</th>
                      <th>Joined</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12"><Loader2 size={24} className="animate-spin text-accent mx-auto" /></td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-secondary">No users match your filters.</td></tr>
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

                        <td>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(user.balance)}</div>
                        </td>

                        <td>
                          <select
                            style={{ appearance: 'none', background: '#1A1D21', color: '#EAECEF', border: '1px solid rgba(43,49,57,0.8)', borderRadius: 6, padding: '4px 20px 4px 8px', fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer', backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=%22%23848E9C%22 height=%2214%22 viewBox=%220 0 24 24%22 width=%2214%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M7 10l5 5 5-5z%22/></svg>")', backgroundRepeat: 'no-repeat', backgroundPositionX: 'calc(100% - 2px)', backgroundPositionY: '50%' }}
                            value={user.level}
                            onChange={e => handleUpdateLevel(user.id, e.target.value)}
                          >
                            <option style={{ background: '#13161A', color: '#fff' }} value="standard">Standard</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="pro">Pro</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="vip">VIP</option>
                          </select>
                        </td>

                        <td>
                          <select
                            style={{ appearance: 'none', background: STATUS_COLOR[user.status] || 'transparent', color: STATUS_TEXT[user.status] || '#848E9C', border: `1px solid ${STATUS_TEXT[user.status]}40`, borderRadius: 6, padding: '4px 20px 4px 8px', fontSize: '0.75rem', fontWeight: 700, outline: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml;utf8,<svg fill=%22${encodeURIComponent(STATUS_TEXT[user.status] || '#848E9C')}%22 height=%2214%22 viewBox=%220 0 24 24%22 width=%2214%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M7 10l5 5 5-5z%22/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPositionX: 'calc(100% - 2px)', backgroundPositionY: '50%' }}
                            value={user.status}
                            onChange={e => handleUpdateStatus(user.id, e.target.value)}
                          >
                            <option style={{ background: '#13161A', color: '#fff' }} value="active">Active</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="suspended">Suspended</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="banned">Banned</option>
                          </select>
                        </td>

                        <td>
                          <select
                            className={`badge ${KYC_BADGE[user.kyc_status] || 'badge-pending'}`}
                            style={{ appearance: 'none', border: 'none', outline: 'none', cursor: 'pointer', paddingRight: 20, backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=%22currentColor%22 height=%2214%22 viewBox=%220 0 24 24%22 width=%2214%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M7 10l5 5 5-5z%22/></svg>")', backgroundRepeat: 'no-repeat', backgroundPositionX: 'calc(100% - 2px)', backgroundPositionY: '50%' }}
                            value={user.kyc_status}
                            onChange={e => handleUpdateKyc(user.id, e.target.value)}
                          >
                            <option style={{ background: '#13161A', color: '#fff' }} value="pending">Pending</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="verified">Verified</option>
                            <option style={{ background: '#13161A', color: '#fff' }} value="rejected">Rejected</option>
                          </select>
                        </td>

                        <td style={{ color: '#848E9C', fontSize: '0.78rem' }}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>

                        <td className="text-right">
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setEditModal({ user, mode: 'set', value: String(user.balance), note: '' })}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(240,185,11,0.3)', background: 'rgba(240,185,11,0.08)', color: '#F0B90B', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s' }}
                              title="Edit balance"
                            >
                              <Edit2 size={12} /> Balance
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

          {/* ════ TAB: POSITIONS ════ */}
          {activeTab === 'positions' && (
            <div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart2 size={16} style={{ color: '#848E9C' }} />
                <span style={{ fontSize: '0.85rem', color: '#848E9C' }}>
                  Showing {storePositions.length} open positions from the current session
                </span>
              </div>
              <div className="table-wrapper border-0 rounded-none" style={{ maxHeight: 520, overflowY: 'auto' }}>
                <table className="table w-full">
                  <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Notional</th>
                      <th>Margin</th>
                      <th>Leverage</th>
                      <th>Entry Price</th>
                      <th>SL / TP</th>
                      <th>Opened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storePositions.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-secondary">No open positions in this session.</td></tr>
                    ) : storePositions.map(pos => (
                      <tr key={pos.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{pos.symbol}</div>
                        </td>
                        <td>
                          <span className={`badge ${pos.type === 'buy' ? 'badge-bull' : 'badge-bear'}`}>
                            {pos.type === 'buy' ? '▲ LONG' : '▼ SHORT'}
                          </span>
                        </td>
                        <td className="font-mono font-semibold">{formatCurrency(pos.amount)}</td>
                        <td className="font-mono">{formatCurrency(pos.margin)}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: pos.leverage >= 50 ? '#F6465D' : pos.leverage >= 20 ? '#F0B90B' : '#0ECB81' }}>
                            {pos.leverage}x
                          </span>
                        </td>
                        <td className="font-mono" style={{ color: '#848E9C' }}>{formatCurrency(pos.entryPrice, true)}</td>
                        <td style={{ fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {pos.stopLoss   && <span style={{ color: '#F6465D', fontFamily: 'monospace' }}>SL:{formatCurrency(pos.stopLoss,   true)}</span>}
                            {pos.takeProfit && <span style={{ color: '#0ECB81', fontFamily: 'monospace' }}>TP:{formatCurrency(pos.takeProfit, true)}</span>}
                            {!pos.stopLoss && !pos.takeProfit && <span style={{ color: '#5E6673' }}>—</span>}
                          </div>
                        </td>
                        <td style={{ color: '#848E9C', fontSize: '0.78rem' }}>
                          <span suppressHydrationWarning>{new Date(pos.openedAt).toLocaleString()}</span>
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
                  <span style={{ fontSize: '0.85rem', color: '#848E9C' }}>{storeTransactions.length} total transactions (current session)</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Summary mini-stats */}
                  {[
                    { label: 'Deposits',    count: storeTransactions.filter(t=>t.type==='deposit').length,    color: '#0ECB81' },
                    { label: 'Withdrawals', count: storeTransactions.filter(t=>t.type==='withdrawal').length, color: '#F6465D' },
                    { label: 'Trades',      count: storeTransactions.filter(t=>t.type.startsWith('trade')).length, color: '#F0B90B' },
                    { label: 'Adjustments', count: storeTransactions.filter(t=>t.type==='admin_adjustment').length, color: '#1890FF' },
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
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeTransactions.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-secondary">No transactions yet.</td></tr>
                    ) : storeTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ color: '#848E9C', fontSize: '0.78rem' }}>
                          <span suppressHydrationWarning>{new Date(tx.date).toLocaleString()}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            tx.type === 'deposit'          ? 'badge-bull' :
                            tx.type === 'withdrawal'       ? 'badge-bear' :
                            tx.type === 'admin_adjustment' ? 'badge-verified' :
                            'badge-neutral'
                          }`}>
                            {tx.type.replace(/_/g,' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.83rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || '—'}
                        </td>
                        <td className="text-right font-mono font-semibold">
                          <span style={{ color: tx.amount >= 0 ? '#0ECB81' : '#F6465D' }}>
                            {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="badge badge-verified">COMPLETED</span>
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
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Platform Settings</h3>
                <p style={{ color: '#848E9C', fontSize: '0.85rem' }}>Configure global platform parameters. Changes apply to all users.</p>
              </div>

              {/* Fee setting */}
              <div style={{ background: '#13161A', border: '1px solid rgba(43,49,57,0.7)', borderRadius: 14, padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Trading Fee Rate (%)</div>
                  <div style={{ color: '#848E9C', fontSize: '0.82rem', marginBottom: 12 }}>Fee charged on each trade open. Applied to the notional position size.</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="number" className="input" style={{ width: 120 }} value={cfgFee} onChange={e => setCfgFee(e.target.value)} min="0" max="5" step="0.01" />
                    <span style={{ color: '#848E9C' }}>% per trade</span>
                  </div>
                </div>
              </div>

              {/* Max leverage */}
              <div style={{ background: '#13161A', border: '1px solid rgba(43,49,57,0.7)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Maximum Leverage</div>
                <div style={{ color: '#848E9C', fontSize: '0.82rem', marginBottom: 12 }}>Maximum leverage available to users. Higher values increase risk.</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="number" className="input" style={{ width: 120 }} value={cfgMaxLev} onChange={e => setCfgMaxLev(e.target.value)} min="1" max="500" step="1" />
                  <span style={{ color: '#848E9C' }}>x</span>
                </div>
              </div>

              {/* Maintenance mode */}
              <div style={{ background: cfgMaintenance ? 'rgba(246,70,93,0.08)' : '#13161A', border: `1px solid ${cfgMaintenance ? 'rgba(246,70,93,0.3)' : 'rgba(43,49,57,0.7)'}`, borderRadius: 14, padding: 24, transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: cfgMaintenance ? '#F6465D' : '#EAECEF' }}>🔧 Maintenance Mode</div>
                    <div style={{ color: '#848E9C', fontSize: '0.82rem' }}>When enabled, users will see a maintenance page instead of the platform.</div>
                  </div>
                  <button onClick={() => { setCfgMaintenance(v => !v); toast(cfgMaintenance ? 'Maintenance OFF' : '⚠️ Maintenance Mode ON'); }}
                    style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: cfgMaintenance ? '#F6465D' : 'rgba(43,49,57,0.8)', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 4, left: cfgMaintenance ? 26 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => toast.success('Settings saved successfully')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 32px', borderRadius: 12, border: 'none', background: '#F0B90B', color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', alignSelf: 'flex-start' }}>
                <CheckCircle2 size={16} /> Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
