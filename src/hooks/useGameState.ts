import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, Achievement, PlayerTag, DailyReward, RelicItem, MenuSkill, AdventureSkill } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, getChestRarityWeights, generateRelicItem } from '../utils/gameUtils';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

const SAVE_KEY = 'hugoland_game_state';

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
  research: {
    level: 1,
    totalSpent: 0,
    availableUpgrades: ['atk', 'def', 'hp'],
  },
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
    seedCost: 2000,
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

// Adventure Skills definitions
const adventureSkillDefinitions: Omit<AdventureSkill, 'id'>[] = [
  { name: 'Risker', description: 'Start with 50% HP but deal 100% more damage', type: 'risker' },
  { name: 'Lightning Chain', description: 'Correct answers have 30% chance to deal double damage', type: 'lightning_chain' },
  { name: 'Skip Card', description: 'Use once to automatically answer correctly', type: 'skip_card' },
  { name: 'Metal Shield', description: 'Reduce all damage taken by 50%', type: 'metal_shield' },
  { name: 'Truth & Lies', description: 'Remove one wrong answer from multiple choice questions', type: 'truth_lies' },
  { name: 'Ramp', description: 'Each correct answer increases damage by 10% (stacks)', type: 'ramp' },
  { name: 'Dodge', description: 'First wrong answer deals no damage', type: 'dodge' },
  { name: 'Berserker', description: 'Deal 50% more damage but take 25% more damage', type: 'berserker' },
  { name: 'Vampiric', description: 'Heal 25% of damage dealt', type: 'vampiric' },
  { name: 'Phoenix', description: 'Revive once with 50% HP when defeated', type: 'phoenix' },
  { name: 'Time Slow', description: 'Get 50% more time to answer questions', type: 'time_slow' },
  { name: 'Critical Strike', description: '20% chance to deal triple damage', type: 'critical_strike' },
  { name: 'Shield Wall', description: 'Take 75% less damage for first 3 hits', type: 'shield_wall' },
  { name: 'Poison Blade', description: 'Attacks poison enemies for 3 turns', type: 'poison_blade' },
  { name: 'Arcane Shield', description: 'Absorb first 100 damage taken', type: 'arcane_shield' },
  { name: 'Battle Frenzy', description: 'Attack speed increases with each correct answer', type: 'battle_frenzy' },
  { name: 'Elemental Mastery', description: 'Deal bonus damage based on question category', type: 'elemental_mastery' },
  { name: 'Shadow Step', description: 'Avoid next enemy attack after wrong answer', type: 'shadow_step' },
  { name: 'Healing Aura', description: 'Heal 10 HP after each correct answer', type: 'healing_aura' },
  { name: 'Double Strike', description: 'Each attack hits twice', type: 'double_strike' },
  { name: 'Mana Shield', description: 'Convert 50% damage to mana cost instead', type: 'mana_shield' },
  { name: 'Berserk Rage', description: 'Deal more damage as HP gets lower', type: 'berserk_rage' },
  { name: 'Divine Protection', description: 'Immune to death once per adventure', type: 'divine_protection' },
  { name: 'Storm Call', description: 'Lightning strikes random enemies', type: 'storm_call' },
  { name: 'Blood Pact', description: 'Sacrifice HP to deal massive damage', type: 'blood_pact' },
  { name: 'Frost Armor', description: 'Slow enemies and reduce their damage', type: 'frost_armor' },
  { name: 'Fireball', description: 'Chance to deal area damage to multiple enemies', type: 'fireball' },
];

