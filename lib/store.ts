import type { CategorySlug } from './categories';

// Storage backend: entries live as a single JSON file, committed straight into
// this GitHub repo via the Contents API. No external database — git history
// *is* the datastore. Writes go to a dedicated branch (DATA_BRANCH) so that
// every save doesn't trigger a Vercel redeploy of the production branch.

export interface Entry {
  id: string;
  category: CategorySlug;
  text: string;
  createdAt: string;
}

const GITHUB_API = 'https://api.github.com';
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || 'main';
const DATA_BRANCH = process.env.DATA_BRANCH || 'data';
const DATA_PATH = process.env.DATA_FILE_PATH || 'data/entries.json';

function assertConfigured(): void {
  if (!OWNER || !REPO || !TOKEN) {
    throw new Error(
      'Missing GitHub storage configuration. Set GITHUB_OWNER, GITHUB_REPO, and GITHUB_TOKEN.'
    );
  }
}

function gh(path: string, init?: RequestInit) {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}

let branchReady: Promise<void> | null = null;

function ensureDataBranch(): Promise<void> {
  if (!branchReady) {
    branchReady = (async () => {
      const check = await gh(`/repos/${OWNER}/${REPO}/branches/${DATA_BRANCH}`);
      if (check.status === 200) return;
      if (check.status !== 404) {
        throw new Error(`Failed to check data branch: ${check.status} ${await check.text()}`);
      }

      const baseRef = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE_BRANCH}`);
      if (!baseRef.ok) {
        throw new Error(
          `Failed to read base branch "${BASE_BRANCH}": ${baseRef.status} ${await baseRef.text()}`
        );
      }
      const { object } = await baseRef.json();

      const createRef = await gh(`/repos/${OWNER}/${REPO}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${DATA_BRANCH}`, sha: object.sha }),
      });
      // 422 means the ref already exists (a concurrent request created it first) — fine.
      if (!createRef.ok && createRef.status !== 422) {
        throw new Error(
          `Failed to create data branch "${DATA_BRANCH}": ${createRef.status} ${await createRef.text()}`
        );
      }
    })();
  }
  return branchReady;
}

interface FileState {
  entries: Entry[];
  sha: string | null;
}

async function readFile(): Promise<FileState> {
  await ensureDataBranch();
  const res = await gh(`/repos/${OWNER}/${REPO}/contents/${DATA_PATH}?ref=${DATA_BRANCH}`);
  if (res.status === 404) {
    return { entries: [], sha: null };
  }
  if (!res.ok) {
    throw new Error(`Failed to read ${DATA_PATH}: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  const entries: Entry[] = content.trim() ? JSON.parse(content) : [];
  return { entries, sha: json.sha };
}

async function writeFile(entries: Entry[], sha: string | null, message: string): Promise<void> {
  const content = Buffer.from(`${JSON.stringify(entries, null, 2)}\n`, 'utf-8').toString('base64');
  const res = await gh(`/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content,
      branch: DATA_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to write ${DATA_PATH}: ${res.status} ${await res.text()}`);
  }
}

async function mutate(
  mutator: (entries: Entry[]) => Entry[],
  message: string
): Promise<Entry[]> {
  assertConfigured();
  // One retry in case another request updated the file between our read and write
  // (the `sha` we sent would then be stale and GitHub rejects the write).
  for (let attempt = 0; attempt < 2; attempt++) {
    const { entries, sha } = await readFile();
    const next = mutator(entries);
    try {
      await writeFile(next, sha, message);
      return next;
    } catch (err) {
      if (attempt === 0) continue;
      throw err;
    }
  }
  throw new Error('Failed to write entries after retry');
}

export async function getEntriesInRange(start: Date, endExclusive: Date): Promise<Entry[]> {
  assertConfigured();
  const { entries } = await readFile();
  const startMs = start.getTime();
  const endMs = endExclusive.getTime();
  return entries
    .filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return t >= startMs && t < endMs;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createEntry(category: CategorySlug, text: string): Promise<Entry> {
  const entry: Entry = {
    id: crypto.randomUUID(),
    category,
    text,
    createdAt: new Date().toISOString(),
  };
  await mutate((entries) => [...entries, entry], `Add ${category} entry`);
  return entry;
}

export async function updateEntry(id: string, text: string): Promise<Entry | null> {
  let updated: Entry | null = null;
  await mutate((entries) => {
    const next = entries.map((e) => {
      if (e.id !== id) return e;
      updated = { ...e, text };
      return updated;
    });
    return next;
  }, `Edit entry ${id}`);
  return updated;
}

export async function deleteEntry(id: string): Promise<boolean> {
  let deleted = false;
  await mutate((entries) => {
    return entries.filter((e) => {
      if (e.id !== id) return true;
      deleted = true;
      return false;
    });
  }, `Delete entry ${id}`);
  return deleted;
}
