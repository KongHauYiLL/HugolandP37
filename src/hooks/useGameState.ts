import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, RelicItem, DailyReward, AdventureSkill, MenuSkill } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, getChestRarityWeights, generateRelicItem } from '../utils/gameUtils';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

const STORAGE_KEY = 'hugoland_game_state';

const createInitialGameState = (): GameState => ({
  coins: 500,
  gems: 50,
  shinyGems: 0,
  zone: 1,
  playerStats: {
    hp: 100,
    maxHp: 100,
    atk: 20,
    def: 10,
    baseAtk: 20,
    baseDef: 10,
    baseHp: 100,
  },
  inventory: {
    weapons: [],
    armor: [],
    relics: [],
    currentWeapon: null,
    currentArmor: null,
    equippedRelics: [],
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
      mythical: 0,
    },
  },
  knowledgeStreak: {
    current: 0,
    best: 0,
    multiplier: 1,
  },
  gameMode: {
    current: 'normal',
    speedModeActive: false,
    survivalLives: 3,
    maxSurvivalLives: 3,
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
    revivals: 0,
  },
  cheats: {
    infiniteCoins: false,
    infiniteGems: false,
    obtainAnyItem: false,
  },
  mining: {
    totalGemsMined: 0,
    totalShinyGemsMined: 0,
  },
  yojefMarket: {
    items: [],
    lastRefresh: new Date(),
    nextRefresh: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
  },
  playerTags: initializePlayerTags(),
  dailyRewards: {
    lastClaimDate: null,
    currentStreak: 0,
    maxStreak: 0,
    availableReward: null,
    rewardHistory: [],
  },
  progression: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    skillPoints: 0,
    unlockedSkills: [],
    prestigeLevel: 0,
    prestigePoints: 0,
    masteryLevels: {},
  },
  offlineProgress: {
    lastSaveTime: new Date(),
    offlineCoins: 0,
    offlineGems: 0,
    offlineTime: 0,
    maxOfflineHours: 8,
  },
  gardenOfGrowth: {
    isPlanted: false,
    plantedAt: null,
    lastWatered: null,
    waterHoursRemaining: 0,
    growthCm: 0,
    totalGrowthBonus: 0,
    seedCost: 1000,
    waterCost: 1000,
    maxGrowthCm: 100,
  },
  settings: {
    colorblindMode: false,
    darkMode: true,
    language: 'en',
    notifications: true,
    snapToGrid: false,
    beautyMode: false,
  },
  hasUsedRevival: false,
  skills: {
    activeMenuSkill: null,
    lastRollTime: null,
    playTimeThisSession: 0,
    sessionStartTime: new Date(),
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
      fireballActive: false,
    },
  },
});

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load game state from storage
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Convert date strings back to Date objects
          if (parsedState.statistics?.sessionStartTime) {
            parsedState.statistics.sessionStartTime = new Date(parsedState.statistics.sessionStartTime);
          }
          if (parsedState.offlineProgress?.lastSaveTime) {
            parsedState.offlineProgress.lastSaveTime = new Date(parsedState.offlineProgress.lastSaveTime);
          }
          if (parsedState.gardenOfGrowth?.plantedAt) {
            parsedState.gardenOfGrowth.plantedAt = new Date(parsedState.gardenOfGrowth.plantedAt);
          }
          if (parsedState.gardenOfGrowth?.lastWatered) {
            parsedState.gardenOfGrowth.lastWatered = new Date(parsedState.gardenOfGrowth.lastWatered);
          }
          if (parsedState.yojefMarket?.lastRefresh) {
            parsedState.yojefMarket.lastRefresh = new Date(parsedState.yojefMarket.lastRefresh);
          }
          if (parsedState.yojefMarket?.nextRefresh) {
            parsedState.yojefMarket.nextRefresh = new Date(parsedState.yojefMarket.nextRefresh);
          }
          if (parsedState.dailyRewards?.lastClaimDate) {
            parsedState.dailyRewards.lastClaimDate = new Date(parsedState.dailyRewards.lastClaimDate);
          }
          if (parsedState.skills?.sessionStartTime) {
            parsedState.skills.sessionStartTime = new Date(parsedState.skills.sessionStartTime);
          }
          if (parsedState.skills?.lastRollTime) {
            parsedState.skills.lastRollTime = new Date(parsedState.skills.lastRollTime);
          }
          if (parsedState.skills?.activeMenuSkill?.activatedAt) {
            parsedState.skills.activeMenuSkill.activatedAt = new Date(parsedState.skills.activeMenuSkill.activatedAt);
          }
          if (parsedState.skills?.activeMenuSkill?.expiresAt) {
            parsedState.skills.activeMenuSkill.expiresAt = new Date(parsedState.skills.activeMenuSkill.expiresAt);
          }

          // Merge with initial state to ensure all new properties exist
          const mergedState = { ...createInitialGameState(), ...parsedState };
          
          // Calculate offline progress
          const now = new Date();
          const lastSave = mergedState.offlineProgress.lastSaveTime;
          const offlineTimeMs = now.getTime() - lastSave.getTime();
          const offlineTimeHours = offlineTimeMs / (1000 * 60 * 60);
          
          if (offlineTimeHours > 0.1) { // Only if offline for more than 6 minutes
            const maxOfflineHours = mergedState.offlineProgress.maxOfflineHours;
            const actualOfflineHours = Math.min(offlineTimeHours, maxOfflineHours);
            
            // Calculate offline rewards based on research level (if it exists)
            const researchLevel = (mergedState as any).research?.level || 0;
            const baseCoinsPerHour = 10 + (researchLevel * 2);
            const baseGemsPerHour = 1 + Math.floor(researchLevel / 5);
            
            mergedState.offlineProgress.offlineCoins = Math.floor(actualOfflineHours * baseCoinsPerHour);
            mergedState.offlineProgress.offlineGems = Math.floor(actualOfflineHours * baseGemsPerHour);
            mergedState.offlineProgress.offlineTime = actualOfflineHours * 3600; // Convert to seconds
          }

          // Update garden growth if planted and watered
          if (mergedState.gardenOfGrowth.isPlanted && mergedState.gardenOfGrowth.waterHoursRemaining > 0) {
            const plantedAt = mergedState.gardenOfGrowth.plantedAt!;
            const lastWatered = mergedState.gardenOfGrowth.lastWatered || plantedAt;
            const timeSinceWatered = (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60); // hours
            
            // Reduce water remaining
            mergedState.gardenOfGrowth.waterHoursRemaining = Math.max(0, mergedState.gardenOfGrowth.waterHoursRemaining - timeSinceWatered);
            
            // Calculate growth (only if there's water)
            if (mergedState.gardenOfGrowth.waterHoursRemaining > 0) {
              const growthRate = 0.5; // 0.5 cm per hour
              const growthToAdd = timeSinceWatered * growthRate;
              mergedState.gardenOfGrowth.growthCm = Math.min(
                mergedState.gardenOfGrowth.maxGrowthCm,
                mergedState.gardenOfGrowth.growthCm + growthToAdd
              );
            }
            
            // Update total growth bonus
            mergedState.gardenOfGrowth.totalGrowthBonus = mergedState.gardenOfGrowth.growthCm * 5; // 5% per cm
          }

          // Check for daily rewards
          const lastClaimDate = mergedState.dailyRewards.lastClaimDate;
          if (lastClaimDate) {
            const daysSinceLastClaim = Math.floor((now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastClaim >= 1) {
              if (daysSinceLastClaim === 1) {
                // Consecutive day - increment streak
                mergedState.dailyRewards.currentStreak += 1;
              } else {
                // Missed days - reset streak
                mergedState.dailyRewards.currentStreak = 1;
              }
              
              // Update max streak
              mergedState.dailyRewards.maxStreak = Math.max(
                mergedState.dailyRewards.maxStreak,
                mergedState.dailyRewards.currentStreak
              );
              
              // Create available reward
              const day = mergedState.dailyRewards.currentStreak;
              const baseCoins = 50 + (day * 25);
              const baseGems = 5 + Math.floor(day / 2);
              
              mergedState.dailyRewards.availableReward = {
                day,
                coins: baseCoins,
                gems: baseGems,
                special: day === 7 ? 'Legendary Chest' : day === 14 ? 'Mythical Item' : undefined,
                claimed: false,
              };
            }
          } else {
            // First time player
            mergedState.dailyRewards.currentStreak = 1;
            mergedState.dailyRewards.availableReward = {
              day: 1,
              coins: 75,
              gems: 5,
              claimed: false,
            };
          }

          // Refresh Yojef Market if needed
          if (now > mergedState.yojefMarket.nextRefresh) {
            mergedState.yojefMarket.items = Array.from({ length: 4 }, () => generateRelicItem());
            mergedState.yojefMarket.lastRefresh = now;
            mergedState.yojefMarket.nextRefresh = new Date(now.getTime() + 5 * 60 * 1000);
          }

          // Check if menu skill has expired
          if (mergedState.skills.activeMenuSkill && now > mergedState.skills.activeMenuSkill.expiresAt) {
            mergedState.skills.activeMenuSkill = null;
          }

          setGameState(mergedState);
        } else {
          // Initialize Yojef Market for new players
          const initialState = createInitialGameState();
          initialState.yojefMarket.items = Array.from({ length: 4 }, () => generateRelicItem());
          setGameState(initialState);
        }
      } catch (error) {
        console.error('Error loading game state:', error);
        const initialState = createInitialGameState();
        initialState.yojefMarket.items = Array.from({ length: 4 }, () => generateRelicItem());
        setGameState(initialState);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, []);

  // Save game state to storage
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      // Update last save time
      state.offlineProgress.lastSaveTime = new Date();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      saveGameState(gameState);
    }, 30000);

    return () => clearInterval(interval);
  }, [gameState, saveGameState]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameState) {
        saveGameState(gameState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState, saveGameState]);

  const updateGameState = useCallback((updater: (state: GameState) => GameState) => {
    setGameState(prevState => {
      if (!prevState) return null;
      const newState = updater(prevState);
      
      // Check for achievements and player tags
      const newAchievements = checkAchievements(newState);
      const newTags = checkPlayerTags(newState);
      
      if (newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
          const existingIndex = newState.achievements.findIndex(a => a.id === achievement.id);
          if (existingIndex !== -1) {
            newState.achievements[existingIndex] = achievement;
          }
          
          // Award achievement rewards
          if (achievement.reward) {
            if (achievement.reward.coins) {
              newState.coins += achievement.reward.coins;
              newState.statistics.coinsEarned += achievement.reward.coins;
            }
            if (achievement.reward.gems) {
              newState.gems += achievement.reward.gems;
              newState.statistics.gemsEarned += achievement.reward.gems;
            }
          }
        });
      }
      
      if (newTags.length > 0) {
        newTags.forEach(tag => {
          const existingIndex = newState.playerTags.findIndex(t => t.id === tag.id);
          if (existingIndex !== -1) {
            newState.playerTags[existingIndex] = tag;
          }
        });
      }
      
      // Check for premium status
      if (newState.zone >= 50 && !newState.isPremium) {
        newState.isPremium = true;
      }
      
      return newState;
    });
  }, []);

  const equipWeapon = useCallback((weapon: Weapon) => {
    updateGameState(state => {
      // Reduce durability of current weapon if equipped
      if (state.inventory.currentWeapon) {
        const currentWeapon = state.inventory.currentWeapon;
        currentWeapon.durability = Math.max(0, currentWeapon.durability - 1);
      }

      state.inventory.currentWeapon = weapon;
      
      // Recalculate stats
      const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
      const relicAtkBonus = state.inventory.equippedRelics
        .filter(r => r.type === 'weapon')
        .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
      
      const weaponAtk = weapon.baseAtk + (weapon.level - 1) * 10;
      const durabilityMultiplier = weapon.durability / weapon.maxDurability;
      const effectiveWeaponAtk = Math.floor(weaponAtk * durabilityMultiplier);
      
      state.playerStats.atk = Math.floor((state.playerStats.baseAtk + effectiveWeaponAtk + relicAtkBonus) * gardenBonus);
      
      return state;
    });
  }, [updateGameState]);

  const equipArmor = useCallback((armor: Armor) => {
    updateGameState(state => {
      // Reduce durability of current armor if equipped
      if (state.inventory.currentArmor) {
        const currentArmor = state.inventory.currentArmor;
        currentArmor.durability = Math.max(0, currentArmor.durability - 1);
      }

      state.inventory.currentArmor = armor;
      
      // Recalculate stats
      const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
      const relicDefBonus = state.inventory.equippedRelics
        .filter(r => r.type === 'armor')
        .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
      
      const armorDef = armor.baseDef + (armor.level - 1) * 5;
      const durabilityMultiplier = armor.durability / armor.maxDurability;
      const effectiveArmorDef = Math.floor(armorDef * durabilityMultiplier);
      
      state.playerStats.def = Math.floor((state.playerStats.baseDef + effectiveArmorDef + relicDefBonus) * gardenBonus);
      
      return state;
    });
  }, [updateGameState]);

  const upgradeWeapon = useCallback((weaponId: string) => {
    updateGameState(state => {
      const weapon = state.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon || state.gems < weapon.upgradeCost) return state;

      state.gems -= weapon.upgradeCost;
      weapon.level += 1;
      weapon.upgradeCost = Math.floor(weapon.upgradeCost * 1.5);
      weapon.sellPrice = Math.floor(weapon.sellPrice * 1.2);
      state.statistics.itemsUpgraded += 1;

      // If this weapon is equipped, recalculate stats
      if (state.inventory.currentWeapon?.id === weaponId) {
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicAtkBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'weapon')
          .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
        
        const weaponAtk = weapon.baseAtk + (weapon.level - 1) * 10;
        const durabilityMultiplier = weapon.durability / weapon.maxDurability;
        const effectiveWeaponAtk = Math.floor(weaponAtk * durabilityMultiplier);
        
        state.playerStats.atk = Math.floor((state.playerStats.baseAtk + effectiveWeaponAtk + relicAtkBonus) * gardenBonus);
      }

      return state;
    });
  }, [updateGameState]);

  const upgradeArmor = useCallback((armorId: string) => {
    updateGameState(state => {
      const armor = state.inventory.armor.find(a => a.id === armorId);
      if (!armor || state.gems < armor.upgradeCost) return state;

      state.gems -= armor.upgradeCost;
      armor.level += 1;
      armor.upgradeCost = Math.floor(armor.upgradeCost * 1.5);
      armor.sellPrice = Math.floor(armor.sellPrice * 1.2);
      state.statistics.itemsUpgraded += 1;

      // If this armor is equipped, recalculate stats
      if (state.inventory.currentArmor?.id === armorId) {
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicDefBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'armor')
          .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
        
        const armorDef = armor.baseDef + (armor.level - 1) * 5;
        const durabilityMultiplier = armor.durability / armor.maxDurability;
        const effectiveArmorDef = Math.floor(armorDef * durabilityMultiplier);
        
        state.playerStats.def = Math.floor((state.playerStats.baseDef + effectiveArmorDef + relicDefBonus) * gardenBonus);
      }

      return state;
    });
  }, [updateGameState]);

  const sellWeapon = useCallback((weaponId: string) => {
    updateGameState(state => {
      const weaponIndex = state.inventory.weapons.findIndex(w => w.id === weaponId);
      if (weaponIndex === -1) return state;

      const weapon = state.inventory.weapons[weaponIndex];
      
      // Can't sell equipped weapon
      if (state.inventory.currentWeapon?.id === weaponId) return state;

      state.coins += weapon.sellPrice;
      state.statistics.coinsEarned += weapon.sellPrice;
      state.statistics.itemsSold += 1;
      state.inventory.weapons.splice(weaponIndex, 1);

      return state;
    });
  }, [updateGameState]);

  const sellArmor = useCallback((armorId: string) => {
    updateGameState(state => {
      const armorIndex = state.inventory.armor.findIndex(a => a.id === armorId);
      if (armorIndex === -1) return state;

      const armor = state.inventory.armor[armorIndex];
      
      // Can't sell equipped armor
      if (state.inventory.currentArmor?.id === armorId) return state;

      state.coins += armor.sellPrice;
      state.statistics.coinsEarned += armor.sellPrice;
      state.statistics.itemsSold += 1;
      state.inventory.armor.splice(armorIndex, 1);

      return state;
    });
  }, [updateGameState]);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;

    let reward: ChestReward;
    const weights = getChestRarityWeights(cost);
    const random = Math.random() * 100;
    
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = ['common', 'rare', 'epic', 'legendary', 'mythical'][i] as any;
        break;
      }
    }

    // Determine if we get items or gems (80% items, 20% gems)
    if (Math.random() < 0.8) {
      // Generate items
      const items: (Weapon | Armor)[] = [];
      const itemCount = Math.random() < 0.3 ? 2 : 1; // 30% chance for 2 items
      
      for (let i = 0; i < itemCount; i++) {
        const isWeapon = Math.random() < 0.5;
        
        // Check for enchanted items (5% base chance, increased for epic+)
        const enchantChance = rarity === 'epic' ? 0.15 : rarity === 'legendary' ? 0.25 : rarity === 'mythical' ? 0.4 : 0.05;
        const forceEnchanted = Math.random() < enchantChance;
        
        if (isWeapon) {
          items.push(generateWeapon(false, rarity, forceEnchanted));
        } else {
          items.push(generateArmor(false, rarity, forceEnchanted));
        }
      }
      
      reward = { type: Math.random() < 0.5 ? 'weapon' : 'armor', items };
    } else {
      // Generate gems
      const gemMultiplier = { common: 1, rare: 2, epic: 3, legendary: 5, mythical: 8 };
      const baseGems = Math.floor(cost / 20);
      const gems = baseGems * gemMultiplier[rarity];
      reward = { type: 'gems', gems };
    }

    updateGameState(state => {
      // Apply cheat if active
      if (state.cheats.infiniteCoins) {
        // Don't deduct coins
      } else {
        state.coins -= cost;
      }
      
      state.statistics.chestsOpened += 1;

      if (reward.type === 'gems' && reward.gems) {
        state.gems += reward.gems;
        state.statistics.gemsEarned += reward.gems;
      } else if (reward.items) {
        reward.items.forEach(item => {
          if ('baseAtk' in item) {
            state.inventory.weapons.push(item as Weapon);
            state.collectionBook.weapons[item.name] = true;
            state.collectionBook.totalWeaponsFound += 1;
          } else {
            state.inventory.armor.push(item as Armor);
            state.collectionBook.armor[item.name] = true;
            state.collectionBook.totalArmorFound += 1;
          }
          
          state.collectionBook.rarityStats[item.rarity] += 1;
          state.statistics.itemsCollected += 1;
        });
      }

      // Always give bonus gems from chests
      const bonusGems = Math.floor(Math.random() * 10) + 5;
      state.gems += bonusGems;
      state.statistics.gemsEarned += bonusGems;

      return state;
    });

    return reward;
  }, [gameState, updateGameState]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    updateGameState(state => {
      if (type === 'weapon') {
        const weaponIndex = state.inventory.weapons.findIndex(w => w.id === itemId);
        if (weaponIndex !== -1) {
          state.inventory.weapons.splice(weaponIndex, 1);
        }
      } else {
        const armorIndex = state.inventory.armor.findIndex(a => a.id === itemId);
        if (armorIndex !== -1) {
          state.inventory.armor.splice(armorIndex, 1);
        }
      }
      return state;
    });
  }, [updateGameState]);

  const purchaseMythical = useCallback((cost: number): boolean => {
    if (!gameState || gameState.coins < cost) return false;

    updateGameState(state => {
      state.coins -= cost;
      
      // Generate mythical item
      const isWeapon = Math.random() < 0.5;
      if (isWeapon) {
        const weapon = generateWeapon(false, 'mythical');
        state.inventory.weapons.push(weapon);
        state.collectionBook.weapons[weapon.name] = true;
        state.collectionBook.totalWeaponsFound += 1;
      } else {
        const armor = generateArmor(false, 'mythical');
        state.inventory.armor.push(armor);
        state.collectionBook.armor[armor.name] = true;
        state.collectionBook.totalArmorFound += 1;
      }
      
      state.collectionBook.rarityStats.mythical += 1;
      state.statistics.itemsCollected += 1;

      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const generateAdventureSkills = (): AdventureSkill[] => {
    const allSkills: AdventureSkill[] = [
      {
        id: 'risker',
        name: 'Risker',
        description: 'Gain extra revival chance but take 50% more damage',
        type: 'risker'
      },
      {
        id: 'lightning_chain',
        name: 'Lightning Chain',
        description: 'Correct answers deal 200% damage',
        type: 'lightning_chain'
      },
      {
        id: 'skip_card',
        name: 'Skip Card',
        description: 'Skip one question and automatically get it correct',
        type: 'skip_card'
      },
      {
        id: 'metal_shield',
        name: 'Metal Shield',
        description: 'Block the first enemy attack completely',
        type: 'metal_shield'
      },
      {
        id: 'truth_lies',
        name: 'Truth & Lies',
        description: 'Remove one wrong answer from multiple choice questions',
        type: 'truth_lies'
      },
      {
        id: 'ramp',
        name: 'Ramp',
        description: 'Each correct answer increases damage by 25%',
        type: 'ramp'
      },
      {
        id: 'dodge',
        name: 'Dodge',
        description: 'Avoid the next enemy attack',
        type: 'dodge'
      },
      {
        id: 'berserker',
        name: 'Berserker',
        description: 'Deal 300% damage but take 200% damage',
        type: 'berserker'
      },
      {
        id: 'vampiric',
        name: 'Vampiric',
        description: 'Heal 25% of damage dealt',
        type: 'vampiric'
      },
      {
        id: 'phoenix',
        name: 'Phoenix',
        description: 'Automatically revive once with 50% HP',
        type: 'phoenix'
      },
      {
        id: 'time_slow',
        name: 'Time Slow',
        description: 'Get 50% more time to answer questions',
        type: 'time_slow'
      },
      {
        id: 'critical_strike',
        name: 'Critical Strike',
        description: '25% chance to deal 400% damage',
        type: 'critical_strike'
      },
      {
        id: 'shield_wall',
        name: 'Shield Wall',
        description: 'Reduce all damage taken by 75%',
        type: 'shield_wall'
      },
      {
        id: 'poison_blade',
        name: 'Poison Blade',
        description: 'Attacks poison enemies for 3 turns',
        type: 'poison_blade'
      },
      {
        id: 'arcane_shield',
        name: 'Arcane Shield',
        description: 'Absorb 3 enemy attacks completely',
        type: 'arcane_shield'
      },
      {
        id: 'battle_frenzy',
        name: 'Battle Frenzy',
        description: 'Attack speed increased by 100%',
        type: 'battle_frenzy'
      },
      {
        id: 'elemental_mastery',
        name: 'Elemental Mastery',
        description: 'Attacks have random elemental effects',
        type: 'elemental_mastery'
      },
      {
        id: 'shadow_step',
        name: 'Shadow Step',
        description: 'Teleport past this enemy without fighting',
        type: 'shadow_step'
      },
      {
        id: 'healing_aura',
        name: 'Healing Aura',
        description: 'Regenerate 10% HP each turn',
        type: 'healing_aura'
      },
      {
        id: 'double_strike',
        name: 'Double Strike',
        description: 'Each attack hits twice',
        type: 'double_strike'
      },
      {
        id: 'mana_shield',
        name: 'Mana Shield',
        description: 'Convert damage to mana cost',
        type: 'mana_shield'
      },
      {
        id: 'berserk_rage',
        name: 'Berserk Rage',
        description: 'Damage increases as HP decreases',
        type: 'berserk_rage'
      },
      {
        id: 'divine_protection',
        name: 'Divine Protection',
        description: 'Immune to death for 3 attacks',
        type: 'divine_protection'
      },
      {
        id: 'storm_call',
        name: 'Storm Call',
        description: 'Lightning strikes deal area damage',
        type: 'storm_call'
      },
      {
        id: 'blood_pact',
        name: 'Blood Pact',
        description: 'Sacrifice HP to deal massive damage',
        type: 'blood_pact'
      }
    ];

    // Randomly select 3 skills
    const shuffled = allSkills.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const startCombat = useCallback(() => {
    updateGameState(state => {
      const enemy = generateEnemy(state.zone);
      state.currentEnemy = enemy;
      state.inCombat = true;
      state.combatLog = [`You encounter a ${enemy.name} in Zone ${state.zone}!`];
      state.hasUsedRevival = false;

      // Generate adventure skills (25% chance)
      if (Math.random() < 0.25) {
        state.adventureSkills.availableSkills = generateAdventureSkills();
        state.adventureSkills.showSelectionModal = true;
      } else {
        state.adventureSkills.selectedSkill = null;
        state.adventureSkills.availableSkills = [];
        state.adventureSkills.showSelectionModal = false;
        // Reset skill effects
        state.adventureSkills.skillEffects = {
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
          fireballActive: false,
        };
      }

      return state;
    });
  }, [updateGameState]);

  const attack = useCallback((hit: boolean, category?: string) => {
    updateGameState(state => {
      if (!state.currentEnemy || !state.inCombat) return state;

      state.statistics.totalQuestionsAnswered += 1;
      
      // Update category accuracy
      if (category) {
        if (!state.statistics.accuracyByCategory[category]) {
          state.statistics.accuracyByCategory[category] = { correct: 0, total: 0 };
        }
        state.statistics.accuracyByCategory[category].total += 1;
        if (hit) {
          state.statistics.accuracyByCategory[category].correct += 1;
        }
      }

      if (hit) {
        state.statistics.correctAnswers += 1;
        state.knowledgeStreak.current += 1;
        state.knowledgeStreak.best = Math.max(state.knowledgeStreak.best, state.knowledgeStreak.current);
        state.knowledgeStreak.multiplier = 1 + (state.knowledgeStreak.current * 0.1);

        // Calculate damage
        let damage = state.playerStats.atk;
        
        // Apply adventure skill effects
        if (state.adventureSkills.selectedSkill) {
          switch (state.adventureSkills.selectedSkill.type) {
            case 'lightning_chain':
              if (state.adventureSkills.skillEffects.lightningChainActive) {
                damage *= 2; // 200% damage
              }
              break;
            case 'berserker':
              if (state.adventureSkills.skillEffects.berserkerActive) {
                damage *= 3; // 300% damage
              }
              break;
            case 'critical_strike':
              if (state.adventureSkills.skillEffects.criticalStrikeActive && Math.random() < 0.25) {
                damage *= 4; // 400% damage on crit
                state.combatLog.push('💥 Critical Strike!');
              }
              break;
            case 'double_strike':
              if (state.adventureSkills.skillEffects.doubleStrikeActive) {
                damage *= 2; // Double damage
                state.combatLog.push('⚡ Double Strike!');
              }
              break;
            case 'ramp':
              if (state.adventureSkills.skillEffects.rampActive) {
                const rampBonus = 1 + (state.knowledgeStreak.current * 0.25);
                damage = Math.floor(damage * rampBonus);
              }
              break;
          }
        }

        // Apply menu skill effects
        if (state.skills.activeMenuSkill) {
          switch (state.skills.activeMenuSkill.type) {
            case 'damage_boost':
              damage *= 2; // 100% more damage
              break;
            case 'coin_multiplier':
            case 'gem_multiplier':
            case 'xp_multiplier':
              // These are applied elsewhere
              break;
          }
        }

        state.currentEnemy.hp -= damage;
        state.statistics.totalDamageDealt += damage;
        state.combatLog.push(`You deal ${damage} damage to the ${state.currentEnemy.name}!`);

        // Apply vampiric healing
        if (state.adventureSkills.selectedSkill?.type === 'vampiric' && state.adventureSkills.skillEffects.vampiricActive) {
          const healing = Math.floor(damage * 0.25);
          state.playerStats.hp = Math.min(state.playerStats.maxHp, state.playerStats.hp + healing);
          state.combatLog.push(`🩸 Vampiric healing restores ${healing} HP!`);
        }

        // Check if enemy is defeated
        if (state.currentEnemy.hp <= 0) {
          const baseCoins = 10 + (state.zone * 2);
          const baseGems = Math.floor(state.zone / 5) + 1;
          const baseXp = 20 + (state.zone * 3);
          
          // Apply knowledge streak multiplier
          let coins = Math.floor(baseCoins * state.knowledgeStreak.multiplier);
          let gems = Math.floor(baseGems * state.knowledgeStreak.multiplier);
          let xp = Math.floor(baseXp * state.knowledgeStreak.multiplier);

          // Apply game mode multipliers
          if (state.gameMode.current === 'blitz') {
            coins = Math.floor(coins * 1.25);
            gems = Math.floor(gems * 1.1);
          } else if (state.gameMode.current === 'survival') {
            coins *= 2;
            gems *= 2;
            xp *= 2;
          }

          // Apply menu skill multipliers
          if (state.skills.activeMenuSkill) {
            switch (state.skills.activeMenuSkill.type) {
              case 'coin_multiplier':
              case 'golden_touch':
                coins *= 3;
                break;
              case 'gem_multiplier':
              case 'gem_magnet':
                gems *= 3;
                break;
              case 'xp_multiplier':
              case 'xp_surge':
                xp *= 4;
                break;
            }
          }

          // Apply cheats
          if (state.cheats.infiniteCoins) {
            coins += 1000;
          }

          state.coins += coins;
          state.gems += gems;
          state.statistics.coinsEarned += coins;
          state.statistics.gemsEarned += gems;
          state.statistics.totalVictories += 1;

          // Add experience and check for level up
          state.progression.experience += xp;
          while (state.progression.experience >= state.progression.experienceToNext) {
            state.progression.experience -= state.progression.experienceToNext;
            state.progression.level += 1;
            state.progression.skillPoints += 1;
            state.progression.experienceToNext = Math.floor(100 * Math.pow(1.2, state.progression.level - 1));
            state.combatLog.push(`🎉 Level up! You are now level ${state.progression.level}!`);
          }

          state.combatLog.push(`Victory! You earned ${coins} coins, ${gems} gems, and ${xp} XP!`);

          // Item drops for zones 10+
          if (state.zone >= 10 && Math.random() < 0.3) {
            const isWeapon = Math.random() < 0.5;
            const rarity = Math.random() < 0.1 ? 'rare' : 'common';
            
            if (isWeapon) {
              const weapon = generateWeapon(false, rarity);
              state.inventory.weapons.push(weapon);
              state.collectionBook.weapons[weapon.name] = true;
              state.collectionBook.totalWeaponsFound += 1;
              state.combatLog.push(`The enemy dropped a ${weapon.name}!`);
            } else {
              const armor = generateArmor(false, rarity);
              state.inventory.armor.push(armor);
              state.collectionBook.armor[armor.name] = true;
              state.collectionBook.totalArmorFound += 1;
              state.combatLog.push(`The enemy dropped ${armor.name}!`);
            }
            
            state.collectionBook.rarityStats[rarity] += 1;
            state.statistics.itemsCollected += 1;
          }

          // Advance to next zone
          state.zone += 1;
          state.statistics.zonesReached = Math.max(state.statistics.zonesReached, state.zone);
          state.inCombat = false;
          state.currentEnemy = null;

          // Restore some HP after victory (unless in survival mode)
          if (state.gameMode.current !== 'survival') {
            const healAmount = Math.floor(state.playerStats.maxHp * 0.2);
            state.playerStats.hp = Math.min(state.playerStats.maxHp, state.playerStats.hp + healAmount);
          }

          // Apply healing aura
          if (state.adventureSkills.selectedSkill?.type === 'healing_aura' && state.adventureSkills.skillEffects.healingAuraActive) {
            const healAmount = Math.floor(state.playerStats.maxHp * 0.1);
            state.playerStats.hp = Math.min(state.playerStats.maxHp, state.playerStats.hp + healAmount);
            state.combatLog.push(`🌟 Healing Aura restores ${healAmount} HP!`);
          }

          // Reset adventure skills for next combat
          state.adventureSkills.selectedSkill = null;
          state.adventureSkills.availableSkills = [];
          state.adventureSkills.showSelectionModal = false;
          state.adventureSkills.skillEffects = {
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
            fireballActive: false,
          };
        }
      } else {
        // Wrong answer - enemy attacks
        state.knowledgeStreak.current = 0;
        state.knowledgeStreak.multiplier = 1;

        let enemyDamage = Math.max(1, state.currentEnemy.atk - state.playerStats.def);
        
        // Apply adventure skill effects
        if (state.adventureSkills.selectedSkill) {
          switch (state.adventureSkills.selectedSkill.type) {
            case 'berserker':
              if (state.adventureSkills.skillEffects.berserkerActive) {
                enemyDamage *= 2; // Take 200% damage
              }
              break;
            case 'shield_wall':
              if (state.adventureSkills.skillEffects.shieldWallActive) {
                enemyDamage = Math.floor(enemyDamage * 0.25); // Reduce damage by 75%
              }
              break;
            case 'metal_shield':
              if (!state.adventureSkills.skillEffects.metalShieldUsed) {
                enemyDamage = 0; // Block first attack
                state.adventureSkills.skillEffects.metalShieldUsed = true;
                state.combatLog.push('🛡️ Metal Shield blocks the attack!');
              }
              break;
            case 'dodge':
              if (!state.adventureSkills.skillEffects.dodgeUsed) {
                enemyDamage = 0; // Dodge attack
                state.adventureSkills.skillEffects.dodgeUsed = true;
                state.combatLog.push('💨 You dodge the attack!');
              }
              break;
          }
        }

        // Apply menu skill effects
        if (state.skills.activeMenuSkill) {
          switch (state.skills.activeMenuSkill.type) {
            case 'defense_boost':
              enemyDamage = Math.floor(enemyDamage * 0.25); // Take 75% less damage
              break;
            case 'magic_shield':
              enemyDamage = 0; // Immune to damage
              break;
          }
        }

        if (enemyDamage > 0) {
          state.playerStats.hp -= enemyDamage;
          state.statistics.totalDamageTaken += enemyDamage;
          state.combatLog.push(`The ${state.currentEnemy.name} deals ${enemyDamage} damage to you!`);

          // Check if player is defeated
          if (state.playerStats.hp <= 0) {
            // Check for phoenix revival
            if (state.adventureSkills.selectedSkill?.type === 'phoenix' && !state.adventureSkills.skillEffects.phoenixUsed) {
              state.playerStats.hp = Math.floor(state.playerStats.maxHp * 0.5);
              state.adventureSkills.skillEffects.phoenixUsed = true;
              state.combatLog.push('🔥 Phoenix revives you with 50% HP!');
            }
            // Check for divine protection
            else if (state.adventureSkills.selectedSkill?.type === 'divine_protection' && !state.adventureSkills.skillEffects.divineProtectionUsed) {
              state.playerStats.hp = 1;
              state.adventureSkills.skillEffects.divineProtectionUsed = true;
              state.combatLog.push('✨ Divine Protection saves you from death!');
            }
            // Check for regular revival
            else if (!state.hasUsedRevival) {
              state.playerStats.hp = Math.floor(state.playerStats.maxHp * 0.5);
              state.hasUsedRevival = true;
              state.statistics.revivals += 1;
              state.combatLog.push('💖 You have been revived with 50% HP!');
            } else {
              // Player is defeated
              state.combatLog.push('💀 You have been defeated!');
              state.statistics.totalDeaths += 1;
              
              if (state.gameMode.current === 'survival') {
                state.gameMode.survivalLives -= 1;
                if (state.gameMode.survivalLives <= 0) {
                  state.combatLog.push('💀 No lives remaining! Game Over!');
                }
              }
              
              state.inCombat = false;
              state.currentEnemy = null;
              state.playerStats.hp = state.playerStats.maxHp;
              
              // Reset adventure skills
              state.adventureSkills.selectedSkill = null;
              state.adventureSkills.availableSkills = [];
              state.adventureSkills.showSelectionModal = false;
              state.adventureSkills.skillEffects = {
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
                fireballActive: false,
              };
            }
          }
        }
      }

      // Reduce durability of equipped items after each combat action
      if (state.inventory.currentWeapon && state.inventory.currentWeapon.durability > 0) {
        state.inventory.currentWeapon.durability = Math.max(0, state.inventory.currentWeapon.durability - 1);
        
        // Recalculate attack if durability changed
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicAtkBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'weapon')
          .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
        
        const weaponAtk = state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10;
        const durabilityMultiplier = state.inventory.currentWeapon.durability / state.inventory.currentWeapon.maxDurability;
        const effectiveWeaponAtk = Math.floor(weaponAtk * durabilityMultiplier);
        
        state.playerStats.atk = Math.floor((state.playerStats.baseAtk + effectiveWeaponAtk + relicAtkBonus) * gardenBonus);
      }

      if (state.inventory.currentArmor && state.inventory.currentArmor.durability > 0) {
        state.inventory.currentArmor.durability = Math.max(0, state.inventory.currentArmor.durability - 1);
        
        // Recalculate defense if durability changed
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicDefBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'armor')
          .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
        
        const armorDef = state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5;
        const durabilityMultiplier = state.inventory.currentArmor.durability / state.inventory.currentArmor.maxDurability;
        const effectiveArmorDef = Math.floor(armorDef * durabilityMultiplier);
        
        state.playerStats.def = Math.floor((state.playerStats.baseDef + effectiveArmorDef + relicDefBonus) * gardenBonus);
      }

      return state;
    });
  }, [updateGameState]);

  const resetGame = useCallback(() => {
    const newState = createInitialGameState();
    newState.yojefMarket.items = Array.from({ length: 4 }, () => generateRelicItem());
    setGameState(newState);
    saveGameState(newState);
  }, [saveGameState]);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'survival') => {
    updateGameState(state => {
      state.gameMode.current = mode;
      
      if (mode === 'survival') {
        state.gameMode.survivalLives = state.gameMode.maxSurvivalLives;
      }
      
      // Apply bloodlust mode effects
      if (mode === 'bloodlust') {
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicAtkBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'weapon')
          .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
        const relicDefBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'armor')
          .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
        
        const weaponAtk = state.inventory.currentWeapon ? 
          state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10 : 0;
        const armorDef = state.inventory.currentArmor ? 
          state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5 : 0;
        
        // Apply bloodlust modifiers: +100% ATK, -50% DEF, -50% HP
        state.playerStats.atk = Math.floor((state.playerStats.baseAtk + weaponAtk + relicAtkBonus) * 2 * gardenBonus);
        state.playerStats.def = Math.floor((state.playerStats.baseDef + armorDef + relicDefBonus) * 0.5 * gardenBonus);
        state.playerStats.maxHp = Math.floor(state.playerStats.baseHp * 0.5 * gardenBonus);
        state.playerStats.hp = Math.min(state.playerStats.hp, state.playerStats.maxHp);
      } else {
        // Recalculate normal stats
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicAtkBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'weapon')
          .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
        const relicDefBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'armor')
          .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
        
        const weaponAtk = state.inventory.currentWeapon ? 
          state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10 : 0;
        const armorDef = state.inventory.currentArmor ? 
          state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5 : 0;
        
        state.playerStats.atk = Math.floor((state.playerStats.baseAtk + weaponAtk + relicAtkBonus) * gardenBonus);
        state.playerStats.def = Math.floor((state.playerStats.baseDef + armorDef + relicDefBonus) * gardenBonus);
        state.playerStats.maxHp = Math.floor(state.playerStats.baseHp * gardenBonus);
        state.playerStats.hp = Math.min(state.playerStats.hp, state.playerStats.maxHp);
      }
      
      return state;
    });
  }, [updateGameState]);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    updateGameState(state => {
      state.cheats[cheat] = !state.cheats[cheat];
      return state;
    });
  }, [updateGameState]);

  const generateCheatItem = useCallback(() => {
    updateGameState(state => {
      const isWeapon = Math.random() < 0.5;
      if (isWeapon) {
        const weapon = generateWeapon(false, 'mythical');
        state.inventory.weapons.push(weapon);
      } else {
        const armor = generateArmor(false, 'mythical');
        state.inventory.armor.push(armor);
      }
      return state;
    });
  }, [updateGameState]);

  const mineGem = useCallback((x: number, y: number) => {
    const isShiny = Math.random() < 0.05;
    const gems = isShiny ? 0 : 1;
    const shinyGems = isShiny ? 1 : 0;

    updateGameState(state => {
      state.gems += gems;
      state.shinyGems += shinyGems;
      state.mining.totalGemsMined += gems;
      state.mining.totalShinyGemsMined += shinyGems;
      state.statistics.gemsEarned += gems;
      state.statistics.shinyGemsEarned += shinyGems;
      return state;
    });

    return { gems, shinyGems };
  }, [updateGameState]);

  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.shinyGems < amount) return false;

    updateGameState(state => {
      state.shinyGems -= amount;
      state.gems += amount * 10;
      state.statistics.gemsEarned += amount * 10;
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const purchaseRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;

    const relic = gameState.yojefMarket.items.find(r => r.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;

    updateGameState(state => {
      state.gems -= relic.cost;
      state.inventory.relics.push(relic);
      
      // Remove from market
      state.yojefMarket.items = state.yojefMarket.items.filter(r => r.id !== relicId);
      
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const upgradeRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.inventory.relics.find(r => r.id === relicId) || 
                   state.inventory.equippedRelics.find(r => r.id === relicId);
      if (!relic || state.gems < relic.upgradeCost) return state;

      state.gems -= relic.upgradeCost;
      relic.level += 1;
      relic.upgradeCost = Math.floor(relic.upgradeCost * 1.5);

      // Recalculate stats if this relic is equipped
      if (state.inventory.equippedRelics.some(r => r.id === relicId)) {
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicAtkBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'weapon')
          .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
        const relicDefBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'armor')
          .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
        
        const weaponAtk = state.inventory.currentWeapon ? 
          state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10 : 0;
        const armorDef = state.inventory.currentArmor ? 
          state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5 : 0;
        
        state.playerStats.atk = Math.floor((state.playerStats.baseAtk + weaponAtk + relicAtkBonus) * gardenBonus);
        state.playerStats.def = Math.floor((state.playerStats.baseDef + armorDef + relicDefBonus) * gardenBonus);
      }

      return state;
    });
  }, [updateGameState]);

  const equipRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relicIndex = state.inventory.relics.findIndex(r => r.id === relicId);
      if (relicIndex === -1) return state;

      const relic = state.inventory.relics[relicIndex];
      
      // Move relic to equipped
      state.inventory.equippedRelics.push(relic);
      state.inventory.relics.splice(relicIndex, 1);

      // Recalculate stats
      const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
      const relicAtkBonus = state.inventory.equippedRelics
        .filter(r => r.type === 'weapon')
        .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
      const relicDefBonus = state.inventory.equippedRelics
        .filter(r => r.type === 'armor')
        .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
      
      const weaponAtk = state.inventory.currentWeapon ? 
        state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10 : 0;
      const armorDef = state.inventory.currentArmor ? 
        state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5 : 0;
      
      state.playerStats.atk = Math.floor((state.playerStats.baseAtk + weaponAtk + relicAtkBonus) * gardenBonus);
      state.playerStats.def = Math.floor((state.playerStats.baseDef + armorDef + relicDefBonus) * gardenBonus);

      return state;
    });
  }, [updateGameState]);

  const unequipRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relicIndex = state.inventory.equippedRelics.findIndex(r => r.id === relicId);
      if (relicIndex === -1) return state;

      const relic = state.inventory.equippedRelics[relicIndex];
      
      // Move relic back to inventory
      state.inventory.relics.push(relic);
      state.inventory.equippedRelics.splice(relicIndex, 1);

      // Recalculate stats
      const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
      const relicAtkBonus = state.inventory.equippedRelics
        .filter(r => r.type === 'weapon')
        .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
      const relicDefBonus = state.inventory.equippedRelics
        .filter(r => r.type === 'armor')
        .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
      
      const weaponAtk = state.inventory.currentWeapon ? 
        state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10 : 0;
      const armorDef = state.inventory.currentArmor ? 
        state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5 : 0;
      
      state.playerStats.atk = Math.floor((state.playerStats.baseAtk + weaponAtk + relicAtkBonus) * gardenBonus);
      state.playerStats.def = Math.floor((state.playerStats.baseDef + armorDef + relicDefBonus) * gardenBonus);

      return state;
    });
  }, [updateGameState]);

  const sellRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relicIndex = state.inventory.relics.findIndex(r => r.id === relicId);
      if (relicIndex === -1) return state;

      const relic = state.inventory.relics[relicIndex];
      const sellPrice = Math.floor(relic.cost * 0.5);
      
      state.gems += sellPrice;
      state.statistics.gemsEarned += sellPrice;
      state.inventory.relics.splice(relicIndex, 1);

      return state;
    });
  }, [updateGameState]);

  const claimDailyReward = useCallback(): boolean => {
    if (!gameState?.dailyRewards.availableReward) return false;

    updateGameState(state => {
      const reward = state.dailyRewards.availableReward!;
      
      state.coins += reward.coins;
      state.gems += reward.gems;
      state.statistics.coinsEarned += reward.coins;
      state.statistics.gemsEarned += reward.gems;
      
      // Handle special rewards
      if (reward.special === 'Legendary Chest') {
        const item = Math.random() < 0.5 ? generateWeapon(false, 'legendary') : generateArmor(false, 'legendary');
        if ('baseAtk' in item) {
          state.inventory.weapons.push(item);
        } else {
          state.inventory.armor.push(item);
        }
      } else if (reward.special === 'Mythical Item') {
        const item = Math.random() < 0.5 ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');
        if ('baseAtk' in item) {
          state.inventory.weapons.push(item);
        } else {
          state.inventory.armor.push(item);
        }
      }
      
      // Mark as claimed
      reward.claimed = true;
      reward.claimDate = new Date();
      state.dailyRewards.rewardHistory.push(reward);
      state.dailyRewards.lastClaimDate = new Date();
      state.dailyRewards.availableReward = null;
      
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (!gameState || gameState.progression.skillPoints <= 0) return false;

    updateGameState(state => {
      state.progression.skillPoints -= 1;
      state.progression.unlockedSkills.push(skillId);
      
      // Apply skill effects based on skillId
      // This would need to be implemented based on your skill system
      
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const prestige = useCallback(): boolean => {
    if (!gameState || gameState.progression.level < 50) return false;

    updateGameState(state => {
      const prestigePoints = Math.floor(state.progression.level / 10);
      
      state.progression.prestigeLevel += 1;
      state.progression.prestigePoints += prestigePoints;
      state.progression.level = 1;
      state.progression.experience = 0;
      state.progression.experienceToNext = 100;
      state.progression.skillPoints = 0;
      state.progression.unlockedSkills = [];
      
      // Reset some progress but keep achievements and collection
      state.zone = 1;
      state.coins = 500;
      state.gems = 50;
      state.playerStats.hp = state.playerStats.maxHp;
      
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const claimOfflineRewards = useCallback(() => {
    updateGameState(state => {
      state.coins += state.offlineProgress.offlineCoins;
      state.gems += state.offlineProgress.offlineGems;
      state.statistics.coinsEarned += state.offlineProgress.offlineCoins;
      state.statistics.gemsEarned += state.offlineProgress.offlineGems;
      
      // Reset offline progress
      state.offlineProgress.offlineCoins = 0;
      state.offlineProgress.offlineGems = 0;
      state.offlineProgress.offlineTime = 0;
      
      return state;
    });
  }, [updateGameState]);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(state => {
      let totalValue = 0;
      
      if (type === 'weapon') {
        const weaponsToSell = state.inventory.weapons.filter(w => 
          itemIds.includes(w.id) && state.inventory.currentWeapon?.id !== w.id
        );
        
        weaponsToSell.forEach(weapon => {
          totalValue += weapon.sellPrice;
          const index = state.inventory.weapons.findIndex(w => w.id === weapon.id);
          if (index !== -1) {
            state.inventory.weapons.splice(index, 1);
          }
        });
      } else {
        const armorToSell = state.inventory.armor.filter(a => 
          itemIds.includes(a.id) && state.inventory.currentArmor?.id !== a.id
        );
        
        armorToSell.forEach(armor => {
          totalValue += armor.sellPrice;
          const index = state.inventory.armor.findIndex(a => a.id === armor.id);
          if (index !== -1) {
            state.inventory.armor.splice(index, 1);
          }
        });
      }
      
      state.coins += totalValue;
      state.statistics.coinsEarned += totalValue;
      state.statistics.itemsSold += itemIds.length;
      
      return state;
    });
  }, [updateGameState]);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(state => {
      let totalCost = 0;
      
      if (type === 'weapon') {
        const weaponsToUpgrade = state.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalCost = weaponsToUpgrade.reduce((sum, w) => sum + w.upgradeCost, 0);
        
        if (state.gems >= totalCost) {
          state.gems -= totalCost;
          weaponsToUpgrade.forEach(weapon => {
            weapon.level += 1;
            weapon.upgradeCost = Math.floor(weapon.upgradeCost * 1.5);
            weapon.sellPrice = Math.floor(weapon.sellPrice * 1.2);
          });
          state.statistics.itemsUpgraded += weaponsToUpgrade.length;
        }
      } else {
        const armorToUpgrade = state.inventory.armor.filter(a => itemIds.includes(a.id));
        totalCost = armorToUpgrade.reduce((sum, a) => sum + a.upgradeCost, 0);
        
        if (state.gems >= totalCost) {
          state.gems -= totalCost;
          armorToUpgrade.forEach(armor => {
            armor.level += 1;
            armor.upgradeCost = Math.floor(armor.upgradeCost * 1.5);
            armor.sellPrice = Math.floor(armor.sellPrice * 1.2);
          });
          state.statistics.itemsUpgraded += armorToUpgrade.length;
        }
      }
      
      return state;
    });
  }, [updateGameState]);

  const plantSeed = useCallback((): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.seedCost || gameState.gardenOfGrowth.isPlanted) {
      return false;
    }

    updateGameState(state => {
      state.coins -= state.gardenOfGrowth.seedCost;
      state.gardenOfGrowth.isPlanted = true;
      state.gardenOfGrowth.plantedAt = new Date();
      state.gardenOfGrowth.lastWatered = new Date();
      state.gardenOfGrowth.waterHoursRemaining = 24; // Start with 24 hours of water
      
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const buyWater = useCallback((hours: number): boolean => {
    if (!gameState || !gameState.gardenOfGrowth.isPlanted) return false;

    const cost = Math.floor((hours / 24) * gameState.gardenOfGrowth.waterCost);
    if (gameState.coins < cost) return false;

    updateGameState(state => {
      state.coins -= cost;
      state.gardenOfGrowth.waterHoursRemaining += hours;
      state.gardenOfGrowth.lastWatered = new Date();
      
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const updateSettings = useCallback((newSettings: Partial<typeof gameState.settings>) => {
    updateGameState(state => {
      state.settings = { ...state.settings, ...newSettings };
      return state;
    });
  }, [updateGameState]);

  const addCoins = useCallback((amount: number) => {
    updateGameState(state => {
      state.coins += amount;
      state.statistics.coinsEarned += amount;
      return state;
    });
  }, [updateGameState]);

  const addGems = useCallback((amount: number) => {
    updateGameState(state => {
      state.gems += amount;
      state.statistics.gemsEarned += amount;
      return state;
    });
  }, [updateGameState]);

  const teleportToZone = useCallback((zone: number) => {
    updateGameState(state => {
      state.zone = Math.max(1, zone);
      state.statistics.zonesReached = Math.max(state.statistics.zonesReached, state.zone);
      return state;
    });
  }, [updateGameState]);

  const setExperience = useCallback((xp: number) => {
    updateGameState(state => {
      state.progression.experience = Math.max(0, xp);
      
      // Handle level ups
      while (state.progression.experience >= state.progression.experienceToNext) {
        state.progression.experience -= state.progression.experienceToNext;
        state.progression.level += 1;
        state.progression.skillPoints += 1;
        state.progression.experienceToNext = Math.floor(100 * Math.pow(1.2, state.progression.level - 1));
      }
      
      return state;
    });
  }, [updateGameState]);

  const generateMenuSkill = (): MenuSkill => {
    const skillTypes = [
      'coin_vacuum', 'treasurer', 'xp_surge', 'luck_gem', 'enchanter', 'time_warp',
      'golden_touch', 'knowledge_boost', 'durability_master', 'relic_finder',
      'stat_amplifier', 'question_master', 'gem_magnet', 'streak_guardian',
      'revival_blessing', 'zone_skipper', 'item_duplicator', 'research_accelerator',
      'garden_booster', 'market_refresh', 'coin_multiplier', 'gem_multiplier',
      'xp_multiplier', 'damage_boost', 'defense_boost', 'health_boost',
      'speed_boost', 'luck_boost', 'magic_shield', 'auto_heal'
    ];

    const randomType = skillTypes[Math.floor(Math.random() * skillTypes.length)] as MenuSkill['type'];
    const now = new Date();
    
    const skillData = {
      coin_vacuum: { name: 'Coin Vacuum', description: 'Get 15 free coins per minute of play time', duration: 2 },
      treasurer: { name: 'Treasurer', description: 'Guarantees next chest opened is epic or better', duration: 1 },
      xp_surge: { name: 'XP Surge', description: 'Gives 300% XP gains for 24 hours', duration: 24 },
      luck_gem: { name: 'Luck Gem', description: 'All gems mined for 1 hour are shiny gems', duration: 1 },
      enchanter: { name: 'Enchanter', description: 'Epic+ drops have 80% chance to be enchanted', duration: 4 },
      time_warp: { name: 'Time Warp', description: 'Get 50% more time to answer questions for 12 hours', duration: 12 },
      golden_touch: { name: 'Golden Touch', description: 'All coin rewards are doubled for 8 hours', duration: 8 },
      knowledge_boost: { name: 'Knowledge Boost', description: 'Knowledge streaks build 50% faster for 24 hours', duration: 24 },
      durability_master: { name: 'Durability Master', description: 'Items lose no durability for 6 hours', duration: 6 },
      relic_finder: { name: 'Relic Finder', description: 'Next 3 Yojef Market refreshes have guaranteed legendary relics', duration: 12 },
      stat_amplifier: { name: 'Stat Amplifier', description: 'All stats (ATK, DEF, HP) increased by 50% for 4 hours', duration: 4 },
      question_master: { name: 'Question Master', description: 'See question category and difficulty before answering for 2 hours', duration: 2 },
      gem_magnet: { name: 'Gem Magnet', description: 'Triple gem rewards from all sources for 3 hours', duration: 3 },
      streak_guardian: { name: 'Streak Guardian', description: 'Knowledge streak cannot be broken for 1 hour', duration: 1 },
      revival_blessing: { name: 'Revival Blessing', description: 'Gain 3 extra revival chances for this session', duration: 24 },
      zone_skipper: { name: 'Zone Skipper', description: 'Skip directly to zone +5 without fighting', duration: 0.1 },
      item_duplicator: { name: 'Item Duplicator', description: 'Next item found is automatically duplicated', duration: 2 },
      research_accelerator: { name: 'Research Accelerator', description: 'Research costs 50% less for 6 hours', duration: 6 },
      garden_booster: { name: 'Garden Booster', description: 'Garden grows 5x faster for 2 hours', duration: 2 },
      market_refresh: { name: 'Market Refresh', description: 'Instantly refresh Yojef Market with premium items', duration: 0.1 },
      coin_multiplier: { name: 'Coin Multiplier', description: 'All coin gains are multiplied by 3x for 4 hours', duration: 4 },
      gem_multiplier: { name: 'Gem Multiplier', description: 'All gem gains are multiplied by 2.5x for 3 hours', duration: 3 },
      xp_multiplier: { name: 'XP Multiplier', description: 'All experience gains are multiplied by 4x for 2 hours', duration: 2 },
      damage_boost: { name: 'Damage Boost', description: 'Deal 100% more damage in combat for 5 hours', duration: 5 },
      defense_boost: { name: 'Defense Boost', description: 'Take 75% less damage in combat for 6 hours', duration: 6 },
      health_boost: { name: 'Health Boost', description: 'Maximum health increased by 200% for 8 hours', duration: 8 },
      speed_boost: { name: 'Speed Boost', description: 'Answer time increased by 100% for 3 hours', duration: 3 },
      luck_boost: { name: 'Luck Boost', description: 'All random events have 50% better outcomes for 4 hours', duration: 4 },
      magic_shield: { name: 'Magic Shield', description: 'Immune to all negative effects for 2 hours', duration: 2 },
      auto_heal: { name: 'Auto Heal', description: 'Automatically heal 25% HP every minute for 1 hour', duration: 1 }
    };

    const skill = skillData[randomType];
    const expiresAt = new Date(now.getTime() + skill.duration * 60 * 60 * 1000);

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: skill.name,
      description: skill.description,
      duration: skill.duration,
      activatedAt: now,
      expiresAt,
      type: randomType
    };
  };

  const rollSkill = useCallback(): boolean => {
    if (!gameState || gameState.coins < 100) return false;

    updateGameState(state => {
      state.coins -= 100;
      state.skills.activeMenuSkill = generateMenuSkill();
      state.skills.lastRollTime = new Date();
      
      // Apply immediate effects for certain skills
      if (state.skills.activeMenuSkill.type === 'zone_skipper') {
        state.zone += 5;
        state.statistics.zonesReached = Math.max(state.statistics.zonesReached, state.zone);
      } else if (state.skills.activeMenuSkill.type === 'market_refresh') {
        state.yojefMarket.items = Array.from({ length: 4 }, () => generateRelicItem());
        state.yojefMarket.lastRefresh = new Date();
        state.yojefMarket.nextRefresh = new Date(Date.now() + 5 * 60 * 1000);
      } else if (state.skills.activeMenuSkill.type === 'health_boost') {
        // Increase max HP by 200%
        state.playerStats.maxHp = Math.floor(state.playerStats.baseHp * 3);
        state.playerStats.hp = state.playerStats.maxHp;
      } else if (state.skills.activeMenuSkill.type === 'stat_amplifier') {
        // Increase all stats by 50%
        const gardenBonus = 1 + (state.gardenOfGrowth.totalGrowthBonus / 100);
        const relicAtkBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'weapon')
          .reduce((total, relic) => total + (relic.baseAtk! + (relic.level - 1) * 22), 0);
        const relicDefBonus = state.inventory.equippedRelics
          .filter(r => r.type === 'armor')
          .reduce((total, relic) => total + (relic.baseDef! + (relic.level - 1) * 15), 0);
        
        const weaponAtk = state.inventory.currentWeapon ? 
          state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10 : 0;
        const armorDef = state.inventory.currentArmor ? 
          state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5 : 0;
        
        state.playerStats.atk = Math.floor((state.playerStats.baseAtk + weaponAtk + relicAtkBonus) * 1.5 * gardenBonus);
        state.playerStats.def = Math.floor((state.playerStats.baseDef + armorDef + relicDefBonus) * 1.5 * gardenBonus);
        state.playerStats.maxHp = Math.floor(state.playerStats.baseHp * 1.5 * gardenBonus);
      }
      
      return state;
    });

    return true;
  }, [gameState, updateGameState]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    updateGameState(state => {
      state.adventureSkills.selectedSkill = skill;
      state.adventureSkills.showSelectionModal = false;
      
      // Activate skill effects
      switch (skill.type) {
        case 'truth_lies':
          state.adventureSkills.skillEffects.truthLiesActive = true;
          break;
        case 'lightning_chain':
          state.adventureSkills.skillEffects.lightningChainActive = true;
          break;
        case 'ramp':
          state.adventureSkills.skillEffects.rampActive = true;
          break;
        case 'berserker':
          state.adventureSkills.skillEffects.berserkerActive = true;
          break;
        case 'vampiric':
          state.adventureSkills.skillEffects.vampiricActive = true;
          break;
        case 'time_slow':
          state.adventureSkills.skillEffects.timeSlowActive = true;
          break;
        case 'critical_strike':
          state.adventureSkills.skillEffects.criticalStrikeActive = true;
          break;
        case 'shield_wall':
          state.adventureSkills.skillEffects.shieldWallActive = true;
          break;
        case 'poison_blade':
          state.adventureSkills.skillEffects.poisonBladeActive = true;
          break;
        case 'arcane_shield':
          state.adventureSkills.skillEffects.arcaneShieldActive = true;
          break;
        case 'battle_frenzy':
          state.adventureSkills.skillEffects.battleFrenzyActive = true;
          break;
        case 'elemental_mastery':
          state.adventureSkills.skillEffects.elementalMasteryActive = true;
          break;
        case 'healing_aura':
          state.adventureSkills.skillEffects.healingAuraActive = true;
          break;
        case 'double_strike':
          state.adventureSkills.skillEffects.doubleStrikeActive = true;
          break;
        case 'mana_shield':
          state.adventureSkills.skillEffects.manaShieldActive = true;
          break;
        case 'berserk_rage':
          state.adventureSkills.skillEffects.berserkRageActive = true;
          break;
        case 'storm_call':
          state.adventureSkills.skillEffects.stormCallActive = true;
          break;
        case 'blood_pact':
          state.adventureSkills.skillEffects.bloodPactActive = true;
          break;
        case 'frost_armor':
          state.adventureSkills.skillEffects.frostArmorActive = true;
          break;
        case 'fireball':
          state.adventureSkills.skillEffects.fireballActive = true;
          break;
      }
      
      return state;
    });
  }, [updateGameState]);

  const skipAdventureSkills = useCallback(() => {
    updateGameState(state => {
      state.adventureSkills.selectedSkill = null;
      state.adventureSkills.showSelectionModal = false;
      state.adventureSkills.availableSkills = [];
      
      // Reset all skill effects
      state.adventureSkills.skillEffects = {
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
        fireballActive: false,
      };
      
      return state;
    });
  }, [updateGameState]);

  const useSkipCard = useCallback(() => {
    updateGameState(state => {
      if (state.adventureSkills.selectedSkill?.type === 'skip_card' && !state.adventureSkills.skillEffects.skipCardUsed) {
        state.adventureSkills.skillEffects.skipCardUsed = true;
      }
      return state;
    });
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
    discardItem,
    purchaseMythical,
    startCombat,
    attack,
    resetGame,
    setGameMode,
    toggleCheat,
    generateCheatItem,
    mineGem,
    exchangeShinyGems,
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