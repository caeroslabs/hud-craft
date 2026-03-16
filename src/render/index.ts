import type { RenderContext } from '../types.js';
import { renderSessionLine } from './session-line.js';
import { renderToolsLine, renderCompactToolsLine } from './tools-line.js';
import { renderAgentsLine } from './agents-line.js';
import { renderTodosLine } from './todos-line.js';
import { renderCostLine } from './cost-line.js';
import {
  renderIdentityLine,
  renderProjectLine,
  renderEnvironmentLine,
  renderUsageLine,
} from './lines/index.js';
import { dim, RESET } from './colors.js';

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function visualLength(str: string): number {
  return stripAnsi(str).length;
}

function makeSeparator(length: number): string {
  return dim('\u2500'.repeat(Math.max(length, 20)));
}

function renderSegment(ctx: RenderContext, name: string): string | null {
  switch (name) {
    case 'project': return renderProjectLine(ctx);
    case 'usage': return renderUsageLine(ctx);
    case 'identity': return renderIdentityLine(ctx);
    case 'tools': return renderCompactToolsLine(ctx);
    case 'environment': return renderEnvironmentLine(ctx);
    case 'cost': return ctx.config?.display?.showCost ? renderCostLine(ctx) : null;
    default: return null;
  }
}

function collectActivityLines(ctx: RenderContext): string[] {
  const activityLines: string[] = [];
  const display = ctx.config?.display;

  if (display?.showAgents !== false) {
    const agentsLine = renderAgentsLine(ctx);
    if (agentsLine) {
      activityLines.push(agentsLine);
    }
  }

  if (display?.showTodos !== false) {
    const todosLine = renderTodosLine(ctx);
    if (todosLine) {
      activityLines.push(todosLine);
    }
  }

  return activityLines;
}

function renderCompact(ctx: RenderContext): string[] {
  const lines: string[] = [];

  const sessionLine = renderSessionLine(ctx);
  if (sessionLine) {
    lines.push(sessionLine);
  }

  return lines;
}

function renderExpanded(ctx: RenderContext): string[] {
  const lines: string[] = [];
  const order = ctx.config?.elementOrder ?? ['project', 'usage', 'identity', 'tools', 'environment'];

  // usage와 identity가 연속이면 한 줄로 합침
  const usageIdx = order.indexOf('usage');
  const identityIdx = order.indexOf('identity');
  const mergeUsageIdentity = usageIdx >= 0 && identityIdx >= 0 && identityIdx === usageIdx + 1;

  for (let i = 0; i < order.length; i++) {
    const segment = order[i];

    if (segment === 'usage' && mergeUsageIdentity) {
      // usage와 identity를 한 줄로
      const usageLine = renderUsageLine(ctx);
      const identityLine = renderIdentityLine(ctx);
      if (usageLine && identityLine) {
        lines.push(`${usageLine} ${dim('\u00B7')} ${identityLine}`);
      } else if (usageLine) {
        lines.push(usageLine);
      } else if (identityLine) {
        lines.push(identityLine);
      }
      continue;
    }
    if (segment === 'identity' && mergeUsageIdentity) continue; // 위에서 처리됨

    const line = renderSegment(ctx, segment);
    if (line) lines.push(line);
  }

  // thinking 인디케이터: 첫 번째 라인 끝에 추가
  if (ctx.config?.display?.showThinking && ctx.transcript.thinkingActive && lines.length > 0) {
    lines[0] = `${lines[0]} ${dim('\u{1F4AD}')}`;
  }

  return lines;
}

export function render(ctx: RenderContext): void {
  const lineLayout = ctx.config?.lineLayout ?? 'expanded';
  const showSeparators = ctx.config?.showSeparators ?? false;

  const headerLines = lineLayout === 'expanded'
    ? renderExpanded(ctx)
    : renderCompact(ctx);

  const activityLines = collectActivityLines(ctx);

  const lines: string[] = [...headerLines];

  if (showSeparators && activityLines.length > 0) {
    const maxWidth = Math.max(...headerLines.map(visualLength), 20);
    lines.push(makeSeparator(maxWidth));
  }

  lines.push(...activityLines);

  for (const line of lines) {
    const outputLine = `${RESET}${line.replace(/ /g, '\u00A0')}`;
    console.log(outputLine);
  }
}
