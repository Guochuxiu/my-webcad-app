import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const knowledgeRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(knowledgeRoot, '..', '..', '..');

const topManifestPath = path.join(knowledgeRoot, 'route-manifest.json');
const sourceManifestPath = path.join(knowledgeRoot, 'source', 'manifest.json');

const comparedRouteSections = ['task_routes', 'topic_routes', 'risk_routes'];
const requiredSectionNames = ['源码用法摘要', '正例', '反例', '审查清单', '最小验证'];
const forbiddenPublishPathPatterns = [
  /[A-Za-z]:[\\/]+workspace[\\/]+/i,
  /\bcadnginx[\\/]src\b/i,
  /\bfscadweb[\\/]src\b/i,
];

const canonicalAliases = [
  { section: 'topic_routes', key: 'cadentity' },
  { section: 'topic_routes', key: 'ses' },
  { section: 'topic_routes', key: 'urdf' },
  { section: 'topic_routes', key: 'inputStack' },
  { section: 'topic_routes', key: 'snapEngine' },
  { section: 'risk_routes', key: 'worker-singleton-and-transfer' },
];

// Keep this list explicit so newly added core pages must be consciously enrolled in
// the structural gate instead of being silently inferred from every legacy route.
const structuredDocs = [
  'knowledge/webcad/source/business/app-view-document-lifecycle.md',
  'knowledge/webcad/source/business/entity-model-and-dirty.md',
  'knowledge/webcad/source/business/rendering-display-lifecycle.md',
  'knowledge/webcad/source/business/pointcloud.md',
  'knowledge/webcad/source/business/command-and-tool-lifecycle.md',
  'knowledge/webcad/source/business/snap-engine.md',
  'knowledge/webcad/source/business/gizmo-usage.md',
  'knowledge/webcad/source/business/model-loaders.md',
  'knowledge/webcad/source/business/resource-and-ses-persistence.md',
  'knowledge/webcad/source/business/kinematics.md',
  'knowledge/webcad/source/business/kinematics-simulation-animation.md',
  'knowledge/webcad/source/business/worker-memory-performance.md',
  'knowledge/webcad/source/business/rendering-scene-material-postprocess.md',
  'knowledge/webcad/source/business/config-theme-assets.md',
  'knowledge/webcad/source/business/instance-external-preview-assembly.md',
  'knowledge/webcad/source/business/math-geometry-occ.md',
  'knowledge/webcad/source/business/animation-simulation-physics.md',
  'knowledge/webcad/source/pitfalls/pointcloud-pick-selection.md',
  'knowledge/webcad/source/pitfalls/pick-selection-input-chain.md',
  'knowledge/webcad/source/pitfalls/inputstack-observer-order.md',
  'knowledge/webcad/source/pitfalls/snap-pick-size-and-singleton.md',
  'knowledge/webcad/source/pitfalls/gizmo-input-and-signal-lifecycle.md',
  'knowledge/webcad/source/pitfalls/worker-singleton-and-transfer.md',
];

// Workflow pages are process contracts rather than business/pitfall fact sheets.
// They stay route-target validated, but their section schema is intentionally waived.
const workflowSectionWaivers = new Map([
  [
    'knowledge/webcad/source/workflows/routing-preflight.md',
    'Routing workflow defines preflight steps and drift checks, not a business/pitfall fact page.',
  ],
  [
    'knowledge/webcad/source/workflows/author-review-revise.md',
    'Author-review workflow is a process loop and may not use the fact-sheet section schema.',
  ],
  [
    'knowledge/webcad/source/workflows/module-verification-matrix.md',
    'Verification matrix is tabular coverage guidance and is exempt from positive/negative examples.',
  ],
  [
    'knowledge/webcad/source/workflows/agent-positive-negative-examples.md',
    'Examples workflow is itself an example catalog and does not need the fact-sheet review schema.',
  ],
]);

const failures = [];
const passedChecks = [];

function fail(message) {
  failures.push(message);
}

function readJsonFile(filePath, label) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const duplicates = findCaseInsensitiveDuplicateKeys(raw);
  if (duplicates.length > 0) {
    for (const duplicate of duplicates) {
      fail(`${label} has case-insensitive duplicate key "${duplicate.key}" in ${duplicate.path}`);
    }
  }

  try {
    const parsed = JSON.parse(raw);
    passedChecks.push(`${label}: JSON.parse succeeded`);
    return { raw, parsed };
  } catch (error) {
    fail(`${label}: JSON.parse failed: ${error.message}`);
    return { raw, parsed: null };
  }
}

