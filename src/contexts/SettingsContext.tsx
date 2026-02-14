import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SettingsMap {
  academy_name: string;
  hero_title: string;
  hero_subtitle: string;
  hero_badge_text: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  enrollment_open: boolean;
  geofence_radius_meters: number;
  theme_primary_color: string;
  partial_payment_percentage: number;
  [key: string]: unknown;
}

const defaultSettings: SettingsMap = {
  academy_name: 'Meranos ICT Training Academy',
  hero_title: 'Launch Your Tech Career',
  hero_subtitle: 'Industry-leading ICT training programs designed to transform beginners into skilled professionals',
  hero_badge_text: 'Enrollment Open for 2025',
  contact_email: 'info@meranos.com',
  contact_phone: '+234 800 000 0000',
  contact_address: 'Lagos, Nigeria',
  enrollment_open: true,
  geofence_radius_meters: 200,
  theme_primary_color: '#6366f1',
  partial_payment_percentage: 50,
};

interface SettingsContextType {
  settings: SettingsMap;
  loading: boolean;
  updateSetting: (key: string, value: unknown) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const parseValue = (raw: unknown): unknown => {
    // jsonb values are already parsed by supabase-js
    return raw;
  };

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (!error && data) {
      const mapped: Record<string, unknown> = {};
      data.forEach((row: { key: string; value: unknown }) => {
        mapped[row.key] = parseValue(row.value);
      });
      setSettings((prev) => ({ ...prev, ...mapped } as SettingsMap));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes on settings table
    const channel = supabase
      .channel('settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // Optionally handle delete
            return;
          }
          const row = payload.new as { key: string; value: unknown };
          setSettings((prev) => ({ ...prev, [row.key]: parseValue(row.value) }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: unknown) => {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value: value as any }, { onConflict: 'key' });

    if (error) throw error;

    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
