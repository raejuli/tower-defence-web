/**
 * GameUI - Pure Functional React Component
 * 
 * Entry point for all game UI - no DOM manipulation, pure React!
 */

import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { TowerStats } from '../components/tower/TowerComponent';
import { HUD } from './react/components/HUD';
import { Shop } from './react/components/Shop';
import { SceneSelect } from './react/components/SceneSelect';
import { GameOverOverlay } from './react/components/GameOverOverlay';
import { GameWinOverlay } from './react/components/GameWinOverlay';
import { TowerDetailsPanel } from './react/components/TowerDetailsPanel';
import { EnemyDetailsPanel } from './react/components/EnemyDetailsPanel';
import { Entity } from '@raejuli/core-engine-gdk';


export interface TowerType {
  name: string;
  color: number;
  stats: TowerStats;
}

export interface GameUIState {
  money: number;
  lives: number;
  wave: number;
  score: number;
  isPaused: boolean;
  isPlacementMode: boolean;
  isSceneSelect: boolean;
  isGameOver: boolean;
  isGameWin: boolean;
}

export interface GameUIHandle {
  setState: (state: Partial<GameUIState>) => void;
  setScenes: (scenesByDifficulty: { Easy: any[]; Medium: any[]; Hard: any[]; Expert: any[] }) => void;
  setPlacementMode: (active: boolean) => void;
  setGameOverReady: (ready: boolean) => void;
  setGameWinReady: (ready: boolean) => void;
  showTowerDetails: (tower: Entity, availableUpgrades?: any[]) => void;
  hideTowerDetails: () => void;
  showEnemyDetails: (enemy: Entity) => void;
  hideEnemyDetails: () => void;
}

export interface GameUIProps {
  onTowerPlacementRequested?: (data: { towerType: string; x: number; y: number }) => void;
  onTowerSelected?: (data: { towerType: string; range: number }) => void;
  onPlacementCancelled?: () => void;
  onTowerDeselected?: () => void;
  onSceneSelected?: (sceneId: string) => void;
  onReturnToMenu?: () => void;
  onReady?: () => void;
  onTowerUpgrade?: (tower: Entity, upgradeId: string) => void;
  onTowerSell?: (tower: Entity) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  coordinateTransform?: { scale: number; offsetX: number; offsetY: number };
}

