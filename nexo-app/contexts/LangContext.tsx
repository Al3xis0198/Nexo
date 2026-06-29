'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Lang = 'es' | 'en'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'es',
  setLang: () => {},
  t: (k) => k,
})

// ── Translation dictionary ─────────────────────────────────────────────────────
export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  es: {
    // Navbar / landing
    'nav.markets':      'Mercados',
    'nav.trade':        'Operar',
    'nav.portfolio':    'Portafolio',
    'nav.login':        'Iniciar sesión',
    'nav.getStarted':   'Comenzar',
    'nav.search':       'Buscar mercados, pares...',

    // Hero
    'hero.badge':       'Mercados en vivo · 350+ Activos',
    'hero.h1a':         'Opera Todo.',
    'hero.h1b':         'Gana Más.',
    'hero.subtitle':    'Trading profesional de criptos, acciones, forex y materias primas. Análisis técnico integrado y ejecución en tiempo real.',
    'hero.cta1':        'Empezar Gratis',
    'hero.cta2':        'Ver Mercados',
    'hero.social':      'Únete a más de 2M de traders en todo el mundo',

    // Stats
    'stats.traders':    'Traders Activos',
    'stats.volume':     'Volumen 24h',
    'stats.markets':    'Mercados',
    'stats.uptime':     'Disponibilidad',

    // Features
    'feat.why':         'Por qué NexoTrading',
    'feat.h2':          'Todo lo que necesitas para operar como un profesional',
    'feat.sub':         'Desde señales en tiempo real hasta gráficos avanzados — construido para traders serios.',
    'feat.f1.title':    'Ejecución Instantánea',
    'feat.f1.desc':     'Procesamiento de órdenes en milisegundos con nuestro motor de matching avanzado. Cero deslizamiento en todos los pares principales.',
    'feat.f2.title':    'Analítica Pro',
    'feat.f2.desc':     'RSI, MACD, Bandas de Bollinger, cruces EMA — todo integrado. Obtén señales automáticas de compra/venta en cada gráfico.',
    'feat.f3.title':    'Seguridad Bancaria',
    'feat.f3.desc':     'Cifrado multicapa, 2FA, almacenamiento en frío y detección de fraude en tiempo real mantienen tus activos seguros.',
    'feat.f4.title':    '350+ Mercados',
    'feat.f4.desc':     'Opera Cripto, Acciones de EEUU, Forex y Materias Primas en una sola plataforma con un balance unificado.',

    // Markets preview
    'mkt.title':        'Principales Mercados Cripto',
    'mkt.sub':          'Precios en vivo actualizados cada 15 segundos',
    'mkt.viewAll':      'Ver Todos los Mercados',
    'mkt.th.asset':     'Activo',
    'mkt.th.price':     'Precio',
    'mkt.th.24h':       'Cambio 24h',
    'mkt.th.7d':        'Cambio 7d',
    'mkt.th.vol':       'Volumen',

    // CTA section
    'cta.tag':          'Comienza Gratis',
    'cta.h2':           '¿Listo para operar de forma más inteligente?',
    'cta.sub':          'Abre tu cuenta hoy y experimenta ejecución ultrarrápida y analítica de nivel pro.',
    'cta.btn1':         'Crear Cuenta Gratis',
    'cta.btn2':         'Iniciar Sesión',

    // Footer
    'foot.desc':        'La plataforma de trading profesional para cripto, acciones, forex y materias primas — todo en un solo lugar.',
    'foot.product':     'Producto',
    'foot.company':     'Empresa',
    'foot.legal':       'Legal y Soporte',
    'foot.about':       'Nosotros',
    'foot.blog':        'Blog',
    'foot.careers':     'Empleo',
    'foot.press':       'Prensa',
    'foot.contact':     'Contacto',
    'foot.terms':       'Términos de Servicio',
    'foot.privacy':     'Política de Privacidad',
    'foot.risk':        'Aviso de Riesgo',
    'foot.cookies':     'Política de Cookies',
    'foot.help':        'Centro de Ayuda',
    'foot.ssl':         '🔒 SSL Seguro',
    'foot.copy':        '© 2026 NexoTrading Global LLC. Todos los derechos reservados.',
    'foot.riskNote':    'El trading implica riesgo. El capital puede perderse.',

    // Sidebar
    'side.main':        'Principal',
    'side.dashboard':   'Panel',
    'side.markets':     'Mercados',
    'side.trade':       'Operar',
    'side.portfolio':   'Portafolio',
    'side.wallet':      'Billetera',
    'side.admin':       'Admin',
    'side.adminPanel':  'Administración',
    'side.help':        'Ayuda y Soporte',
    'side.settings':    'Configuración',

    // Navbar app
    'app.balance':      'Balance',
    'app.demoMode':     'Modo Demo',
    'app.profile':      'Perfil',
    'app.wallet':       'Billetera',
    'app.adminPanel':   'Panel Admin',
    'app.logout':       'Cerrar Sesión',
    'app.search':       'Buscar mercados, pares...',

    // Dashboard
    'dash.title':       'Panel',
    'dash.subtitle':    'Bienvenido de vuelta',
    'dash.refresh':     'Actualizar',

    // Wallet
    'wal.title':        'Billetera',
    'wal.sub':          'Gestiona tus fondos y ve el historial de transacciones.',
    'wal.available':    'Balance Disponible',
    'wal.ready':        'Listo para operar',
    'wal.deposit':      'Depósito (Demo)',
    'wal.withdraw':     'Retiro (Demo)',
    'wal.amount':       'Monto (USD)',
    'wal.confirm':      'Confirmar Depósito',
    'wal.requestWith':  'Solicitar Retiro',
    'wal.note':         'Nota: Esto es una plataforma demo. No se mueven fondos reales.',
    'wal.history':      'Todas las Transacciones',
    'wal.noTx':         'Aún no hay transacciones.',
    'wal.date':         'Fecha y Hora',
    'wal.type':         'Tipo de Transacción',
    'wal.desc':         'Descripción',
    'wal.amount2':      'Monto',
    'wal.status':       'Estado',

    // Admin
    'adm.title':        'Panel de Control Admin',
    'adm.sub':          'Gestiona usuarios, balances, posiciones y configuración.',
    'adm.refresh':      'Actualizar',
    'adm.totalUsers':   'Total Usuarios',
    'adm.platBal':      'Balance Plataforma',
    'adm.openPos':      'Posiciones Abiertas',
    'adm.kycVer':       'KYC Verificado',
    'adm.tab.users':    '👥 Usuarios',
    'adm.tab.pos':      '📊 Posiciones',
    'adm.tab.tx':       '💰 Transacciones',
    'adm.tab.config':   '⚙️ Config',
    'adm.search':       'Buscar por email o nombre...',
    'adm.allStatus':    'Todos los estados',
    'adm.noUsers':      'No hay usuarios con esos filtros.',
    'adm.editBal':      'Balance',
    'adm.editBalTitle': 'Editar Balance',
    'adm.curBal':       'Balance Actual',
    'adm.setTo':        'Establecer en',
    'adm.addFunds':     'Añadir fondos',
    'adm.subtract':     'Restar',
    'adm.newBal':       'El nuevo balance será',
    'adm.note':         'Nota del admin (motivo)',
    'adm.notePH':       'ej. Bono, corrección manual...',
    'adm.cancel':       'Cancelar',
    'adm.save':         'Guardar Balance',
    'adm.saving':       'Guardando...',
    'adm.cfgTitle':     'Configuración de Plataforma',
    'adm.cfgSub':       'Configura los parámetros globales. Los cambios aplican a todos los usuarios.',
    'adm.feeRate':      'Tasa de Comisión (%)',
    'adm.feeDesc':      'Comisión cobrada por cada operación. Se aplica al tamaño nocional.',
    'adm.maxLev':       'Apalancamiento Máximo',
    'adm.maxLevDesc':   'Apalancamiento máximo disponible para los usuarios.',
    'adm.maintenance':  '🔧 Modo de Mantenimiento',
    'adm.maintDesc':    'Cuando está activado, los usuarios verán una página de mantenimiento.',
    'adm.saveConfig':   'Guardar Configuración',

    // Trade panel
    'trade.buyLong':    'COMPRAR / LARGO',
    'trade.sellShort':  'VENDER / CORTO',
    'trade.available':  'Balance Disponible',
    'trade.entry':      'Precio de Entrada',
    'trade.market':     'Mercado',
    'trade.amount':     'Monto de Inversión (USD)',
    'trade.leverage':   'Apalancamiento',
    'trade.lowRisk':    'Riesgo Bajo',
    'trade.medRisk':    'Riesgo Medio',
    'trade.highRisk':   'Riesgo Alto',
    'trade.sl':         '🛑 Stop Loss',
    'trade.tp':         '✅ Take Profit',
    'trade.margin':     'Margen Requerido',
    'trade.fee':        'Comisión (0.1%)',
    'trade.liq':        'Precio de Liquidación',
    'trade.totalDebit': 'Total a Debitar',
    'trade.insuf':      'Balance insuficiente. Necesitas',
    'trade.more':       'más.',
    'trade.enterAmt':   'Ingresa un Monto',
    'trade.insufBal':   'Balance Insuficiente',
    'trade.demo':       'Plataforma demo — sin fondos reales. El margen se debita al abrir.',

    // Confirm modal
    'conf.title':       'Confirmar Orden',
    'conf.price':       'Precio de Mercado',
    'conf.size':        'Tamaño de Posición',
    'conf.lev':         'Apalancamiento',
    'conf.margin':      'Margen Requerido',
    'conf.fee':         'Comisión (0.1%)',
    'conf.total':       'Total a Debitar',
    'conf.liq':         'Precio de Liquidación',
    'conf.risk':        'El alto apalancamiento aumenta significativamente el riesgo de liquidación.',
    'conf.cancel':      'Cancelar',
    'conf.confirm':     'Confirmar',
  },

  en: {
    // Navbar / landing
    'nav.markets':      'Markets',
    'nav.trade':        'Trade',
    'nav.portfolio':    'Portfolio',
    'nav.login':        'Log In',
    'nav.getStarted':   'Get Started',
    'nav.search':       'Search markets, pairs...',

    // Hero
    'hero.badge':       'Live Markets · 350+ Assets',
    'hero.h1a':         'Trade Everything.',
    'hero.h1b':         'Win Bigger.',
    'hero.subtitle':    'Professional-grade crypto, stocks, forex and commodities trading. Built-in technical analysis and real-time execution.',
    'hero.cta1':        'Start Trading Free',
    'hero.cta2':        'View Markets',
    'hero.social':      'Join 2M+ traders worldwide',

    // Stats
    'stats.traders':    'Active Traders',
    'stats.volume':     '24h Volume',
    'stats.markets':    'Markets',
    'stats.uptime':     'Uptime',

    // Features
    'feat.why':         'Why NexoTrading',
    'feat.h2':          'Everything you need to trade like a pro',
    'feat.sub':         'From real-time signals to advanced charting — built for serious traders.',
    'feat.f1.title':    'Instant Execution',
    'feat.f1.desc':     'Sub-millisecond order processing with our advanced matching engine. Zero slippage on all major pairs.',
    'feat.f2.title':    'Pro Analytics',
    'feat.f2.desc':     'RSI, MACD, Bollinger Bands, EMA crosses — all built in. Get automated buy/sell signals on every chart.',
    'feat.f3.title':    'Bank-Grade Security',
    'feat.f3.desc':     'Multi-layer encryption, 2FA, cold storage, and real-time fraud detection keep your assets safe.',
    'feat.f4.title':    '350+ Markets',
    'feat.f4.desc':     'Trade Crypto, US Stocks, Forex and Commodities all in one platform with a single unified balance.',

    // Markets preview
    'mkt.title':        'Top Crypto Markets',
    'mkt.sub':          'Live prices updated every 15 seconds',
    'mkt.viewAll':      'View All Markets',
    'mkt.th.asset':     'Asset',
    'mkt.th.price':     'Price',
    'mkt.th.24h':       '24h Change',
    'mkt.th.7d':        '7d Change',
    'mkt.th.vol':       'Volume',

    // CTA section
    'cta.tag':          'Start for Free',
    'cta.h2':           'Ready to trade smarter?',
    'cta.sub':          'Open your account today and experience lightning-fast execution and pro-level analytics.',
    'cta.btn1':         'Create Free Account',
    'cta.btn2':         'Sign In',

    // Footer
    'foot.desc':        'The professional trading platform for crypto, stocks, forex and commodities — all in one place.',
    'foot.product':     'Product',
    'foot.company':     'Company',
    'foot.legal':       'Legal & Support',
    'foot.about':       'About Us',
    'foot.blog':        'Blog',
    'foot.careers':     'Careers',
    'foot.press':       'Press',
    'foot.contact':     'Contact',
    'foot.terms':       'Terms of Service',
    'foot.privacy':     'Privacy Policy',
    'foot.risk':        'Risk Disclaimer',
    'foot.cookies':     'Cookie Policy',
    'foot.help':        'Help Center',
    'foot.ssl':         '🔒 SSL Secured',
    'foot.copy':        '© 2026 NexoTrading Global LLC. All rights reserved.',
    'foot.riskNote':    'Trading involves risk. Capital may be lost.',

    // Sidebar
    'side.main':        'Main',
    'side.dashboard':   'Dashboard',
    'side.markets':     'Markets',
    'side.trade':       'Trade',
    'side.portfolio':   'Portfolio',
    'side.wallet':      'Wallet',
    'side.admin':       'Admin',
    'side.adminPanel':  'Administration',
    'side.help':        'Help & Support',
    'side.settings':    'Settings',

    // Navbar app
    'app.balance':      'Balance',
    'app.demoMode':     'Demo Mode',
    'app.profile':      'Profile',
    'app.wallet':       'Wallet',
    'app.adminPanel':   'Admin Panel',
    'app.logout':       'Log Out',
    'app.search':       'Search markets, pairs...',

    // Dashboard
    'dash.title':       'Dashboard',
    'dash.subtitle':    'Welcome back',
    'dash.refresh':     'Refresh',

    // Wallet
    'wal.title':        'Wallet',
    'wal.sub':          'Manage your funds and view transaction history.',
    'wal.available':    'Available Balance',
    'wal.ready':        'Ready for trading',
    'wal.deposit':      'Deposit (Demo)',
    'wal.withdraw':     'Withdraw (Demo)',
    'wal.amount':       'Amount (USD)',
    'wal.confirm':      'Confirm Deposit',
    'wal.requestWith':  'Request Withdrawal',
    'wal.note':         'Note: This is a demo platform. No real funds are moved.',
    'wal.history':      'All Transactions',
    'wal.noTx':         'No transactions yet.',
    'wal.date':         'Date & Time',
    'wal.type':         'Transaction Type',
    'wal.desc':         'Description',
    'wal.amount2':      'Amount',
    'wal.status':       'Status',

    // Admin
    'adm.title':        'Admin Control Panel',
    'adm.sub':          'Manage users, balances, positions and platform settings.',
    'adm.refresh':      'Refresh',
    'adm.totalUsers':   'Total Users',
    'adm.platBal':      'Platform Balance',
    'adm.openPos':      'Open Positions',
    'adm.kycVer':       'Verified KYC',
    'adm.tab.users':    '👥 Users',
    'adm.tab.pos':      '📊 Positions',
    'adm.tab.tx':       '💰 Transactions',
    'adm.tab.config':   '⚙️ Config',
    'adm.search':       'Search by email or name...',
    'adm.allStatus':    'All Status',
    'adm.noUsers':      'No users match your filters.',
    'adm.editBal':      'Balance',
    'adm.editBalTitle': 'Edit Balance',
    'adm.curBal':       'Current Balance',
    'adm.setTo':        'Set to',
    'adm.addFunds':     'Add funds',
    'adm.subtract':     'Subtract',
    'adm.newBal':       'New balance will be',
    'adm.note':         'Admin Note (reason)',
    'adm.notePH':       'e.g. Bonus deposit, manual correction...',
    'adm.cancel':       'Cancel',
    'adm.save':         'Save Balance',
    'adm.saving':       'Saving...',
    'adm.cfgTitle':     'Platform Settings',
    'adm.cfgSub':       'Configure global platform parameters. Changes apply to all users.',
    'adm.feeRate':      'Trading Fee Rate (%)',
    'adm.feeDesc':      'Fee charged on each trade open. Applied to the notional position size.',
    'adm.maxLev':       'Maximum Leverage',
    'adm.maxLevDesc':   'Maximum leverage available to users. Higher values increase risk.',
    'adm.maintenance':  '🔧 Maintenance Mode',
    'adm.maintDesc':    'When enabled, users will see a maintenance page instead of the platform.',
    'adm.saveConfig':   'Save Settings',

    // Trade panel
    'trade.buyLong':    'BUY / LONG',
    'trade.sellShort':  'SELL / SHORT',
    'trade.available':  'Available Balance',
    'trade.entry':      'Entry Price',
    'trade.market':     'Market',
    'trade.amount':     'Investment Amount (USD)',
    'trade.leverage':   'Leverage',
    'trade.lowRisk':    'Low Risk',
    'trade.medRisk':    'Medium Risk',
    'trade.highRisk':   'High Risk',
    'trade.sl':         '🛑 Stop Loss',
    'trade.tp':         '✅ Take Profit',
    'trade.margin':     'Margin Required',
    'trade.fee':        'Fee (0.1%)',
    'trade.liq':        'Liquidation Price',
    'trade.totalDebit': 'Total Debit',
    'trade.insuf':      'Insufficient balance. Need',
    'trade.more':       'more.',
    'trade.enterAmt':   'Enter Amount',
    'trade.insufBal':   'Insufficient Balance',
    'trade.demo':       'Demo platform — no real funds. Margin debited on open.',

    // Confirm modal
    'conf.title':       'Confirm Order',
    'conf.price':       'Market Price',
    'conf.size':        'Position Size',
    'conf.lev':         'Leverage',
    'conf.margin':      'Margin Required',
    'conf.fee':         'Trading Fee (0.1%)',
    'conf.total':       'Total Debit',
    'conf.liq':         'Liquidation Price',
    'conf.risk':        'High leverage significantly increases liquidation risk.',
    'conf.cancel':      'Cancel',
    'conf.confirm':     'Confirm',
  },
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const saved = localStorage.getItem('nexo-lang') as Lang | null
    if (saved === 'en' || saved === 'es') {
      setTimeout(() => {
        setLangState(saved)
      }, 0)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('nexo-lang', l)
  }

  const t = (key: string): string => {
    return TRANSLATIONS[lang][key] ?? TRANSLATIONS['en'][key] ?? key
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