const generateRandomAdventureSkills = (count: number = 3): AdventureSkill[] => {
  const shuffled = [...adventureSkillDefinitions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((skill, index) => ({
    ...skill,
    id: `adventure_skill_${Date.now()}_${index}`,
  }));
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load game state from storage
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(SAVE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Ensure all required properties exist
          const completeState = {
            ...createInitialGameState(),
            ...parsedState,
            statistics: {
              ...createInitialGameState().statistics,
              ...parsedState.statistics,
              sessionStartTime: new Date(),
            },
            offlineProgress: {
              ...createInitialGameState().offlineProgress,
              ...parsedState.offlineProgress,
            },
            gardenOfGrowth: {
              ...createInitialGameState().gardenOfGrowth,
              ...parsedState.gardenOfGrowth,
            },
            settings: {
              ...createInitialGameState().settings,
              ...parsedState.settings,
            },
            skills: {
              ...createInitialGameState().skills,
              ...parsedState.skills,
              sessionStartTime: new Date(),
            },
            adventureSkills: {
              ...createInitialGameState().adventureSkills,
              ...parsedState.adventureSkills,
            },
          };

          // Calculate offline progress
          const now = Date.now();
          const lastSave = new Date(completeState.offlineProgress.lastSaveTime).getTime();
          const offlineTimeSeconds = Math.floor((now - lastSave) / 1000);
          const offlineTimeHours = offlineTimeSeconds / 3600;

          if (offlineTimeHours > 0.1) { // Only if offline for more than 6 minutes
            const maxOfflineHours = completeState.offlineProgress.maxOfflineHours;
            const effectiveOfflineHours = Math.min(offlineTimeHours, maxOfflineHours);
            
            // Calculate offline rewards based on zone
            const baseCoinsPerHour = 10 + (completeState.zone * 2);
            const baseGemsPerHour = Math.floor(completeState.zone / 5);
            
            const offlineCoins = Math.floor(baseCoinsPerHour * effectiveOfflineHours);
            const offlineGems = Math.floor(baseGemsPerHour * effectiveOfflineHours);

            completeState.offlineProgress = {
              ...completeState.offlineProgress,
              offlineCoins,
              offlineGems,
              offlineTime: Math.floor(effectiveOfflineHours * 3600),
            };
          }

          // Check for daily rewards
          const today = new Date().toDateString();
          const lastClaimDate = completeState.dailyRewards.lastClaimDate 
            ? new Date(completeState.dailyRewards.lastClaimDate).toDateString()
            : null;

          if (lastClaimDate !== today) {
            const daysSinceLastClaim = lastClaimDate 
              ? Math.floor((Date.now() - new Date(completeState.dailyRewards.lastClaimDate!).getTime()) / (1000 * 60 * 60 * 24))
              : 1;

            if (daysSinceLastClaim === 1 || !lastClaimDate) {
              // Consecutive day or first time
              const newStreak = lastClaimDate ? completeState.dailyRewards.currentStreak + 1 : 1;
              const rewardDay = Math.min(newStreak, 14);
              
              completeState.dailyRewards = {
                ...completeState.dailyRewards,
                currentStreak: newStreak,
                maxStreak: Math.max(completeState.dailyRewards.maxStreak, newStreak),
                availableReward: {
                  day: rewardDay,
                  coins: 50 + (rewardDay * 25),
                  gems: 5 + Math.floor(rewardDay / 2),
                  special: rewardDay === 7 ? 'Legendary Chest' : rewardDay === 14 ? 'Mythical Item' : undefined,
                  claimed: false,
                },
              };
            } else if (daysSinceLastClaim > 1) {
              // Streak broken
              completeState.dailyRewards = {
                ...completeState.dailyRewards,
                currentStreak: 1,
                availableReward: {
                  day: 1,
                  coins: 75,
                  gems: 5,
                  claimed: false,
                },
              };
            }
          }

          // Update garden growth
          if (completeState.gardenOfGrowth.isPlanted && completeState.gardenOfGrowth.waterHoursRemaining > 0) {
            const plantedTime = new Date(completeState.gardenOfGrowth.plantedAt!).getTime();
            const hoursGrown = (now - plantedTime) / (1000 * 60 * 60);
            const growthRate = 0.5; // cm per hour
            const newGrowth = Math.min(
              hoursGrown * growthRate,
              completeState.gardenOfGrowth.maxGrowthCm
            );
            
            completeState.gardenOfGrowth.growthCm = newGrowth;
            completeState.gardenOfGrowth.totalGrowthBonus = newGrowth * 5; // 5% per cm
            
            // Update water remaining
            const waterUsed = Math.min(hoursGrown, completeState.gardenOfGrowth.waterHoursRemaining);
            completeState.gardenOfGrowth.waterHoursRemaining = Math.max(0, completeState.gardenOfGrowth.waterHoursRemaining - waterUsed);
          }

          // Refresh Yojef Market if needed
          if (new Date() > new Date(completeState.yojefMarket.nextRefresh)) {
            const newItems = Array.from({ length: 3 }, () => generateRelicItem());
            completeState.yojefMarket = {
              items: newItems,
              lastRefresh: new Date(),
              nextRefresh: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            };
          }

          setGameState(completeState);
        } else {
          // Initialize new game
          const newState = createInitialGameState();
          // Generate initial Yojef Market items
          newState.yojefMarket.items = Array.from({ length: 3 }, () => generateRelicItem());
          setGameState(newState);
        }
      } catch (error) {
        console.error('Error loading game state:', error);
        const newState = createInitialGameState();
        newState.yojefMarket.items = Array.from({ length: 3 }, () => generateRelicItem());
        setGameState(newState);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, []);

  // Save game state to storage
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      const stateToSave = {
        ...state,
        offlineProgress: {
          ...state.offlineProgress,
          lastSaveTime: new Date(),
        },
      };
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, []);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      saveGameState(gameState);
    }, 10000);

    return () => clearInterval(interval);
  }, [gameState, saveGameState]);

  // Calculate total stats including bonuses
  const calculateTotalStats = useCallback((state: GameState) => {
    const gardenBonus = state.gardenOfGrowth.totalGrowthBonus;
    
    // Base stats
    let totalAtk = state.playerStats.baseAtk;
    let totalDef = state.playerStats.baseDef;
    let totalHp = state.playerStats.baseHp;

    // Equipment bonuses
    if (state.inventory.currentWeapon) {
      totalAtk += state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10;
    }
    if (state.inventory.currentArmor) {
      totalDef += state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5;
    }

    // Relic bonuses
    state.inventory.equippedRelics.forEach(relic => {
      if (relic.type === 'weapon' && relic.baseAtk) {
        totalAtk += relic.baseAtk + (relic.level - 1) * 22;
      } else if (relic.type === 'armor' && relic.baseDef) {
        totalDef += relic.baseDef + (relic.level - 1) * 15;
      }
    });

    // Garden bonuses
    totalAtk += (totalAtk * gardenBonus) / 100;
    totalDef += (totalDef * gardenBonus) / 100;
    totalHp += (totalHp * gardenBonus) / 100;

    return {
      atk: Math.floor(totalAtk),
      def: Math.floor(totalDef),
      maxHp: Math.floor(totalHp),
    };
  }, []);

  // Update player stats when equipment changes
  useEffect(() => {
    if (!gameState) return;

    const totalStats = calculateTotalStats(gameState);
    const currentHpPercentage = gameState.playerStats.hp / gameState.playerStats.maxHp;
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          atk: totalStats.atk,
          def: totalStats.def,
          maxHp: totalStats.maxHp,
          hp: Math.floor(totalStats.maxHp * currentHpPercentage),
        },
      };
    });
  }, [gameState?.inventory.currentWeapon, gameState?.inventory.currentArmor, gameState?.inventory.equippedRelics, gameState?.gardenOfGrowth.totalGrowthBonus, calculateTotalStats]);

  const startCombat = useCallback(() => {
    if (!gameState) return;

    // Generate 3 random adventure skills
    const availableSkills = generateRandomAdventureSkills(3);
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        adventureSkills: {
          ...prev.adventureSkills,
          availableSkills,
          showSelectionModal: true,
        },
      };
    });
  }, [gameState]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      
      const enemy = generateEnemy(prev.zone);
      
      // Apply skill effects
      let modifiedPlayerStats = { ...prev.playerStats };
      let modifiedEnemy = { ...enemy };
      let skillEffects = { ...prev.adventureSkills.skillEffects };

      // Reset all skill effects first
      skillEffects = {
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

      // Apply selected skill effects
      switch (skill.type) {
        case 'risker':
          modifiedPlayerStats.hp = Math.floor(modifiedPlayerStats.hp * 0.5);
          modifiedPlayerStats.atk = Math.floor(modifiedPlayerStats.atk * 2);
          break;
        case 'lightning_chain':
          skillEffects.lightningChainActive = true;
          break;
        case 'truth_lies':
          skillEffects.truthLiesActive = true;
          break;
        case 'berserker':
          modifiedPlayerStats.atk = Math.floor(modifiedPlayerStats.atk * 1.5);
          modifiedPlayerStats.def = Math.floor(modifiedPlayerStats.def * 0.75);
          skillEffects.berserkerActive = true;
          break;
        case 'vampiric':
          skillEffects.vampiricActive = true;
          break;
        case 'time_slow':
          skillEffects.timeSlowActive = true;
          break;
        case 'critical_strike':
          skillEffects.criticalStrikeActive = true;
          break;
        case 'shield_wall':
          skillEffects.shieldWallActive = true;
          break;
        case 'poison_blade':
          skillEffects.poisonBladeActive = true;
          break;
        case 'arcane_shield':
          skillEffects.arcaneShieldActive = true;
          break;
        case 'battle_frenzy':
          skillEffects.battleFrenzyActive = true;
          break;
        case 'elemental_mastery':
          skillEffects.elementalMasteryActive = true;
          break;
        case 'healing_aura':
          skillEffects.healingAuraActive = true;
          break;
        case 'double_strike':
          skillEffects.doubleStrikeActive = true;
          break;
        case 'mana_shield':
          skillEffects.manaShieldActive = true;
          break;
        case 'berserk_rage':
          skillEffects.berserkRageActive = true;
          break;
        case 'storm_call':
          skillEffects.stormCallActive = true;
          break;
        case 'blood_pact':
          skillEffects.bloodPactActive = true;
          break;
        case 'frost_armor':
          skillEffects.frostArmorActive = true;
          break;
        case 'fireball':
          skillEffects.fireballActive = true;
          break;
      }

      return {
        ...prev,
        currentEnemy: modifiedEnemy,
        inCombat: true,
        combatLog: [`You enter combat in Zone ${prev.zone} against ${enemy.name}!`],
        hasUsedRevival: false,
        playerStats: modifiedPlayerStats,
        adventureSkills: {
          ...prev.adventureSkills,
          selectedSkill: skill,
          showSelectionModal: false,
          skillEffects,
        },
      };
    });
  }, [gameState]);

  const skipAdventureSkills = useCallback(() => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      
      const enemy = generateEnemy(prev.zone);
      
      return {
        ...prev,
        currentEnemy: enemy,
        inCombat: true,
        combatLog: [`You enter combat in Zone ${prev.zone} against ${enemy.name}!`],
        hasUsedRevival: false,
        adventureSkills: {
          ...prev.adventureSkills,
          selectedSkill: null,
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
      };
    });
  }, [gameState]);

  const useSkipCard = useCallback(() => {
    if (!gameState || !gameState.adventureSkills.selectedSkill || gameState.adventureSkills.selectedSkill.type !== 'skip_card') return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        adventureSkills: {
          ...prev.adventureSkills,
          skillEffects: {
            ...prev.adventureSkills.skillEffects,
            skipCardUsed: true,
          },
        },
      };
    });
  }, [gameState]);

  const attack = useCallback((hit: boolean, category?: string) => {
    if (!gameState || !gameState.currentEnemy) return;

    setGameState(prev => {
      if (!prev || !prev.currentEnemy) return prev;

      let newState = { ...prev };
      let combatLog = [...prev.combatLog];
      let enemy = { ...prev.currentEnemy };
      let playerStats = { ...prev.playerStats };
      let knowledgeStreak = { ...prev.knowledgeStreak };

      // Update statistics
      newState.statistics = {
        ...newState.statistics,
        totalQuestionsAnswered: newState.statistics.totalQuestionsAnswered + 1,
      };

      if (category) {
        if (!newState.statistics.accuracyByCategory[category]) {
          newState.statistics.accuracyByCategory[category] = { correct: 0, total: 0 };
        }
        newState.statistics.accuracyByCategory[category].total += 1;
      }

      if (hit) {
        // Correct answer
        newState.statistics.correctAnswers += 1;
        if (category) {
          newState.statistics.accuracyByCategory[category].correct += 1;
        }

        // Update knowledge streak
        knowledgeStreak.current += 1;
        knowledgeStreak.best = Math.max(knowledgeStreak.best, knowledgeStreak.current);
        knowledgeStreak.multiplier = 1 + (knowledgeStreak.current * 0.1);

        // Calculate damage
        let damage = Math.max(1, playerStats.atk - enemy.def);
        
        // Apply adventure skill effects
        if (newState.adventureSkills.selectedSkill) {
          switch (newState.adventureSkills.selectedSkill.type) {
            case 'lightning_chain':
              if (Math.random() < 0.3) {
                damage *= 2;
                combatLog.push('⚡ Lightning chains for double damage!');
              }
              break;
            case 'critical_strike':
              if (Math.random() < 0.2) {
                damage *= 3;
                combatLog.push('💥 Critical strike for triple damage!');
              }
              break;
            case 'double_strike':
              damage *= 2;
              combatLog.push('⚔️ Double strike hits twice!');
              break;
            case 'healing_aura':
              playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 10);
              combatLog.push('💚 Healing aura restores 10 HP!');
              break;
          }
        }

        // Apply vampiric healing
        if (newState.adventureSkills.skillEffects.vampiricActive) {
          const healing = Math.floor(damage * 0.25);
          playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + healing);
          combatLog.push(`🩸 Vampiric healing restores ${healing} HP!`);
        }

        enemy.hp = Math.max(0, enemy.hp - damage);
        combatLog.push(`You deal ${damage} damage! Enemy HP: ${enemy.hp}/${enemy.maxHp}`);

        // Check if enemy is defeated
        if (enemy.hp <= 0) {
          const baseCoins = 10 + (prev.zone * 2);
          const baseGems = Math.floor(prev.zone / 5) + 1;
          
          let coinsEarned = Math.floor(baseCoins * knowledgeStreak.multiplier);
          let gemsEarned = Math.floor(baseGems * knowledgeStreak.multiplier);

          // Apply game mode bonuses
          if (newState.gameMode.current === 'blitz') {
            coinsEarned = Math.floor(coinsEarned * 1.25);
            gemsEarned = Math.floor(gemsEarned * 1.1);
          } else if (newState.gameMode.current === 'survival') {
            coinsEarned *= 2;
            gemsEarned *= 2;
          }

          // Apply cheat bonuses
          if (newState.cheats.infiniteCoins) coinsEarned = 999999;
          if (newState.cheats.infiniteGems) gemsEarned = 999999;

          newState.coins += coinsEarned;
          newState.gems += gemsEarned;
          newState.zone += 1;

          // Update statistics
          newState.statistics.coinsEarned += coinsEarned;
          newState.statistics.gemsEarned += gemsEarned;
          newState.statistics.totalVictories += 1;
          newState.statistics.zonesReached = Math.max(newState.statistics.zonesReached, newState.zone);

          // Add experience
          const expGained = 10 + (prev.zone * 2);
          newState.progression.experience += expGained;
          
          // Check for level up
          while (newState.progression.experience >= newState.progression.experienceToNext) {
            newState.progression.experience -= newState.progression.experienceToNext;
            newState.progression.level += 1;
            newState.progression.skillPoints += 1;
            newState.progression.experienceToNext = 100 + (newState.progression.level * 50);
          }

          // Check for premium unlock
          if (newState.zone >= 50) {
            newState.isPremium = true;
          }

          // Restore health
          if (newState.gameMode.current !== 'survival') {
            playerStats.hp = playerStats.maxHp;
          }

          combatLog.push(`Victory! You earned ${coinsEarned} coins and ${gemsEarned} gems!`);
          combatLog.push(`Advancing to Zone ${newState.zone}!`);

          // Check for item drops (zones 10+)
          if (prev.zone >= 10 && Math.random() < 0.3) {
            const isWeapon = Math.random() < 0.5;
            const newItem = isWeapon ? generateWeapon() : generateArmor();
            
            if (isWeapon) {
              newState.inventory.weapons.push(newItem as Weapon);
            } else {
              newState.inventory.armor.push(newItem as Armor);
            }

            // Update collection book
            const itemName = newItem.name;
            if (isWeapon) {
              if (!newState.collectionBook.weapons[itemName]) {
                newState.collectionBook.weapons[itemName] = true;
                newState.collectionBook.totalWeaponsFound += 1;
              }
            } else {
              if (!newState.collectionBook.armor[itemName]) {
                newState.collectionBook.armor[itemName] = true;
                newState.collectionBook.totalArmorFound += 1;
              }
            }

            newState.collectionBook.rarityStats[newItem.rarity] += 1;
            newState.statistics.itemsCollected += 1;

            combatLog.push(`${newItem.name} (${newItem.rarity}) dropped!`);
          }

          // Check achievements and player tags
          const newAchievements = checkAchievements(newState);
          const newTags = checkPlayerTags(newState);

          if (newAchievements.length > 0) {
            newState.achievements = newState.achievements.map(achievement => {
              const newAchievement = newAchievements.find(na => na.id === achievement.id);
              return newAchievement || achievement;
            });
          }

          if (newTags.length > 0) {
            newState.playerTags = newState.playerTags.map(tag => {
              const newTag = newTags.find(nt => nt.id === tag.id);
              return newTag || tag;
            });
          }

          return {
            ...newState,
            currentEnemy: null,
            inCombat: false,
            combatLog,
            playerStats,
            knowledgeStreak,
          };
        }
      } else {
        // Wrong answer
        knowledgeStreak.current = 0;
        knowledgeStreak.multiplier = 1;

        let damage = Math.max(1, enemy.atk - playerStats.def);
        
        // Apply adventure skill damage reduction
        if (newState.adventureSkills.skillEffects.metalShieldUsed) {
          damage = Math.floor(damage * 0.5);
        }

        playerStats.hp = Math.max(0, playerStats.hp - damage);
        combatLog.push(`Enemy deals ${damage} damage! Your HP: ${playerStats.hp}/${playerStats.maxHp}`);

        // Check if player is defeated
        if (playerStats.hp <= 0) {
          // Check for revival
          if (!newState.hasUsedRevival) {
            playerStats.hp = Math.floor(playerStats.maxHp * 0.5);
            newState.hasUsedRevival = true;
            newState.statistics.revivals += 1;
            combatLog.push('💖 You have been revived with 50% HP!');
          } else {
            // Player defeated
            newState.statistics.totalDeaths += 1;
            
            if (newState.gameMode.current === 'survival') {
              newState.gameMode.survivalLives -= 1;
              if (newState.gameMode.survivalLives <= 0) {
                combatLog.push('💀 All lives lost! Game Over!');
              } else {
                playerStats.hp = playerStats.maxHp;
                combatLog.push(`💀 You died! ${newState.gameMode.survivalLives} lives remaining.`);
              }
            } else {
              combatLog.push('💀 You have been defeated!');
            }

            return {
              ...newState,
              currentEnemy: null,
              inCombat: false,
              combatLog,
              playerStats,
              knowledgeStreak,
            };
          }
        }
      }

      return {
        ...newState,
        currentEnemy: enemy,
        combatLog,
        playerStats,
        knowledgeStreak,
      };
    });
  }, [gameState]);

  const equipWeapon = useCallback((weapon: Weapon) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          currentWeapon: weapon,
        },
      };
    });
  }, [gameState]);

  const equipArmor = useCallback((armor: Armor) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          currentArmor: armor,
        },
      };
    });
  }, [gameState]);

  const upgradeWeapon = useCallback((weaponId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const weapon = prev.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon || prev.gems < weapon.upgradeCost) return prev;

      const updatedWeapons = prev.inventory.weapons.map(w => {
        if (w.id === weaponId) {
          return {
            ...w,
            level: w.level + 1,
            baseAtk: w.baseAtk + 10,
            upgradeCost: Math.floor(w.upgradeCost * 1.5),
            sellPrice: Math.floor(w.sellPrice * 1.2),
          };
        }
        return w;
      });

      const updatedCurrentWeapon = prev.inventory.currentWeapon?.id === weaponId
        ? updatedWeapons.find(w => w.id === weaponId) || prev.inventory.currentWeapon
        : prev.inventory.currentWeapon;

      return {
        ...prev,
        gems: prev.gems - weapon.upgradeCost,
        inventory: {
          ...prev.inventory,
          weapons: updatedWeapons,
          currentWeapon: updatedCurrentWeapon,
        },
        statistics: {
          ...prev.statistics,
          itemsUpgraded: prev.statistics.itemsUpgraded + 1,
        },
      };
    });
  }, [gameState]);

  const upgradeArmor = useCallback((armorId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const armor = prev.inventory.armor.find(a => a.id === armorId);
      if (!armor || prev.gems < armor.upgradeCost) return prev;

      const updatedArmor = prev.inventory.armor.map(a => {
        if (a.id === armorId) {
          return {
            ...a,
            level: a.level + 1,
            baseDef: a.baseDef + 5,
            upgradeCost: Math.floor(a.upgradeCost * 1.5),
            sellPrice: Math.floor(a.sellPrice * 1.2),
          };
        }
        return a;
      });

      const updatedCurrentArmor = prev.inventory.currentArmor?.id === armorId
        ? updatedArmor.find(a => a.id === armorId) || prev.inventory.currentArmor
        : prev.inventory.currentArmor;

      return {
        ...prev,
        gems: prev.gems - armor.upgradeCost,
        inventory: {
          ...prev.inventory,
          armor: updatedArmor,
          currentArmor: updatedCurrentArmor,
        },
        statistics: {
          ...prev.statistics,
          itemsUpgraded: prev.statistics.itemsUpgraded + 1,
        },
      };
    });
  }, [gameState]);

  const sellWeapon = useCallback((weaponId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const weapon = prev.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon) return prev;

      const updatedWeapons = prev.inventory.weapons.filter(w => w.id !== weaponId);
      const updatedCurrentWeapon = prev.inventory.currentWeapon?.id === weaponId
        ? null
        : prev.inventory.currentWeapon;

      return {
        ...prev,
        coins: prev.coins + weapon.sellPrice,
        inventory: {
          ...prev.inventory,
          weapons: updatedWeapons,
          currentWeapon: updatedCurrentWeapon,
        },
        statistics: {
          ...prev.statistics,
          itemsSold: prev.statistics.itemsSold + 1,
        },
      };
    });
  }, [gameState]);

  const sellArmor = useCallback((armorId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const armor = prev.inventory.armor.find(a => a.id === armorId);
      if (!armor) return prev;

      const updatedArmor = prev.inventory.armor.filter(a => a.id !== armorId);
      const updatedCurrentArmor = prev.inventory.currentArmor?.id === armorId
        ? null
        : prev.inventory.currentArmor;

      return {
        ...prev,
        coins: prev.coins + armor.sellPrice,
        inventory: {
          ...prev.inventory,
          armor: updatedArmor,
          currentArmor: updatedCurrentArmor,
        },
        statistics: {
          ...prev.statistics,
          itemsSold: prev.statistics.itemsSold + 1,
        },
      };
    });
  }, [gameState]);

  const upgradeResearch = useCallback((type: 'atk' | 'def' | 'hp') => {
    // Research is removed - this function is kept for compatibility but does nothing
    return;
  }, []);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;

    const weights = getChestRarityWeights(cost);
    const random = Math.random() * 100;
    
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
    let cumulative = 0;
    
    const rarities: ('common' | 'rare' | 'epic' | 'legendary' | 'mythical')[] = ['common', 'rare', 'epic', 'legendary', 'mythical'];
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = rarities[i];
        break;
      }
    }

    // 20% chance for gems instead of items
    if (Math.random() < 0.2) {
      const gemAmount = cost === 1000 ? 50 : cost === 400 ? 25 : cost === 200 ? 15 : 10;
      
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          coins: prev.coins - cost,
          gems: prev.gems + gemAmount,
          statistics: {
            ...prev.statistics,
            chestsOpened: prev.statistics.chestsOpened + 1,
            gemsEarned: prev.statistics.gemsEarned + gemAmount,
          },
        };
      });

      return { type: 'gems', gems: gemAmount };
    }

    // Generate items
    const items: (Weapon | Armor)[] = [];
    const itemCount = cost >= 400 ? 2 : 1;

    for (let i = 0; i < itemCount; i++) {
      const isWeapon = Math.random() < 0.5;
      const forceEnchanted = Math.random() < 0.05; // 5% chance for enchanted
      const item = isWeapon 
        ? generateWeapon(false, rarity, forceEnchanted)
        : generateArmor(false, rarity, forceEnchanted);
      items.push(item);
    }

    setGameState(prev => {
      if (!prev) return prev;

      const newWeapons = [...prev.inventory.weapons];
      const newArmor = [...prev.inventory.armor];

      items.forEach(item => {
        if ('baseAtk' in item) {
          newWeapons.push(item as Weapon);
        } else {
          newArmor.push(item as Armor);
        }

        // Update collection book
        const itemName = item.name;
        if ('baseAtk' in item) {
          if (!prev.collectionBook.weapons[itemName]) {
            prev.collectionBook.weapons[itemName] = true;
            prev.collectionBook.totalWeaponsFound += 1;
          }
        } else {
          if (!prev.collectionBook.armor[itemName]) {
            prev.collectionBook.armor[itemName] = true;
            prev.collectionBook.totalArmorFound += 1;
          }
        }

        prev.collectionBook.rarityStats[item.rarity] += 1;
      });

      return {
        ...prev,
        coins: prev.coins - cost,
        inventory: {
          ...prev.inventory,
          weapons: newWeapons,
          armor: newArmor,
        },
        statistics: {
          ...prev.statistics,
          chestsOpened: prev.statistics.chestsOpened + 1,
          itemsCollected: prev.statistics.itemsCollected + items.length,
        },
      };
    });

    return { type: 'weapon', items };
  }, [gameState]);

  const purchaseMythical = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');

    setGameState(prev => {
      if (!prev) return prev;

      const newWeapons = [...prev.inventory.weapons];
      const newArmor = [...prev.inventory.armor];

      if ('baseAtk' in item) {
        newWeapons.push(item as Weapon);
        if (!prev.collectionBook.weapons[item.name]) {
          prev.collectionBook.weapons[item.name] = true;
          prev.collectionBook.totalWeaponsFound += 1;
        }
      } else {
        newArmor.push(item as Armor);
        if (!prev.collectionBook.armor[item.name]) {
          prev.collectionBook.armor[item.name] = true;
          prev.collectionBook.totalArmorFound += 1;
        }
      }

      prev.collectionBook.rarityStats.mythical += 1;

      return {
        ...prev,
        coins: prev.coins - cost,
        inventory: {
          ...prev.inventory,
          weapons: newWeapons,
          armor: newArmor,
        },
        statistics: {
          ...prev.statistics,
          itemsCollected: prev.statistics.itemsCollected + 1,
        },
      };
    });

    return { type: 'weapon', items: [item] };
  }, [gameState]);

  const resetGame = useCallback(() => {
    const newState = createInitialGameState();
    newState.yojefMarket.items = Array.from({ length: 3 }, () => generateRelicItem());
    setGameState(newState);
    saveGameState(newState);
  }, [saveGameState]);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'survival') => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gameMode: {
          ...prev.gameMode,
          current: mode,
          survivalLives: mode === 'survival' ? 3 : prev.gameMode.survivalLives,
        },
      };
    });
  }, [gameState]);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cheats: {
          ...prev.cheats,
          [cheat]: !prev.cheats[cheat],
        },
      };
    });
  }, [gameState]);

  const generateCheatItem = useCallback(() => {
    if (!gameState) return;

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');

    setGameState(prev => {
      if (!prev) return prev;

      const newWeapons = [...prev.inventory.weapons];
      const newArmor = [...prev.inventory.armor];

      if ('baseAtk' in item) {
        newWeapons.push(item as Weapon);
      } else {
        newArmor.push(item as Armor);
      }

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          weapons: newWeapons,
          armor: newArmor,
        },
      };
    });
  }, [gameState]);

  const mineGem = useCallback((x: number, y: number) => {
    if (!gameState) return null;

    const isShiny = Math.random() < 0.05; // 5% chance for shiny gem
    const gemsFound = isShiny ? 0 : 1;
    const shinyGemsFound = isShiny ? 1 : 0;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gems: prev.gems + gemsFound,
        shinyGems: prev.shinyGems + shinyGemsFound,
        mining: {
          ...prev.mining,
          totalGemsMined: prev.mining.totalGemsMined + gemsFound,
          totalShinyGemsMined: prev.mining.totalShinyGemsMined + shinyGemsFound,
        },
        statistics: {
          ...prev.statistics,
          gemsEarned: prev.statistics.gemsEarned + gemsFound,
          shinyGemsEarned: prev.statistics.shinyGemsEarned + shinyGemsFound,
        },
      };
    });

    return { gems: gemsFound, shinyGems: shinyGemsFound };
  }, [gameState]);

  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.shinyGems < amount) return false;

    const regularGems = amount * 10;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        shinyGems: prev.shinyGems - amount,
        gems: prev.gems + regularGems,
        statistics: {
          ...prev.statistics,
          gemsEarned: prev.statistics.gemsEarned + regularGems,
        },
      };
    });

    return true;
  }, [gameState]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      if (type === 'weapon') {
        const updatedWeapons = prev.inventory.weapons.filter(w => w.id !== itemId);
        const updatedCurrentWeapon = prev.inventory.currentWeapon?.id === itemId
          ? null
          : prev.inventory.currentWeapon;

        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            weapons: updatedWeapons,
            currentWeapon: updatedCurrentWeapon,
          },
        };
      } else {
        const updatedArmor = prev.inventory.armor.filter(a => a.id !== itemId);
        const updatedCurrentArmor = prev.inventory.currentArmor?.id === itemId
          ? null
          : prev.inventory.currentArmor;

        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            armor: updatedArmor,
            currentArmor: updatedCurrentArmor,
          },
        };
      }
    });
  }, [gameState]);

  const purchaseRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;

    const relic = gameState.yojefMarket.items.find(item => item.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;

    setGameState(prev => {
      if (!prev) return prev;

      const updatedMarketItems = prev.yojefMarket.items.filter(item => item.id !== relicId);

      return {
        ...prev,
        gems: prev.gems - relic.cost,
        inventory: {
          ...prev.inventory,
          relics: [...prev.inventory.relics, relic],
        },
        yojefMarket: {
          ...prev.yojefMarket,
          items: updatedMarketItems,
        },
      };
    });

    return true;
  }, [gameState]);

  const upgradeRelic = useCallback((relicId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const relic = prev.inventory.relics.find(r => r.id === relicId) || 
                   prev.inventory.equippedRelics.find(r => r.id === relicId);
      if (!relic || prev.gems < relic.upgradeCost) return prev;

      const upgradeRelic = (r: RelicItem) => {
        if (r.id === relicId) {
          return {
            ...r,
            level: r.level + 1,
            baseAtk: r.baseAtk ? r.baseAtk + 22 : undefined,
            baseDef: r.baseDef ? r.baseDef + 15 : undefined,
            upgradeCost: Math.floor(r.upgradeCost * 1.5),
          };
        }
        return r;
      };

      return {
        ...prev,
        gems: prev.gems - relic.upgradeCost,
        inventory: {
          ...prev.inventory,
          relics: prev.inventory.relics.map(upgradeRelic),
          equippedRelics: prev.inventory.equippedRelics.map(upgradeRelic),
        },
      };
    });
  }, [gameState]);

  const equipRelic = useCallback((relicId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic || prev.inventory.equippedRelics.length >= 5) return prev;

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          relics: prev.inventory.relics.filter(r => r.id !== relicId),
          equippedRelics: [...prev.inventory.equippedRelics, relic],
        },
      };
    });
  }, [gameState]);

  const unequipRelic = useCallback((relicId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const relic = prev.inventory.equippedRelics.find(r => r.id === relicId);
      if (!relic) return prev;

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          equippedRelics: prev.inventory.equippedRelics.filter(r => r.id !== relicId),
          relics: [...prev.inventory.relics, relic],
        },
      };
    });
  }, [gameState]);

  const sellRelic = useCallback((relicId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      const updatedRelics = prev.inventory.relics.filter(r => r.id !== relicId);

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          relics: updatedRelics,
        },
      };
    });
  }, [gameState]);

  const claimDailyReward = useCallback((): boolean => {
    if (!gameState || !gameState.dailyRewards.availableReward) return false;

    const reward = gameState.dailyRewards.availableReward;

    setGameState(prev => {
      if (!prev || !prev.dailyRewards.availableReward) return prev;

      return {
        ...prev,
        coins: prev.coins + reward.coins,
        gems: prev.gems + reward.gems,
        dailyRewards: {
          ...prev.dailyRewards,
          lastClaimDate: new Date(),
          availableReward: null,
          rewardHistory: [...prev.dailyRewards.rewardHistory, { ...reward, claimed: true, claimDate: new Date() }],
        },
        statistics: {
          ...prev.statistics,
          coinsEarned: prev.statistics.coinsEarned + reward.coins,
          gemsEarned: prev.statistics.gemsEarned + reward.gems,
        },
      };
    });

    return true;
  }, [gameState]);

  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (!gameState || gameState.progression.skillPoints <= 0) return false;

    setGameState(prev => {
      if (!prev || prev.progression.skillPoints <= 0) return prev;

      return {
        ...prev,
        progression: {
          ...prev.progression,
          skillPoints: prev.progression.skillPoints - 1,
          unlockedSkills: [...prev.progression.unlockedSkills, skillId],
        },
      };
    });

    return true;
  }, [gameState]);

  const prestige = useCallback((): boolean => {
    if (!gameState || gameState.progression.level < 50) return false;

    const prestigePoints = Math.floor(gameState.progression.level / 10);

    setGameState(prev => {
      if (!prev || prev.progression.level < 50) return prev;

      return {
        ...prev,
        progression: {
          ...prev.progression,
          level: 1,
          experience: 0,
          experienceToNext: 100,
          skillPoints: 0,
          unlockedSkills: [],
          prestigeLevel: prev.progression.prestigeLevel + 1,
          prestigePoints: prev.progression.prestigePoints + prestigePoints,
        },
        playerStats: {
          ...prev.playerStats,
          hp: 100,
          maxHp: 100,
          atk: 20,
          def: 10,
        },
      };
    });

    return true;
  }, [gameState]);

  const claimOfflineRewards = useCallback(() => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        coins: prev.coins + prev.offlineProgress.offlineCoins,
        gems: prev.gems + prev.offlineProgress.offlineGems,
        offlineProgress: {
          ...prev.offlineProgress,
          offlineCoins: 0,
          offlineGems: 0,
          offlineTime: 0,
        },
        statistics: {
          ...prev.statistics,
          coinsEarned: prev.statistics.coinsEarned + prev.offlineProgress.offlineCoins,
          gemsEarned: prev.statistics.gemsEarned + prev.offlineProgress.offlineGems,
        },
      };
    });
  }, [gameState]);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      let totalCoins = 0;
      let itemsSold = 0;

      if (type === 'weapon') {
        const itemsToSell = prev.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalCoins = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        itemsSold = itemsToSell.length;

        const updatedWeapons = prev.inventory.weapons.filter(w => !itemIds.includes(w.id));
        const updatedCurrentWeapon = itemIds.includes(prev.inventory.currentWeapon?.id || '')
          ? null
          : prev.inventory.currentWeapon;

        return {
          ...prev,
          coins: prev.coins + totalCoins,
          inventory: {
            ...prev.inventory,
            weapons: updatedWeapons,
            currentWeapon: updatedCurrentWeapon,
          },
          statistics: {
            ...prev.statistics,
            itemsSold: prev.statistics.itemsSold + itemsSold,
          },
        };
      } else {
        const itemsToSell = prev.inventory.armor.filter(a => itemIds.includes(a.id));
        totalCoins = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        itemsSold = itemsToSell.length;

        const updatedArmor = prev.inventory.armor.filter(a => !itemIds.includes(a.id));
        const updatedCurrentArmor = itemIds.includes(prev.inventory.currentArmor?.id || '')
          ? null
          : prev.inventory.currentArmor;

        return {
          ...prev,
          coins: prev.coins + totalCoins,
          inventory: {
            ...prev.inventory,
            armor: updatedArmor,
            currentArmor: updatedCurrentArmor,
          },
          statistics: {
            ...prev.statistics,
            itemsSold: prev.statistics.itemsSold + itemsSold,
          },
        };
      }
    });
  }, [gameState]);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;

      let totalCost = 0;
      let itemsUpgraded = 0;

      if (type === 'weapon') {
        const itemsToUpgrade = prev.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);

        if (prev.gems < totalCost) return prev;

        itemsUpgraded = itemsToUpgrade.length;

        const updatedWeapons = prev.inventory.weapons.map(w => {
          if (itemIds.includes(w.id)) {
            return {
              ...w,
              level: w.level + 1,
              baseAtk: w.baseAtk + 10,
              upgradeCost: Math.floor(w.upgradeCost * 1.5),
              sellPrice: Math.floor(w.sellPrice * 1.2),
            };
          }
          return w;
        });

        const updatedCurrentWeapon = prev.inventory.currentWeapon && itemIds.includes(prev.inventory.currentWeapon.id)
          ? updatedWeapons.find(w => w.id === prev.inventory.currentWeapon!.id) || prev.inventory.currentWeapon
          : prev.inventory.currentWeapon;

        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            weapons: updatedWeapons,
            currentWeapon: updatedCurrentWeapon,
          },
          statistics: {
            ...prev.statistics,
            itemsUpgraded: prev.statistics.itemsUpgraded + itemsUpgraded,
          },
        };
      } else {
        const itemsToUpgrade = prev.inventory.armor.filter(a => itemIds.includes(a.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);

        if (prev.gems < totalCost) return prev;

        itemsUpgraded = itemsToUpgrade.length;

        const updatedArmor = prev.inventory.armor.map(a => {
          if (itemIds.includes(a.id)) {
            return {
              ...a,
              level: a.level + 1,
              baseDef: a.baseDef + 5,
              upgradeCost: Math.floor(a.upgradeCost * 1.5),
              sellPrice: Math.floor(a.sellPrice * 1.2),
            };
          }
          return a;
        });

        const updatedCurrentArmor = prev.inventory.currentArmor && itemIds.includes(prev.inventory.currentArmor.id)
          ? updatedArmor.find(a => a.id === prev.inventory.currentArmor!.id) || prev.inventory.currentArmor
          : prev.inventory.currentArmor;

        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            armor: updatedArmor,
            currentArmor: updatedCurrentArmor,
          },
          statistics: {
            ...prev.statistics,
            itemsUpgraded: prev.statistics.itemsUpgraded + itemsUpgraded,
          },
        };
      }
    });
  }, [gameState]);

  const plantSeed = useCallback((): boolean => {
    if (!gameState || gameState.gardenOfGrowth.isPlanted || gameState.coins < gameState.gardenOfGrowth.seedCost) return false;

    setGameState(prev => {
      if (!prev || prev.gardenOfGrowth.isPlanted || prev.coins < prev.gardenOfGrowth.seedCost) return prev;

      return {
        ...prev,
        coins: prev.coins - prev.gardenOfGrowth.seedCost,
        gardenOfGrowth: {
          ...prev.gardenOfGrowth,
          isPlanted: true,
          plantedAt: new Date(),
          lastWatered: new Date(),
          waterHoursRemaining: 24, // Start with 24 hours of water
        },
      };
    });

    return true;
  }, [gameState]);

  const buyWater = useCallback((hours: number): boolean => {
    if (!gameState || !gameState.gardenOfGrowth.isPlanted) return false;

    const cost = (hours / 24) * gameState.gardenOfGrowth.waterCost;
    if (gameState.coins < cost) return false;

    setGameState(prev => {
      if (!prev || !prev.gardenOfGrowth.isPlanted || prev.coins < cost) return prev;

      return {
        ...prev,
        coins: prev.coins - cost,
        gardenOfGrowth: {
          ...prev.gardenOfGrowth,
          waterHoursRemaining: prev.gardenOfGrowth.waterHoursRemaining + hours,
        },
      };
    });

    return true;
  }, [gameState]);

  const updateSettings = useCallback((newSettings: Partial<typeof gameState.settings>) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          ...newSettings,
        },
      };
    });
  }, [gameState]);

  const addCoins = useCallback((amount: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        coins: prev.coins + amount,
      };
    });
  }, [gameState]);

  const addGems = useCallback((amount: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gems: prev.gems + amount,
      };
    });
  }, [gameState]);

  const teleportToZone = useCallback((zone: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        zone: Math.max(1, zone),
        statistics: {
          ...prev.statistics,
          zonesReached: Math.max(prev.statistics.zonesReached, zone),
        },
      };
    });
  }, [gameState]);

  const setExperience = useCallback((xp: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      
      let newLevel = 1;
      let remainingXp = xp;
      
      // Calculate level based on XP
      while (remainingXp >= (100 + (newLevel * 50))) {
        remainingXp -= (100 + (newLevel * 50));
        newLevel++;
      }

      return {
        ...prev,
        progression: {
          ...prev.progression,
          level: newLevel,
          experience: remainingXp,
          experienceToNext: 100 + (newLevel * 50),
        },
      };
    });
  }, [gameState]);

  const rollSkill = useCallback((): boolean => {
    if (!gameState || gameState.coins < 100) return false;

    // Generate random skill
    const skillTypes = [
      'coin_vacuum', 'treasurer', 'xp_surge', 'luck_gem', 'enchanter', 'time_warp',
      'golden_touch', 'knowledge_boost', 'durability_master', 'relic_finder', 'stat_amplifier'
    ];
    
    const randomType = skillTypes[Math.floor(Math.random() * skillTypes.length)];
    const duration = Math.floor(Math.random() * 12) + 1; // 1-12 hours
    
    const newSkill: MenuSkill = {
      id: `skill_${Date.now()}`,
      name: randomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `A powerful temporary skill effect`,
      duration,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
      type: randomType as any,
    };

    setGameState(prev => {
      if (!prev || prev.coins < 100) return prev;

      return {
        ...prev,
        coins: prev.coins - 100,
        skills: {
          ...prev.skills,
          activeMenuSkill: newSkill,
          lastRollTime: new Date(),
        },
      };
    });

    return true;
  }, [gameState]);

  return {
    gameState,
    isLoading,
    equipWeapon,
    equipArmor,
    upgradeWeapon,
    upgradeArmor,
    sellWeapon,
    sellArmor,
    upgradeResearch,
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