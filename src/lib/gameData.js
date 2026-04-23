export const GAMES = [
  { id: 'valorant', name: 'Valorant' },
  { id: 'lol', name: 'League of Legends' },
  { id: 'overwatch2', name: 'Overwatch 2' },
  { id: 'apex', name: 'Apex Legends' },
  { id: 'csgo', name: 'CS2' },
  { id: 'fortnite', name: 'Fortnite' },
];

export const RANKS = {
  valorant: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
  lol: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
  overwatch2: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Top 500'],
  apex: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator'],
  csgo: ['Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Silver Elite', 'Silver Elite Master', 'Gold Nova I', 'Gold Nova II', 'Gold Nova III', 'Gold Nova Master', 'Master Guardian I', 'Master Guardian II', 'Master Guardian Elite', 'Distinguished Master Guardian', 'Legendary Eagle', 'Legendary Eagle Master', 'Supreme', 'Global Elite'],
  fortnite: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'],
};

export const ROLES = {
  valorant: ['Duelist', 'Controller', 'Initiator', 'Sentinel', 'IGL'],
  lol: ['Top', 'Jungle', 'Mid', 'ADC', 'Support', 'Fill'],
  overwatch2: ['Tank', 'Damage', 'Support', 'Flex'],
  apex: ['Fragger', 'Support', 'Scout', 'IGL', 'Flex'],
  csgo: ['Entry Fragger', 'AWPer', 'Support', 'IGL', 'Lurker', 'Rifler'],
  fortnite: ['Fragger', 'Builder', 'Support', 'IGL'],
};

export const MOCK_PLAYERS = [
  { id: 1, username: 'NightOwl_GG', rating: 4.8, game: 'valorant', rank: 'Immortal', roles: ['Duelist', 'IGL'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightOwl' },
  { id: 2, username: 'ShadowStrike', rating: 4.5, game: 'valorant', rank: 'Diamond', roles: ['Sentinel', 'Controller'], online: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow' },
  { id: 3, username: 'PixelHunter', rating: 4.2, game: 'lol', rank: 'Platinum', roles: ['Mid', 'Jungle'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel' },
  { id: 4, username: 'CryptoKnight', rating: 4.9, game: 'lol', rank: 'Diamond', roles: ['Top', 'Support'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Crypto' },
  { id: 5, username: 'VoidWalker', rating: 3.8, game: 'overwatch2', rank: 'Gold', roles: ['Tank', 'Flex'], online: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Void' },
  { id: 6, username: 'StarBlast99', rating: 4.6, game: 'apex', rank: 'Master', roles: ['Fragger', 'IGL'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Star' },
  { id: 7, username: 'IronFist_X', rating: 4.1, game: 'csgo', rank: 'Global Elite', roles: ['AWPer', 'Entry Fragger'], online: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Iron' },
  { id: 8, username: 'QuickScope', rating: 4.7, game: 'valorant', rank: 'Ascendant', roles: ['Duelist', 'Initiator'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quick' },
  { id: 9, username: 'LunarEdge', rating: 3.9, game: 'lol', rank: 'Gold', roles: ['ADC', 'Fill'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lunar' },
  { id: 10, username: 'ThunderCore', rating: 4.3, game: 'apex', rank: 'Diamond', roles: ['Scout', 'Support'], online: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thunder' },
  { id: 11, username: 'MistBlade', rating: 4.0, game: 'overwatch2', rank: 'Platinum', roles: ['Damage', 'Support'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mist' },
  { id: 12, username: 'ZeroPoint', rating: 4.4, game: 'fortnite', rank: 'Champion', roles: ['Builder', 'Fragger'], online: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zero' },
];

export const MOCK_INVITES = [
  { id: 1, from: 'NightOwl_GG', game: 'Valorant', rank: 'Immortal', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightOwl', time: '2m ago' },
  { id: 2, from: 'CryptoKnight', game: 'League of Legends', rank: 'Diamond', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Crypto', time: '15m ago' },
  { id: 3, from: 'StarBlast99', game: 'Apex Legends', rank: 'Master', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Star', time: '1h ago' },
];

export const MOCK_MESSAGES = [
  { id: 1, sender: 'other', text: "Hey! Want to queue together for ranked?", time: '10:12 AM' },
  { id: 2, sender: 'me', text: "Sure! What rank are you pushing to?", time: '10:13 AM' },
  { id: 3, sender: 'other', text: "Trying to hit Immortal this act. I'm Ascendant 2 right now.", time: '10:13 AM' },
  { id: 4, sender: 'me', text: "Nice, I'm Ascendant 3. Let's do it!", time: '10:14 AM' },
  { id: 5, sender: 'other', text: "Perfect. I'll send the invite now 🎮", time: '10:14 AM' },
];