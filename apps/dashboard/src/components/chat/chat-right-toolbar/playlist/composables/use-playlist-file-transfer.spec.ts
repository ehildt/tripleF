import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import { serializePlaylistFile } from '../helpers/serialize-playlist-file.helper';
import { usePlaylistFileTransfer } from './use-playlist-file-transfer';

const { importPlaylistMock, toastInfoMock, toastErrorMock, toastDebugMock } =
  vi.hoisted(() => ({
    importPlaylistMock: vi.fn(),
    toastInfoMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastDebugMock: vi.fn(),
  }));

vi.mock('@/composables/use-playlist-catalog/use-playlist-catalog', () => ({
  usePlaylistCatalog: () => ({ importPlaylist: importPlaylistMock }),
}));

vi.mock('@/composables/use-toast/use-toast', () => ({
  useToast: () => ({
    info: toastInfoMock,
    error: toastErrorMock,
    debug: toastDebugMock,
  }),
}));

const VIDEO: VideoGalleryItem = {
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'One',
  channel: 'Channel',
};

function createPlaylistFile(name: string, text: string): File {
  const file = new File([text], name, { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => text });
  return file;
}

function pickFile(input: HTMLInputElement, file: File): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  });
  input.dispatchEvent(new Event('change'));
}

describe('usePlaylistFileTransfer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    importPlaylistMock.mockReset().mockImplementation((name, videos) => ({
      name,
      videos,
    }));
    toastInfoMock.mockReset();
    toastErrorMock.mockReset();
    toastDebugMock.mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:playlist');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('downloads the requested inactive playlist and revokes its object URL', async () => {
    const clickedLinks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clickedLinks.push(this);
    });
    const store = usePlaylistStore();
    store.createPlaylist('Other');
    store.addVideoToActivePlaylist({
      videoUrl: 'https://cdn.example.com/other.mp4',
    });
    store.createPlaylist('Focus / Night');
    store.addVideoToActivePlaylist(VIDEO);
    store.selectPlaylist('Other');

    usePlaylistFileTransfer().savePlaylistToFile('Focus / Night');

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(JSON.parse(await blob.text())).toEqual({
      version: 1,
      videos: [VIDEO],
    });
    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0].download).toBe('Focus _ Night.json');
    expect(clickedLinks[0].isConnected).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:playlist');
    expect(toastInfoMock).toHaveBeenCalledWith(
      'Playlist Focus / Night exported',
    );
  });

  it('does nothing when the requested playlist does not exist', () => {
    usePlaylistFileTransfer().savePlaylistToFile('missing');

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(toastInfoMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('opens a single JSON picker and imports a valid lossless file', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    usePlaylistFileTransfer().loadPlaylistFromFile();
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    expect(input?.accept).toBe('.json,application/json');
    expect(input?.multiple).toBe(false);

    pickFile(
      input!,
      createPlaylistFile('Focus.json', serializePlaylistFile([VIDEO])),
    );

    await vi.waitFor(() =>
      expect(importPlaylistMock).toHaveBeenCalledWith('Focus', [VIDEO]),
    );
    expect(input?.isConnected).toBe(false);
    expect(toastInfoMock).toHaveBeenCalledWith('Playlist Focus imported');
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'Focus.txt', text: serializePlaylistFile([VIDEO]) },
    { name: 'Focus.json', text: 'not json' },
  ])('rejects $name without importing partial data', async ({ name, text }) => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    usePlaylistFileTransfer().loadPlaylistFromFile();
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]')!;

    pickFile(input, createPlaylistFile(name, text));

    await vi.waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
    expect(importPlaylistMock).not.toHaveBeenCalled();
    expect(usePlaylistStore().playlists).toEqual([]);
    expect(input.isConnected).toBe(false);
    expect(toastDebugMock).toHaveBeenCalledTimes(1);
  });

  it('removes the picker on cancel without importing', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    usePlaylistFileTransfer().loadPlaylistFromFile();
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]')!;

    input.dispatchEvent(new Event('cancel'));

    expect(input.isConnected).toBe(false);
    expect(importPlaylistMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});
