/**
 * SceneSelect Component - Scene selection overlay
 */

import React from 'react';
import './SceneSelect.css';

export interface Scene {
  id: string;
  name: string;
  description: string;
  difficulty: string;
}

export interface SceneSelectProps {
  scenes: {
    Easy: Scene[];
    Medium: Scene[];
    Hard: Scene[];
    Expert: Scene[];
  };
  onSceneSelect: (sceneId: string) => void;
}

export const SceneSelect: React.FC<SceneSelectProps> = ({ scenes, onSceneSelect }) => {
  return (
    <div className="scene-select-overlay">
      <div className="scene-select-content">
        <h2>🎬 Select a Scene</h2>
        <div className="scenes-container">
          {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map((difficulty) => {
            const difficultyScenes = scenes[difficulty];
            if (difficultyScenes.length === 0) return null;

            return (
              <div key={difficulty} className="difficulty-section">
                <h3>{difficulty}</h3>
                <div className="scene-grid">
                  {difficultyScenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="scene-card"
                      onClick={() => onSceneSelect(scene.id)}
                    >
                      <h4>{scene.name}</h4>
                      <p>{scene.description}</p>
                      <span className={`difficulty difficulty-${scene.difficulty}`}>
                        {scene.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
