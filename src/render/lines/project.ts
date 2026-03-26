import type { RenderContext } from '../../types.js';
import { getModelName, getProviderLabel } from '../../stdin.js';
import { cyan, yellow, green, dim } from '../colors.js';
import { buildGitParts } from '../utils.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function readAccountLabel(customLabel?: string): string | null {
  if (customLabel) return customLabel;
  try {
    const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    const claudeJson = path.join(configDir, '.claude.json');
    if (!fs.existsSync(claudeJson)) return null;
    const d = JSON.parse(fs.readFileSync(claudeJson, 'utf8'));
    const acc = d.oauthAccount;
    if (!acc) return null;
    const name = acc.displayName || acc.emailAddress?.split('@')[0];
    const org = acc.organizationName && !acc.organizationName.includes('@')
      ? acc.organizationName : null;
    return org ? `${name} (${org})` : name;
  } catch { return null; }
}

export function renderProjectLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  const parts: string[] = [];

  // 1. Account label + plan
  const accountLabel = readAccountLabel((ctx.config as unknown as Record<string, unknown>)?.accountLabel as string);
  const providerLabel = getProviderLabel(ctx.stdin);
  const planName = display?.showUsage !== false ? ctx.usageData?.planName : undefined;
  const planDisplay = providerLabel ?? planName;

  if (accountLabel) {
    const planPart = planDisplay ? ` ${dim('·')} ${dim(planDisplay)}` : '';
    parts.push(`👤 ${dim(accountLabel)}${planPart}`);
  }

  // 2. Model
  if (display?.showModel !== false) {
    const model = getModelName(ctx.stdin);
    parts.push(`🤖 ${cyan(model)}`);
  }

  // 3. Path + git
  if (ctx.stdin.cwd) {
    const segments = ctx.stdin.cwd.split(/[/\\]/).filter(Boolean);
    const pathLevels = ctx.config?.pathLevels ?? 1;
    const projectPath = segments.length > 0 ? segments.slice(-pathLevels).join('/') : '/';

    let gitPart = '';
    const gitConfig = ctx.config?.gitStatus;
    const showGit = gitConfig?.enabled ?? true;

    if (showGit && ctx.gitStatus) {
      const gitParts = buildGitParts(ctx.gitStatus, gitConfig);
      gitPart = `  🌿 ${green(gitParts.join(''))}`;
    }

    parts.push(`📁 ${yellow(projectPath)}${gitPart}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(` · `);
}
