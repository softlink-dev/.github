const core = require('@actions/core');
const {spawnSync, execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

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

function loadPromptTemplate() {
  const templatePath = path.join(__dirname, 'prompt-template.md');
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }
  
  // Enhanced fallback template with lessons from sequential system
  return `# AI Code Review Prompt Template

You are a code reviewer analyzing a SINGLE file from a pull request.

## CRITICAL SCOPE LIMITATION
- You are reviewing ONLY the file: \`{{FILE_PATH}}\`
- You can ONLY see the diff and file content provided below
- You CANNOT browse the repository, access other files, or see the broader codebase
- You CANNOT make assumptions about other files or project structure
- You CANNOT list files, explore directories, or navigate the codebase
- You CANNOT say "I will continue listing files" or similar phrases
- You CANNOT use phrases like "I'll look for", "I'll examine", "I'll check", "I'll explore"
- You CANNOT mention other files, directories, or project structure
- You MUST focus ONLY on the provided file content and diff
- You CANNOT access any GitHub URLs or browse the repository
- You CANNOT see project structure, solution files, or any other files

## File Details
- Path: \`{{FILE_PATH}}\`
- Commit: \`{{COMMIT_SHA}}\`
- Status: \`{{STATUS}}\`
- Mode: \`{{MODE}}\` (file lines: \`{{FILE_LINES}}\`)

## REVIEW INSTRUCTIONS
1. Analyze ONLY the provided diff and file content
2. Do NOT mention other files, directories, or project structure
3. Do NOT try to browse or access files outside this scope
4. Do NOT attempt to list files or explore the repository
5. Do NOT use phrases like "I'll look for", "I'll examine", "I'll check", "I'll explore"
6. If you need context from other files, respond with: "REQUIRES CROSS-FILE CONTEXT"
7. Focus on the specific code changes and their impact
8. Start your review immediately without any exploratory language

## Review Focus Areas
- Code quality and readability
- Potential bugs or logical errors
- Security vulnerabilities
- Performance issues
- Best practices violations
- Specific, actionable improvement suggestions

## 💻 C# Coding Standards
* Use \`async/await\` for all I/O-bound operations.
* Wrap database access in \`using\` blocks to ensure proper disposal.
* Avoid try-catch in every method — handle exceptions at boundary layers.
* Use \`readonly\` for fields wherever possible.
* Apply **early returns** to reduce nesting and improve readability.
* Limit method length to **≤ 30 lines**; extract sub-methods where needed.
* Use \`ILogger<T>\` for structured logging — avoid \`Console.WriteLine\`.
* Prefer \`var\` when the type is clear; use explicit types for readability otherwise.
* Favor **pattern matching** and **switch expressions** when applicable.

## 🧾 Naming Conventions — C#
* **Projects/Repos:** \`kebab-case\` (e.g., \`logisys-accounts-core\`)
* **Classes & Public Methods:** \`PascalCase\` (e.g., \`CustomerManager\`, \`CalculateInvoiceTotal\`)
* **Private/Local Variables & Methods:** \`camelCase\`
* **Protected/Private Fields:** \`_camelCase\` (e.g., \`_userRepo\`)
* **Constants:** \`UPPER_SNAKE_CASE\` (e.g., \`MAX_RETRY_ATTEMPTS\`)

## 🧠 Naming Conventions — JavaScript / React
* **Components:** \`PascalCase\` (e.g., \`CustomerCard\`)
* **Functions/Variables/State Hooks:** \`camelCase\`
* **CSS/SCSS Classes:** \`kebab-case\` (e.g., \`invoice-header\`)
* **Constants:** \`UPPER_SNAKE_CASE\`
* **File Naming:** Components: \`ComponentName.js\`, Hooks: \`useXyz.js\`, Utils: \`someUtility.js\`

## 🔍 Code Review Heuristics
### 1. Single Responsibility Principle (SRP)
* Flag methods doing multiple things (e.g., validation + DB + formatting).
* Long methods (>30 lines) often indicate SRP violations.

### 2. Method Structure & Length
* Flag methods exceeding 30 lines.
* Recommend logical sub-methods.
* Use early exits where possible.
* Ensure **all statements in a method maintain the same level of abstraction**.

### 3. DRY Principle
* Flag repeated logic blocks.
* Suggest private methods or utilities.
* Identify duplicated code across layers or files.

### 4. Naming Quality
* Flag cryptic or overly verbose names.
* Ensure names reflect intent and follow conventions.
* Avoid undocumented abbreviations.

### 5. Null Safety & Defensive Coding
* Flag missing null checks in shared/public methods.
* Use \`?.\`, \`??\`, and null guards appropriately.

### 6. Magic Values
* Flag hardcoded literals (e.g., \`if (code == 7)\`).
* Move them to constants or enums.

### 7. Exception Handling
* Flag empty \`catch {}\` blocks.
* Recommend logging and meaningful error propagation.

### 8. Code Comments & Readability
* Encourage comments that explain **why**, not **what**.
* Remove commented-out code unless justified and noted.

### 9. Dead Code
* Identify unused variables, methods, or legacy blocks.
* Recommend deletion for cleaner code.

### 10. Testability
* Flag tightly coupled logic that's hard to test.
* Recommend interface-driven design for unit testing.

## 🖥 UI / Front-End Guidelines
* Use **React functional components with hooks**.
* Use \`className\` in JSX (not \`class\`).
* Keep forms **controlled** using state.
* Extract shared logic into **custom hooks**.
* Avoid inline styles unless unavoidable.
* Use **modular CSS**, **SCSS**, or **Tailwind CSS**.
* Separate reusable components into their own files.
* Use semantic HTML and accessibility attributes.
* Write tests using **React Testing Library** and **Jest**.

## 🌐 Localization & Constants
* Do not hardcode labels, errors, or messages.
* Use \`.resx\` files or centralized config/constants.
* Use enums or static constants for logic-related values.

## 🧾 Feedback Format (for Chat or Review Tools)
* Use Markdown sections for clarity:
  * \`## SRP Violation\`
  * \`## Naming Issue\`
  * \`## DRY Violation\`, etc.
* Keep feedback technical, concise, and actionable.
* Quote or reference exact code lines where helpful.

## CRITICAL REMINDER
You are reviewing ONLY \`{{FILE_PATH}}\`. You cannot see any other files. If you cannot provide a meaningful review with only the provided content, say "REQUIRES CROSS-FILE CONTEXT" instead of making assumptions or trying to browse the repository.

---

## DIFF CONTENT
\`\`\`
{{DIFF_CONTENT}}
\`\`\`

---

## FILE CONTENT
{{FILE_CONTENT_SECTION}}

---

## FINAL REMINDER
You are reviewing ONLY \`{{FILE_PATH}}\`. You cannot see any other files or the broader codebase. Do NOT try to list files, explore directories, or navigate the repository. Do NOT use exploratory language. If you need more context, say "REQUIRES CROSS-FILE CONTEXT" instead of making assumptions.

**START YOUR REVIEW NOW - NO EXPLORATORY LANGUAGE ALLOWED**`;
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

    if (!batch || !Array.isArray(batch.items)) {
      core.warning('batch.items missing or not an array; nothing to do.');
      return;
    }

    // Create output directories (LESSON: Flat structure from sequential system)
    fs.mkdirSync('reviews', { recursive: true });
    fs.mkdirSync('.github/review-results', { recursive: true });

    // Load enhanced prompt template (LESSON: Better AI prompts from sequential system)
    const promptTemplate = loadPromptTemplate();
    core.info('📝 Using enhanced prompt template with anti-hallucination instructions');

    // Process each file in the batch (LESSON: Batch processing from batch system)
    let processedCount = 0;
    const totalFiles = batch.items.length;

    core.info(`🚀 Starting batch processing: ${totalFiles} files in batch ${batch.id || 'unknown'}`);

    for (const item of batch.items) {
      const sha = item.sha;
      const filePath = item.path;
      const status = item.status;
      const isBinary = !!item.is_binary;

      // LESSON: Skip review result files (from sequential system)
      if (filePath.includes('.github/review-results/')) {
        core.info(`⏭️ Skipping review result file: ${filePath}`);
        continue;
      }

      core.info(`📄 Processing file ${processedCount + 1}/${totalFiles}: ${filePath} (${status})`);

      ensureCommit(sha);

      // Prefer API diff; else derive (LESSON: From batch system)
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

      // Excerpts (LESSON: Windowed code logic from batch system)
      let excerpts = '';
      if (mode === 'windowed') {
        excerpts = buildExcerpts(diff, content, WB, WA, GAP, MAX_WIN);
      }

      // Build enhanced prompt using template (LESSON: Template system from sequential)
      let prompt = promptTemplate
        .replace(/{{FILE_PATH}}/g, filePath)
        .replace(/{{COMMIT_SHA}}/g, sha)
        .replace(/{{STATUS}}/g, status)
        .replace(/{{MODE}}/g, mode)
        .replace(/{{FILE_LINES}}/g, fileLines.toString());

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

      // LESSON: Save debug prompt (from sequential system)
      const safeFilename = sanitize(filePath);
      const debugPromptPath = `.github/review-results/PROMPT-${safeFilename}.md`;
      fs.writeFileSync(debugPromptPath, prompt, 'utf8');
      core.info(`🔍 Debug prompt saved to: ${debugPromptPath}`);

      // Call Gemini (LESSON: Retry logic from both systems)
      const body = await callGemini(model, prompt);

      // LESSON: Flat output structure (from sequential system)
      const outDir = `reviews`;
      const header = `## ${filePath} @ ${sha.slice(0,8)}\n\n**Mode:** ${mode}  |  **Lines:** ${fileLines || 0}\n\n`;
      fs.writeFileSync(`${outDir}/${safeFilename}.md`, header + (body || 'Review failed - no response from AI service.') + `\n\n---\n`, 'utf8');

      core.info(`✅ Completed: ${filePath}`);
      processedCount++;

      // LESSON: Progress tracking (from sequential system)
      if (processedCount % 5 === 0 || processedCount === totalFiles) {
        core.info(`📊 Progress: ${processedCount}/${totalFiles} files processed`);
      }
    }

    // Create summary JSON (LESSON: From sequential system)
    const summary = {
      total: totalFiles,
      processed: processedCount,
      failed: totalFiles - processedCount,
      batch_id: batch.id || 'unknown',
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('reviews/summary.json', JSON.stringify(summary, null, 2), 'utf8');

    // LESSON: Enhanced logging (from sequential system)
    core.info(`🎉 Batch processing complete: ${processedCount}/${totalFiles} files processed successfully`);
    core.info(`📁 Results saved to: reviews/ directory`);
    core.info(`🔍 Debug prompts saved to: .github/review-results/ directory`);

  } catch (e) {
    core.setFailed(e.message);
  }
})();
