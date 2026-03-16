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
export declare const DEFAULT_CONFIG: HudConfig;
export declare function getConfigPath(): string;
export declare function getProjectConfigPath(cwd?: string): string | null;
export declare function parseCliOverrides(): Partial<HudConfig>;
declare const THEME_PRESETS: Record<string, Partial<HudConfig>>;
export { THEME_PRESETS };
export declare function loadConfig(cwd?: string): Promise<HudConfig>;
//# sourceMappingURL=config.d.ts.map