"use client";

import { createContext, useContext, useState } from 'react';

const MatchContext = createContext();

export function MatchProvider({ children }) {
  const [activeMatch, setActiveMatch] = useState(null);

  // Expects an object like: { matchId: '123...', player: { username, avatar, game, rank... } }
  const startMatch = (matchData) => setActiveMatch(matchData);
  
  const endMatch = () => setActiveMatch(null);

  return (
    <MatchContext.Provider value={{ activeMatch, startMatch, endMatch }}>
      {children}
    </MatchContext.Provider>
  );
}

export const useMatch = () => useContext(MatchContext);