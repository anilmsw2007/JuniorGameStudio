import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Position, Direction, TileType, ThemeType, HeroType } from '../types/index';
import { THEME_DATA, HERO_EMOJIS } from '../data/themes';

interface GameGridProps {
  board: TileType[][];
  heroPos: Position;
  heroDir: Direction;
  theme: ThemeType;
  hero: HeroType;
  visitedPositions?: Position[];
  onTilePress?: (row: number, col: number) => void;
  isInteractive?: boolean;
  showJumpPreview?: boolean;
  isHeroDizzy?: boolean;
}

export const GameGrid: React.FC<GameGridProps> = ({
  board,
  heroPos,
  heroDir,
  theme,
  hero,
  visitedPositions = [],
  onTilePress,
  isInteractive = false,
  showJumpPreview = false,
  isHeroDizzy = false,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const themeConfig = THEME_DATA[theme] || THEME_DATA.jungle;
  const heroEmoji = isHeroDizzy ? '😵‍💫' : (HERO_EMOJIS[hero] || '🐵');

  const rows = board.length;
  const cols = board[0].length;

  const TILE_GAP = 2;
  const CONTAINER_PADDING = 6;
  const BORDER_WIDTH = 3.5;

  const maxAvailableDim = useMemo(() => {
    if (isLandscape) {
      return Math.min(screenHeight - 110, screenWidth * 0.42, 380);
    } else {
      return Math.min(screenWidth - 32, screenHeight * 0.42, 420);
    }
  }, [screenWidth, screenHeight, isLandscape]);

  const tileSize = Math.max(
    28,
    Math.floor((maxAvailableDim - CONTAINER_PADDING * 2 - TILE_GAP * (cols - 1)) / cols)
  );

  const exactContainerWidth = tileSize * cols + TILE_GAP * (cols - 1) + CONTAINER_PADDING * 2;
  const exactContainerHeight = tileSize * rows + TILE_GAP * (rows - 1) + CONTAINER_PADDING * 2;

  const jumpLandingPos = useMemo<Position | null>(() => {
    if (!showJumpPreview) return null;

    let dr = 0;
    let dc = 0;
    if (heroDir === 'UP') dr = -2;
    else if (heroDir === 'DOWN') dr = 2;
    else if (heroDir === 'LEFT') dc = -2;
    else if (heroDir === 'RIGHT') dc = 2;

    const jr = heroPos.row + dr;
    const jc = heroPos.col + dc;

    if (jr >= 0 && jr < rows && jc >= 0 && jc < cols) {
      return { row: jr, col: jc };
    }
    return null;
  }, [heroPos, heroDir, rows, cols, showJumpPreview]);

  const dirArrow = useMemo(() => {
    switch (heroDir) {
      case 'UP': return '⬆️';
      case 'DOWN': return '⬇️';
      case 'LEFT': return '⬅️';
      case 'RIGHT': return '➡️';
    }
  }, [heroDir]);

  const isVisited = (r: number, c: number) => {
    return visitedPositions.some((p) => p.row === r && p.col === c);
  };

  return (
    <View
      style={[
        styles.gridContainer,
        {
          backgroundColor: themeConfig.colors.boardBg,
          borderColor: themeConfig.colors.wallBorder,
          borderWidth: BORDER_WIDTH,
          width: exactContainerWidth,
          height: exactContainerHeight,
          padding: CONTAINER_PADDING,
        },
      ]}
    >
      {board.map((rowArr, r) => (
        <View
          key={`row-${r}`}
          style={[
            styles.gridRow,
            { marginBottom: r < rows - 1 ? TILE_GAP : 0 },
          ]}
        >
          {rowArr.map((tileType, c) => {
            const isHeroHere = heroPos.row === r && heroPos.col === c;
            const isJumpTarget =
              jumpLandingPos &&
              jumpLandingPos.row === r &&
              jumpLandingPos.col === c;
            const hasFootprint =
              !isHeroHere && isVisited(r, c) && tileType === 'EMPTY';

            let tileBg = themeConfig.colors.emptyTileBg;
            let tileBorder = themeConfig.colors.emptyTileBorder;
            let emojiContent = themeConfig.emojis[tileType] || '';

            if (tileType === 'WALL') {
              tileBg = themeConfig.colors.wallBg;
              tileBorder = themeConfig.colors.wallBorder;
            } else if (tileType === 'HAZARD') {
              tileBg = themeConfig.colors.hazardBg;
              tileBorder = themeConfig.colors.hazardBorder;
            } else if (tileType === 'GOAL') {
              tileBg = '#FEF08A';
              tileBorder = '#EAB308';
            }

            return (
              <Pressable
                key={`tile-${r}-${c}`}
                disabled={!isInteractive}
                onPress={() => onTilePress && onTilePress(r, c)}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    width: tileSize,
                    height: tileSize,
                    marginRight: c < cols - 1 ? TILE_GAP : 0,
                    backgroundColor: tileBg,
                    borderColor: isJumpTarget ? '#FFEA00' : tileBorder,
                    borderWidth: isJumpTarget ? 3 : 1.5,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                {/* Jump Landing Preview Ring */}
                {isJumpTarget && (
                  <View style={styles.jumpRingOverlay}>
                    <Text style={styles.jumpRingLabel}>🦘</Text>
                  </View>
                )}

                {/* Footprint Trail */}
                {hasFootprint && (
                  <Text style={styles.footprint}>🐾</Text>
                )}

                {/* Tile Asset Emoji */}
                {!isHeroHere && emojiContent ? (
                  <Text
                    style={[
                      styles.tileEmoji,
                      { fontSize: Math.floor(tileSize * 0.52) },
                    ]}
                  >
                    {emojiContent}
                  </Text>
                ) : null}

                {/* Hero Character & Facing Direction */}
                {isHeroHere && (
                  <View style={styles.heroWrapper}>
                    <Text
                      style={[
                        styles.heroEmoji,
                        { fontSize: Math.floor(tileSize * 0.58) },
                      ]}
                    >
                      {heroEmoji}
                    </Text>
                    {/* Enhanced Directional Facing Badge */}
                    {!isHeroDizzy && (
                      <View style={styles.directionArrowBadge}>
                        <Text style={styles.directionArrowText}>{dirArrow}</Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginVertical: 4,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  tileEmoji: {
    textAlign: 'center',
  },
  heroWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  heroEmoji: {
    textAlign: 'center',
    zIndex: 2,
  },
  directionArrowBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    zIndex: 4,
  },
  directionArrowText: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
  },
  jumpRingOverlay: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(255, 234, 0, 0.45)',
    borderRadius: 10,
    paddingHorizontal: 2,
    zIndex: 1,
  },
  jumpRingLabel: {
    fontSize: 10,
  },
  footprint: {
    position: 'absolute',
    opacity: 0.35,
    fontSize: 13,
  },
});
