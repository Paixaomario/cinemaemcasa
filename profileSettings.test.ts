import { saveProfileSettings, getProfileSettings } from '@/lib/profileSettings';
import { createClient } from '@/lib/supabase';

const mockSupabase = createClient() as any;

describe('profileSettings - User Preferences', () => {
  const userId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar valores padrão se o usuário não tiver configurações salvas', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

    const settings = await getProfileSettings(userId);
    
    expect(settings).toEqual({
      language: 'pt-BR',
      subtitles: 'off',
      video_quality: 'auto',
      data_saver: false,
    });
  });

  test('deve salvar configurações usando upsert para evitar duplicatas', async () => {
    const newSettings = {
      language: 'en-US',
      video_quality: 'hd',
      data_saver: true
    };

    mockSupabase.from().upsert.mockResolvedValue({ error: null });

    await saveProfileSettings(userId, newSettings);

    expect(mockSupabase.from).toHaveBeenCalledWith('profile_settings');
    expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        language: 'en-US',
        video_quality: 'hd'
      }),
      { onConflict: 'user_id' }
    );
  });
});