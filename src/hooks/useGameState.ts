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
          // Ensure all required properties exist
          const completeState: GameState = {
            ...parsedState,
            achievements: parsedState.achievements || initializeAchievements(),
            playerTags: parsedState.playerTags || initializePlayerTags(),
            settings: parsedState.settings || {
              soundEnabled: true,
              musicEnabled: true,
              notificationsEnabled: true,
              colorblindMode: false,
              language: 'en'
            }
          };
          setGameState(completeState);
        } else {
          // Create new game state
          const newState: GameState = {
            player: {
              level: 1,
              experience: 0,
              experienceToNext: 100,
              health: 100,
              maxHealth: 100,
              attack: 10,
              defense: 5,
              coins: 100,
              gems: 0,
              shinyGems: 0,
              currentZone: 1,
              prestigeLevel: 0,
              prestigePoints: 0,
              skillPoints: 0,
              adventureSkillPoints: 0,
              skipCards: 0
            },
            inventory: {
              weapons: [],
              armor: [],
              relics: []
            },
            equipped: {
              weapon: null,
              armor: null,
              relics: []
            },
            combat: {
              isActive: false,
              enemy: null,
              playerTurn: true,
              combatLog: []
            },
            shop: {
              weapons: [],
              armor: [],
              relics: [],
              lastRefresh: Date.now()
            },
            chest: {
              isOpen: false,
              rewards: []
            },
            gameMode: 'normal',
            cheatMode: false,
            mining: {
              gemsPerClick: 1,
              autoMineLevel: 0,
              lastMineTime: Date.now()
            },
            dailyRewards: {
              lastClaimDate: null,
              currentStreak: 0,
              availableReward: null
            },
            skills: {
              combat: { level: 1, experience: 0 },
              mining: { level: 1, experience: 0 },
              crafting: { level: 1, experience: 0 },
              exploration: { level: 1, experience: 0 }
            },
            adventureSkills: [],
            garden: {
              plots: Array(9).fill(null).map(() => ({
                planted: null,
                plantedAt: null,
                watered: false,
                wateredAt: null
              })),
              water: 10,
              seeds: {
                common: 5,
                rare: 2,
                epic: 1,
                legendary: 0
              }
            },
            statistics: {
              totalPlayTime: 0,
              enemiesDefeated: 0,
              chestsOpened: 0,
              coinsEarned: 0,
              gemsEarned: 0,
              weaponsFound: 0,
              armorFound: 0,
              relicsFound: 0,
              prestigeCount: 0,
              highestZone: 1,
              totalDamageDealt: 0,
              totalDamageTaken: 0,
              skillsUpgraded: 0,
              dailyRewardsClaimed: 0
            },
            achievements: initializeAchievements(),
            playerTags: initializePlayerTags(),
            settings: {
              soundEnabled: true,
              musicEnabled: true,
              notificationsEnabled: true,
              colorblindMode: false,
              language: 'en'
            },
            lastSaveTime: Date.now(),
            offlineTime: 0
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
          const stateToSave = {
            ...gameState,
            lastSaveTime: Date.now()
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
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
      const updatedAchievements = checkAchievements(newState, prevState);
      const updatedTags = checkPlayerTags(newState, prevState);
      
      return {
        ...newState,
        achievements: updatedAchievements,
        playerTags: updatedTags
      };
    });
  }, []);

  const equipWeapon = useCallback((weapon: Weapon) => {
    updateGameState(state => ({
      ...state,
      equipped: { ...state.equipped, weapon },
      inventory: {
        ...state.inventory,
        weapons: state.inventory.weapons.filter(w => w.id !== weapon.id)
      }
    }));
  }, [updateGameState]);

  const equipArmor = useCallback((armor: Armor) => {
    updateGameState(state => ({
      ...state,
      equipped: { ...state.equipped, armor },
      inventory: {
        ...state.inventory,
        armor: state.inventory.armor.filter(a => a.id !== armor.id)
      }
    }));
  }, [updateGameState]);

  const upgradeWeapon = useCallback((weaponId: string) => {
    updateGameState(state => {
      const weapon = state.inventory.weapons.find(w => w.id === weaponId) || 
                   (state.equipped.weapon?.id === weaponId ? state.equipped.weapon : null);
      
      if (!weapon) return state;
      
      const upgradeCost = weapon.level * 50;
      if (state.player.coins < upgradeCost) return state;
      
      const upgradedWeapon = {
        ...weapon,
        level: weapon.level + 1,
        attack: Math.floor(weapon.attack * 1.1),
        value: Math.floor(weapon.value * 1.2)
      };
      
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins - upgradeCost },
        inventory: {
          ...state.inventory,
          weapons: state.inventory.weapons.map(w => 
            w.id === weaponId ? upgradedWeapon : w
          )
        },
        equipped: {
          ...state.equipped,
          weapon: state.equipped.weapon?.id === weaponId ? upgradedWeapon : state.equipped.weapon
        },
        statistics: {
          ...state.statistics,
          skillsUpgraded: state.statistics.skillsUpgraded + 1
        }
      };
    });
  }, [updateGameState]);

  const upgradeArmor = useCallback((armorId: string) => {
    updateGameState(state => {
      const armor = state.inventory.armor.find(a => a.id === armorId) || 
                   (state.equipped.armor?.id === armorId ? state.equipped.armor : null);
      
      if (!armor) return state;
      
      const upgradeCost = armor.level * 50;
      if (state.player.coins < upgradeCost) return state;
      
      const upgradedArmor = {
        ...armor,
        level: armor.level + 1,
        defense: Math.floor(armor.defense * 1.1),
        value: Math.floor(armor.value * 1.2)
      };
      
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins - upgradeCost },
        inventory: {
          ...state.inventory,
          armor: state.inventory.armor.map(a => 
            a.id === armorId ? upgradedArmor : a
          )
        },
        equipped: {
          ...state.equipped,
          armor: state.equipped.armor?.id === armorId ? upgradedArmor : state.equipped.armor
        },
        statistics: {
          ...state.statistics,
          skillsUpgraded: state.statistics.skillsUpgraded + 1
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
        player: { ...state.player, coins: state.player.coins + weapon.value },
        inventory: {
          ...state.inventory,
          weapons: state.inventory.weapons.filter(w => w.id !== weaponId)
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
        player: { ...state.player, coins: state.player.coins + armor.value },
        inventory: {
          ...state.inventory,
          armor: state.inventory.armor.filter(a => a.id !== armorId)
        }
      };
    });
  }, [updateGameState]);

  const openChest = useCallback((chestType: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical') => {
    updateGameState(state => {
      const costs = { common: 100, rare: 500, epic: 2000, legendary: 10000, mythical: 50000 };
      const cost = costs[chestType];
      
      if (state.player.coins < cost) return state;
      
      const rarityWeights = getChestRarityWeights(chestType);
      const rewards: ChestReward[] = [];
      
      // Generate 3-5 items
      const itemCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < itemCount; i++) {
        const rand = Math.random();
        let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
        
        if (rand < rarityWeights.mythical) rarity = 'mythical';
        else if (rand < rarityWeights.legendary) rarity = 'legendary';
        else if (rand < rarityWeights.epic) rarity = 'epic';
        else if (rand < rarityWeights.rare) rarity = 'rare';
        
        const itemType = Math.random() < 0.5 ? 'weapon' : 'armor';
        
        if (itemType === 'weapon') {
          const weapon = generateWeapon(state.player.level, rarity);
          rewards.push({ type: 'weapon', item: weapon });
        } else {
          const armor = generateArmor(state.player.level, rarity);
          rewards.push({ type: 'armor', item: armor });
        }
      }
      
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins - cost },
        chest: { isOpen: true, rewards },
        statistics: {
          ...state.statistics,
          chestsOpened: state.statistics.chestsOpened + 1
        }
      };
    });
  }, [updateGameState]);

  const discardItem = useCallback((rewardIndex: number) => {
    updateGameState(state => {
      if (!state.chest.isOpen || !state.chest.rewards[rewardIndex]) return state;
      
      const newRewards = state.chest.rewards.filter((_, index) => index !== rewardIndex);
      
      return {
        ...state,
        chest: {
          ...state.chest,
          rewards: newRewards,
          isOpen: newRewards.length > 0
        }
      };
    });
  }, [updateGameState]);

  const purchaseMythical = useCallback(() => {
    updateGameState(state => {
      if (state.player.gems < 100) return state;
      
      const itemType = Math.random() < 0.5 ? 'weapon' : 'armor';
      let newItem;
      
      if (itemType === 'weapon') {
        newItem = generateWeapon(state.player.level, 'mythical');
      } else {
        newItem = generateArmor(state.player.level, 'mythical');
      }
      
      return {
        ...state,
        player: { ...state.player, gems: state.player.gems - 100 },
        inventory: {
          ...state.inventory,
          [itemType === 'weapon' ? 'weapons' : 'armor']: [
            ...state.inventory[itemType === 'weapon' ? 'weapons' : 'armor'],
            newItem
          ]
        },
        statistics: {
          ...state.statistics,
          [itemType === 'weapon' ? 'weaponsFound' : 'armorFound']: 
            state.statistics[itemType === 'weapon' ? 'weaponsFound' : 'armorFound'] + 1
        }
      };
    });
  }, [updateGameState]);

  const startCombat = useCallback(() => {
    updateGameState(state => {
      const enemy = generateEnemy(state.player.currentZone);
      return {
        ...state,
        combat: {
          isActive: true,
          enemy,
          playerTurn: true,
          combatLog: [`You encounter a ${enemy.name}!`]
        }
      };
    });
  }, [updateGameState]);

  const attack = useCallback(() => {
    updateGameState(state => {
      if (!state.combat.isActive || !state.combat.enemy || !state.combat.playerTurn) return state;
      
      const playerAttack = state.player.attack + (state.equipped.weapon?.attack || 0);
      const playerDefense = state.player.defense + (state.equipped.armor?.defense || 0);
      
      // Player attacks
      const damage = Math.max(1, playerAttack - state.combat.enemy.defense);
      const newEnemyHealth = state.combat.enemy.health - damage;
      
      let newState = {
        ...state,
        combat: {
          ...state.combat,
          enemy: { ...state.combat.enemy, health: newEnemyHealth },
          combatLog: [...state.combat.combatLog, `You deal ${damage} damage!`],
          playerTurn: false
        },
        statistics: {
          ...state.statistics,
          totalDamageDealt: state.statistics.totalDamageDealt + damage
        }
      };
      
      // Check if enemy is defeated
      if (newEnemyHealth <= 0) {
        const expGain = state.combat.enemy.expReward;
        const coinGain = state.combat.enemy.coinReward;
        const gemGain = Math.random() < 0.1 ? 1 : 0;
        
        const newExp = state.player.experience + expGain;
        let newLevel = state.player.level;
        let newExpToNext = state.player.experienceToNext;
        let skillPoints = state.player.skillPoints;
        
        // Level up check
        if (newExp >= state.player.experienceToNext) {
          newLevel++;
          newExpToNext = newLevel * 100;
          skillPoints++;
        }
        
        newState = {
          ...newState,
          player: {
            ...newState.player,
            experience: newExp,
            level: newLevel,
            experienceToNext: newExpToNext,
            coins: newState.player.coins + coinGain,
            gems: newState.player.gems + gemGain,
            skillPoints
          },
          combat: {
            isActive: false,
            enemy: null,
            playerTurn: true,
            combatLog: [
              ...newState.combat.combatLog,
              `${state.combat.enemy.name} is defeated!`,
              `You gain ${expGain} experience and ${coinGain} coins!`
            ]
          },
          statistics: {
            ...newState.statistics,
            enemiesDefeated: newState.statistics.enemiesDefeated + 1,
            coinsEarned: newState.statistics.coinsEarned + coinGain,
            gemsEarned: newState.statistics.gemsEarned + gemGain
          }
        };
        
        if (gemGain > 0) {
          newState.combat.combatLog.push(`You found ${gemGain} gem!`);
        }
        
        return newState;
      }
      
      // Enemy attacks
      setTimeout(() => {
        updateGameState(prevState => {
          if (!prevState.combat.isActive || prevState.combat.playerTurn) return prevState;
          
          const enemyDamage = Math.max(1, prevState.combat.enemy!.attack - playerDefense);
          const newPlayerHealth = prevState.player.health - enemyDamage;
          
          let updatedState = {
            ...prevState,
            player: { ...prevState.player, health: Math.max(0, newPlayerHealth) },
            combat: {
              ...prevState.combat,
              combatLog: [...prevState.combat.combatLog, `${prevState.combat.enemy!.name} deals ${enemyDamage} damage!`],
              playerTurn: true
            },
            statistics: {
              ...prevState.statistics,
              totalDamageTaken: prevState.statistics.totalDamageTaken + enemyDamage
            }
          };
          
          // Check if player is defeated
          if (newPlayerHealth <= 0) {
            updatedState = {
              ...updatedState,
              player: { ...updatedState.player, health: updatedState.player.maxHealth },
              combat: {
                isActive: false,
                enemy: null,
                playerTurn: true,
                combatLog: [...updatedState.combat.combatLog, 'You have been defeated!']
              }
            };
          }
          
          return updatedState;
        });
      }, 1000);
      
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

  const setGameMode = useCallback((mode: 'normal' | 'hardcore' | 'creative') => {
    updateGameState(state => ({ ...state, gameMode: mode }));
  }, [updateGameState]);

  const toggleCheat = useCallback(() => {
    updateGameState(state => ({ ...state, cheatMode: !state.cheatMode }));
  }, [updateGameState]);

  const generateCheatItem = useCallback((type: 'weapon' | 'armor', rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical') => {
    updateGameState(state => {
      if (!state.cheatMode) return state;
      
      let newItem;
      if (type === 'weapon') {
        newItem = generateWeapon(state.player.level, rarity);
      } else {
        newItem = generateArmor(state.player.level, rarity);
      }
      
      return {
        ...state,
        inventory: {
          ...state.inventory,
          [type === 'weapon' ? 'weapons' : 'armor']: [
            ...state.inventory[type === 'weapon' ? 'weapons' : 'armor'],
            newItem
          ]
        }
      };
    });
  }, [updateGameState]);

  const mineGem = useCallback(() => {
    updateGameState(state => {
      const gemsGained = state.mining.gemsPerClick;
      const expGained = 1;
      
      return {
        ...state,
        player: { ...state.player, gems: state.player.gems + gemsGained },
        skills: {
          ...state.skills,
          mining: {
            ...state.skills.mining,
            experience: state.skills.mining.experience + expGained
          }
        },
        mining: { ...state.mining, lastMineTime: Date.now() },
        statistics: {
          ...state.statistics,
          gemsEarned: state.statistics.gemsEarned + gemsGained
        }
      };
    });
  }, [updateGameState]);

  const exchangeShinyGems = useCallback((amount: number) => {
    updateGameState(state => {
      if (state.player.gems < amount * 100) return state;
      
      return {
        ...state,
        player: {
          ...state.player,
          gems: state.player.gems - (amount * 100),
          shinyGems: state.player.shinyGems + amount
        }
      };
    });
  }, [updateGameState]);

  const purchaseRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.shop.relics.find(r => r.id === relicId);
      if (!relic || state.player.shinyGems < relic.cost) return state;
      
      return {
        ...state,
        player: { ...state.player, shinyGems: state.player.shinyGems - relic.cost },
        inventory: {
          ...state.inventory,
          relics: [...state.inventory.relics, relic]
        },
        shop: {
          ...state.shop,
          relics: state.shop.relics.filter(r => r.id !== relicId)
        },
        statistics: {
          ...state.statistics,
          relicsFound: state.statistics.relicsFound + 1
        }
      };
    });
  }, [updateGameState]);

  const upgradeRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.inventory.relics.find(r => r.id === relicId) ||
                   state.equipped.relics.find(r => r.id === relicId);
      
      if (!relic) return state;
      
      const upgradeCost = relic.level * 10;
      if (state.player.shinyGems < upgradeCost) return state;
      
      const upgradedRelic = {
        ...relic,
        level: relic.level + 1,
        effect: { ...relic.effect, value: relic.effect.value * 1.1 }
      };
      
      return {
        ...state,
        player: { ...state.player, shinyGems: state.player.shinyGems - upgradeCost },
        inventory: {
          ...state.inventory,
          relics: state.inventory.relics.map(r => 
            r.id === relicId ? upgradedRelic : r
          )
        },
        equipped: {
          ...state.equipped,
          relics: state.equipped.relics.map(r => 
            r.id === relicId ? upgradedRelic : r
          )
        }
      };
    });
  }, [updateGameState]);

  const equipRelic = useCallback((relic: RelicItem) => {
    updateGameState(state => {
      if (state.equipped.relics.length >= 3) return state;
      
      return {
        ...state,
        equipped: {
          ...state.equipped,
          relics: [...state.equipped.relics, relic]
        },
        inventory: {
          ...state.inventory,
          relics: state.inventory.relics.filter(r => r.id !== relic.id)
        }
      };
    });
  }, [updateGameState]);

  const unequipRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.equipped.relics.find(r => r.id === relicId);
      if (!relic) return state;
      
      return {
        ...state,
        equipped: {
          ...state.equipped,
          relics: state.equipped.relics.filter(r => r.id !== relicId)
        },
        inventory: {
          ...state.inventory,
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
        player: { ...state.player, shinyGems: state.player.shinyGems + sellValue },
        inventory: {
          ...state.inventory,
          relics: state.inventory.relics.filter(r => r.id !== relicId)
        }
      };
    });
  }, [updateGameState]);

  const claimDailyReward: () => boolean = useCallback(() => {
    if (!gameState?.dailyRewards.availableReward) return false;
    
    updateGameState(state => {
      if (!state.dailyRewards.availableReward) return state;
      
      const reward = state.dailyRewards.availableReward;
      let newState = { ...state };
      
      switch (reward.type) {
        case 'coins':
          newState.player.coins += reward.amount;
          break;
        case 'gems':
          newState.player.gems += reward.amount;
          break;
        case 'shinyGems':
          newState.player.shinyGems += reward.amount;
          break;
        case 'experience':
          newState.player.experience += reward.amount;
          break;
      }
      
      return {
        ...newState,
        dailyRewards: {
          lastClaimDate: new Date().toDateString(),
          currentStreak: state.dailyRewards.currentStreak + 1,
          availableReward: null
        },
        statistics: {
          ...newState.statistics,
          dailyRewardsClaimed: newState.statistics.dailyRewardsClaimed + 1
        }
      };
    });
    
    return true;
  }, [gameState, updateGameState]);

  const upgradeSkill = useCallback((skillType: 'combat' | 'mining' | 'crafting' | 'exploration') => {
    updateGameState(state => {
      if (state.player.skillPoints < 1) return state;
      
      return {
        ...state,
        player: { ...state.player, skillPoints: state.player.skillPoints - 1 },
        skills: {
          ...state.skills,
          [skillType]: {
            ...state.skills[skillType],
            level: state.skills[skillType].level + 1
          }
        },
        statistics: {
          ...state.statistics,
          skillsUpgraded: state.statistics.skillsUpgraded + 1
        }
      };
    });
  }, [updateGameState]);

  const prestige = useCallback(() => {
    updateGameState(state => {
      if (state.player.level < 50) return state;
      
      const prestigePoints = Math.floor(state.player.level / 10);
      
      return {
        ...state,
        player: {
          ...state.player,
          level: 1,
          experience: 0,
          experienceToNext: 100,
          health: 100,
          maxHealth: 100,
          attack: 10 + (state.player.prestigeLevel * 2),
          defense: 5 + state.player.prestigeLevel,
          currentZone: 1,
          prestigeLevel: state.player.prestigeLevel + 1,
          prestigePoints: state.player.prestigePoints + prestigePoints,
          skillPoints: 0
        },
        inventory: { weapons: [], armor: [], relics: [] },
        equipped: { weapon: null, armor: null, relics: [] },
        skills: {
          combat: { level: 1, experience: 0 },
          mining: { level: 1, experience: 0 },
          crafting: { level: 1, experience: 0 },
          exploration: { level: 1, experience: 0 }
        },
        statistics: {
          ...state.statistics,
          prestigeCount: state.statistics.prestigeCount + 1
        }
      };
    });
  }, [updateGameState]);

  const claimOfflineRewards = useCallback((rewards: { coins: number; gems: number; experience: number }) => {
    updateGameState(state => ({
      ...state,
      player: {
        ...state.player,
        coins: state.player.coins + rewards.coins,
        gems: state.player.gems + rewards.gems,
        experience: state.player.experience + rewards.experience
      },
      offlineTime: 0
    }));
  }, [updateGameState]);

  const bulkSell = useCallback((items: { type: 'weapon' | 'armor'; ids: string[] }) => {
    updateGameState(state => {
      let totalValue = 0;
      const itemsToSell = items.type === 'weapon' 
        ? state.inventory.weapons.filter(w => items.ids.includes(w.id))
        : state.inventory.armor.filter(a => items.ids.includes(a.id));
      
      totalValue = itemsToSell.reduce((sum, item) => sum + item.value, 0);
      
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins + totalValue },
        inventory: {
          ...state.inventory,
          [items.type === 'weapon' ? 'weapons' : 'armor']: 
            state.inventory[items.type === 'weapon' ? 'weapons' : 'armor']
              .filter(item => !items.ids.includes(item.id))
        }
      };
    });
  }, [updateGameState]);

  const bulkUpgrade = useCallback((items: { type: 'weapon' | 'armor'; ids: string[] }) => {
    updateGameState(state => {
      let totalCost = 0;
      const itemsToUpgrade = items.type === 'weapon'
        ? state.inventory.weapons.filter(w => items.ids.includes(w.id))
        : state.inventory.armor.filter(a => items.ids.includes(a.id));
      
      totalCost = itemsToUpgrade.reduce((sum, item) => sum + (item.level * 50), 0);
      
      if (state.player.coins < totalCost) return state;
      
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins - totalCost },
        inventory: {
          ...state.inventory,
          [items.type === 'weapon' ? 'weapons' : 'armor']:
            state.inventory[items.type === 'weapon' ? 'weapons' : 'armor'].map(item => {
              if (items.ids.includes(item.id)) {
                return {
                  ...item,
                  level: item.level + 1,
                  [items.type === 'weapon' ? 'attack' : 'defense']: 
                    Math.floor(item[items.type === 'weapon' ? 'attack' : 'defense'] * 1.1),
                  value: Math.floor(item.value * 1.2)
                };
              }
              return item;
            })
        }
      };
    });
  }, [updateGameState]);

  const plantSeed = useCallback((plotIndex: number, seedType: 'common' | 'rare' | 'epic' | 'legendary') => {
    updateGameState(state => {
      if (state.garden.seeds[seedType] < 1 || state.garden.plots[plotIndex].planted) return state;
      
      return {
        ...state,
        garden: {
          ...state.garden,
          seeds: {
            ...state.garden.seeds,
            [seedType]: state.garden.seeds[seedType] - 1
          },
          plots: state.garden.plots.map((plot, index) => 
            index === plotIndex 
              ? { ...plot, planted: seedType, plantedAt: Date.now() }
              : plot
          )
        }
      };
    });
  }, [updateGameState]);

  const buyWater = useCallback((amount: number) => {
    updateGameState(state => {
      const cost = amount * 10;
      if (state.player.coins < cost) return state;
      
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins - cost },
        garden: { ...state.garden, water: state.garden.water + amount }
      };
    });
  }, [updateGameState]);

  const updateSettings = useCallback((newSettings: Partial<GameState['settings']>) => {
    updateGameState(state => ({
      ...state,
      settings: { ...state.settings, ...newSettings }
    }));
  }, [updateGameState]);

  const addCoins = useCallback((amount: number) => {
    updateGameState(state => ({
      ...state,
      player: { ...state.player, coins: state.player.coins + amount }
    }));
  }, [updateGameState]);

  const addGems = useCallback((amount: number) => {
    updateGameState(state => ({
      ...state,
      player: { ...state.player, gems: state.player.gems + amount }
    }));
  }, [updateGameState]);

  const teleportToZone = useCallback((zone: number) => {
    updateGameState(state => ({
      ...state,
      player: { ...state.player, currentZone: zone }
    }));
  }, [updateGameState]);

  const setExperience = useCallback((experience: number) => {
    updateGameState(state => ({
      ...state,
      player: { ...state.player, experience }
    }));
  }, [updateGameState]);

  const rollSkill = useCallback(() => {
    updateGameState(state => {
      if (state.player.adventureSkillPoints < 1) return state;
      
      const availableSkills: AdventureSkill[] = [
        { id: 'damage_boost', name: 'Damage Boost', description: '+10% Attack', effect: { type: 'attack', value: 0.1 } },
        { id: 'defense_boost', name: 'Defense Boost', description: '+10% Defense', effect: { type: 'defense', value: 0.1 } },
        { id: 'health_boost', name: 'Health Boost', description: '+20% Max Health', effect: { type: 'health', value: 0.2 } },
        { id: 'coin_boost', name: 'Coin Boost', description: '+25% Coin Gain', effect: { type: 'coins', value: 0.25 } },
        { id: 'exp_boost', name: 'Experience Boost', description: '+15% EXP Gain', effect: { type: 'experience', value: 0.15 } }
      ];
      
      const randomSkills = availableSkills
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      return {
        ...state,
        player: { ...state.player, adventureSkillPoints: state.player.adventureSkillPoints - 1 },
        adventureSkills: randomSkills
      };
    });
  }, [updateGameState]);

  const selectAdventureSkill = useCallback((skillId: string) => {
    updateGameState(state => {
      const skill = state.adventureSkills.find(s => s.id === skillId);
      if (!skill) return state;
      
      let newState = { ...state };
      
      // Apply skill effect
      switch (skill.effect.type) {
        case 'attack':
          newState.player.attack = Math.floor(newState.player.attack * (1 + skill.effect.value));
          break;
        case 'defense':
          newState.player.defense = Math.floor(newState.player.defense * (1 + skill.effect.value));
          break;
        case 'health':
          newState.player.maxHealth = Math.floor(newState.player.maxHealth * (1 + skill.effect.value));
          newState.player.health = newState.player.maxHealth;
          break;
      }
      
      return {
        ...newState,
        adventureSkills: []
      };
    });
  }, [updateGameState]);

  const skipAdventureSkills = useCallback(() => {
    updateGameState(state => ({
      ...state,
      adventureSkills: []
    }));
  }, [updateGameState]);

  const useSkipCard = useCallback(() => {
    updateGameState(state => {
      if (state.player.skipCards < 1) return state;
      
      return {
        ...state,
        player: { ...state.player, skipCards: state.player.skipCards - 1 },
        adventureSkills: []
      };
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

export default useGameState;