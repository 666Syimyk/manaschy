import {
  FORBIDDEN_ANDROID_PERMISSIONS,
  validateAppPermissions,
} from '../../scripts/release/validate-app-permissions';

interface SafeConfig {
  expo: {
    plugins: unknown[];
    android: {
      blockedPermissions: string[];
      permissions: string[];
    };
    ios: { infoPlist: Record<string, string> };
  };
}

function safeConfig(): SafeConfig {
  return {
    expo: {
      plugins: ['expo-router', 'expo-dev-client', ['expo-splash-screen', {}]],
      android: {
        blockedPermissions: [...FORBIDDEN_ANDROID_PERMISSIONS],
        permissions: [],
      },
      ios: { infoPlist: {} },
    },
  };
}

describe('validateAppPermissions', () => {
  it('treats Expo template overlay and vibration permissions as forbidden', () => {
    expect(FORBIDDEN_ANDROID_PERMISSIONS).toEqual(
      expect.arrayContaining([
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.VIBRATE',
      ]),
    );
  });

  it('accepts an app config that explicitly blocks every unused sensitive permission', () => {
    expect(validateAppPermissions(safeConfig())).toEqual([]);
  });

  it.each(FORBIDDEN_ANDROID_PERMISSIONS)(
    'rejects requested Android permission %s',
    (permission) => {
      const config = safeConfig();
      config.expo.android.permissions.push(permission);

      expect(validateAppPermissions(config).join('\n')).toContain(permission);
    },
  );

  it('reports every required Android block that is absent', () => {
    const config = safeConfig();
    config.expo.android.blockedPermissions = [];

    const errors = validateAppPermissions(config).join('\n');
    for (const permission of FORBIDDEN_ANDROID_PERMISSIONS) {
      expect(errors).toContain(permission);
    }
  });

  it.each([
    'expo-image-picker',
    'expo-camera',
    'expo-audio',
    'expo-av',
    'expo-media-library',
    'expo-notifications',
  ])('rejects the unused sensitive plugin %s', (plugin) => {
    const config = safeConfig();
    config.expo.plugins.push(plugin);

    expect(validateAppPermissions(config).join('\n')).toContain(plugin);
  });

  it.each([
    'NSCameraUsageDescription',
    'NSMicrophoneUsageDescription',
    'NSPhotoLibraryUsageDescription',
    'NSPhotoLibraryAddUsageDescription',
    'NSUserTrackingUsageDescription',
  ])('rejects unused iOS usage description %s', (key) => {
    const config = safeConfig();
    config.expo.ios.infoPlist[key] = 'Not needed by Manaschy';

    expect(validateAppPermissions(config).join('\n')).toContain(key);
  });

  it('rejects malformed input instead of silently passing it', () => {
    expect(validateAppPermissions(null)).toEqual([expect.stringContaining('object')]);
  });
});
