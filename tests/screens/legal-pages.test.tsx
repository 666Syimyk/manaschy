jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { render } from '@testing-library/react-native';
import { MethodologyScreen } from '../../src/features/settings/methodology-screen';
import { PrivacyScreen } from '../../src/features/settings/privacy-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

function setLocale(locale: 'ru' | 'ky') {
  useGuideStore.setState({
    ...useGuideStore.getInitialState(),
    ...DEFAULT_LOCAL_STATE,
    locale,
    onboarded: true,
    savedGuideIds: [],
    guideProgress: {},
    hydrated: true,
  });
}

describe('privacy and methodology pages', () => {
  beforeEach(() => setLocale('ru'));

  it('lists local fields and distinguishes local storage from external PDF requests', async () => {
    const screen = await render(<PrivacyScreen />);

    for (const field of [
      'schemaVersion',
      'locale',
      'fontScale',
      'onboarded',
      'savedGuideIds',
      'guideProgress',
      'firstOpenedAt',
      'lastOpenedAt',
      'completedAt',
      'lastGuideId',
    ]) {
      expect(screen.getByText(new RegExp(field))).toBeTruthy();
    }
    expect(screen.getByText(/не отправляет эти данные на сервер/)).toBeTruthy();
    expect(screen.getByText(/нет аналитики, рекламы и отслеживания/)).toBeTruthy();
    expect(screen.getByText(/manas-discovery.kg.*IP-адрес/)).toBeTruthy();
    expect(screen.getByText(/Ollama.*на этом компьютере/)).toBeTruthy();
    expect(screen.getByText(/Переписка.*в памяти/)).toBeTruthy();
  });

  it('distinguishes source access from reuse rights and explains the original-text scope', async () => {
    const screen = await render(<MethodologyScreen />);

    expect(screen.getByText(/каждый содержательный абзац связан/)).toBeTruthy();
    expect(screen.getByText(/дата последней проверки/)).toBeTruthy();
    expect(screen.getByText(/не означает разрешение на повторное использование/)).toBeTruthy();
    expect(screen.getByText(/Книги не включены в сборку/)).toBeTruthy();
    expect(screen.getByText(/не вся трилогия и не русский перевод/)).toBeTruthy();
    expect(screen.getByText(/Чат.*может ошибаться/)).toBeTruthy();
  });

  it('provides the same disclosures in Kyrgyz', async () => {
    setLocale('ky');
    const screen = await render(<PrivacyScreen />);

    expect(screen.getByText('Купуялык жана жергиликтүү маалыматтар')).toBeTruthy();
    expect(screen.getByText(/серверге жөнөтпөйт/)).toBeTruthy();
    expect(screen.getByText(/Ollama.*ушул компьютерде/)).toBeTruthy();
  });
});
