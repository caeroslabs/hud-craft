import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export type LineLayoutType = 'compact' | 'expanded';

export type AutocompactBufferMode = 'enabled' | 'disabled';
export type ContextValueMode = 'percent' | 'tokens' | 'remaining';
export type BarStyle = 'block' | 'segment' | 'dot' | 'ascii';
export type EmojiMode = 'full' | 'minimal' | 'none' | 'nerd';

export type SegmentName = 'project' | 'usage' | 'identity' | 'tools' | 'environment' | 'agents' | 'todos' | 'cost';

export interface CustomColors {
  contextLow?: string;
  contextMid?: string;
  contextHigh?: string;
  quotaLow?: string;
  quotaMid?: string;
  quotaHigh?: string;
  accent?: string;
  dim?: string;
}

export interface HudConfig {
  lineLayout: LineLayoutType;
  showSeparators: boolean;
  pathLevels: 1 | 2 | 3;
  barStyle: BarStyle;
  barWidth: number;
  emojiMode: EmojiMode;
  elementOrder: SegmentName[];
  colors: CustomColors;
  gitStatus: {
    enabled: boolean;
    showDirty: boolean;
    showAheadBehind: boolean;
    showFileStats: boolean;
  };
  display: {
    showModel: boolean;
    showContextBar: boolean;
    contextValue: ContextValueMode;
    showConfigCounts: boolean;
    showDuration: boolean;
    showSpeed: boolean;
    showTokenBreakdown: boolean;
    showUsage: boolean;
    usageBarEnabled: boolean;
    showTools: boolean;
    showAgents: boolean;
    showTodos: boolean;
    showCost: boolean;
    showThinking: boolean;
    autocompactBuffer: AutocompactBufferMode;
    usageThreshold: number;
    sevenDayThreshold: number;
    environmentThreshold: number;
  };
}

export const DEFAULT_CONFIG: HudConfig = {
  lineLayout: 'expanded',
  showSeparators: false,
  pathLevels: 1,
  barStyle: 'segment',
  barWidth: 6,
  emojiMode: 'full',
  elementOrder: ['project', 'usage', 'identity', 'tools', 'environment'],
  colors: {},
  gitStatus: {
    enabled: true,
    showDirty: true,
    showAheadBehind: false,
    showFileStats: false,
  },
  display: {
    showModel: true,
    showContextBar: true,
    contextValue: 'percent',
    showConfigCounts: true,
    showDuration: true,
    showSpeed: false,
    showTokenBreakdown: true,
    showUsage: true,
    usageBarEnabled: true,
    showTools: true,
    showAgents: true,
    showTodos: true,
    showCost: false,
    showThinking: true,
    autocompactBuffer: 'enabled',
    usageThreshold: 0,
    sevenDayThreshold: 80,
    environmentThreshold: 0,
  },
};

export function getConfigPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude', 'plugins', 'hud-craft', 'config.json');
}

export function getProjectConfigPath(cwd?: string): string | null {
  if (!cwd) return null;
  const projectConfig = path.join(cwd, '.hud-craft.json');
  if (fs.existsSync(projectConfig)) return projectConfig;
  return null;
}

function validatePathLevels(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function validateLineLayout(value: unknown): value is LineLayoutType {
  return value === 'compact' || value === 'expanded';
}

function validateAutocompactBuffer(value: unknown): value is AutocompactBufferMode {
  return value === 'enabled' || value === 'disabled';
}

function validateContextValue(value: unknown): value is ContextValueMode {
  return value === 'percent' || value === 'tokens' || value === 'remaining';
}

function validateBarStyle(value: unknown): value is BarStyle {
  return value === 'block' || value === 'segment' || value === 'dot' || value === 'ascii';
}

function validateEmojiMode(value: unknown): value is EmojiMode {
  return value === 'full' || value === 'minimal' || value === 'none' || value === 'nerd';
}

function validateBarWidth(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_CONFIG.barWidth;
  return Math.max(4, Math.min(20, Math.round(value)));
}

function validateElementOrder(value: unknown): SegmentName[] {
  if (!Array.isArray(value)) return DEFAULT_CONFIG.elementOrder;
  const valid: SegmentName[] = ['project', 'usage', 'identity', 'tools', 'environment', 'agents', 'todos', 'cost'];
  const filtered = value.filter((v): v is SegmentName => valid.includes(v as SegmentName));
  return filtered.length > 0 ? filtered : DEFAULT_CONFIG.elementOrder;
}

function validateColors(value: unknown): CustomColors {
  if (typeof value !== 'object' || value === null) return {};
  const allowed = ['contextLow', 'contextMid', 'contextHigh', 'quotaLow', 'quotaMid', 'quotaHigh', 'accent', 'dim'];
  const result: CustomColors = {};
  for (const key of allowed) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === 'string') {
      (result as Record<string, string>)[key] = v;
    }
  }
  return result;
}

