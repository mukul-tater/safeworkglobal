import Config from 'react-native-config';

export const ENV = {
  SUPABASE_URL: Config.SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: Config.SUPABASE_ANON_KEY ?? '',
};
