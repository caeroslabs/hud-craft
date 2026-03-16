import type { RenderContext, AgentEntry } from '../types.js';
import { yellow, green, red, magenta, cyan, dim } from './colors.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ─── OMC 상태 파일 읽기 ────────────────────────────────────────────

const MAX_STATE_AGE_MS = 2 * 60 * 60 * 1000; // 2시간

function isStale(filePath: string): boolean {
  try {
    return Date.now() - fs.statSync(filePath).mtimeMs > MAX_STATE_AGE_MS;
  } catch { return true; }
}

function omcRoot(cwd: string): string {
  return path.join(cwd, '.omc');
}

// 상태 파일 경로 해결:
// 1. .omc/state/sessions/{id}/filename (최신 세션)
// 2. .omc/state/filename
// 3. .omc/filename (legacy)
// 4. ~/.omc/state/filename (홈 fallback)
function resolveStatePath(cwd: string, filename: string): string | null {
  const root = omcRoot(cwd);
  let best: string | null = null;
  let bestMtime = 0;

  // 세션 스코프
  const sessionsDir = path.join(root, 'state', 'sessions');
  if (fs.existsSync(sessionsDir)) {
    try {
      for (const entry of fs.readdirSync(sessionsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const p = path.join(sessionsDir, entry.name, filename);
        if (fs.existsSync(p)) {
          const mtime = fs.statSync(p).mtimeMs;
          if (mtime > bestMtime) { bestMtime = mtime; best = p; }
        }
      }
    } catch { /* ignore */ }
  }

  // 표준
  const standard = path.join(root, 'state', filename);
  if (fs.existsSync(standard)) {
    try {
      const mtime = fs.statSync(standard).mtimeMs;
      if (mtime > bestMtime) { bestMtime = mtime; best = standard; }
    } catch { if (!best) best = standard; }
  }

  // 레거시
  const legacy = path.join(root, filename);
  if (fs.existsSync(legacy)) {
    try {
      const mtime = fs.statSync(legacy).mtimeMs;
      if (mtime > bestMtime) best = legacy;
    } catch { if (!best) best = legacy; }
  }

  // 홈 fallback
  if (!best) {
    const home = path.join(os.homedir(), '.omc', 'state', filename);
    if (fs.existsSync(home)) best = home;
  }

  return best;
}

function readJsonState(cwd: string, filename: string): Record<string, unknown> | null {
  const p = resolveStatePath(cwd, filename);
  if (!p || isStale(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

// ─── OMC 모드 렌더링 ───────────────────────────────────────────────

function renderRalph(cwd: string): string | null {
  const s = readJsonState(cwd, 'ralph-state.json');
  if (!s?.active) return null;
  const iteration = s.iteration as number;
  const max = (s.max_iterations as number) || 1;
  const ratio = iteration / max;
  const color = ratio >= 0.9 ? red : ratio >= 0.6 ? yellow : green;
  return `ralph:${color(`${iteration}/${max}`)}`;
}

function renderUltrawork(cwd: string): string | null {
  const s = readJsonState(cwd, 'ultrawork-state.json');
  if (!s?.active) return null;
  const count = (s.reinforcement_count as number) ?? 0;
  return cyan(`ulw${count > 0 ? `:${count}` : ''}`);
}

function renderAutopilot(cwd: string): string | null {
  const s = readJsonState(cwd, 'autopilot-state.json');
  if (!s?.active) return null;
  const PHASES: Record<string, number> = { expansion: 1, planning: 2, execution: 3, qa: 4, validation: 5, complete: 5, failed: 0 };
  const NAMES: Record<string, string> = { expansion: 'Expand', planning: 'Plan', execution: 'Build', qa: 'QA', validation: 'Verify', complete: 'Done', failed: 'Failed' };
  const phase = s.phase as string;
  const num = PHASES[phase] ?? 0;
  const name = NAMES[phase] ?? phase;
  const phaseColor = phase === 'complete' ? green : phase === 'failed' ? red : cyan;
  let out = `${cyan('[AP]')} ${phaseColor(`${num}/5`)}:${name}`;
  const execution = s.execution as Record<string, number> | undefined;
  if (phase === 'execution' && execution && execution.tasks_total > 0) {
    out += ` ${dim(`${execution.tasks_completed ?? 0}/${execution.tasks_total}t`)}`;
  }
  return out;
}

// ─── backgroundTasks (hud-state.json) ─────────────────────────────

interface BackgroundTask {
  status: string;
  completedAt?: string;
  agentType?: string;
  description?: string;
}

function readBackgroundTasks(cwd: string): BackgroundTask[] {
  const hudStatePath = path.join(omcRoot(cwd), 'state', 'hud-state.json');
  if (!fs.existsSync(hudStatePath)) return [];
  try {
    const s = JSON.parse(fs.readFileSync(hudStatePath, 'utf8'));
    const tasks: BackgroundTask[] = s?.backgroundTasks ?? [];
    const cutoff = Date.now() - 30 * 60 * 1000;
    return tasks.filter(t => {
      if (t.status === 'running') return true;
      if (t.completedAt) return new Date(t.completedAt).getTime() > cutoff;
      return false;
    });
  } catch { return []; }
}

function renderBackgroundTasks(tasks: BackgroundTask[]): string | null {
  const running = tasks.filter(t => t.status === 'running');
  if (running.length === 0) return null;
  const color = running.length >= 5 ? yellow : running.length >= 4 ? cyan : green;
  const names = running.slice(0, 3).map(t => {
    if (t.agentType) return t.agentType.split(':').pop();
    return (t.description ?? '').slice(0, 8);
  });
  const suffix = running.length > 3 ? `,+${running.length - 3}` : '';
  return `bg:${color(`${running.length}/5`)} ${dim(`[${names.join(',')}${suffix}]`)}`;
}

// ─── nativeAgents (transcript 기반) ───────────────────────────────

function formatAgent(agent: AgentEntry): string {
  const statusIcon = agent.status === 'running' ? yellow('◐') : green('✓');
  const type = magenta(agent.type);
  const desc = agent.description ? dim(`: ${agent.description.slice(0, 35)}${agent.description.length > 35 ? '...' : ''}`) : '';
  const elapsed = formatElapsed(agent);
  return `${statusIcon} ${type}${desc} ${dim(`(${elapsed})`)}`;
}

function formatElapsed(agent: AgentEntry): string {
  const ms = (agent.endTime?.getTime() ?? Date.now()) - agent.startTime.getTime();
  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

// ─── 메인 렌더 ────────────────────────────────────────────────────

export function renderAgentsLine(ctx: RenderContext): string | null {
  const cwd = ctx.stdin?.cwd;
  const parts: string[] = [];

  // 1. OMC 모드 상태
  if (cwd) {
    const ralph = renderRalph(cwd);
    const ultrawork = renderUltrawork(cwd);
    const autopilot = renderAutopilot(cwd);
    if (ralph) parts.push(ralph);
    if (ultrawork) parts.push(ultrawork);
    if (autopilot) parts.push(autopilot);

    // 2. 백그라운드 작업
    const bgLine = renderBackgroundTasks(readBackgroundTasks(cwd));
    if (bgLine) parts.push(bgLine);
  }

  // 3. native Agent 도구 (transcript 기반)
  const { agents } = ctx.transcript;
  const running = agents.filter(a => a.status === 'running');
  const recentDone = agents.filter(a => a.status === 'completed').slice(-2);
  for (const a of [...running, ...recentDone].slice(-3)) {
    parts.push(formatAgent(a));
  }

  if (parts.length === 0) return null;
  return parts.join(' · ');
}
