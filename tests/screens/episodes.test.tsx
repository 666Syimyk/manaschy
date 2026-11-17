import { Linking, ScrollView } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { EpisodeCatalogScreen } from '../../src/features/episodes/catalog-screen';
import { EpisodeReaderScreen } from '../../src/features/episodes/reader-screen';
import { GuideCatalogScreen } from '../../src/features/guides/catalog-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockPush = jest.fn();
const mockLoad = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock('@/data/epic', () => {
  const epicVolumes = [1, 2, 3, 4].map((number) => ({
    id: `v${number}`, number, title: `Том ${number}`, pdfUrl: `https://example.org/${number}.pdf`,
    pageCount: 100, citation: `Тестовая ссылка на том ${number}`,
  }));
  const epicEpisodes = [
    { id: 'first', title: 'Биринчи эпизод', volumeId: 'v1', order: 1, startPage: 10, endPage: 12, lineCount: 0, access: 'source', pdfUrl: 'https://example.org/1.pdf' },
    { id: 'second', title: 'Экинчи эпизод', volumeId: 'v2', order: 2, startPage: 20, endPage: 21, lineCount: 0, access: 'source', pdfUrl: 'https://example.org/2.pdf' },
    { id: 'third', title: 'Тестовый заголовок AЛМAМБЕТ', volumeId: 'v4', order: 3, startPage: 30, endPage: 31, lineCount: 0, access: 'source', pdfUrl: 'https://example.org/4.pdf' },
  ];
  return {
    epicVolumes, epicEpisodes,
    getEpisodeById: (id: string) => epicEpisodes.find((episode) => episode.id === id),
    getEpisodeNeighbours: (id: string) => {
      const index = epicEpisodes.findIndex((episode) => episode.id === id);
      return { previous: epicEpisodes[index - 1], next: epicEpisodes[index + 1] };
    },
    loadEpisodePage: (id: string, page: number, signal?: AbortSignal) => mockLoad(id, page, signal),
  };
}, { virtual: true });

function resetStore(locale: 'ru' | 'ky' = 'ru') {
  useGuideStore.setState({
    ...useGuideStore.getInitialState(), ...DEFAULT_LOCAL_STATE, locale, onboarded: true, hydrated: true,
  });
}