const GameUIComponent = forwardRef<GameUIHandle, GameUIProps>((props, ref) => {
  const {
    onTowerPlacementRequested,
    onTowerSelected,
    onPlacementCancelled,
    onTowerDeselected,
    onSceneSelected,
    onReturnToMenu,
    onReady,
    onTowerUpgrade,
    onTowerSell,
    canvasRef,
    coordinateTransform
  } = props;

  // State
  const [state, setState] = useState<GameUIState>({
    money: 0,
    lives: 0,
    wave: 0,
    score: 0,
    isPaused: false,
    isPlacementMode: false,
    isSceneSelect: false,
    isGameOver: false,
    isGameWin: false
  });

  const [selectedTowerType, setSelectedTowerType] = useState<string | null>(null);
  const [gameOverReady, setGameOverReady] = useState(false);
  const [gameWinReady, setGameWinReady] = useState(false);
  const [scenesByDifficulty, setScenesByDifficulty] = useState<any>({
    Easy: [],
    Medium: [],
    Hard: [],
    Expert: []
  });
  const [towerDetailsEntity, setTowerDetailsEntity] = useState<Entity | null>(null);
  const [towerAvailableUpgrades, setTowerAvailableUpgrades] = useState<any[]>([]);
  const [enemyDetailsEntity, setEnemyDetailsEntity] = useState<Entity | null>(null);

  // Tower types
  const towerTypes = new Map<string, TowerType>([
    ['basic', {
      name: 'Basic Tower',
      color: 0x00ff00,
      stats: {
        damage: 10,
        range: 100,
        fireRate: 1,
        projectileSpeed: 200,
        cost: 50,
        upgradeCost: 75,
        level: 1
      }
    }],
    ['sniper', {
      name: 'Sniper Tower',
      color: 0x0000ff,
      stats: {
        damage: 50,
        range: 200,
        fireRate: 0.5,
        projectileSpeed: 400,
        cost: 150,
        upgradeCost: 200,
        level: 1
      }
    }],
    ['rapid', {
      name: 'Rapid Tower',
      color: 0xffff00,
      stats: {
        damage: 5,
        range: 80,
        fireRate: 3,
        projectileSpeed: 300,
        cost: 100,
        upgradeCost: 150,
        level: 1
      }
    }],
    ['electric', {
      name: 'Electric Tower',
      color: 0x00ffff,
      stats: {
        damage: 15,
        range: 120,
        fireRate: 0.8,
        projectileSpeed: 350,
        cost: 200,
        upgradeCost: 250,
        level: 1
      }
    }],
    ['flamethrower', {
      name: 'Flamethrower Tower',
      color: 0xff6600,
      stats: {
        damage: 30,
        range: 100,
        fireRate: 2,
        projectileSpeed: 0,
        cost: 175,
        upgradeCost: 225,
        level: 1
      }
    }]
  ]);

  // Handlers
  const handleTowerSelect = useCallback((towerType: string) => {
    const towerData = towerTypes.get(towerType);
    if (!towerData || state.money < towerData.stats.cost) {
      return;
    }

    setSelectedTowerType(towerType);
    setState(prev => ({ ...prev, isPlacementMode: true }));
    
    if (onTowerSelected) {
      onTowerSelected({
        towerType,
        range: towerData.stats.range
      });
    }
  }, [state.money, onTowerSelected]);

  const handleCancelPlacement = useCallback(() => {
    setSelectedTowerType(null);
    setState(prev => ({ ...prev, isPlacementMode: false }));
    if (onPlacementCancelled) {
      onPlacementCancelled();
    }
  }, [onPlacementCancelled]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.isPlacementMode || !selectedTowerType || !canvasRef?.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Apply coordinate transformation if provided
    if (coordinateTransform) {
      x = (x - coordinateTransform.offsetX) / coordinateTransform.scale;
      y = (y - coordinateTransform.offsetY) / coordinateTransform.scale;
    }

    if (onTowerPlacementRequested) {
      onTowerPlacementRequested({
        towerType: selectedTowerType,
        x,
        y
      });
    }
  }, [state.isPlacementMode, selectedTowerType, canvasRef, onTowerPlacementRequested, coordinateTransform]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef?.current) return;

    // Forward mouse move events to the canvas so ClickHandlerSystem can track them
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create and dispatch a synthetic mousemove event on the canvas
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: e.clientX,
      clientY: e.clientY,
      bubbles: true,
      cancelable: true
    });
    canvasRef.current.dispatchEvent(mouseMoveEvent);
  }, [canvasRef]);

  const handleTowerDetailsClose = useCallback(() => {
    setTowerDetailsEntity(null);
    setTowerAvailableUpgrades([]);
    if (onTowerDeselected) {
      onTowerDeselected();
    }
  }, [onTowerDeselected]);

  const handleTowerUpgrade = useCallback((upgradeId: string) => {
    if (towerDetailsEntity && onTowerUpgrade) {
      onTowerUpgrade(towerDetailsEntity, upgradeId);
    }
  }, [towerDetailsEntity, onTowerUpgrade]);

  const handleTowerSell = useCallback(() => {
    if (towerDetailsEntity && onTowerSell) {
      onTowerSell(towerDetailsEntity);
      handleTowerDetailsClose();
    }
  }, [towerDetailsEntity, onTowerSell, handleTowerDetailsClose]);

  const handleEnemyDetailsClose = useCallback(() => {
    setEnemyDetailsEntity(null);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelPlacement();
        if (towerDetailsEntity) {
          handleTowerDetailsClose();
        }
        if (enemyDetailsEntity) {
          handleEnemyDetailsClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCancelPlacement, towerDetailsEntity, handleTowerDetailsClose, enemyDetailsEntity, handleEnemyDetailsClose, state.isPlacementMode]);

  // Notify when component is ready
  React.useEffect(() => {
    if (onReady) {
      onReady();
    }
  }, [onReady]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    setState: (newState: Partial<GameUIState>) => {
      setState(prev => ({ ...prev, ...newState }));
    },

    setScenes: (scenes: { Easy: any[]; Medium: any[]; Hard: any[]; Expert: any[] }) => {
      setScenesByDifficulty(scenes);
    },

    setPlacementMode: (active: boolean) => {
      setState(prev => ({ ...prev, isPlacementMode: active }));
      if (!active) {
        setSelectedTowerType(null);
      }
    },

    setGameOverReady: (ready: boolean) => {
      setGameOverReady(ready);
    },

    setGameWinReady: (ready: boolean) => {
      setGameWinReady(ready);
    },

    showTowerDetails: (tower: Entity, availableUpgrades?: any[]) => {
      setTowerDetailsEntity(tower);
      setTowerAvailableUpgrades(availableUpgrades || []);
      setEnemyDetailsEntity(null); // Close enemy details if open
    },

    hideTowerDetails: () => {
      setTowerDetailsEntity(null);
      setTowerAvailableUpgrades([]);
    },

    showEnemyDetails: (enemy: Entity) => {
      setEnemyDetailsEntity(enemy);
      setTowerDetailsEntity(null); // Close tower details if open
    },

    hideEnemyDetails: () => {
      setEnemyDetailsEntity(null);
    }
  }), []);

  return (
    <div className="game-ui-container">
      {/* Canvas click handler overlay */}
      {canvasRef && state.isPlacementMode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'all',
            zIndex: 10
          }}
          onClick={handleCanvasClick as any}
          onMouseMove={handleMouseMove as any}
        />
      )}

      {/* HUD */}
      {!state.isSceneSelect && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '250px', zIndex: 100 }}>
          <HUD
            money={state.money}
            lives={state.lives}
            wave={state.wave}
            score={state.score}
          />
        </div>
      )}

      {/* Shop */}
      {!state.isSceneSelect && !state.isGameOver && !state.isGameWin && (
        <div style={{ position: 'absolute', top: '150px', left: '10px', width: '250px', zIndex: 100 }}>
          <Shop
            towerTypes={towerTypes}
            money={state.money}
            selectedTowerType={selectedTowerType}
            onTowerSelect={handleTowerSelect}
            onCancelPlacement={handleCancelPlacement}
          />
        </div>
      )}

      {/* Scene Select */}
      {state.isSceneSelect && (
        <SceneSelect
          scenes={scenesByDifficulty}
          onSceneSelect={(sceneId) => onSceneSelected?.(sceneId)}
        />
      )}

      {/* Game Over Overlay */}
      {state.isGameOver && (
        <GameOverOverlay
          score={state.score}
          wave={state.wave}
          money={state.money}
          canReturn={gameOverReady}
          onReturn={() => onReturnToMenu?.()}
        />
      )}

      {/* Game Win Overlay */}
      {state.isGameWin && (
        <GameWinOverlay
          score={state.score}
          wave={state.wave}
          lives={state.lives}
          money={state.money}
          canReturn={gameWinReady}
          onReturn={() => onReturnToMenu?.()}
        />
      )}

      {/* Tower Details Panel */}
      {towerDetailsEntity && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '300px' }}>
          <TowerDetailsPanel
            tower={towerDetailsEntity}
            onClose={handleTowerDetailsClose}
            onUpgrade={handleTowerUpgrade}
            onSell={handleTowerSell}
            playerMoney={state.money}
            availableUpgrades={towerAvailableUpgrades}
          />
        </div>
      )}

      {/* Enemy Details Panel */}
      {enemyDetailsEntity && (
        <div style={{ position: 'absolute', top: '10px', left: '270px', width: '300px' }}>
          <EnemyDetailsPanel
            enemy={enemyDetailsEntity}
            onClose={handleEnemyDetailsClose}
          />
        </div>
      )}
    </div>
  );
});

GameUIComponent.displayName = 'GameUI';

export { GameUIComponent };
