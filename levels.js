// levels.js

export const availableLevels = [
    'Dad', // Example: Add your default level here
];

export async function loadLevelData(levelName) {
    try {
        const response = await fetch(`./game_levels/${levelName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const levelData = await response.json();
        return levelData;
    } catch (error) {
        console.error(`Could not load level ${levelName}:`, error);
        return null;
    }
}
