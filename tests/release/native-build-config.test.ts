import appConfig from '../../app.json';
import packageConfig from '../../package.json';

describe('native release configuration', () => {
  it('keeps the legacy Hermes runtime, compiler, and Babel transform profile aligned', () => {
    const buildProperties = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
    );

    expect(buildProperties).toEqual([
      'expo-build-properties',
      expect.objectContaining({
        buildReactNativeFromSource: true,
        useHermesV1: false,
      }),
    ]);
    expect(packageConfig.overrides).toEqual(
      expect.objectContaining({ 'hermes-compiler': '0.15.0' }),
    );

    const cache = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const babelConfig = require('../../babel.config.js')({ cache });

    expect(cache).toHaveBeenCalledWith(true);
    expect(babelConfig.presets).toContainEqual([
      'babel-preset-expo',
      expect.objectContaining({ unstable_transformProfile: 'hermes-v0' }),
    ]);
  });

  it('defines installable preview and store-ready production profiles', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const easConfig = require('../../eas.json');

    expect(easConfig.build.development).toEqual(
      expect.objectContaining({ developmentClient: true, distribution: 'internal' }),
    );
    expect(easConfig.build.preview).toEqual(
      expect.objectContaining({
        distribution: 'internal',
        android: expect.objectContaining({ buildType: 'apk' }),
      }),
    );
    expect(easConfig.build.production.android.buildType).toBe('app-bundle');
  });
});
