import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LlamaProvider, useLlama } from './src/context/LlamaContext';
import { ChatScreen } from './src/components/ChatScreen';
import { ModelSetupScreen } from './src/components/ModelSetupScreen';
import { LandingScreen } from './src/components/LandingScreen';
import { hasSeenLanding, setSeenLanding } from './src/lib/storage';
import { Platform } from 'react-native';

function AppContent() {
  const { isReady, isWeb } = useLlama();
  const [showLanding, setShowLanding] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenLanding().then((seen) => setShowLanding(!seen));
  }, []);

  const handleGetStarted = async () => {
    await setSeenLanding();
    setShowLanding(false);
  };

  if (showLanding === null) return null;

  if (showLanding) {
    return <LandingScreen onGetStarted={handleGetStarted} />;
  }

  if (!isReady && !isWeb && Platform.OS !== 'web') {
    return <ModelSetupScreen />;
  }

  return <ChatScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LlamaProvider>
        <AppContent />
      </LlamaProvider>
    </SafeAreaProvider>
  );
}
