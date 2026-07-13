import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GeminiProvider } from './src/context/GeminiContext';
import { ChatScreen } from './src/components/ChatScreen';
import { LandingScreen } from './src/components/LandingScreen';
import { hasSeenLanding, setSeenLanding } from './src/lib/storage';

function AppContent() {
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

  return <ChatScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GeminiProvider>
        <AppContent />
      </GeminiProvider>
    </SafeAreaProvider>
  );
}
