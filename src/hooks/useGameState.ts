import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, RelicItem, DailyReward, AdventureSkill } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, getChestRarityWeights, generateRelicItem } from '../utils/gameUtils';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

// Initial game state with all required properties
const createInitialGameState = (): GameState => ({
  coins: 500,
  gems: 10,
  shinyGems: 0,
  zone: 1,
  playerStats: {
    hp: 100,
    maxHp: 100,
    atk: 20,
    def: 10,
    baseAtk: 20,
    baseDef: 10,
    baseHp: 100
  },
  inventory: {
    weapons: [],
    armor: [],
    relics: [],
    currentWeapon: null,
    currentArmor: null,
    equippedRelics: []
  },
  currentEnemy: null,
  inCombat: false,
  combatLog: [],
  isPremium: false,
  achievements: initializeAchievements(),
  collectionBook: {
    weapons: {},
    armor: {},
    totalWeaponsFound: 0,
    totalArmorFound: 0,
    rarityStats: {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythical: 0
    }
  },
  knowledgeStreak: {
    current: 0,
    best: 0,
    multiplier: 1
  },
  gameMode: {
    current: 'normal',
    speedModeActive: false,
    survivalLives: 3,
    maxSurvivalLives: 3
  },
  statistics: {
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    totalPlayTime: 0,
    zonesReached: 1,
    itemsCollected: 0,
    coinsEarned: 0,
    gemsEarned: 0,
    shinyGemsEarned: 0,
    chestsOpened: 0,
    accuracyByCategory: {},
    sessionStartTime: new Date(),
    totalDeaths: 0,
    totalVictories: 0,
    longestStreak: 0,
    fastestVictory: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    itemsUpgraded: 0,
    itemsSold: 0,
    totalResearchSpent: 0,
    averageAccuracy: 0,
    revivals: 0
  },
  cheats: {
    infiniteCoins: false,
    infiniteGems: false,
    obtainAnyItem: false
  },
  mining: {
    totalGemsMined: 0,
    totalShinyGemsMined: 0
  },
  yojefMarket: {
    items: [],
    lastRefresh: new Date(),
    nextRefresh: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
  },
  playerTags: initializePlayerTags(),
  dailyRewards: {
    lastClaimDate: null,
    currentStreak: 0,
    maxStreak: 0,
    availableReward: null,
    rewardHistory: []
  },
  progression: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    skillPoints: 0,
    unlockedSkills: [],
    prestigeLevel: 0,
    prestigePoints: 0,
    masteryLevels: {}
  },
  offlineProgress: {
    lastSaveTime: new Date(),
    offlineCoins: 0,
    offlineGems: 0,
    offlineTime: 0,
    maxOfflineHours: 8
  },
  gardenOfGrowth: {
    isPlanted: false,
    plantedAt: null,
    lastWatered: null,
    waterHoursRemaining: 0,
    growthCm: 0,
    totalGrowthBonus: 0,
    seedCost: 1000,
    waterCost: 100,
    maxGrowthCm: 100
  },
  settings: {
    colorblindMode: false,
    darkMode: true,
    language: 'en',
    notifications: true,
    snapToGrid: false,
    beautyMode: false
  },
  hasUsedRevival: false,
  skills: {
    activeMenuSkill: null,
    lastRollTime: null,
    playTimeThisSession: 0,
    sessionStartTime: new Date()
  },
  adventureSkills: {
    selectedSkill: null,
    availableSkills: [],
    showSelectionModal: false,
    skillEffects: {
      skipCardUsed: false,
      metalShieldUsed: false,
      dodgeUsed: false,
      truthLiesActive: false,
      lightningChainActive: false,
      rampActive: false,
      berserkerActive: false,
      vampiricActive: false,
      phoenixUsed: false,
      timeSlowActive: false,
      criticalStrikeActive: false,
      shieldWallActive: false,
      poisonBladeActive: false,
      arcaneShieldActive: false,
      battleFrenzyActive: false,
      elementalMasteryActive: false,
      shadowStepUsed: false,
      healingAuraActive: false,
      doubleStrikeActive: false,
      manaShieldActive: false,
      berserkRageActive: false,
      divineProtectionUsed: false,
      stormCallActive: false,
      bloodPactActive: false,
      frostArmorActive: false,
      fireballActive: false
    }
  },
  research: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    totalSpent: 0,
    bonuses: {
      atk: 0,
      def: 0,
      hp: 0,
      coinMultiplier: 1,
      gemMultiplier: 1,
      xpMultiplier: 1
    }
  },
  multipliers: {
    coins: 1,
    gems: 1,
    atk: 1,
    def: 1,
    hp: 1
  }
});

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Save game state to storage
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      await AsyncStorage.setItem('gameState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }, []);

  // Load game state from storage
  const loadGameState = useCallback(async () => {
    try {
      const savedState = await AsyncStorage.getItem('gameState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Merge with initial state to ensure all properties exist
        const mergedState = { ...createInitialGameState(), ...parsed };
        setGameState(mergedState);
      } else {
        setGameState(createInitialGameState());
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      setGameState(createInitialGameState());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize game state on mount
  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // Auto-save game state when it changes
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState, saveGameState]);

  const updateGameState = useCallback((updates: Partial<GameState> | ((prev: GameState) => GameState)) => {
    setGameState(prev => {
      if (!prev) return prev;
      const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      return newState;
    });
  }, []);

  // Game functions
  const equipWeapon = useCallback((weapon: Weapon) => {
    updateGameState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        currentWeapon: weapon
      }
    }));
  }, [updateGameState]);

  const equipArmor = useCallback((armor: Armor) => {
    updateGameState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        currentArmor: armor
      }
    }));
  }, [updateGameState]);

  const upgradeWeapon = useCallback((weaponId: string) => {
    updateGameState(prev => {
      if (prev.gems < 10) return prev; // Not enough gems
      
      const weaponIndex = prev.inventory.weapons.findIndex(w => w.id === weaponId);
      if (weaponIndex === -1) return prev;

      const updatedWeapons = [...prev.inventory.weapons];
      const weapon = { ...updatedWeapons[weaponIndex] };
      weapon.level += 1;
      weapon.upgradeCost = Math.floor(weapon.upgradeCost * 1.5);
      updatedWeapons[weaponIndex] = weapon;

      // Update current weapon if it's the one being upgraded
      const currentWeapon = prev.inventory.currentWeapon?.id === weaponId ? weapon : prev.inventory.currentWeapon;

      return {
        ...prev,
        gems: prev.gems - 10,
        inventory: {
          ...prev.inventory,
          weapons: updatedWeapons,
          currentWeapon
        }
      };
    });
  }, [updateGameState]);

  const upgradeArmor = useCallback((armorId: string) => {
    updateGameState(prev => {
      if (prev.gems < 10) return prev; // Not enough gems
      
      const armorIndex = prev.inventory.armor.findIndex(a => a.id === armorId);
      if (armorIndex === -1) return prev;

      const updatedArmor = [...prev.inventory.armor];
      const armor = { ...updatedArmor[armorIndex] };
      armor.level += 1;
      armor.upgradeCost = Math.floor(armor.upgradeCost * 1.5);
      updatedArmor[armorIndex] = armor;

      // Update current armor if it's the one being upgraded
      const currentArmor = prev.inventory.currentArmor?.id === armorId ? armor : prev.inventory.currentArmor;

      return {
        ...prev,
        gems: prev.gems - 10,
        inventory: {
          ...prev.inventory,
          armor: updatedArmor,
          currentArmor
        }
      };
    });
  }, [updateGameState]);

  const sellWeapon = useCallback((weaponId: string) => {
    updateGameState(prev => {
      const weapon = prev.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon) return prev;

      return {
        ...prev,
        coins: prev.coins + weapon.sellPrice,
        inventory: {
          ...prev.inventory,
          weapons: prev.inventory.weapons.filter(w => w.id !== weaponId),
          currentWeapon: prev.inventory.currentWeapon?.id === weaponId ? null : prev.inventory.currentWeapon
        }
      };
    });
  }, [updateGameState]);

  const sellArmor = useCallback((armorId: string) => {
    updateGameState(prev => {
      const armor = prev.inventory.armor.find(a => a.id === armorId);
      if (!armor) return prev;

      return {
        ...prev,
        coins: prev.coins + armor.sellPrice,
        inventory: {
          ...prev.inventory,
          armor: prev.inventory.armor.filter(a => a.id !== armorId),
          currentArmor: prev.inventory.currentArmor?.id === armorId ? null : prev.inventory.currentArmor
        }
      };
    });
  }, [updateGameState]);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;

    const weights = getChestRarityWeights(cost);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    let selectedRarityIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        selectedRarityIndex = i;
        break;
      }
    }
    
    const rarities = ['common', 'rare', 'epic', 'legendary', 'mythical'];
    const selectedRarity = rarities[selectedRarityIndex];

    // Generate random reward
    const isWeapon = Math.random() < 0.5;
    const item = isWeapon 
      ? generateWeapon(false, selectedRarity)
      : generateArmor(false, selectedRarity);

    const reward: ChestReward = {
      type: isWeapon ? 'weapon' : 'armor',
      items: [item]
    };

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      inventory: {
        ...prev.inventory,
        weapons: isWeapon ? [...prev.inventory.weapons, item as Weapon] : prev.inventory.weapons,
        armor: !isWeapon ? [...prev.inventory.armor, item as Armor] : prev.inventory.armor
      },
      statistics: {
        ...prev.statistics,
        chestsOpened: prev.statistics.chestsOpened + 1
      }
    }));

    return reward;
  }, [gameState, updateGameState]);

  const purchaseMythical = useCallback((cost: number): boolean => {
    if (!gameState || gameState.coins < cost) return false;

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      inventory: {
        ...prev.inventory,
        weapons: isWeapon ? [...prev.inventory.weapons, item as Weapon] : prev.inventory.weapons,
        armor: !isWeapon ? [...prev.inventory.armor, item as Armor] : prev.inventory.armor
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const startCombat = useCallback(() => {
    if (!gameState) return;

    const enemy = generateEnemy(gameState.zone);
    updateGameState(prev => ({
      ...prev,
      currentEnemy: enemy,
      inCombat: true,
      combatLog: [`You encounter a ${enemy.name} in Zone ${enemy.zone}!`]
    }));
  }, [gameState, updateGameState]);

  const attack = useCallback((hit: boolean, category?: string) => {
    if (!gameState || !gameState.currentEnemy) return;

    updateGameState(prev => {
      const enemy = prev.currentEnemy!;
      let newCombatLog = [...prev.combatLog];
      let newEnemy = { ...enemy };
      let newPlayerStats = { ...prev.playerStats };
      let newStreak = { ...prev.knowledgeStreak };
      let coins = prev.coins;
      let gems = prev.gems;
      let zone = prev.zone;
      let inCombat = prev.inCombat;
      let currentEnemy = prev.currentEnemy;

      if (hit) {
        // Player hits enemy
        const damage = Math.max(1, prev.playerStats.atk - enemy.def);
        newEnemy.hp = Math.max(0, newEnemy.hp - damage);
        newCombatLog.push(`You deal ${damage} damage to the ${enemy.name}!`);
        
        // Update streak
        newStreak.current += 1;
        if (newStreak.current > newStreak.best) {
          newStreak.best = newStreak.current;
        }
        newStreak.multiplier = 1 + (newStreak.current * 0.1);

        if (newEnemy.hp <= 0) {
          // Enemy defeated
          const coinReward = Math.floor((10 + zone * 2) * newStreak.multiplier);
          const gemReward = Math.floor((1 + Math.floor(zone / 5)) * newStreak.multiplier);
          
          coins += coinReward;
          gems += gemReward;
          zone += 1;
          inCombat = false;
          currentEnemy = null;
          
          newCombatLog.push(`${enemy.name} defeated! You earned ${coinReward} coins and ${gemReward} gems!`);
          newCombatLog.push(`Advancing to Zone ${zone}!`);
        }
      } else {
        // Player misses, enemy attacks
        const damage = Math.max(1, enemy.atk - prev.playerStats.def);
        newPlayerStats.hp = Math.max(0, newPlayerStats.hp - damage);
        newCombatLog.push(`The ${enemy.name} deals ${damage} damage to you!`);
        
        // Reset streak
        newStreak.current = 0;
        newStreak.multiplier = 1;

        if (newPlayerStats.hp <= 0) {
          // Player defeated
          if (!prev.hasUsedRevival) {
            // Free revival
            newPlayerStats.hp = Math.floor(newPlayerStats.maxHp * 0.5);
            newCombatLog.push('💖 You used your free revival and restored 50% HP!');
            return {
              ...prev,
              currentEnemy: newEnemy,
              playerStats: newPlayerStats,
              combatLog: newCombatLog,
              knowledgeStreak: newStreak,
              hasUsedRevival: true
            };
          } else {
            // Game over
            inCombat = false;
            currentEnemy = null;
            newCombatLog.push('You have been defeated! Return to town to recover.');
          }
        }
      }

      return {
        ...prev,
        currentEnemy,
        inCombat,
        playerStats: newPlayerStats,
        combatLog: newCombatLog,
        knowledgeStreak: newStreak,
        coins,
        gems,
        zone
      };
    });
  }, [gameState, updateGameState]);

  const resetGame = useCallback(() => {
    const initialState = createInitialGameState();
    setGameState(initialState);
  }, []);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'survival') => {
    updateGameState(prev => ({
      ...prev,
      gameMode: {
        ...prev.gameMode,
        current: mode,
        speedModeActive: mode === 'blitz' || mode === 'bloodlust',
        survivalLives: mode === 'survival' ? 3 : prev.gameMode.survivalLives,
        maxSurvivalLives: mode === 'survival' ? 3 : prev.gameMode.maxSurvivalLives
      }
    }));
  }, [updateGameState]);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    if (!gameState) return;
    
    updateGameState(prev => ({
      ...prev,
      cheats: {
        ...prev.cheats,
        [cheat]: !prev.cheats[cheat]
      }
    }));
  }, [gameState, updateGameState]);

  const generateCheatItem = useCallback(() => {
    // Implementation for cheat item generation
  }, []);

  const mineGem = useCallback((x: number, y: number) => {
    const isShiny = Math.random() < 0.05;
    const reward = isShiny ? { gems: 0, shinyGems: 1 } : { gems: 1, shinyGems: 0 };
    
    updateGameState(prev => ({
      ...prev,
      gems: prev.gems + reward.gems,
      shinyGems: prev.shinyGems + reward.shinyGems,
      mining: {
        totalGemsMined: prev.mining.totalGemsMined + reward.gems,
        totalShinyGemsMined: prev.mining.totalShinyGemsMined + reward.shinyGems
      }
    }));

    return reward;
  }, [updateGameState]);

  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.shinyGems < amount) return false;

    updateGameState(prev => ({
      ...prev,
      shinyGems: prev.shinyGems - amount,
      gems: prev.gems + (amount * 10)
    }));

    return true;
  }, [gameState, updateGameState]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    updateGameState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        weapons: type === 'weapon' ? prev.inventory.weapons.filter(w => w.id !== itemId) : prev.inventory.weapons,
        armor: type === 'armor' ? prev.inventory.armor.filter(a => a.id !== itemId) : prev.inventory.armor
      }
    }));
  }, [updateGameState]);

  const purchaseRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;

    const relic = gameState.yojefMarket.items.find(r => r.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;

    updateGameState(prev => ({
      ...prev,
      gems: prev.gems - relic.cost,
      inventory: {
        ...prev.inventory,
        relics: [...prev.inventory.relics, relic]
      },
      yojefMarket: {
        ...prev.yojefMarket,
        items: prev.yojefMarket.items.filter(r => r.id !== relicId)
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const upgradeRelic = useCallback((relicId: string) => {
    updateGameState(prev => {
      const relicIndex = prev.inventory.relics.findIndex(r => r.id === relicId);
      if (relicIndex === -1 || prev.gems < prev.inventory.relics[relicIndex].upgradeCost) return prev;

      const updatedRelics = [...prev.inventory.relics];
      const relic = { ...updatedRelics[relicIndex] };
      relic.level += 1;
      relic.upgradeCost = Math.floor(relic.upgradeCost * 1.5);
      updatedRelics[relicIndex] = relic;

      return {
        ...prev,
        gems: prev.gems - prev.inventory.relics[relicIndex].upgradeCost,
        inventory: {
          ...prev.inventory,
          relics: updatedRelics
        }
      };
    });
  }, [updateGameState]);

  const equipRelic = useCallback((relicId: string) => {
    updateGameState(prev => {
      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic) return prev;

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          equippedRelics: [...prev.inventory.equippedRelics, relic]
        }
      };
    });
  }, [updateGameState]);

  const unequipRelic = useCallback((relicId: string) => {
    updateGameState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        equippedRelics: prev.inventory.equippedRelics.filter(r => r.id !== relicId)
      }
    }));
  }, [updateGameState]);

  const sellRelic = useCallback((relicId: string) => {
    updateGameState(prev => {
      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic) return prev;

      const sellPrice = Math.floor(relic.cost * 0.5);

      return {
        ...prev,
        gems: prev.gems + sellPrice,
        inventory: {
          ...prev.inventory,
          relics: prev.inventory.relics.filter(r => r.id !== relicId),
          equippedRelics: prev.inventory.equippedRelics.filter(r => r.id !== relicId)
        }
      };
    });
  }, [updateGameState]);

  const claimDailyReward = useCallback((): boolean => {
    if (!gameState || !gameState.dailyRewards.availableReward) return false;

    const reward = gameState.dailyRewards.availableReward;
    
    updateGameState(prev => ({
      ...prev,
      coins: prev.coins + reward.coins,
      gems: prev.gems + reward.gems,
      dailyRewards: {
        ...prev.dailyRewards,
        availableReward: null,
        lastClaimDate: new Date(),
        currentStreak: prev.dailyRewards.currentStreak + 1,
        maxStreak: Math.max(prev.dailyRewards.maxStreak, prev.dailyRewards.currentStreak + 1),
        rewardHistory: [...prev.dailyRewards.rewardHistory, { ...reward, claimed: true, claimDate: new Date() }]
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (!gameState || gameState.progression.skillPoints < 1) return false;

    updateGameState(prev => ({
      ...prev,
      progression: {
        ...prev.progression,
        skillPoints: prev.progression.skillPoints - 1,
        unlockedSkills: [...prev.progression.unlockedSkills, skillId]
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const prestige = useCallback(): boolean => {
    if (!gameState || gameState.progression.level < 50) return false;

    const prestigePoints = Math.floor(gameState.progression.level / 10);

    updateGameState(prev => ({
      ...prev,
      progression: {
        ...prev.progression,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        skillPoints: 0,
        unlockedSkills: [],
        prestigeLevel: prev.progression.prestigeLevel + 1,
        prestigePoints: prev.progression.prestigePoints + prestigePoints
      },
      // Reset some progress but keep achievements and collection
      zone: 1,
      playerStats: {
        ...prev.playerStats,
        hp: 100,
        maxHp: 100
      },
      inCombat: false,
      currentEnemy: null
    }));

    return true;
  }, [gameState, updateGameState]);

  const claimOfflineRewards = useCallback(() => {
    if (!gameState) return;

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins + prev.offlineProgress.offlineCoins,
      gems: prev.gems + prev.offlineProgress.offlineGems,
      offlineProgress: {
        ...prev.offlineProgress,
        offlineCoins: 0,
        offlineGems: 0,
        offlineTime: 0
      }
    }));
  }, [gameState, updateGameState]);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(prev => {
      let totalValue = 0;
      
      if (type === 'weapon') {
        const itemsToSell = prev.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        
        return {
          ...prev,
          coins: prev.coins + totalValue,
          inventory: {
            ...prev.inventory,
            weapons: prev.inventory.weapons.filter(w => !itemIds.includes(w.id))
          }
        };
      } else {
        const itemsToSell = prev.inventory.armor.filter(a => itemIds.includes(a.id));
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        
        return {
          ...prev,
          coins: prev.coins + totalValue,
          inventory: {
            ...prev.inventory,
            armor: prev.inventory.armor.filter(a => !itemIds.includes(a.id))
          }
        };
      }
    });
  }, [updateGameState]);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(prev => {
      let totalCost = 0;
      
      if (type === 'weapon') {
        const itemsToUpgrade = prev.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prev.gems < totalCost) return prev;
        
        const updatedWeapons = prev.inventory.weapons.map(weapon => {
          if (itemIds.includes(weapon.id)) {
            return {
              ...weapon,
              level: weapon.level + 1,
              upgradeCost: Math.floor(weapon.upgradeCost * 1.5)
            };
          }
          return weapon;
        });
        
        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            weapons: updatedWeapons
          }
        };
      } else {
        const itemsToUpgrade = prev.inventory.armor.filter(a => itemIds.includes(a.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prev.gems < totalCost) return prev;
        
        const updatedArmor = prev.inventory.armor.map(armor => {
          if (itemIds.includes(armor.id)) {
            return {
              ...armor,
              level: armor.level + 1,
              upgradeCost: Math.floor(armor.upgradeCost * 1.5)
            };
          }
          return armor;
        });
        
        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            armor: updatedArmor
          }
        };
      }
    });
  }, [updateGameState]);

  const plantSeed = useCallback((): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.seedCost || gameState.gardenOfGrowth.isPlanted) {
      return false;
    }

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - prev.gardenOfGrowth.seedCost,
      gardenOfGrowth: {
        ...prev.gardenOfGrowth,
        isPlanted: true,
        plantedAt: new Date(),
        lastWatered: new Date(),
        waterHoursRemaining: 24
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const buyWater = useCallback((hours: number): boolean => {
    if (!gameState) return false;

    const cost = Math.floor((hours / 24) * gameState.gardenOfGrowth.waterCost);
    if (gameState.coins < cost) return false;

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      gardenOfGrowth: {
        ...prev.gardenOfGrowth,
        waterHoursRemaining: prev.gardenOfGrowth.waterHoursRemaining + hours
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const updateSettings = useCallback((settings: Partial<typeof gameState.settings>) => {
    updateGameState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings
      }
    }));
  }, [updateGameState]);

  const addCoins = useCallback((amount: number) => {
    updateGameState(prev => ({
      ...prev,
      coins: prev.coins + amount
    }));
  }, [updateGameState]);

  const addGems = useCallback((amount: number) => {
    updateGameState(prev => ({
      ...prev,
      gems: prev.gems + amount
    }));
  }, [updateGameState]);

  const teleportToZone = useCallback((zone: number) => {
    updateGameState(prev => ({
      ...prev,
      zone: Math.max(1, zone)
    }));
  }, [updateGameState]);

  const setExperience = useCallback((xp: number) => {
    updateGameState(prev => ({
      ...prev,
      progression: {
        ...prev.progression,
        experience: Math.max(0, xp)
      }
    }));
  }, [updateGameState]);

  const rollSkill = useCallback((): boolean => {
    if (!gameState || gameState.coins < 100) return false;

    // Generate random skill (simplified implementation)
    const skillTypes = ['coin_vacuum', 'treasurer', 'xp_surge', 'luck_gem', 'enchanter'];
    const randomType = skillTypes[Math.floor(Math.random() * skillTypes.length)] as any;
    const duration = 2 + Math.random() * 6; // 2-8 hours
    
    const newSkill = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${randomType.replace('_', ' ')} Skill`,
      description: `A powerful temporary skill`,
      duration,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
      type: randomType
    };

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - 100,
      skills: {
        ...prev.skills,
        activeMenuSkill: newSkill,
        lastRollTime: new Date()
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    updateGameState(prev => ({
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        selectedSkill: skill,
        showSelectionModal: false,
        availableSkills: []
      }
    }));
  }, [updateGameState]);

  const skipAdventureSkills = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        showSelectionModal: false,
        availableSkills: []
      }
    }));
  }, [updateGameState]);

  const useSkipCard = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        skillEffects: {
          ...prev.adventureSkills.skillEffects,
          skipCardUsed: true
        }
      }
    }));
  }, [updateGameState]);

  return {
    gameState,
    isLoading,
    equipWeapon,
    equipArmor,
    upgradeWeapon,
    upgradeArmor,
    sellWeapon,
    sellArmor,
    openChest,
    purchaseMythical,
    startCombat,
    attack,
    resetGame,
    setGameMode,
    toggleCheat,
    generateCheatItem,
    mineGem,
    exchangeShinyGems,
    discardItem,
    purchaseRelic,
    upgradeRelic,
    equipRelic,
    unequipRelic,
    sellRelic,
    claimDailyReward,
    upgradeSkill,
    prestige,
    claimOfflineRewards,
    bulkSell,
    bulkUpgrade,
    plantSeed,
    buyWater,
    updateSettings,
    addCoins,
    addGems,
    teleportToZone,
    setExperience,
    rollSkill,
    selectAdventureSkill,
    skipAdventureSkills,
    useSkipCard,
  };
};

export default useGameState;