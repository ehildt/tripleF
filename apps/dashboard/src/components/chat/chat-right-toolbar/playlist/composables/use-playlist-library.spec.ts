import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlaylistLibrary } from './use-playlist-library';

const {
  selectPlaylistMock,
  createPlaylistMock,
  deletePlaylistMock,
  renamePlaylistMock,
  toastInfoMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  selectPlaylistMock: vi.fn(),
  createPlaylistMock: vi.fn(),
  deletePlaylistMock: vi.fn(),
  renamePlaylistMock: vi.fn(),
  toastInfoMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('@/composables/use-playlist-catalog/use-playlist-catalog', () => ({
  usePlaylistCatalog: () => ({
    selectPlaylist: selectPlaylistMock,
    createPlaylist: createPlaylistMock,
    deletePlaylist: deletePlaylistMock,
    renamePlaylist: renamePlaylistMock,
  }),
}));

vi.mock('@/composables/use-toast/use-toast', () => ({
  useToast: () => ({ info: toastInfoMock, error: toastErrorMock }),
}));

describe('usePlaylistLibrary', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    selectPlaylistMock.mockReset().mockReturnValue(true);
    createPlaylistMock.mockReset();
    deletePlaylistMock.mockReset().mockReturnValue(true);
    renamePlaylistMock.mockReset().mockReturnValue(true);
    toastInfoMock.mockClear();
    toastErrorMock.mockClear();
  });

  it('creates the typed playlist, announces it, and clears the input', () => {
    createPlaylistMock.mockReturnValue({ name: 'main', videos: [] });
    const library = usePlaylistLibrary();
    library.playlistNameInput.value = ' main ';

    library.createPlaylist();

    expect(createPlaylistMock).toHaveBeenCalledWith('main');
    expect(toastInfoMock).toHaveBeenCalledTimes(1);
    expect(library.playlistNameInput.value).toBe('');
  });

  it('keeps the draft and success toast silent when creation is a no-op', () => {
    createPlaylistMock.mockReturnValue(null);
    const library = usePlaylistLibrary();
    library.playlistNameInput.value = 'duplicate';

    library.createPlaylist();

    expect(library.playlistNameInput.value).toBe('duplicate');
    expect(toastInfoMock).not.toHaveBeenCalled();
  });

  it('announces only successful selection and deletion', () => {
    const library = usePlaylistLibrary();

    selectPlaylistMock.mockReturnValueOnce(false);
    library.selectPlaylist('missing');
    deletePlaylistMock.mockReturnValueOnce(false);
    library.deletePlaylist('missing');
    expect(toastInfoMock).not.toHaveBeenCalled();

    library.selectPlaylist('main');
    library.deletePlaylist('main');
    expect(toastInfoMock).toHaveBeenCalledTimes(2);
  });

  it('shows the existing name error only for a rejected rename', () => {
    const library = usePlaylistLibrary();

    renamePlaylistMock.mockReturnValueOnce(false);
    library.renamePlaylist('main', 'taken');
    expect(toastErrorMock).toHaveBeenCalledTimes(1);

    library.renamePlaylist('main', 'renamed');
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });
});
