import type { RenderContext } from '../types.js';
import { yellow, green, cyan, dim } from './colors.js';

const TOOL_EMOJIS: Record<string, string> = {
  'Edit': '✏️', 'MultiEdit': '✏️', 'Write': '📝',
  'Read': '📖', 'Bash': '⚡', 'Grep': '🔍',
  'Glob': '📂', 'WebFetch': '🌐', 'WebSearch': '🔎',
  'Agent': '🤖', 'TodoWrite': '📋', 'TodoRead': '📋',
  'NotebookEdit': '📓', 'NotebookRead': '📓',
  'ask_codex': '🔵', 'ask_gemini': '💎',
  'wait_for_job': '⏳', 'check_job_status': '🔎',
};

function toolEmoji(name: string): string {
  return TOOL_EMOJIS[name] ?? '🔧';
}

// mcp__plugin_oh-my-claudecode_x__ask_codex → ask_codex
function toolDisplayName(name: string): string {
  if (!name.startsWith('mcp__')) return name;
  const lastDunder = name.lastIndexOf('__');
  if (lastDunder > 4) return name.slice(lastDunder + 2);
  return name;
}

export function renderToolsLine(ctx: RenderContext): string | null {
  const { tools } = ctx.transcript;

  if (tools.length === 0) {
    return null;
  }

  const parts: string[] = [];

  const runningTools = tools.filter((t) => t.status === 'running');
  const completedTools = tools.filter((t) => t.status === 'completed' || t.status === 'error');

  for (const tool of runningTools.slice(-2)) {
    const displayName = toolDisplayName(tool.name);
    const target = tool.target ? truncatePath(tool.target) : '';
    parts.push(`${toolEmoji(displayName)} ${cyan(displayName)}${target ? dim(`: ${target}`) : ''}`);
  }

  const toolCounts = new Map<string, number>();
  for (const tool of completedTools) {
    const displayName = toolDisplayName(tool.name);
    const count = toolCounts.get(displayName) ?? 0;
    toolCounts.set(displayName, count + 1);
  }

  const sortedTools = Array.from(toolCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  for (const [name, count] of sortedTools) {
    parts.push(`${green('✓')} ${toolEmoji(name)} ${name} ${dim(`×${count}`)}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(` · `);
}

export function renderCompactToolsLine(ctx: RenderContext): string | null {
  const { tools } = ctx.transcript;
  if (tools.length === 0) return null;

  const parts: string[] = [];
  const runningTools = tools.filter((t) => t.status === 'running');
  const completedTools = tools.filter((t) => t.status === 'completed' || t.status === 'error');

  // 실행 중: 이모지만 (노란색)
  for (const tool of runningTools.slice(-3)) {
    const displayName = toolDisplayName(tool.name);
    parts.push(yellow(toolEmoji(displayName)));
  }

  // 완료: 도구 이름별 그룹화 후 이모지+개수 표시
  const nameCounts = new Map<string, number>();
  for (const tool of completedTools) {
    const displayName = toolDisplayName(tool.name);
    nameCounts.set(displayName, (nameCounts.get(displayName) ?? 0) + 1);
  }

  const sorted = Array.from(nameCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  for (const [name, count] of sorted) {
    parts.push(`${toolEmoji(name)}${dim('×' + count)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

function truncatePath(p: string, maxLen: number = 20): string {
  const normalizedPath = p.replace(/\\/g, '/');
  if (normalizedPath.length <= maxLen) return normalizedPath;

  const parts = normalizedPath.split('/');
  const filename = parts.pop() || normalizedPath;

  if (filename.length >= maxLen) {
    return filename.slice(0, maxLen - 3) + '...';
  }

  return '.../' + filename;
}
