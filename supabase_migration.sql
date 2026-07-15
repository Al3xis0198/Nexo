-- ============================================================
-- NexoTrading - Supabase Migration Script
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- ===== EXTENSIONES =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== TABLA: profiles =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  balance DECIMAL(20,8) DEFAULT 10000.00,
  level TEXT DEFAULT 'standard' CHECK (level IN ('standard','pro','vip')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','banned')),
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending','verified','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABLA: user_roles =====
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin')) NOT NULL,
  UNIQUE(user_id, role)
);

-- ===== TABLA: positions =====
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('buy','sell')),
  asset_type TEXT DEFAULT 'crypto' CHECK (asset_type IN ('crypto','stock','forex','commodity')),
  amount DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  close_price DECIMAL(20,8),
  leverage INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed')),
  fixed_pnl DECIMAL(20,8),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- ===== TABLA: transactions =====
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','withdrawal','trade_open','trade_close','admin_adjustment','binary_win','binary_loss')),
  amount DECIMAL(20,8) NOT NULL,
  description TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABLA: binary_options =====
CREATE TABLE IF NOT EXISTS public.binary_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('call', 'put')),
  amount DECIMAL(20,8) NOT NULL,
  payout_rate DECIMAL(5,2) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  close_price DECIMAL(20,8),
  pnl DECIMAL(20,8),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABLA: platform_settings =====
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY,
  fee DECIMAL(10,4) NOT NULL DEFAULT 0.1,
  max_leverage INT NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (id, fee, max_leverage)
VALUES (1, 0.1, 100)
ON CONFLICT (id) DO NOTHING;

-- ===== FUNCIÓN: has_role =====
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = p_user_id
      AND user_roles.role::text = p_role
  );
$$;

-- ===== FUNCIÓN: handle_new_user (auto-crear perfil + rol al registrarse) =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ===== TRIGGER: on_auth_user_created =====
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===== FUNCIÓN: updated_at automático =====
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS: profiles =====
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS: user_roles =====
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS: positions =====
CREATE POLICY "Users can manage own positions"
  ON public.positions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all positions"
  ON public.positions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS: transactions =====
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS: binary_options =====
CREATE POLICY "Users can manage own binary options"
  ON public.binary_options FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all binary options"
  ON public.binary_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLÍTICAS: platform_settings =====
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage platform settings"
  ON public.platform_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- GRANT permisos a anon y authenticated
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.positions TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.binary_options TO authenticated;
GRANT ALL ON public.platform_settings TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.platform_settings TO anon;

-- ============================================================
-- ÍNDICES para rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON public.positions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_options_user_id ON public.binary_options(user_id);

-- ============================================================
-- HACER ADMIN AL PRIMER USUARIO (opcional, ejecutar manualmente)
-- Reemplaza 'tu-email@ejemplo.com' con tu email
-- ============================================================
-- DO $$
-- DECLARE
--   target_id UUID;
-- BEGIN
--   SELECT id INTO target_id FROM auth.users WHERE email = 'tu-email@ejemplo.com' LIMIT 1;
--   IF target_id IS NOT NULL THEN
--     INSERT INTO public.user_roles (user_id, role) VALUES (target_id, 'admin')
--     ON CONFLICT (user_id, role) DO NOTHING;
--   END IF;
-- END $$;