function findCaseInsensitiveDuplicateKeys(raw) {
  const duplicates = [];
  const stack = [];

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (char === '"') {
      const parsedString = readJsonString(raw, i);
      const current = stack.at(-1);
      const nextIndex = nextNonWhitespace(raw, parsedString.end + 1);
      const isObjectKey =
        current?.type === 'object' &&
        current.expectingKey &&
        raw[nextIndex] === ':';

      if (isObjectKey) {
        const normalized = parsedString.value.toLocaleLowerCase('en-US');
        if (current.seen.has(normalized)) {
          duplicates.push({
            key: parsedString.value,
            path: current.path,
            first: current.seen.get(normalized),
          });
        } else {
          current.seen.set(normalized, parsedString.value);
        }
        current.expectingKey = false;
      }

      i = parsedString.end;
      continue;
    }

    if (char === '{') {
      const parent = stack.at(-1);
      const pathLabel = parent?.pendingKey
        ? `${parent.path}.${parent.pendingKey}`
        : parent
          ? `${parent.path}[]`
          : '$';
      stack.push({ type: 'object', path: pathLabel, seen: new Map(), expectingKey: true, pendingKey: '' });
      continue;
    }

    if (char === '[') {
      const parent = stack.at(-1);
      const pathLabel = parent?.pendingKey
        ? `${parent.path}.${parent.pendingKey}`
        : parent
          ? `${parent.path}[]`
          : '$';
      stack.push({ type: 'array', path: pathLabel });
      continue;
    }

    if (char === '}') {
      stack.pop();
      markParentValueComplete(stack.at(-1));
      continue;
    }

    if (char === ']') {
      stack.pop();
      markParentValueComplete(stack.at(-1));
      continue;
    }

    if (char === ':') {
      const current = stack.at(-1);
      if (current?.type === 'object') {
        current.pendingKey = getLastSeenKey(current);
      }
      continue;
    }

    if (char === ',') {
      const current = stack.at(-1);
      if (current?.type === 'object') {
        current.expectingKey = true;
        current.pendingKey = '';
      }
    }
  }

  return duplicates;
}

function readJsonString(raw, start) {
  let value = '';
  for (let i = start + 1; i < raw.length; i += 1) {
    const char = raw[i];
    if (char === '"') {
      return { value, end: i };
    }
    if (char === '\\') {
      const escaped = raw[i + 1];
      if (escaped === 'u') {
        value += String.fromCodePoint(Number.parseInt(raw.slice(i + 2, i + 6), 16));
        i += 5;
      } else {
        value += escaped;
        i += 1;
      }
    } else {
      value += char;
    }
  }
  return { value, end: raw.length - 1 };
}

function nextNonWhitespace(raw, start) {
  for (let i = start; i < raw.length; i += 1) {
    if (!/\s/.test(raw[i])) {
      return i;
    }
  }
  return raw.length;
}

function getLastSeenKey(context) {
  let last = '';
  for (const value of context.seen.values()) {
    last = value;
  }
  return last;
}

function markParentValueComplete(context) {
  if (context?.type === 'object') {
    context.pendingKey = '';
  }
}

function sortedKeys(objectValue) {
  return Object.keys(objectValue ?? {}).sort((a, b) => a.localeCompare(b));
}

function compareRouteSections(topManifest, sourceManifest) {
  for (const section of comparedRouteSections) {
    const topKeys = sortedKeys(topManifest[section]);
    const sourceKeys = sortedKeys(sourceManifest[section]);

    const missingInSource = topKeys.filter((key) => !sourceKeys.includes(key));
    const missingInTop = sourceKeys.filter((key) => !topKeys.includes(key));

    for (const key of missingInSource) {
      fail(`${section}: key "${key}" exists in route-manifest.json but not source/manifest.json`);
    }
    for (const key of missingInTop) {
      fail(`${section}: key "${key}" exists in source/manifest.json but not route-manifest.json`);
    }

    for (const key of topKeys.filter((candidate) => sourceKeys.includes(candidate))) {
      const topValue = JSON.stringify(topManifest[section][key]);
      const sourceValue = JSON.stringify(sourceManifest[section][key]);
      if (topValue !== sourceValue) {
        fail(`${section}.${key}: target mismatch between manifests`);
      }
    }
  }

  passedChecks.push('task/topic/risk route keys and values match between manifests');
}

