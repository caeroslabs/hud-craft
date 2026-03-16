import type { RenderContext } from '../types.js';
import { renderSessionLine } from './session-line.js';
import { renderToolsLine, renderCompactToolsLine } from './tools-line.js';
import { renderAgentsLine } from './agents-line.js';
import { renderTodosLine } from './todos-line.js';
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
  return dim('─'.repeat(Math.max(length, 20)));
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

  // 라인 1: 프로젝트 (계정 · 모델 · 경로 · git)
  const projectLine = renderProjectLine(ctx);
  if (projectLine) lines.push(projectLine);

  // 라인 2: 사용량 바 · 컨텍스트 (usage BEFORE identity, separated by ·)
  const identityLine = renderIdentityLine(ctx);
  const usageLine = renderUsageLine(ctx);
  if (usageLine && identityLine) {
    lines.push(`${usageLine} ${dim('·')} ${identityLine}`);
  } else if (usageLine) {
    lines.push(usageLine);
  } else if (identityLine) {
    lines.push(identityLine);
  }

  // 라인 3: 도구 (이모지+개수 컴팩트)
  const compactTools = renderCompactToolsLine(ctx);
  if (compactTools) lines.push(compactTools);

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