describe('episode catalog and reader', () => {
  beforeEach(() => {
    resetStore();
    mockLoad.mockReset();
    mockLoad.mockImplementation(async (episodeId: string, page: number) => ({ episodeId, page, blocks: [
      { kind: 'heading', text: `Заголовок страницы ${page}` },
      { kind: 'verse', text: `Первая строка страницы ${page}\nВторая строка` },
      { kind: 'prose', text: 'Обычный прозаический абзац из издания.' },
    ] }));
  });

  it('opens the cited page, accepts a new citation and preserves internal page turns', async () => {
    const screen = await render(<EpisodeReaderScreen id="first" initialPage={11} />);
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('11');
    await screen.findByText('Заголовок страницы 11');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Следующая страница' })[0]);
    await screen.rerender(<EpisodeReaderScreen id="first" initialPage={11} />);
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('12');
    await screen.rerender(<EpisodeReaderScreen id="first" initialPage={10} />);
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('10');
    await screen.rerender(<EpisodeReaderScreen id="first" initialPage={12} />);
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('12');
    await screen.findByText('Заголовок страницы 12');
  });

  it.each([9, 13, 11.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])('rejects invalid initial page %s', async (initialPage) => {
    const screen = await render(<EpisodeReaderScreen id="first" initialPage={initialPage} />);
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('10');
    await screen.findByText('Заголовок страницы 10');
  });

  it('opens episodes by default and retains the article catalog', async () => {
    const screen = await render(<GuideCatalogScreen />);
    expect(screen.getByRole('button', { name: 'Эпизоды' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('episode-card-first')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Статьи' }));
    expect(screen.getAllByTestId(/^guide-card-/)).toHaveLength(10);
    expect(screen.queryByTestId('episode-card-first')).toBeNull();
  });

  it('filters volumes, searches original titles, and resets an empty search', async () => {
    const screen = await render(<EpisodeCatalogScreen />);
    expect(screen.getAllByTestId(/^episode-card-/)).toHaveLength(3);
    await fireEvent.press(screen.getByRole('button', { name: 'Том 2' }));
    expect(screen.getAllByTestId(/^episode-card-/)).toHaveLength(1);
    expect(screen.getByTestId('episode-card-second')).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: 'Экинчи эпизод · Том 2 · Страницы 20–21' }));
    expect(mockPush).toHaveBeenCalledWith('/episode/second');
    await fireEvent.changeText(screen.getByLabelText('Поиск по эпизодам'), 'отсутствует');
    expect(screen.getByText('Эпизоды не найдены')).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Сбросить поиск' }).at(-1)!);
    expect(screen.getAllByTestId(/^episode-card-/)).toHaveLength(3);
    await fireEvent.changeText(screen.getByLabelText('Поиск по эпизодам'), '  БИРИНЧИ  ');
    expect(screen.getAllByTestId(/^episode-card-/)).toHaveLength(1);
  });

  it('localizes controls while retaining original episode titles', async () => {
    resetStore('ky');
    const screen = await render(<GuideCatalogScreen />);
    expect(screen.getByRole('button', { name: 'Эпизоддор' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Бардык томдор' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Биринчи эпизод · Том 1 · Беттер 10–12' })).toBeTruthy();
  });

  it('finds headings with mixed Latin and Cyrillic glyphs without changing their display', async () => {
    const screen = await render(<EpisodeCatalogScreen />);
    await fireEvent.changeText(screen.getByLabelText('Поиск по эпизодам'), 'алмамбет');
    expect(screen.getAllByTestId(/^episode-card-/)).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Тестовый заголовок AЛМAМБЕТ · Том 4 · Страницы 30–31' })).toBeTruthy();
  });

  it('bounds source-page navigation, opens the chosen source page and resets on episode change', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const screen = await render(<EpisodeReaderScreen id="first" />);
    await screen.findByText('Заголовок страницы 10');
    expect(screen.getAllByRole('button', { name: 'Предыдущая страница' })[0].props.accessibilityState.disabled).toBe(true);
    const pageControl = screen.getByLabelText('Номер страницы издания');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Следующая страница' })[0]);
    expect(screen.getByLabelText('Номер страницы издания')).toBe(pageControl);
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('11');
    await fireEvent.press(screen.getByRole('button', { name: 'Эта страница в PDF' }));
    expect(openUrl).toHaveBeenCalledWith('https://example.org/1.pdf#page=11&view=FitH');
    for (const value of ['9', '13', '999', '11.5', '-10', 'abc', '']) {
      await fireEvent.changeText(screen.getByLabelText('Номер страницы издания'), value);
      await fireEvent.press(screen.getByRole('button', { name: 'Перейти' }));
      expect(screen.getByText('Введите номер страницы этого эпизода.')).toBeTruthy();
      expect(screen.getByText('Заголовок страницы 11')).toBeTruthy();
    }
    await fireEvent.changeText(screen.getByLabelText('Номер страницы издания'), '12');
    await fireEvent.press(screen.getByRole('button', { name: 'Перейти' }));
    expect(screen.getAllByRole('button', { name: 'Следующая страница' })[0].props.accessibilityState.disabled).toBe(true);
    expect(await screen.findByText('Заголовок страницы 12')).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: 'Следующий эпизод: Экинчи эпизод' }));
    expect(mockPush).toHaveBeenCalledWith('/episode/second');
    await screen.rerender(<EpisodeReaderScreen id="second" />);
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('20');
    expect(await screen.findByText('Заголовок страницы 20')).toBeTruthy();
    openUrl.mockRestore();
  });

  it('reports failure to open an external source', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('unavailable'));
    const screen = await render(<EpisodeReaderScreen id="first" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Эта страница в PDF' }));
    expect(await screen.findByText('Не удалось открыть источник. Попробуйте ещё раз.')).toBeTruthy();
    openUrl.mockRestore();
  });

  it('returns to the top on a changed page without remounting the reading screen', async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
    try {
      const screen = await render(<EpisodeReaderScreen id="first" />);
      await screen.findByText('Заголовок страницы 10');
      const readingScreen = screen.root;
      const pageInput = screen.getByLabelText('Номер страницы издания');
      expect(scrollTo).not.toHaveBeenCalled();

      await fireEvent.press(screen.getAllByRole('button', { name: 'Следующая страница' }).at(-1)!);
      expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
      expect(await screen.findByText('Заголовок страницы 11')).toBeTruthy();
      expect(screen.root).toBe(readingScreen);
      expect(screen.getByLabelText('Номер страницы издания')).toBe(pageInput);

      scrollTo.mockClear();
      await fireEvent.press(screen.getByRole('button', { name: 'Перейти' }));
      await fireEvent.changeText(pageInput, '99');
      await fireEvent.press(screen.getByRole('button', { name: 'Перейти' }));
      expect(scrollTo).not.toHaveBeenCalled();

      await fireEvent.changeText(pageInput, '12');
      await fireEvent.press(screen.getByRole('button', { name: 'Перейти' }));
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: false });
      expect(await screen.findByText('Заголовок страницы 12')).toBeTruthy();
      await fireEvent.press(screen.getAllByRole('button', { name: 'Предыдущая страница' })[0]);
      expect(scrollTo).toHaveBeenCalledTimes(2);
      expect(await screen.findByText('Заголовок страницы 11')).toBeTruthy();
    } finally {
      scrollTo.mockRestore();
    }
  });

  it('shows loading before rendering selectable source text with verse and prose blocks', async () => {
    let finish!: (value: unknown) => void;
    mockLoad.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const screen = await render(<EpisodeReaderScreen id="first" />);
    expect(screen.getByRole('progressbar', { name: 'Загружаем текст эпизода…' })).toBeTruthy();
    expect(screen.queryByTestId('episode-page')).toBeNull();
    await act(async () => finish({ episodeId: 'first', page: 10, blocks: [
      { kind: 'heading', text: 'Глава из источника' },
      { kind: 'verse', text: 'Первая тестовая строка\n\nВторая тестовая строка' },
      { kind: 'prose', text: 'Прозаический абзац, который переносится по ширине экрана.' },
    ] }));
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('Глава из источника').props.selectable).toBe(true);
    expect(screen.getByText('Первая тестовая строка\n\nВторая тестовая строка').props.selectable).toBe(true);
    expect(screen.getByText('Прозаический абзац, который переносится по ширине экрана.').props.selectable).toBe(true);
    expect(JSON.stringify(screen.toJSON())).not.toContain('"type":"iframe"');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Следующая страница' })[0]);
    expect(await screen.findByText('Заголовок страницы 11')).toBeTruthy();
    expect(screen.queryByText('Первая тестовая строка\n\nВторая тестовая строка')).toBeNull();
  });

  it('retries a failed text load and handles unknown IDs', async () => {
    mockLoad.mockRejectedValueOnce(new Error('missing'));
    const screen = await render(<EpisodeReaderScreen id="first" />);
    await waitFor(() => expect(screen.getByText('Не удалось загрузить текст')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Повторить загрузку' }));
    expect(await screen.findByText('Заголовок страницы 10')).toBeTruthy();
    await screen.rerender(<EpisodeReaderScreen id="missing" />);
    expect(screen.getByText('Эпизод не найден')).toBeTruthy();
  });

  it('clears the previous page while loading and ignores a stale response after a page jump', async () => {
    const screen = await render(<EpisodeReaderScreen id="first" />);
    await screen.findByText('Заголовок страницы 10');
    let finishOld!: (value: unknown) => void;
    let finishCurrent!: (value: unknown) => void;
    let oldSignal: AbortSignal | undefined;
    mockLoad.mockImplementationOnce((_id: string, _page: number, signal?: AbortSignal) => {
      oldSignal = signal;
      return new Promise((resolve) => { finishOld = resolve; });
    });
    mockLoad.mockImplementationOnce(() => new Promise((resolve) => { finishCurrent = resolve; }));
    await fireEvent.press(screen.getAllByRole('button', { name: 'Следующая страница' })[0]);
    expect(screen.queryByText('Заголовок страницы 10')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Номер страницы издания'), '12');
    await fireEvent.press(screen.getByRole('button', { name: 'Перейти' }));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => finishOld({ episodeId: 'first', page: 11, blocks: [{ kind: 'verse', text: 'Устаревший ответ' }] }));
    expect(screen.queryByText('Устаревший ответ')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    await act(async () => finishCurrent({ episodeId: 'first', page: 12, blocks: [{ kind: 'verse', text: 'Выбранная страница' }] }));
    expect(screen.getByText('Выбранная страница')).toBeTruthy();
    expect(screen.getByLabelText('Номер страницы издания').props.value).toBe('12');
  });

  it('reports empty source pages as a load error instead of showing fake text', async () => {
    mockLoad.mockResolvedValueOnce({ episodeId: 'first', page: 10, blocks: [] });
    const screen = await render(<EpisodeReaderScreen id="first" />);
    expect(await screen.findByText('Не удалось загрузить текст')).toBeTruthy();
    expect(screen.queryByTestId('episode-page')).toBeNull();
  });
});
