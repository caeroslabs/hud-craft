import type { RenderContext } from '../../types.js';
import { dim, cyan } from '../colors.js';

export function renderEnvironmentLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;

  if (display?.showConfigCounts === false) {
    return null;
  }

  const totalCounts = ctx.claudeMdCount + ctx.rulesCount + ctx.mcpCount + ctx.hooksCount;
  const threshold = display?.environmentThreshold ?? 0;

  if (totalCounts === 0 || totalCounts < threshold) {
    return null;
  }

  const parts: string[] = [];

  if (ctx.mcpCount > 0) {
    const names = ctx.mcpNames ?? [];
    let label: string;
    if (names.length === 0) {
      label = `${ctx.mcpCount} MCPs`;
    } else if (names.length <= 2) {
      label = names.map(n => cyan(n)).join(dim(' · '));
    } else {
      label = `${cyan(names[0])} ${dim(`+${names.length - 1}`)}`;
    }
    parts.push(`🔌 ${label}`);
  }

  if (ctx.hooksCount > 0) {
    const names = ctx.hookNames ?? [];
    let label: string;
    if (names.length === 0) {
      label = `${ctx.hooksCount} hooks`;
    } else if (names.length <= 2) {
      label = names.join(dim(' · '));
    } else {
      label = `${names.length} hooks`;
    }
    parts.push(`🪝 ${dim(label)}`);
  }

  if (ctx.claudeMdCount > 0) {
    parts.push(dim(`📋 ${ctx.claudeMdCount} CLAUDE.md`));
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(` · `);
}