function collectRouteTargets(manifest) {
  const targets = new Set();
  for (const entry of manifest.entry ?? []) {
    targets.add(entry);
  }
  for (const section of comparedRouteSections) {
    for (const value of Object.values(manifest[section] ?? {})) {
      if (Array.isArray(value)) {
        for (const item of value) targets.add(item);
      } else {
        targets.add(value);
      }
    }
  }
  return targets;
}

function resolveKnowledgePath(routeTarget) {
  const normalized = routeTarget.replaceAll('\\', '/');
  if (path.isAbsolute(normalized)) {
    return normalized;
  }
  if (normalized.startsWith('knowledge/webcad/')) {
    return path.join(knowledgeRoot, normalized.slice('knowledge/webcad/'.length));
  }
  return path.join(workspaceRoot, normalized);
}

function validateRouteTargets(topManifest, sourceManifest) {
  const targets = new Set([...collectRouteTargets(topManifest), ...collectRouteTargets(sourceManifest)]);
  for (const target of [...targets].sort()) {
    const diskPath = resolveKnowledgePath(target);
    if (!fs.existsSync(diskPath)) {
      fail(`route target does not exist: ${target}`);
    }
  }
  passedChecks.push(`${targets.size} unique route targets exist`);
}

function validateStructuredDocs() {
  for (const routeTarget of structuredDocs) {
    const diskPath = resolveKnowledgePath(routeTarget);
    if (!fs.existsSync(diskPath)) {
      fail(`structured doc is missing: ${routeTarget}`);
      continue;
    }

    const text = fs.readFileSync(diskPath, 'utf8');
    for (const section of requiredSectionNames) {
      const headingPattern = new RegExp(`^##\\s+${escapeRegExp(section)}(?:\\s|$)`, 'm');
      if (!headingPattern.test(text)) {
        fail(`structured doc ${routeTarget} is missing section "${section}"`);
      }
    }
  }

  passedChecks.push(`${structuredDocs.length} structured business/pitfall docs contain required sections`);
}

function validateWorkflowWaivers(topManifest, sourceManifest) {
  const targets = new Set([...collectRouteTargets(topManifest), ...collectRouteTargets(sourceManifest)]);
  const workflowTargets = [...targets].filter((target) => target.includes('/workflows/')).sort();
  for (const target of workflowTargets) {
    if (!workflowSectionWaivers.has(target)) {
      fail(`workflow section waiver is missing for routed workflow doc: ${target}`);
    }
  }
  passedChecks.push(`${workflowTargets.length} routed workflow docs have explicit section waivers`);
}

function validateCanonicalAliases(topManifest, sourceManifest) {
  for (const manifest of [
    ['route-manifest.json', topManifest],
    ['source/manifest.json', sourceManifest],
  ]) {
    const [label, manifestValue] = manifest;
    for (const alias of canonicalAliases) {
      if (!Object.hasOwn(manifestValue[alias.section] ?? {}, alias.key)) {
        fail(`${label}: canonical alias ${alias.section}.${alias.key} is missing`);
      }
    }
  }
  passedChecks.push('canonical aliases exist in both manifests');
}

function validateNoLocalSourcePaths() {
  const markdownFiles = listMarkdownFiles(knowledgeRoot);
  for (const filePath of markdownFiles) {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const pattern of forbiddenPublishPathPatterns) {
      if (pattern.test(text)) {
        fail(`published knowledge doc contains local source path: ${path.relative(knowledgeRoot, filePath)}`);
        break;
      }
    }
  }

  passedChecks.push('published knowledge docs contain no local source paths');
}

function listMarkdownFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const topManifest = readJsonFile(topManifestPath, 'route-manifest.json').parsed;
const sourceManifest = readJsonFile(sourceManifestPath, 'source/manifest.json').parsed;

if (topManifest && sourceManifest) {
  compareRouteSections(topManifest, sourceManifest);
  validateRouteTargets(topManifest, sourceManifest);
  validateStructuredDocs();
  validateWorkflowWaivers(topManifest, sourceManifest);
  validateCanonicalAliases(topManifest, sourceManifest);
  validateNoLocalSourcePaths();
}

if (failures.length > 0) {
  console.error('WebCAD knowledge validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log('WebCAD knowledge validation passed.');
  for (const check of passedChecks) {
    console.log(`- ${check}`);
  }
  if (workflowSectionWaivers.size > 0) {
    console.log('- workflow section waivers:');
    for (const [target, reason] of workflowSectionWaivers) {
      console.log(`  - ${target}: ${reason}`);
    }
  }
}
