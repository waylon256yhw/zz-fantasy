import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from './pages/WelcomeScreen';
import CharacterCreation from './pages/CharacterCreation';
import GameInterface from './pages/GameInterface';
import SaveScreen from './pages/SaveScreen';
import { Character } from './types';

const App: React.FC = () => {
  const [character, setCharacter] = useState<Character | null>(null);

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
              <GameInterface character={character} />
            ) : (
              <Navigate to="/create" replace />
            )
          } 
        />
        <Route 
          path="/save" 
          element={<SaveScreen currentCharacter={character} onLoadCharacter={setCharacter} />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;