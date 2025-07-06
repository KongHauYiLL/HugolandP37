import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, RelicItem, DailyReward, AdventureSkill, MenuSkill } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, getChestRarityWeights, generateRelicItem } from '../utils/gameUtils';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

const STORAGE_KEY = 'hugoland_game_state';

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize game state
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Ensure all required properties exist with proper defaults
          const completeState: GameState = {
            coins: parsedState.coins || 500,
            gems: parsedState.gems || 0,
            shinyGems: parsedState.shinyGems || 0,
            zone: parsedState.zone || 1,
            playerStats: {
              hp: parsedState.playerStats?.hp || 100,
              maxHp: parsedState.playerStats?.maxHp || 100,
              atk: parsedState.playerStats?.atk || 20,
              def: parsedState.playerStats?.def || 10,
              baseAtk: parsedState.playerStats?.baseAtk || 20,
              baseDef: parsedState.playerStats?.baseDef || 10,
              baseHp: parsedState.playerStats?.baseHp || 100
            },
            inventory: {
              weapons: parsedState.inventory?.weapons || [],
              armor: parsedState.inventory?.armor || [],
              relics: parsedState.inventory?.relics || [],
              currentWeapon: parsedState.inventory?.currentWeapon || null,
              currentArmor: parsedState.inventory?.currentArmor || null,
              equippedRelics: parsedState.inventory?.equippedRelics || []
            },
            currentEnemy: parsedState.currentEnemy || null,
            inCombat: parsedState.inCombat || false,
            combatLog: parsedState.combatLog || [],
            isPremium: parsedState.isPremium || false,
            achievements: parsedState.achievements || initializeAchievements(),
            collectionBook: parsedState.collectionBook || {
              weapons: {},
              armor: {},
              totalWeaponsFound: 0,
              totalArmorFound: 0,
              rarityStats: { common: 0, rare: 0, epic: 0, legendary: 0, mythical: 0 }
            },
            knowledgeStreak: parsedState.knowledgeStreak || {
              current: 0,
              best: 0,
              multiplier: 1
            },
            gameMode: parsedState.gameMode || {
              current: 'normal',
              speedModeActive: false,
              survivalLives: 3,
              maxSurvivalLives: 3
            },
            statistics: parsedState.statistics || {
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
            cheats: parsedState.cheats || {
              infiniteCoins: false,
              infiniteGems: false,
              obtainAnyItem: false
            },
            mining: parsedState.mining || {
              totalGemsMined: 0,
              totalShinyGemsMined: 0
            },
            yojefMarket: parsedState.yojefMarket || {
              items: [],
              lastRefresh: new Date(),
              nextRefresh: new Date(Date.now() + 5 * 60 * 1000)
            },
            playerTags: parsedState.playerTags || initializePlayerTags(),
            dailyRewards: parsedState.dailyRewards || {
              lastClaimDate: null,
              currentStreak: 0,
              maxStreak: 0,
              availableReward: null,
              rewardHistory: []
            },
            progression: parsedState.progression || {
              level: 1,
              experience: 0,
              experienceToNext: 100,
              skillPoints: 0,
              unlockedSkills: [],
              prestigeLevel: 0,
              prestigePoints: 0,
              masteryLevels: {}
            },
            offlineProgress: parsedState.offlineProgress || {
              lastSaveTime: new Date(),
              offlineCoins: 0,
              offlineGems: 0,
              offlineTime: 0,
              maxOfflineHours: 24
            },
            gardenOfGrowth: parsedState.gardenOfGrowth || {
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
            settings: parsedState.settings || {
              colorblindMode: false,
              darkMode: true,
              language: 'en',
              notifications: true,
              snapToGrid: false,
              beautyMode: false
            },
            hasUsedRevival: parsedState.hasUsedRevival || false,
            skills: parsedState.skills || {
              activeMenuSkill: null,
              lastRollTime: null,
              playTimeThisSession: 0,
              sessionStartTime: new Date()
            },
            adventureSkills: parsedState.adventureSkills || {
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
            }
          };
          
          setGameState(completeState);
        } else {
          // Create new game state
          const newState: GameState = {
            coins: 500,
            gems: 0,
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
              rarityStats: { common: 0, rare: 0, epic: 0, legendary: 0, mythical: 0 }
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
              nextRefresh: new Date(Date.now() + 5 * 60 * 1000)
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
              maxOfflineHours: 24
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
            }
          };
          
          setGameState(newState);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
      } catch (error) {
        console.error('Failed to initialize game state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGame();
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (gameState && !isLoading) {
      const saveState = async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        } catch (error) {
          console.error('Failed to save game state:', error);
        }
      };
      saveState();
    }
  }, [gameState, isLoading]);

  const updateGameState = useCallback((updater: (prevState: GameState) => GameState) => {
    setGameState(prevState => {
      if (!prevState) return prevState;
      const newState = updater(prevState);
      
      // Check achievements after state update
      const newAchievements = checkAchievements(newState);
      const newTags = checkPlayerTags(newState);
      
      return {
        ...newState,
        achievements: [...newState.achievements.filter(a => !newAchievements.some(na => na.id === a.id)), ...newAchievements],
        playerTags: [...newState.playerTags.filter(t => !newTags.some(nt => nt.id === t.id)), ...newTags]
      };
    });
  }, []);

  const equipWeapon = useCallback((weapon: Weapon) => {
    updateGameState(state => {
      const newWeapons = [...state.inventory.weapons];
      if (state.inventory.currentWeapon) {
        newWeapons.push(state.inventory.currentWeapon);
      }
      
      return {
        ...state,
        inventory: {
          ...state.inventory,
          weapons: newWeapons.filter(w => w.id !== weapon.id),
          currentWeapon: weapon
        }
      };
    });
  }, [updateGameState]);

  const equipArmor = useCallback((armor: Armor) => {
    updateGameState(state => {
      const newArmor = [...state.inventory.armor];
      if (state.inventory.currentArmor) {
        newArmor.push(state.inventory.currentArmor);
      }
      
      return {
        ...state,
        inventory: {
          ...state.inventory,
          armor: newArmor.filter(a => a.id !== armor.id),
          currentArmor: armor
        }
      };
    });
  }, [updateGameState]);

  const upgradeWeapon = useCallback((weaponId: string) => {
    updateGameState(state => {
      const weapon = state.inventory.weapons.find(w => w.id === weaponId) || 
                   (state.inventory.currentWeapon?.id === weaponId ? state.inventory.currentWeapon : null);
      
      if (!weapon || state.gems < weapon.upgradeCost) return state;
      
      const upgradedWeapon = {
        ...weapon,
        level: weapon.level + 1,
        baseAtk: weapon.baseAtk + 10,
        upgradeCost: Math.floor(weapon.upgradeCost * 1.5),
        sellPrice: Math.floor(weapon.sellPrice * 1.2),
        // Fix durability - restore to max when upgrading
        durability: weapon.maxDurability
      };
      
      return {
        ...state,
        gems: state.gems - weapon.upgradeCost,
        inventory: {
          ...state.inventory,
          weapons: state.inventory.weapons.map(w => 
            w.id === weaponId ? upgradedWeapon : w
          ),
          currentWeapon: state.inventory.currentWeapon?.id === weaponId ? upgradedWeapon : state.inventory.currentWeapon
        },
        statistics: {
          ...state.statistics,
          itemsUpgraded: state.statistics.itemsUpgraded + 1
        }
      };
    });
  }, [updateGameState]);

  const upgradeArmor = useCallback((armorId: string) => {
    updateGameState(state => {
      const armor = state.inventory.armor.find(a => a.id === armorId) || 
                   (state.inventory.currentArmor?.id === armorId ? state.inventory.currentArmor : null);
      
      if (!armor || state.gems < armor.upgradeCost) return state;
      
      const upgradedArmor = {
        ...armor,
        level: armor.level + 1,
        baseDef: armor.baseDef + 5,
        upgradeCost: Math.floor(armor.upgradeCost * 1.5),
        sellPrice: Math.floor(armor.sellPrice * 1.2),
        // Fix durability - restore to max when upgrading
        durability: armor.maxDurability
      };
      
      return {
        ...state,
        gems: state.gems - armor.upgradeCost,
        inventory: {
          ...state.inventory,
          armor: state.inventory.armor.map(a => 
            a.id === armorId ? upgradedArmor : a
          ),
          currentArmor: state.inventory.currentArmor?.id === armorId ? upgradedArmor : state.inventory.currentArmor
        },
        statistics: {
          ...state.statistics,
          itemsUpgraded: state.statistics.itemsUpgraded + 1
        }
      };
    });
  }, [updateGameState]);

  const sellWeapon = useCallback((weaponId: string) => {
    updateGameState(state => {
      const weapon = state.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon) return state;
      
      return {
        ...state,
        coins: state.coins + weapon.sellPrice,
        inventory: {
          ...state.inventory,
          weapons: state.inventory.weapons.filter(w => w.id !== weaponId)
        },
        statistics: {
          ...state.statistics,
          itemsSold: state.statistics.itemsSold + 1
        }
      };
    });
  }, [updateGameState]);

  const sellArmor = useCallback((armorId: string) => {
    updateGameState(state => {
      const armor = state.inventory.armor.find(a => a.id === armorId);
      if (!armor) return state;
      
      return {
        ...state,
        coins: state.coins + armor.sellPrice,
        inventory: {
          ...state.inventory,
          armor: state.inventory.armor.filter(a => a.id !== armorId)
        },
        statistics: {
          ...state.statistics,
          itemsSold: state.statistics.itemsSold + 1
        }
      };
    });
  }, [updateGameState]);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;
    
    updateGameState(state => {
      // Determine chest type based on cost
      let chestType: 'basic' | 'rare' | 'epic' | 'legendary';
      if (cost >= 1000) chestType = 'legendary';
      else if (cost >= 400) chestType = 'epic';
      else if (cost >= 200) chestType = 'rare';
      else chestType = 'basic';
      
      const weights = getChestRarityWeights(cost);
      const items: (Weapon | Armor)[] = [];
      
      // Always generate at least 1 item, up to 3 items
      const itemCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < itemCount; i++) {
        const rand = Math.random() * 100;
        let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
        
        let cumulative = 0;
        if (rand <= (cumulative += weights[0])) rarity = 'common';
        else if (rand <= (cumulative += weights[1])) rarity = 'rare';
        else if (rand <= (cumulative += weights[2])) rarity = 'epic';
        else if (rand <= (cumulative += weights[3])) rarity = 'legendary';
        else rarity = 'mythical';
        
        // 5% chance for enchanted items on epic+ chests
        const forceEnchanted = cost >= 400 && Math.random() < 0.05;
        
        if (Math.random() < 0.5) {
          items.push(generateWeapon(false, rarity, forceEnchanted));
        } else {
          items.push(generateArmor(false, rarity, forceEnchanted));
        }
      }
      
      // Add items to inventory
      const newWeapons = [...state.inventory.weapons];
      const newArmor = [...state.inventory.armor];
      
      items.forEach(item => {
        if ('baseAtk' in item) {
          newWeapons.push(item as Weapon);
        } else {
          newArmor.push(item as Armor);
        }
      });
      
      // Update collection book
      const newCollectionBook = { ...state.collectionBook };
      items.forEach(item => {
        if ('baseAtk' in item) {
          newCollectionBook.weapons[item.name] = true;
          newCollectionBook.totalWeaponsFound++;
        } else {
          newCollectionBook.armor[item.name] = true;
          newCollectionBook.totalArmorFound++;
        }
        newCollectionBook.rarityStats[item.rarity]++;
      });
      
      return {
        ...state,
        coins: state.coins - cost,
        inventory: {
          ...state.inventory,
          weapons: newWeapons,
          armor: newArmor
        },
        collectionBook: newCollectionBook,
        statistics: {
          ...state.statistics,
          chestsOpened: state.statistics.chestsOpened + 1,
          itemsCollected: state.statistics.itemsCollected + items.length
        }
      };
    });
    
    return { type: 'weapon', items: [] }; // This will be updated by the state change
  }, [gameState, updateGameState]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    updateGameState(state => ({
      ...state,
      inventory: {
        ...state.inventory,
        [type === 'weapon' ? 'weapons' : 'armor']: 
          state.inventory[type === 'weapon' ? 'weapons' : 'armor'].filter(item => item.id !== itemId)
      }
    }));
  }, [updateGameState]);

  const purchaseMythical = useCallback(() => {
    updateGameState(state => {
      if (state.gems < 100) return state;
      
      const itemType = Math.random() < 0.5 ? 'weapon' : 'armor';
      let newItem;
      
      if (itemType === 'weapon') {
        newItem = generateWeapon(false, 'mythical');
      } else {
        newItem = generateArmor(false, 'mythical');
      }
      
      return {
        ...state,
        gems: state.gems - 100,
        inventory: {
          ...state.inventory,
          [itemType === 'weapon' ? 'weapons' : 'armor']: [
            ...state.inventory[itemType === 'weapon' ? 'weapons' : 'armor'],
            newItem
          ]
        }
      };
    });
  }, [updateGameState]);

  const startCombat = useCallback(() => {
    updateGameState(state => {
      if (state.inCombat) return state;
      
      const enemy = generateEnemy(state.zone);
      
      // Generate adventure skills for selection (3 random skills)
      const allAdventureSkills: AdventureSkill[] = [
        { id: 'risker', name: 'Risker', description: 'Gain extra revival chance', type: 'risker' },
        { id: 'lightning_chain', name: 'Lightning Chain', description: 'Chain lightning on correct answers', type: 'lightning_chain' },
        { id: 'skip_card', name: 'Skip Card', description: 'Skip one question automatically', type: 'skip_card' },
        { id: 'metal_shield', name: 'Metal Shield', description: 'Block one enemy attack', type: 'metal_shield' },
        { id: 'truth_lies', name: 'Truth & Lies', description: 'Remove one wrong answer', type: 'truth_lies' },
        { id: 'ramp', name: 'Ramp', description: 'Damage increases each turn', type: 'ramp' },
        { id: 'dodge', name: 'Dodge', description: 'Avoid next enemy attack', type: 'dodge' },
        { id: 'berserker', name: 'Berserker', description: '+50% damage, -25% defense', type: 'berserker' },
        { id: 'vampiric', name: 'Vampiric', description: 'Heal when dealing damage', type: 'vampiric' },
        { id: 'phoenix', name: 'Phoenix', description: 'Revive with full health once', type: 'phoenix' },
        { id: 'time_slow', name: 'Time Slow', description: '+50% answer time', type: 'time_slow' },
        { id: 'critical_strike', name: 'Critical Strike', description: '25% chance for double damage', type: 'critical_strike' },
        { id: 'shield_wall', name: 'Shield Wall', description: '+100% defense for 3 turns', type: 'shield_wall' },
        { id: 'poison_blade', name: 'Poison Blade', description: 'Attacks poison enemies', type: 'poison_blade' },
        { id: 'arcane_shield', name: 'Arcane Shield', description: 'Absorb next 3 attacks', type: 'arcane_shield' },
        { id: 'battle_frenzy', name: 'Battle Frenzy', description: 'Attack speed increases over time', type: 'battle_frenzy' },
        { id: 'elemental_mastery', name: 'Elemental Mastery', description: 'Random elemental effects', type: 'elemental_mastery' },
        { id: 'shadow_step', name: 'Shadow Step', description: 'Teleport behind enemy for bonus damage', type: 'shadow_step' },
        { id: 'healing_aura', name: 'Healing Aura', description: 'Regenerate health over time', type: 'healing_aura' },
        { id: 'double_strike', name: 'Double Strike', description: 'Attack twice per turn', type: 'double_strike' },
        { id: 'mana_shield', name: 'Mana Shield', description: 'Convert damage to mana cost', type: 'mana_shield' },
        { id: 'berserk_rage', name: 'Berserk Rage', description: 'Damage increases as health decreases', type: 'berserk_rage' },
        { id: 'divine_protection', name: 'Divine Protection', description: 'Immunity to death once', type: 'divine_protection' },
        { id: 'storm_call', name: 'Storm Call', description: 'Lightning strikes all enemies', type: 'storm_call' },
        { id: 'blood_pact', name: 'Blood Pact', description: 'Sacrifice health for massive damage', type: 'blood_pact' },
        { id: 'frost_armor', name: 'Frost Armor', description: 'Slow enemies and reduce damage', type: 'frost_armor' },
        { id: 'fireball', name: 'Fireball', description: 'Explosive area damage', type: 'fireball' }
      ];
      
      const availableSkills = allAdventureSkills
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      return {
        ...state,
        currentEnemy: enemy,
        inCombat: true,
        combatLog: [`You encounter a ${enemy.name}!`],
        adventureSkills: {
          ...state.adventureSkills,
          availableSkills,
          showSelectionModal: true,
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
        }
      };
    });
  }, [updateGameState]);

  const attack = useCallback((hit: boolean, category?: string) => {
    updateGameState(state => {
      if (!state.inCombat || !state.currentEnemy) return state;
      
      let newState = { ...state };
      let damage = 0;
      
      // Update knowledge streak
      if (hit) {
        newState.knowledgeStreak = {
          ...newState.knowledgeStreak,
          current: newState.knowledgeStreak.current + 1,
          best: Math.max(newState.knowledgeStreak.best, newState.knowledgeStreak.current + 1),
          multiplier: 1 + (newState.knowledgeStreak.current + 1) * 0.1
        };
        
        // Calculate damage
        let baseAtk = newState.playerStats.atk;
        if (newState.inventory.currentWeapon) {
          baseAtk += newState.inventory.currentWeapon.baseAtk + (newState.inventory.currentWeapon.level - 1) * 10;
        }
        
        // Apply adventure skill effects
        if (newState.adventureSkills.skillEffects.berserkerActive) {
          baseAtk = Math.floor(baseAtk * 1.5);
        }
        if (newState.adventureSkills.skillEffects.criticalStrikeActive && Math.random() < 0.25) {
          baseAtk *= 2;
          newState.combatLog.push('Critical Strike!');
        }
        if (newState.adventureSkills.skillEffects.doubleStrikeActive) {
          baseAtk *= 2;
          newState.combatLog.push('Double Strike!');
        }
        
        damage = Math.max(1, baseAtk - newState.currentEnemy.def);
        
        // Apply knowledge streak multiplier
        damage = Math.floor(damage * newState.knowledgeStreak.multiplier);
        
        newState.currentEnemy = {
          ...newState.currentEnemy,
          hp: Math.max(0, newState.currentEnemy.hp - damage)
        };
        
        newState.combatLog.push(`You deal ${damage} damage!`);
        
        // Vampiric healing
        if (newState.adventureSkills.skillEffects.vampiricActive) {
          const healing = Math.floor(damage * 0.2);
          newState.playerStats.hp = Math.min(newState.playerStats.maxHp, newState.playerStats.hp + healing);
          newState.combatLog.push(`You heal ${healing} HP!`);
        }
        
        // Update statistics
        newState.statistics = {
          ...newState.statistics,
          correctAnswers: newState.statistics.correctAnswers + 1,
          totalQuestionsAnswered: newState.statistics.totalQuestionsAnswered + 1,
          totalDamageDealt: newState.statistics.totalDamageDealt + damage
        };
        
        // Update category accuracy
        if (category) {
          if (!newState.statistics.accuracyByCategory[category]) {
            newState.statistics.accuracyByCategory[category] = { correct: 0, total: 0 };
          }
          newState.statistics.accuracyByCategory[category].correct++;
          newState.statistics.accuracyByCategory[category].total++;
        }
      } else {
        // Wrong answer - reset streak
        newState.knowledgeStreak = {
          ...newState.knowledgeStreak,
          current: 0,
          multiplier: 1
        };
        
        // Enemy attacks
        let enemyDamage = Math.max(1, newState.currentEnemy.atk - newState.playerStats.def);
        
        // Apply adventure skill effects
        if (newState.adventureSkills.skillEffects.dodgeUsed) {
          enemyDamage = 0;
          newState.combatLog.push('You dodge the attack!');
          newState.adventureSkills.skillEffects.dodgeUsed = false;
        } else if (newState.adventureSkills.skillEffects.metalShieldUsed) {
          enemyDamage = 0;
          newState.combatLog.push('Metal Shield blocks the attack!');
          newState.adventureSkills.skillEffects.metalShieldUsed = false;
        } else if (newState.adventureSkills.skillEffects.frostArmorActive) {
          enemyDamage = Math.floor(enemyDamage * 0.5);
          newState.combatLog.push('Frost Armor reduces damage!');
        }
        
        if (enemyDamage > 0) {
          newState.playerStats.hp = Math.max(0, newState.playerStats.hp - enemyDamage);
          newState.combatLog.push(`${newState.currentEnemy.name} deals ${enemyDamage} damage!`);
          
          // Reduce equipment durability
          if (newState.inventory.currentWeapon && newState.inventory.currentWeapon.durability > 0) {
            newState.inventory.currentWeapon.durability = Math.max(0, newState.inventory.currentWeapon.durability - 1);
          }
          if (newState.inventory.currentArmor && newState.inventory.currentArmor.durability > 0) {
            newState.inventory.currentArmor.durability = Math.max(0, newState.inventory.currentArmor.durability - 1);
          }
        }
        
        newState.statistics = {
          ...newState.statistics,
          totalQuestionsAnswered: newState.statistics.totalQuestionsAnswered + 1,
          totalDamageTaken: newState.statistics.totalDamageTaken + enemyDamage
        };
        
        // Update category accuracy
        if (category) {
          if (!newState.statistics.accuracyByCategory[category]) {
            newState.statistics.accuracyByCategory[category] = { correct: 0, total: 0 };
          }
          newState.statistics.accuracyByCategory[category].total++;
        }
      }
      
      // Check if enemy is defeated
      if (newState.currentEnemy.hp <= 0) {
        const coinReward = Math.floor((50 + newState.zone * 10) * newState.knowledgeStreak.multiplier);
        const gemReward = Math.random() < 0.1 ? 1 : 0;
        const expReward = 10 + newState.zone * 2;
        
        newState.coins += coinReward;
        newState.gems += gemReward;
        newState.progression.experience += expReward;
        
        // Check for level up
        if (newState.progression.experience >= newState.progression.experienceToNext) {
          newState.progression.level++;
          newState.progression.experience -= newState.progression.experienceToNext;
          newState.progression.experienceToNext = newState.progression.level * 100;
          newState.progression.skillPoints++;
          newState.combatLog.push(`Level up! You are now level ${newState.progression.level}!`);
        }
        
        newState.zone++;
        newState.inCombat = false;
        newState.currentEnemy = null;
        newState.combatLog.push(`Victory! You earned ${coinReward} coins and ${expReward} experience!`);
        
        if (gemReward > 0) {
          newState.combatLog.push(`You found ${gemReward} gem!`);
        }
        
        // Check for premium status
        if (newState.zone >= 50) {
          newState.isPremium = true;
        }
        
        newState.statistics = {
          ...newState.statistics,
          totalVictories: newState.statistics.totalVictories + 1,
          zonesReached: Math.max(newState.statistics.zonesReached, newState.zone),
          coinsEarned: newState.statistics.coinsEarned + coinReward,
          gemsEarned: newState.statistics.gemsEarned + gemReward
        };
        
        // Reset adventure skills
        newState.adventureSkills = {
          ...newState.adventureSkills,
          selectedSkill: null,
          availableSkills: [],
          showSelectionModal: false
        };
      }
      
      // Check if player is defeated
      if (newState.playerStats.hp <= 0) {
        if (!newState.hasUsedRevival) {
          // Free revival
          newState.playerStats.hp = newState.playerStats.maxHp;
          newState.hasUsedRevival = true;
          newState.combatLog.push('You have been revived! This was your free revival.');
        } else {
          // Game over
          newState.inCombat = false;
          newState.currentEnemy = null;
          newState.combatLog.push('You have been defeated!');
          newState.statistics.totalDeaths++;
          
          // Reset to previous zone
          newState.zone = Math.max(1, newState.zone - 1);
          newState.playerStats.hp = newState.playerStats.maxHp;
          newState.hasUsedRevival = false;
        }
      }
      
      return newState;
    });
  }, [updateGameState]);

  const resetGame = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  }, []);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'survival') => {
    updateGameState(state => ({
      ...state,
      gameMode: {
        ...state.gameMode,
        current: mode,
        survivalLives: mode === 'survival' ? 3 : state.gameMode.survivalLives
      }
    }));
  }, [updateGameState]);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    updateGameState(state => ({
      ...state,
      cheats: {
        ...state.cheats,
        [cheat]: !state.cheats[cheat]
      }
    }));
  }, [updateGameState]);

  const generateCheatItem = useCallback(() => {
    updateGameState(state => {
      if (!state.cheats.obtainAnyItem) return state;
      
      const itemType = Math.random() < 0.5 ? 'weapon' : 'armor';
      const rarity = ['common', 'rare', 'epic', 'legendary', 'mythical'][Math.floor(Math.random() * 5)] as any;
      
      let newItem;
      if (itemType === 'weapon') {
        newItem = generateWeapon(false, rarity);
      } else {
        newItem = generateArmor(false, rarity);
      }
      
      return {
        ...state,
        inventory: {
          ...state.inventory,
          [itemType === 'weapon' ? 'weapons' : 'armor']: [
            ...state.inventory[itemType === 'weapon' ? 'weapons' : 'armor'],
            newItem
          ]
        }
      };
    });
  }, [updateGameState]);

  const mineGem = useCallback((x: number, y: number) => {
    if (!gameState) return null;
    
    const isShiny = Math.random() < 0.05;
    const gemsGained = isShiny ? 0 : 1;
    const shinyGemsGained = isShiny ? 1 : 0;
    
    updateGameState(state => ({
      ...state,
      gems: state.gems + gemsGained,
      shinyGems: state.shinyGems + shinyGemsGained,
      mining: {
        ...state.mining,
        totalGemsMined: state.mining.totalGemsMined + gemsGained,
        totalShinyGemsMined: state.mining.totalShinyGemsMined + shinyGemsGained
      },
      statistics: {
        ...state.statistics,
        gemsEarned: state.statistics.gemsEarned + gemsGained,
        shinyGemsEarned: state.statistics.shinyGemsEarned + shinyGemsGained
      }
    }));
    
    return { gems: gemsGained, shinyGems: shinyGemsGained };
  }, [gameState, updateGameState]);

  const exchangeShinyGems = useCallback((amount: number) => {
    if (!gameState || gameState.shinyGems < amount) return false;
    
    updateGameState(state => ({
      ...state,
      shinyGems: state.shinyGems - amount,
      gems: state.gems + (amount * 10)
    }));
    
    return true;
  }, [gameState, updateGameState]);

  const purchaseRelic = useCallback((relicId: string) => {
    if (!gameState) return false;
    
    updateGameState(state => {
      const relic = state.yojefMarket.items.find(r => r.id === relicId);
      if (!relic || state.gems < relic.cost) return state;
      
      return {
        ...state,
        gems: state.gems - relic.cost,
        inventory: {
          ...state.inventory,
          relics: [...state.inventory.relics, relic]
        },
        yojefMarket: {
          ...state.yojefMarket,
          items: state.yojefMarket.items.filter(r => r.id !== relicId)
        }
      };
    });
    
    return true;
  }, [gameState, updateGameState]);

  const upgradeRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = [...state.inventory.relics, ...state.inventory.equippedRelics].find(r => r.id === relicId);
      if (!relic || state.gems < relic.upgradeCost) return state;
      
      const upgradedRelic = {
        ...relic,
        level: relic.level + 1,
        baseAtk: relic.baseAtk ? relic.baseAtk + 22 : undefined,
        baseDef: relic.baseDef ? relic.baseDef + 15 : undefined,
        upgradeCost: Math.floor(relic.upgradeCost * 1.5)
      };
      
      return {
        ...state,
        gems: state.gems - relic.upgradeCost,
        inventory: {
          ...state.inventory,
          relics: state.inventory.relics.map(r => r.id === relicId ? upgradedRelic : r),
          equippedRelics: state.inventory.equippedRelics.map(r => r.id === relicId ? upgradedRelic : r)
        }
      };
    });
  }, [updateGameState]);

  const equipRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.inventory.relics.find(r => r.id === relicId);
      if (!relic) return state;
      
      return {
        ...state,
        inventory: {
          ...state.inventory,
          relics: state.inventory.relics.filter(r => r.id !== relicId),
          equippedRelics: [...state.inventory.equippedRelics, relic]
        }
      };
    });
  }, [updateGameState]);

  const unequipRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.inventory.equippedRelics.find(r => r.id === relicId);
      if (!relic) return state;
      
      return {
        ...state,
        inventory: {
          ...state.inventory,
          equippedRelics: state.inventory.equippedRelics.filter(r => r.id !== relicId),
          relics: [...state.inventory.relics, relic]
        }
      };
    });
  }, [updateGameState]);

  const sellRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.inventory.relics.find(r => r.id === relicId);
      if (!relic) return state;
      
      const sellValue = Math.floor(relic.cost * 0.7);
      
      return {
        ...state,
        gems: state.gems + sellValue,
        inventory: {
          ...state.inventory,
          relics: state.inventory.relics.filter(r => r.id !== relicId)
        }
      };
    });
  }, [updateGameState]);

  const claimDailyReward = useCallback((): boolean => {
    if (!gameState?.dailyRewards.availableReward) return false;
    
    updateGameState(state => {
      if (!state.dailyRewards.availableReward) return state;
      
      const reward = state.dailyRewards.availableReward;
      
      return {
        ...state,
        coins: state.coins + reward.coins,
        gems: state.gems + reward.gems,
        dailyRewards: {
          ...state.dailyRewards,
          lastClaimDate: new Date(),
          currentStreak: state.dailyRewards.currentStreak + 1,
          maxStreak: Math.max(state.dailyRewards.maxStreak, state.dailyRewards.currentStreak + 1),
          availableReward: null,
          rewardHistory: [...state.dailyRewards.rewardHistory, { ...reward, claimed: true, claimDate: new Date() }]
        }
      };
    });
    
    return true;
  }, [gameState, updateGameState]);

  const upgradeSkill = useCallback((skillId: string) => {
    if (!gameState || gameState.progression.skillPoints < 1) return false;
    
    updateGameState(state => ({
      ...state,
      progression: {
        ...state.progression,
        skillPoints: state.progression.skillPoints - 1,
        unlockedSkills: [...state.progression.unlockedSkills, skillId]
      }
    }));
    
    return true;
  }, [gameState, updateGameState]);

  const prestige = useCallback(() => {
    if (!gameState || gameState.progression.level < 50) return false;
    
    updateGameState(state => {
      const prestigePoints = Math.floor(state.progression.level / 10);
      
      return {
        ...state,
        progression: {
          level: 1,
          experience: 0,
          experienceToNext: 100,
          skillPoints: 0,
          unlockedSkills: [],
          prestigeLevel: state.progression.prestigeLevel + 1,
          prestigePoints: state.progression.prestigePoints + prestigePoints,
          masteryLevels: state.progression.masteryLevels
        },
        playerStats: {
          hp: 100 + (state.progression.prestigeLevel * 10),
          maxHp: 100 + (state.progression.prestigeLevel * 10),
          atk: 20 + (state.progression.prestigeLevel * 5),
          def: 10 + (state.progression.prestigeLevel * 3),
          baseAtk: 20 + (state.progression.prestigeLevel * 5),
          baseDef: 10 + (state.progression.prestigeLevel * 3),
          baseHp: 100 + (state.progression.prestigeLevel * 10)
        },
        zone: 1,
        inventory: {
          weapons: [],
          armor: [],
          relics: [],
          currentWeapon: null,
          currentArmor: null,
          equippedRelics: []
        }
      };
    });
    
    return true;
  }, [gameState, updateGameState]);

  const claimOfflineRewards = useCallback(() => {
    updateGameState(state => ({
      ...state,
      coins: state.coins + state.offlineProgress.offlineCoins,
      gems: state.gems + state.offlineProgress.offlineGems,
      offlineProgress: {
        ...state.offlineProgress,
        offlineCoins: 0,
        offlineGems: 0,
        offlineTime: 0
      }
    }));
  }, [updateGameState]);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(state => {
      const items = type === 'weapon' ? state.inventory.weapons : state.inventory.armor;
      const itemsToSell = items.filter(item => itemIds.includes(item.id));
      const totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
      
      return {
        ...state,
        coins: state.coins + totalValue,
        inventory: {
          ...state.inventory,
          [type === 'weapon' ? 'weapons' : 'armor']: items.filter(item => !itemIds.includes(item.id))
        }
      };
    });
  }, [updateGameState]);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(state => {
      const items = type === 'weapon' ? state.inventory.weapons : state.inventory.armor;
      const itemsToUpgrade = items.filter(item => itemIds.includes(item.id));
      const totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
      
      if (state.gems < totalCost) return state;
      
      return {
        ...state,
        gems: state.gems - totalCost,
        inventory: {
          ...state.inventory,
          [type === 'weapon' ? 'weapons' : 'armor']: items.map(item => {
            if (itemIds.includes(item.id)) {
              return {
                ...item,
                level: item.level + 1,
                [type === 'weapon' ? 'baseAtk' : 'baseDef']: 
                  item[type === 'weapon' ? 'baseAtk' : 'baseDef'] + (type === 'weapon' ? 10 : 5),
                upgradeCost: Math.floor(item.upgradeCost * 1.5),
                durability: item.maxDurability // Restore durability on upgrade
              };
            }
            return item;
          })
        }
      };
    });
  }, [updateGameState]);

  const plantSeed = useCallback(() => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.seedCost) return false;
    
    updateGameState(state => ({
      ...state,
      coins: state.coins - state.gardenOfGrowth.seedCost,
      gardenOfGrowth: {
        ...state.gardenOfGrowth,
        isPlanted: true,
        plantedAt: new Date(),
        lastWatered: new Date(),
        waterHoursRemaining: 24
      }
    }));
    
    return true;
  }, [gameState, updateGameState]);

  const buyWater = useCallback((hours: number) => {
    if (!gameState) return false;
    
    const cost = Math.floor(hours / 24) * gameState.gardenOfGrowth.waterCost;
    if (gameState.coins < cost) return false;
    
    updateGameState(state => ({
      ...state,
      coins: state.coins - cost,
      gardenOfGrowth: {
        ...state.gardenOfGrowth,
        waterHoursRemaining: state.gardenOfGrowth.waterHoursRemaining + hours,
        lastWatered: new Date()
      }
    }));
    
    return true;
  }, [gameState, updateGameState]);

  const updateSettings = useCallback((newSettings: Partial<GameState['settings']>) => {
    updateGameState(state => ({
      ...state,
      settings: { ...state.settings, ...newSettings }
    }));
  }, [updateGameState]);

  const addCoins = useCallback((amount: number) => {
    updateGameState(state => ({
      ...state,
      coins: state.coins + amount
    }));
  }, [updateGameState]);

  const addGems = useCallback((amount: number) => {
    updateGameState(state => ({
      ...state,
      gems: state.gems + amount
    }));
  }, [updateGameState]);

  const teleportToZone = useCallback((zone: number) => {
    updateGameState(state => ({
      ...state,
      zone: Math.max(1, zone)
    }));
  }, [updateGameState]);

  const setExperience = useCallback((xp: number) => {
    updateGameState(state => ({
      ...state,
      progression: {
        ...state.progression,
        experience: Math.max(0, xp)
      }
    }));
  }, [updateGameState]);

  const rollSkill = useCallback(() => {
    if (!gameState || gameState.coins < 100) return false;
    
    updateGameState(state => {
      // Generate random menu skill
      const menuSkills: MenuSkill[] = [
        {
          id: 'coin_vacuum',
          name: 'Coin Vacuum',
          description: 'Get 15 free coins per minute of play time',
          duration: 60,
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          type: 'coin_vacuum'
        },
        {
          id: 'treasurer',
          name: 'Treasurer',
          description: 'Guarantees next chest opened is epic or better',
          duration: 24,
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          type: 'treasurer'
        },
        {
          id: 'xp_surge',
          name: 'XP Surge',
          description: 'Gives 300% XP gains for 24 hours',
          duration: 24,
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          type: 'xp_surge'
        }
      ];
      
      const randomSkill = menuSkills[Math.floor(Math.random() * menuSkills.length)];
      
      return {
        ...state,
        coins: state.coins - 100,
        skills: {
          ...state.skills,
          activeMenuSkill: randomSkill,
          lastRollTime: new Date()
        }
      };
    });
    
    return true;
  }, [gameState, updateGameState]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    updateGameState(state => ({
      ...state,
      adventureSkills: {
        ...state.adventureSkills,
        selectedSkill: skill,
        showSelectionModal: false,
        skillEffects: {
          ...state.adventureSkills.skillEffects,
          [skill.type + 'Active']: true
        }
      }
    }));
  }, [updateGameState]);

  const skipAdventureSkills = useCallback(() => {
    updateGameState(state => ({
      ...state,
      adventureSkills: {
        ...state.adventureSkills,
        showSelectionModal: false,
        availableSkills: []
      }
    }));
  }, [updateGameState]);

  const useSkipCard = useCallback(() => {
    updateGameState(state => ({
      ...state,
      adventureSkills: {
        ...state.adventureSkills,
        skillEffects: {
          ...state.adventureSkills.skillEffects,
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