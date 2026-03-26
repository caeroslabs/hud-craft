export interface ConfigCounts {
    claudeMdCount: number;
    rulesCount: number;
    mcpCount: number;
    hooksCount: number;
    mcpNames: string[];
    hookNames: string[];
}
export declare function countConfigs(cwd?: string): Promise<ConfigCounts>;
//# sourceMappingURL=config-reader.d.ts.map