interface LegacyConfig {
  layout?: 'default' | 'separators';
}

function migrateConfig(userConfig: Partial<HudConfig> & LegacyConfig): Partial<HudConfig> {
  const migrated = { ...userConfig } as Partial<HudConfig> & LegacyConfig;

  if ('layout' in userConfig && !('lineLayout' in userConfig)) {
    if (userConfig.layout === 'separators') {
      migrated.lineLayout = 'compact';
      migrated.showSeparators = true;
    } else {
      migrated.lineLayout = 'compact';
      migrated.showSeparators = false;
    }
    delete migrated.layout;
  }

  return migrated;
}

function validateThreshold(value: unknown, max = 100): number {
  if (typeof value !== 'number') return 0;
  return Math.max(0, Math.min(max, value));
}

function mergeConfig(userConfig: Partial<HudConfig>): HudConfig {
  const migrated = migrateConfig(userConfig);

  const lineLayout = validateLineLayout(migrated.lineLayout)
    ? migrated.lineLayout
    : DEFAULT_CONFIG.lineLayout;

  const showSeparators = typeof migrated.showSeparators === 'boolean'
    ? migrated.showSeparators
    : DEFAULT_CONFIG.showSeparators;

  const pathLevels = validatePathLevels(migrated.pathLevels)
    ? migrated.pathLevels
    : DEFAULT_CONFIG.pathLevels;

  const barStyle = validateBarStyle(migrated.barStyle)
    ? migrated.barStyle
    : DEFAULT_CONFIG.barStyle;

  const barWidth = validateBarWidth(migrated.barWidth);

  const emojiMode = validateEmojiMode(migrated.emojiMode)
    ? migrated.emojiMode
    : DEFAULT_CONFIG.emojiMode;

  const elementOrder = validateElementOrder(migrated.elementOrder);

  const colors = validateColors(migrated.colors);

  const gitStatus = {
    enabled: typeof migrated.gitStatus?.enabled === 'boolean'
      ? migrated.gitStatus.enabled
      : DEFAULT_CONFIG.gitStatus.enabled,
    showDirty: typeof migrated.gitStatus?.showDirty === 'boolean'
      ? migrated.gitStatus.showDirty
      : DEFAULT_CONFIG.gitStatus.showDirty,
    showAheadBehind: typeof migrated.gitStatus?.showAheadBehind === 'boolean'
      ? migrated.gitStatus.showAheadBehind
      : DEFAULT_CONFIG.gitStatus.showAheadBehind,
    showFileStats: typeof migrated.gitStatus?.showFileStats === 'boolean'
      ? migrated.gitStatus.showFileStats
      : DEFAULT_CONFIG.gitStatus.showFileStats,
  };

  const display = {
    showModel: typeof migrated.display?.showModel === 'boolean'
      ? migrated.display.showModel
      : DEFAULT_CONFIG.display.showModel,
    showContextBar: typeof migrated.display?.showContextBar === 'boolean'
      ? migrated.display.showContextBar
      : DEFAULT_CONFIG.display.showContextBar,
    contextValue: validateContextValue(migrated.display?.contextValue)
      ? migrated.display.contextValue
      : DEFAULT_CONFIG.display.contextValue,
    showConfigCounts: typeof migrated.display?.showConfigCounts === 'boolean'
      ? migrated.display.showConfigCounts
      : DEFAULT_CONFIG.display.showConfigCounts,
    showDuration: typeof migrated.display?.showDuration === 'boolean'
      ? migrated.display.showDuration
      : DEFAULT_CONFIG.display.showDuration,
    showSpeed: typeof migrated.display?.showSpeed === 'boolean'
      ? migrated.display.showSpeed
      : DEFAULT_CONFIG.display.showSpeed,
    showTokenBreakdown: typeof migrated.display?.showTokenBreakdown === 'boolean'
      ? migrated.display.showTokenBreakdown
      : DEFAULT_CONFIG.display.showTokenBreakdown,
    showUsage: typeof migrated.display?.showUsage === 'boolean'
      ? migrated.display.showUsage
      : DEFAULT_CONFIG.display.showUsage,
    usageBarEnabled: typeof migrated.display?.usageBarEnabled === 'boolean'
      ? migrated.display.usageBarEnabled
      : DEFAULT_CONFIG.display.usageBarEnabled,
    showTools: typeof migrated.display?.showTools === 'boolean'
      ? migrated.display.showTools
      : DEFAULT_CONFIG.display.showTools,
    showAgents: typeof migrated.display?.showAgents === 'boolean'
      ? migrated.display.showAgents
      : DEFAULT_CONFIG.display.showAgents,
    showTodos: typeof migrated.display?.showTodos === 'boolean'
      ? migrated.display.showTodos
      : DEFAULT_CONFIG.display.showTodos,
    showCost: typeof migrated.display?.showCost === 'boolean'
      ? migrated.display.showCost
      : DEFAULT_CONFIG.display.showCost,
    showThinking: typeof migrated.display?.showThinking === 'boolean'
      ? migrated.display.showThinking
      : DEFAULT_CONFIG.display.showThinking,
    autocompactBuffer: validateAutocompactBuffer(migrated.display?.autocompactBuffer)
      ? migrated.display.autocompactBuffer
      : DEFAULT_CONFIG.display.autocompactBuffer,
    usageThreshold: validateThreshold(migrated.display?.usageThreshold, 100),
    sevenDayThreshold: validateThreshold(migrated.display?.sevenDayThreshold, 100),
    environmentThreshold: validateThreshold(migrated.display?.environmentThreshold, 100),
  };

  return { lineLayout, showSeparators, pathLevels, barStyle, barWidth, emojiMode, elementOrder, colors, gitStatus, display };
}

