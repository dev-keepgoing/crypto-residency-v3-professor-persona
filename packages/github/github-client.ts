import axios, { AxiosInstance } from "axios";
import { CommitFile, CommitResult } from "../core/types";

interface TreeItem {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string;
}

interface GitHubConfig {
  pat: string;
  owner: string;
  repo: string;
}

function getConfig(): GitHubConfig {
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!pat) throw new Error("GITHUB_PAT is not set in environment.");
  if (!owner) throw new Error("GITHUB_OWNER is not set in environment.");
  if (!repo) throw new Error("GITHUB_REPO is not set in environment.");

  return { pat, owner, repo };
}

function createAxiosClient(pat: string): AxiosInstance {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
  });
}

async function getLatestCommitSha(
  client: AxiosInstance,
  owner: string,
  repo: string,
  branch: string = "main"
): Promise<string> {
  const response = await client.get(`/repos/${owner}/${repo}/git/refs/heads/${branch}`);
  return response.data.object.sha as string;
}

async function getBaseTreeSha(
  client: AxiosInstance,
  owner: string,
  repo: string,
  commitSha: string
): Promise<string> {
  const response = await client.get(`/repos/${owner}/${repo}/git/commits/${commitSha}`);
  return response.data.tree.sha as string;
}

async function createBlob(
  client: AxiosInstance,
  owner: string,
  repo: string,
  content: string
): Promise<string> {
  const response = await client.post(`/repos/${owner}/${repo}/git/blobs`, {
    content: Buffer.from(content, "utf-8").toString("base64"),
    encoding: "base64",
  });
  return response.data.sha as string;
}

async function createTree(
  client: AxiosInstance,
  owner: string,
  repo: string,
  baseTreeSha: string,
  items: TreeItem[]
): Promise<string> {
  const response = await client.post(`/repos/${owner}/${repo}/git/trees`, {
    base_tree: baseTreeSha,
    tree: items,
  });
  return response.data.sha as string;
}

async function createCommit(
  client: AxiosInstance,
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string
): Promise<string> {
  const response = await client.post(`/repos/${owner}/${repo}/git/commits`, {
    message,
    tree: treeSha,
    parents: [parentSha],
  });
  return response.data.sha as string;
}

async function updateRef(
  client: AxiosInstance,
  owner: string,
  repo: string,
  commitSha: string,
  branch: string = "main"
): Promise<void> {
  await client.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commitSha,
    force: false,
  });
}

export async function commitFiles(
  files: CommitFile[],
  commitMessage: string,
  branch: string = "main"
): Promise<CommitResult> {
  const { pat, owner, repo } = getConfig();
  const client = createAxiosClient(pat);

  console.log(`  [GitHub] Committing ${files.length} file(s) to ${owner}/${repo}@${branch}`);

  const latestCommitSha = await getLatestCommitSha(client, owner, repo, branch);
  const baseTreeSha = await getBaseTreeSha(client, owner, repo, latestCommitSha);

  const treeItems: TreeItem[] = [];
  for (const file of files) {
    console.log(`  [GitHub] Creating blob for: ${file.path}`);
    const blobSha = await createBlob(client, owner, repo, file.content);
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobSha,
    });
  }

  const newTreeSha = await createTree(client, owner, repo, baseTreeSha, treeItems);
  const newCommitSha = await createCommit(
    client,
    owner,
    repo,
    commitMessage,
    newTreeSha,
    latestCommitSha
  );
  await updateRef(client, owner, repo, newCommitSha, branch);

  const url = `https://github.com/${owner}/${repo}/commit/${newCommitSha}`;
  console.log(`  [GitHub] Committed: ${url}`);

  return { sha: newCommitSha, url };
}
