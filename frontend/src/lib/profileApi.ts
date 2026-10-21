// Profile details (phone, address, bio) and earned badges. Kept apart from lib/api.ts so the shared API file stays untouched.
import { useCallback, useEffect, useState } from 'react';
import { ApiError, UNAUTHORIZED_EVENT, getToken } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the Core API running?', 0);
  }
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') message = body.detail;
      else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((d: { msg?: string }) => (d.msg || '').replace(/^Value error, /, ''))
          .filter(Boolean)
          .join('; ');
      }
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export interface ProfileDetails {
  name: string;
  email: string;
  ward: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  bio: string | null;
}

export interface ProfileDetailsInput {
  name?: string;
  ward?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  bio?: string;
}

export const fetchProfileDetails = () => req<ProfileDetails>('/api/auth/me');
export const saveProfileDetails = (input: ProfileDetailsInput) =>
  req<ProfileDetails>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(input) });

export interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  requirement: string;
  category: string;
  earned_at: string;
}

export const fetchMyBadges = () => req<EarnedBadge[]>('/api/badges/mine');

/** Badges this citizen has really earned. Re-fetches when `refreshKey` changes (e.g. points moved). */
export function useMyBadges(refreshKey: unknown = 0) {
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    fetchMyBadges()
      .then(setBadges)
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load, refreshKey]);
  return { badges, loading, reload: load };
}

export function useProfileDetails() {
  const [details, setDetails] = useState<ProfileDetails | null>(null);
  const load = useCallback(() => {
    fetchProfileDetails().then(setDetails).catch(() => undefined);
  }, []);
  useEffect(load, [load]);
  return { details, setDetails, reload: load };
}

export interface WalletTx {
  id: number;
  points: number;
  action_type: string;
  description: string | null;
  created_at: string;
}
export interface Wallet {
  points: number;
  tier: string;
  next_tier: string | null;
  points_to_next_tier: number;
  progress_percent: number;
  points_today: number;
  daily_cap: number;
  remaining_today: number;
  recent_transactions: WalletTx[];
}
export const fetchWallet = () => req<Wallet>('/api/rewards/wallet');

export function useWallet(refreshKey: unknown = 0) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  useEffect(() => {
    fetchWallet().then(setWallet).catch(() => setWallet(null));
  }, [refreshKey]);
  return wallet;
}
