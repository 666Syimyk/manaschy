import { act, fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { ChatScreen } from '../../src/features/chat/chat-screen';
import { useChatStore } from '../../src/features/chat/store';
import { useGuideStore } from '../../src/features/local-state/store';
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const mockPrepare = jest.fn(); const mockStatus = jest.fn(); const mockSend = jest.fn(); const mockPush = jest.fn();
jest.mock('../../src/features/chat/api', () => ({
  prepareChat: (...args: unknown[]) => mockPrepare(...args), getChatStatus: (...args: unknown[]) => mockStatus(...args), sendChat: (...args: unknown[]) => mockSend(...args),
}), { virtual: true });
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
const ready = { index: 'ready', model: 'ready', completedPages: 2149, totalPages: 2149 };
describe('global epic chat screen', () => {
  beforeEach(() => { useChatStore.getState().reset(); useGuideStore.setState({ locale: 'ru', fontScale: 'medium' }); mockPrepare.mockReset().mockResolvedValue(ready); mockStatus.mockReset().mockResolvedValue(ready); mockSend.mockReset(); });
  it('lets readers draft during preparation and send only when ready', async () => {
    mockPrepare.mockResolvedValueOnce({ ...ready, index: 'preparing', completedPages: 15 });
    const screen = await render(<ChatScreen />);
    await screen.findByText(/15.*2149/);
    expect(screen.getByText('Экспериментальный ИИ · Qwen')).toBeTruthy();
    expect(screen.getByText(/Модель может путать события и перевод/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Ваш вопрос об эпосе'), 'Что произошло?');
    expect(screen.getByRole('button', { name: 'Отправить' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByLabelText('Номер страницы издания')).toBeNull();
    await screen.unmount();
  });
  it('shows actual model answers, source links and preserves conversation on remount', async () => {
    mockSend.mockResolvedValue({ status: 'answered', answer: 'Объяснение по источнику.', sources: [{ id: 'a', title: 'МАНАС', volume: 1, page: 11, episodeId: 'orozbakov-v1-001', href: '/episode/orozbakov-v1-001?page=11' }] });
    const screen = await render(<ChatScreen />); await screen.findByText('Можно задавать вопросы');
    await fireEvent.changeText(screen.getByLabelText('Ваш вопрос об эпосе'), 'Почему он плакал?');
    await fireEvent.press(screen.getByRole('button', { name: 'Отправить' }));
    expect(await screen.findByText('Объяснение по источнику.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: /Том 1.*11/ }));
    expect(mockPush).toHaveBeenCalledWith('/episode/orozbakov-v1-001?page=11');
    await screen.unmount();
    const next = await render(<ChatScreen />);
    expect(next.getByText('Почему он плакал?')).toBeTruthy();
    await fireEvent.press(next.getByRole('button', { name: 'Новый разговор' }));
    expect(next.queryByText('Объяснение по источнику.')).toBeNull();
  });
  it('shows service failures and can retry readiness', async () => {
    mockPrepare.mockRejectedValueOnce(Error('MODEL_UNAVAILABLE'));
    const screen = await render(<ChatScreen />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Повторить проверку' }));
    expect(await screen.findByText('Можно задавать вопросы')).toBeTruthy();
  });
  it('localizes the chat and supports stopping a request', async () => {
    useGuideStore.setState({ locale: 'ky' });
    let finish!: (value: unknown) => void;
    mockSend.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const screen = await render(<ChatScreen />); await screen.findByText('Суроо берсеңиз болот');
    await fireEvent.changeText(screen.getByLabelText('Эпос тууралуу сурооңуз'), 'Эмне болду?');
    await fireEvent.press(screen.getByRole('button', { name: 'Жөнөтүү' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Токтотуу' }));
    await act(async () => finish({ status: 'not_found', answer: 'Эски жооп', sources: [] }));
    expect(screen.queryByText('Эски жооп')).toBeNull();
    expect(screen.getByLabelText('Эпос тууралуу сурооңуз').props.value).toBe('Эмне болду?');
  });

  it('sends with web Enter but preserves Shift+Enter and IME composition', async () => {
    const previousPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    try {
      mockSend.mockResolvedValue({ status: 'clarify', answer: 'О каком герое речь?', sources: [] });
      const screen = await render(<ChatScreen />); await screen.findByText('Можно задавать вопросы');
      const input = screen.getByLabelText('Ваш вопрос об эпосе');
      await fireEvent.changeText(input, 'Почему он ушёл?');
      const preventDefault = jest.fn();
      await fireEvent(input, 'keyPress', { nativeEvent: { key: 'Enter', shiftKey: true }, preventDefault });
      await fireEvent(input, 'keyPress', { nativeEvent: { key: 'Enter', isComposing: true }, preventDefault });
      expect(mockSend).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
      await fireEvent(input, 'keyPress', { nativeEvent: { key: 'Enter' }, preventDefault });
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(await screen.findByText('Нужно уточнение')).toBeTruthy();
      expect(screen.getByText('О каком герое речь?')).toBeTruthy();
    } finally { Object.defineProperty(Platform, 'OS', { configurable: true, value: previousPlatform }); }
  });
});
