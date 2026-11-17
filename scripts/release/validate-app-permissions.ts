import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export const FORBIDDEN_ANDROID_PERMISSIONS = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.VIBRATE',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  'android.permission.ACCESS_MEDIA_LOCATION',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.POST_NOTIFICATIONS',
  'com.google.android.gms.permission.AD_ID',
] as const;

const FORBIDDEN_PLUGINS = [
  'expo-image-picker',
  'expo-camera',
  'expo-audio',
  'expo-av',
  'expo-media-library',
  'expo-notifications',
] as const;

const FORBIDDEN_IOS_USAGE_DESCRIPTIONS = [
  'NSCameraUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSUserTrackingUsageDescription',
] as const;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function pluginName(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
}

function manifestPermissions(root: UnknownRecord): Array<{ name?: string; removed: boolean }> {
  const internal = record(root._internal);
  const modResults = record(internal?.modResults);
  const androidResult = record(modResults?.android);
  const manifestResult = record(androidResult?.manifest);
  const manifest = record(manifestResult?.manifest);
  const entries = manifest?.['uses-permission'];
  if (!Array.isArray(entries)) return [];

  return entries.map((entry) => {
    const attributes = record(record(entry)?.$);
    return {
      name: typeof attributes?.['android:name'] === 'string' ? attributes['android:name'] : undefined,
      removed: attributes?.['tools:node'] === 'remove',
    };
  });
}

export function validateAppPermissions(config: unknown): string[] {
  const input = record(config);
  if (!input) return ['Expo config must be an object.'];

  const root = record(input.expo) ?? input;
  const errors: string[] = [];
  const android = record(root.android) ?? {};
  const requested = new Set(strings(android.permissions));
  const blocked = new Set(strings(android.blockedPermissions));

  for (const permission of FORBIDDEN_ANDROID_PERMISSIONS) {
    if (requested.has(permission)) {
      errors.push(`Forbidden Android permission is requested: ${permission}`);
    }
    if (!blocked.has(permission)) {
      errors.push(`Android permission is not explicitly blocked: ${permission}`);
    }
  }

  for (const permission of manifestPermissions(root)) {
    if (
      permission.name &&
      FORBIDDEN_ANDROID_PERMISSIONS.includes(
        permission.name as (typeof FORBIDDEN_ANDROID_PERMISSIONS)[number],
      ) &&
      !permission.removed
    ) {
      errors.push(`Forbidden Android permission remains in the introspected manifest: ${permission.name}`);
    }
  }

  const plugins = Array.isArray(root.plugins) ? root.plugins.map(pluginName) : [];
  for (const plugin of FORBIDDEN_PLUGINS) {
    if (plugins.includes(plugin)) errors.push(`Unused sensitive config plugin is enabled: ${plugin}`);
  }

  const ios = record(root.ios) ?? {};
  const rawInfoPlist = record(ios.infoPlist) ?? {};
  const internal = record(root._internal);
  const modResults = record(internal?.modResults);
  const iosResult = record(modResults?.ios);
  const introspectedInfoPlist = record(iosResult?.infoPlist) ?? {};

  for (const key of FORBIDDEN_IOS_USAGE_DESCRIPTIONS) {
    if (key in rawInfoPlist || key in introspectedInfoPlist) {
      errors.push(`Unused iOS usage description is present: ${key}`);
    }
  }

  return errors;
}

function loadIntrospectedConfig(): unknown {
  const expoCli = resolve(process.cwd(), 'node_modules', 'expo', 'bin', 'cli');
  const output = execFileSync(
    process.execPath,
    [expoCli, 'config', '--type', 'introspect', '--json'],
    { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return JSON.parse(output);
}

function main() {
  try {
    const errors = validateAppPermissions(loadIntrospectedConfig());
    if (errors.length > 0) {
      console.error(`Permission validation failed with ${errors.length} error(s):`);
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
      return;
    }

    console.log('Expo CNG introspection contains no forbidden overlay, vibration, camera, microphone, media, notification, or ad permissions.');
    console.log('The final signed native binary manifest must still be inspected before store submission.');
  } catch (error) {
    console.error('Could not introspect Expo configuration.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