export function parseCliOverrides(): Partial<HudConfig> {
  const overrides: Partial<HudConfig> = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === '--theme' && next) {
      const theme = THEME_PRESETS[next];
      if (theme) Object.assign(overrides, theme);
      i++;
    } else if (arg === '--bar-style' && next) {
      if (validateBarStyle(next)) overrides.barStyle = next;
      i++;
    } else if (arg === '--bar-width' && next) {
      overrides.barWidth = validateBarWidth(parseInt(next, 10));
      i++;
    } else if (arg === '--emoji-mode' && next) {
      if (validateEmojiMode(next)) overrides.emojiMode = next;
      i++;
    } else if (arg === '--layout' && next) {
      if (validateLineLayout(next)) overrides.lineLayout = next;
      i++;
    }
  }
  return overrides;
}

const THEME_PRESETS: Record<string, Partial<HudConfig>> = {
  default:   { barStyle: 'segment', barWidth: 6, emojiMode: 'full' },
  powerline: { barStyle: 'segment', barWidth: 10, emojiMode: 'full' },
  clean:     { barStyle: 'dot', barWidth: 10, emojiMode: 'none' },
  hacker:    { barStyle: 'ascii', barWidth: 8, emojiMode: 'none', lineLayout: 'compact', showSeparators: true },
  minimal:   { barStyle: 'block', barWidth: 6, emojiMode: 'minimal' },
};
export { THEME_PRESETS };

export async function loadConfig(cwd?: string): Promise<HudConfig> {
  let userConfig: Partial<HudConfig> = {};

  // 1. 글로벌 설정 로딩
  const globalPath = getConfigPath();
  try {
    if (fs.existsSync(globalPath)) {
      userConfig = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
    }
  } catch { /* ignore */ }

  // 2. 프로젝트 설정 오버라이드
  const projectPath = getProjectConfigPath(cwd);
  if (projectPath) {
    try {
      const projectConfig = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
      if (projectConfig.gitStatus) {
        userConfig.gitStatus = { ...userConfig.gitStatus, ...projectConfig.gitStatus };
      }
      if (projectConfig.display) {
        userConfig.display = { ...userConfig.display, ...projectConfig.display };
      }
      if (projectConfig.colors) {
        userConfig.colors = { ...userConfig.colors, ...projectConfig.colors };
      }
      userConfig = { ...userConfig, ...projectConfig };
    } catch { /* ignore */ }
  }

  return mergeConfig(userConfig);
}
