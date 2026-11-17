module.exports = function configureBabel(api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // The native build intentionally uses legacy Hermes to avoid the
          // Expo SDK 56 Hermes V1 + Worklets memory regression.
          unstable_transformProfile: 'hermes-v0',
        },
      ],
    ],
  };
};
