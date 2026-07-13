/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'AiSpark',
    slug: 'aispark',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    scheme: 'aispark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0A0F',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.spark.motivationalapp',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Spark uses your location to share motivational weather insights for your day.',
      },
    },
    android: {
      package: 'com.spark.motivationalapp',
      adaptiveIcon: {
        backgroundColor: '#B026FF',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
      name: 'Spark — Motivational AI',
      shortName: 'Spark',
      description: 'Your warm, uplifting AI companion with voice and motivation.',
      themeColor: '#B026FF',
      backgroundColor: '#0A0A0F',
      display: 'standalone',
      orientation: 'portrait',
      lang: 'en',
      startUrl: '/AiSpark/',
      scope: '/AiSpark/',
    },
    experiments: {
      baseUrl: '/AiSpark',
    },
    plugins: [
      'expo-dev-client',
      [
        'llama.rn',
        {
          enableEntitlements: true,
          entitlementsProfile: 'production',
          forceCxx20: true,
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.4',
          },
        },
      ],
    ],
  },
};
