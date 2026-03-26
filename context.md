# hud-craft

## 개요
Claude Code 커스터마이저블 statusline HUD 플러그인 — 바 스타일, 이모지 모드, 디스플레이 옵션을 config.json 하나로 제어

## 상태
- Phase: v1.0.0 (안정적 릴리즈)
- 마지막 작업: 미정 (CHANGELOG 확인 필요)

## Owner
- 구현: Daedalus
- 보조: Iris (UI/UX)

## 기술 스택
- TypeScript → `dist/index.js`
- Node.js (stdin JSON 파싱)
- Claude Code HUD 플러그인 인터페이스

## 포트/URL
- 로컬: 없음 (stdin/stdout 파이프 방식)
- 프로덕션: `~/.claude/plugins/hud-craft/` 설치

## 주요 경로
- 소스: `~/projects/hud-craft/src/`
- 설정: `~/.claude/plugins/hud-craft/config.json`
- 문서: `~/projects/hud-craft/README.md`

## 주요 명령어
- `npm ci` — 의존성 설치
- `npm run build` — TypeScript → dist/ 빌드
- `./install.sh` — 플러그인 설치

## 최근 활동
- 갱신일: 2026-03-26
- 워킹트리 변경: 있음
- Uncommitted 변경:
- ` M README.md`
- ` M commands/configure.md`
- ` M install.sh`
- `?? context.md`
- 최근 커밋:
- d2425ba feat: 12가지 기능 일괄 추가
- 478c03c feat: 커스텀 HUD 포맷을 기본 테마로 포팅
- e8c2a4b feat: configure 커맨드에 테마 시스템 추가
- 5110abe feat: configure 커맨드 전면 재작성 — 모든 설정 옵션 노출
- 00e3de0 fix: 코드 기본값-README-인스톨러 3-way 불일치 수정 + 안전 개선

