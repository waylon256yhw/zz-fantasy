import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from './pages/WelcomeScreen';
import CharacterCreation from './pages/CharacterCreation';
import GameInterface from './pages/GameInterface';
import SaveScreen from './pages/SaveScreen';
import { GameProvider, useGame } from './src/contexts/GameContext';
import { ALL_ASSETS } from './constants';

const useImagePreloader = (urls: string[]) => {
  useEffect(() => {
    // Silent background preloading with a slight delay to prioritize critical rendering
    const preloadImages = () => {
      urls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    };

    const timer = setTimeout(preloadImages, 2000);
    return () => clearTimeout(timer);
  }, [urls]);
};

/**
 * App Routes Component
 * Separated to allow access to GameContext
 */
const AppRoutes: React.FC = () => {
  const { character, setCharacter } = useGame();

  // Start preloading all assets when the app mounts
  useImagePreloader(ALL_ASSETS);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route
          path="/create"
          element={<CharacterCreation onComplete={setCharacter} />}
        />
        <Route
          path="/game"
          element={
            character ? (
              <GameInterface />
            ) : (
              <Navigate to="/create" replace />
            )
          }
        />
        <Route path="/save" element={<SaveScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

/**
 * Main App Component
 * Wrapped with GameProvider for global state management
 */
const App: React.FC = () => {
  return (
    <GameProvider>
      <AppRoutes />
    </GameProvider>
  );
};

export default App;