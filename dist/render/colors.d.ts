import type { BarStyle, CustomColors } from '../config.js';
export declare const RESET = "\u001B[0m";
export declare function applyCustomColors(colors: CustomColors): void;
export declare const BAR_PRESETS: Record<BarStyle, {
    filled: string;
    empty: string;
}>;
export declare function green(text: string): string;
export declare function yellow(text: string): string;
export declare function red(text: string): string;
export declare function cyan(text: string): string;
export declare function magenta(text: string): string;
export declare function dim(text: string): string;
export declare function getContextColor(percent: number): string;
export declare function getQuotaColor(percent: number): string;
export declare function quotaBar(percent: number, width?: number, style?: BarStyle): string;
export declare function coloredBar(percent: number, width?: number, style?: BarStyle): string;
//# sourceMappingURL=colors.d.ts.map