const core = require('@actions/core');
const {spawnSync, execSync} = require('child_process');
const fs = require('fs');

function sh(cmd, args, opts = {}) {
  const out = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return { code: out.status ?? 1, out: out.stdout || '', err: out.stderr || '' };
}

function ensureCommit(sha) {
  try { execSync(`git cat-file -e ${sha}^{commit}`, { stdio: 'ignore' }); }
  catch {
    try { execSync(`git fetch --no-tags --depth=1 origin ${sha}`, { stdio: 'ignore' }); } catch {}
  }
}

function gitShow(args) {
  const res = sh('git', ['show', ...args]);
  return res.code === 0 ? res.out : '';
}

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function callGemini(model, prompt) {
  for (let i=0;i<3;i++){
    await sleep(2000);
    let r = sh('gemini', ['--yolo','--model', model, '--prompt', prompt]);
    if (r.code === 0 && r.out.trim()) return r.out;
    r = sh('gemini', ['--yolo','--model', 'gemini-2.0-pro', '--prompt', prompt]);
    if (r.code === 0 && r.out.trim()) return r.out;
  }
  return '';
}

function sanitize(p){ return p.replace(/[\/\\:*?"<>|]/g,'_'); }

function buildExcerpts(diff, content, WB, WA, GAP, MAX_WIN){
  if (!diff || !content) return '';
  const hunks = diff.split('\n').filter(l => l.startsWith('@@ '));
  const windows = [];
  for (const h of hunks) {
    const m = h.match(/\+([0-9]+),?([0-9]*)/);
    if (!m) continue;
    const c = parseInt(m[1],10);
    const d = m[2] ? parseInt(m[2],10) : 1;
    const s = Math.max(1, c - WB);
    const e = c + d - 1 + WA;
    windows.push([s,e]);
  }
  windows.sort((a,b)=>a[0]-b[0]);
  const merged = [];
  for (const w of windows) {
    if (!merged.length) merged.push(w);
    else {
      const prev = merged[merged.length-1];
      const gap = w[0] - prev[1];
      if (gap <= GAP) prev[1] = Math.max(prev[1], w[1]);
      else merged.push(w);
    }
  }
  const lines = content.split('\n');
  let total = 0, out = '';
  for (const [s,e] of merged) {
    const len = e - s + 1;
    if (total + len > MAX_WIN) break;
    const slice = lines.slice(s-1, e).join('\n');
    out += `--- BEGIN EXCERPT [lines ${s}-${e}] ---\n${slice}\n--- END EXCERPT ---\n`;
    total += len;
  }
  return out;
}

(async () => {
  try {
    const batch = JSON.parse(core.getInput('batch_json', { required: true }));
    const model = core.getInput('model', { required: true });

    const MAX_DIFF = parseInt(core.getInput('max_diff_lines'), 10);
    const FULL_FILE = parseInt(core.getInput('full_file_threshold_lines'), 10);
    const WB = parseInt(core.getInput('window_before'), 10);
    const WA = parseInt(core.getInput('window_after'), 10);
    const GAP = parseInt(core.getInput('merge_gap_tolerance'), 10);
    const MAX_WIN = parseInt(core.getInput('max_windowed_lines'), 10);

    const POLICY_FOUND = core.getInput('policy_found') === 'true';
    const POLICY_SCOPE = core.getInput('policy_scope') || '';
    const POLICY_PATH = core.getInput('policy_path') || '';

    const repo = process.env.GITHUB_REPOSITORY || '';

    if (!batch || !Array.isArray(batch.items)) {
      core.warning('batch.items missing or not an array; nothing to do.');
      return;
    }

    fs.mkdirSync('reviews', { recursive: true });

    for (const item of batch.items) {
      const sha = item.sha;
      const filePath = item.path;
      const status = item.status;
      const isBinary = !!item.is_binary;

      fs.mkdirSync(`work/${sha}`, { recursive: true });
      ensureCommit(sha);

      // Prefer API diff; else derive
      let diff = item.patch || '';
      if (!diff && !isBinary) {
        diff = gitShow(['--no-color','--unified=0', `${sha}`, '--', `${filePath}`]);
      }
      if (diff) diff = diff.split('\n').slice(0, MAX_DIFF).join('\n');

      // Post-change content
      let content = '';
      if (!isBinary) {
        content = gitShow([`${sha}:${filePath}`]);
      }

      // Mode
      let mode = 'diff_only';
      let fileLines = 0;
      if (content) {
        fileLines = content.split('\n').length;
        mode = (fileLines <= FULL_FILE) ? 'full' : 'windowed';
      }

      // Excerpts
      let excerpts = '';
      if (mode === 'windowed') {
        excerpts = buildExcerpts(diff, content, WB, WA, GAP, MAX_WIN);
      }

      // Prompt
      let prompt = `You are reviewing exactly ONE file in a PR.

Repository: ${repo}
Commit: ${sha}
File: ${filePath}
Status: ${status}
Context-Mode: ${mode}${fileLines ? ' (file lines: '+fileLines+')' : ''}

STRICT RULES:
- Review ONLY this file at this commit.
- Use ONLY the unified diff below and the provided post-change content (if any).
- If cross-file context is needed, reply: 'Out of scope: requires cross-file context.'
- Be specific with line references and provide actionable, testable suggestions.
`;

      if (POLICY_FOUND && POLICY_PATH && fs.existsSync(POLICY_PATH)) {
        prompt += `\n--- BEGIN REVIEW POLICY (${POLICY_SCOPE}) ---\n${fs.readFileSync(POLICY_PATH,'utf8')}\n--- END REVIEW POLICY ---\n`;
      }

      prompt += `\n--- BEGIN DIFF (file-scoped) ---\n${diff || '(No diff content available for this file.)'}\n--- END DIFF ---\n`;

      if (mode === 'full' && content) {
        prompt += `\n--- BEGIN POST-CHANGE CONTENT (FULL) ---\n${content}\n--- END POST-CHANGE CONTENT ---\n`;
      } else if (mode === 'windowed' && excerpts) {
        prompt += `\n--- BEGIN POST-CHANGE EXCERPTS (WINDOWED) ---\n${excerpts}\n--- END POST-CHANGE EXCERPTS ---\n`;
      } else {
        prompt += `\n(No post-change content included.)\n`;
      }

      // Call Gemini
      const body = await callGemini(model, prompt);

      // Output
      const safe = sanitize(filePath);
      const outDir = `reviews/${sha}`;
      fs.mkdirSync(outDir, { recursive: true });
      const header = `## ${filePath} @ ${sha.slice(0,8)}\n\n**Mode:** ${mode}  |  **Lines:** ${fileLines || 0}\n\n`;
      fs.writeFileSync(`${outDir}/${safe}.md`, header + (body || 'Review failed - no response from AI service.') + `\n\n---\n`, 'utf8');

      core.info(`Reviewed: ${filePath}`);
    }
  } catch (e) {
    core.setFailed(e.message);
  }
})();
