const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();
jest.mock('expo-linking', () => ({
  canOpenURL: (...args: unknown[]) => mockCanOpenURL(...args),
  openURL: (...args: unknown[]) => mockOpenURL(...args),
}));

import { referenceSources } from '../../src/data/guides';
import { openPublishedSource } from '../../src/services/external-links';
import type { ReferenceSource } from '../../src/features/guides/types';

describe('openPublishedSource', () => {
  beforeEach(() => {
    mockCanOpenURL.mockReset();
    mockOpenURL.mockReset();
  });

  it('rejects non-HTTPS input without leaving the app', async () => {
    const source = { ...referenceSources[0], url: 'http://example.com' } as ReferenceSource;

    await expect(openPublishedSource(source)).resolves.toEqual({ ok: false, reason: 'invalid' });
    expect(mockCanOpenURL).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('reports unsupported URLs without calling openURL', async () => {
    mockCanOpenURL.mockResolvedValue(false);

    await expect(openPublishedSource(referenceSources[0])).resolves.toEqual({
      ok: false,
      reason: 'unsupported',
    });
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('opens a supported published HTTPS source', async () => {
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(undefined);

    await expect(openPublishedSource(referenceSources[0])).resolves.toEqual({ ok: true });
    expect(mockOpenURL).toHaveBeenCalledWith(referenceSources[0].url);
  });

  it('reports failures thrown by openURL and keeps control in the app', async () => {
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockRejectedValue(new Error('platform failure'));

    await expect(openPublishedSource(referenceSources[0])).resolves.toEqual({
      ok: false,
      reason: 'failed',
    });
  });
});
