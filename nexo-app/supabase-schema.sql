-- 1. Custom Types
CREATE TYPE user_level AS ENUM ('standard', 'pro', 'vip');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE position_type AS ENUM ('buy', 'sell');
CREATE TYPE position_status AS ENUM ('open', 'closed');
CREATE TYPE asset_type AS ENUM ('crypto', 'stock', 'forex', 'commodity');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'trade_open', 'trade_close', 'admin_adjustment', 'binary_win', 'binary_loss');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE binary_option_status AS ENUM ('open', 'won', 'lost', 'expired');

-- 2. Tables

-- Profiles Table (Extends Supabase Auth User)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0 NOT NULL,
  level user_level DEFAULT 'standard' NOT NULL,
  status user_status DEFAULT 'active' NOT NULL,
  kyc_status kyc_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Roles Table (For admin access)
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'user' NOT NULL,
  UNIQUE(user_id, role)
);

-- Positions Table (Trading positions)
CREATE TABLE positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  type position_type NOT NULL,
  asset_type asset_type NOT NULL,
  amount NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  close_price NUMERIC,
  leverage NUMERIC DEFAULT 1 NOT NULL,
  status position_status DEFAULT 'open' NOT NULL,
  fixed_pnl NUMERIC,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Transactions Table (Balance history)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Binary Options Table (Options binary history)
CREATE TABLE binary_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('call', 'put')),
  amount NUMERIC NOT NULL,
  payout_rate NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  close_price NUMERIC,
  pnl NUMERIC,
  status binary_option_status DEFAULT 'open' NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Platform Settings Table (Global settings)
CREATE TABLE platform_settings (
  id INT PRIMARY KEY,
  fee NUMERIC DEFAULT 0.1 NOT NULL,
  max_leverage INT DEFAULT 100 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

INSERT INTO platform_settings (id, fee, max_leverage)
VALUES (1, 0.1, 100)
ON CONFLICT (id) DO NOTHING;

-- 3. Functions & Triggers

-- Trigger to automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update 'updated_at' timestamp on profiles
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Function to check if user has specific role (used in RLS)
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role::text = p_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Row Level Security (RLS) Policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE binary_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User Roles Policies
CREATE POLICY "Users can read their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles" ON user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Positions Policies
CREATE POLICY "Users can view their own positions" ON positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all positions" ON positions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own positions" ON positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own open positions" ON positions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'open');

-- Transactions Policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert any transaction" ON transactions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Binary Options Policies
CREATE POLICY "Users can view their own binary options" ON binary_options
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own binary options" ON binary_options
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all binary options" ON binary_options
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert binary options" ON binary_options
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update binary options" ON binary_options
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Platform Settings Policies
CREATE POLICY "Anyone can read platform settings" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert/update platform settings" ON platform_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
