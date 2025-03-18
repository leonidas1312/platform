import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// For demo purposes, we retrieve the user token from localStorage.
const getUserToken = () => localStorage.getItem("gitea_token") || "";

interface GiteaRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  owner: { login: string };
  private: boolean;
  description?: string;
  stars_count: number;
  forks_count: number;
  watchers_count?: number;
  updated_at: string;
  default_branch?: string;
}

interface RepoResponse {
  repo: GiteaRepo;
  readme: string; // markdown content
  config: any;    // parsed config.json (or null)
  files: any[];   // file listing in the repo root
}

export default function RepoPage() {
  const { owner, repoName } = useParams<{ owner: string; repoName: string }>();
  const [repo, setRepo] = useState<GiteaRepo | null>(null);
  const [readme, setReadme] = useState("");
  const [config, setConfig] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Qubot Card state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [qubotCardContent, setQubotCardContent] = useState<string>("");

  // Code editor state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileSha, setSelectedFileSha] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!owner || !repoName) {
      setError("No owner or repository name provided.");
      setLoading(false);
      return;
    }
    fetch(`http://localhost:4000/api/repos/${owner}/${repoName}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Failed to fetch repo details");
          });
        }
        return res.json();
      })
      .then((data: RepoResponse) => {
        setRepo(data.repo);
        setReadme(data.readme);
        setConfig(data.config);
        setFiles(data.files);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [owner, repoName]);

  const reloadRepoData = async () => {
    if (!owner || !repoName) return;
    const res = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}`);
    const data = await res.json();
    setRepo(data.repo);
    setReadme(data.readme);
    setConfig(data.config);
    setFiles(data.files);
  };

  // Qubot Card Handlers (unchanged)
  const handleCreateQubotCardClick = () => {
    const defaultJson = JSON.stringify(
      {
        entry_point: "my_module:MyClass",
        default_params: {},
        creator: "YourName",
        type: "problem",
        problem_name: "Sample Problem",
        description: "A short description of this Qubot card.",
        link_to_dataset: "",
        keywords: ["example", "qubot", "card"],
        data_format: {},
        decision_variables: {},
        objective: {},
        solution_representation: "",
        formulations: [],
      },
      null,
      2
    );
    setQubotCardContent(defaultJson);
    setShowCreateForm(true);
  };

  const handleSaveQubotCard = async () => {
    if (!owner || !repoName || !repo) return;
    setLoading(true);
    try {
      const token = getUserToken();
      const response = await fetch(
        `http://localhost:4000/api/repos/${owner}/${repoName}/contents/config.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${token}`,
          },
          body: JSON.stringify({
            content: qubotCardContent,
            message: "Create config.json (Qubot card)",
            branch: repo.default_branch || "main",
          }),
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create config.json");
      }
      await reloadRepoData();
      setShowCreateForm(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error creating Qubot card");
    } finally {
      setLoading(false);
    }
  };

  // File selection handler: Fetch file content and store its SHA for updates.
  const handleFileClick = async (file: any) => {
    if (file.type === "dir") {
      // Implement folder navigation if needed.
      return;
    }
    setSelectedFile(file.path);
    setIsEditing(false); // start in view mode
    setEditorLoading(true);
    try {
      const branch = repo?.default_branch || "main";
      const fileRes = await fetch(
        `http://localhost:3000/api/v1/repos/${owner}/${repoName}/contents/${file.path}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${getUserToken()}`,
          },
        }
      );
      if (fileRes.ok) {
        const fileJson = await fileRes.json();
        if (fileJson.content) {
          const decoded = atob(fileJson.content);
          setFileContent(decoded);
          setSelectedFileSha(fileJson.sha);
        } else {
          setFileContent("");
          setSelectedFileSha(null);
        }
      } else {
        setFileContent(`Could not fetch file content (status: ${fileRes.status})`);
        setSelectedFileSha(null);
      }
    } catch (err) {
      console.error("Error fetching file content:", err);
      setFileContent("Error fetching file content.");
      setSelectedFileSha(null);
    } finally {
      setEditorLoading(false);
    }
  };

  // Save file updates by sending a PUT request with the file's SHA.
  const handleSaveFile = async () => {
    if (!selectedFile || !owner || !repoName || !repo || !selectedFileSha) return;
    try {
      setEditorLoading(true);
      const token = getUserToken();
      // Encode fileContent using btoa
      const encodedContent = btoa(fileContent);
      const response = await fetch(
        `http://localhost:4000/api/repos/${owner}/${repoName}/contents/${selectedFile}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${token}`,
          },
          body: JSON.stringify({
            content: encodedContent,
            message: `Update ${selectedFile}`,
            branch: repo.default_branch || "main",
            sha: selectedFileSha,
          }),
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update file");
      }
      await reloadRepoData();
      setIsEditing(false);
      alert("File saved!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error saving file");
    } finally {
      setEditorLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Loading repository...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-500">{error}</div>
      </Layout>
    );
  }

  if (!repo) {
    return (
      <Layout>
        <div className="p-8 text-center">No repository found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 mt-32">
        {/* Repository Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800">{repo.full_name}</h1>
          {repo.description && (
            <p className="mt-2 text-xl text-gray-600">{repo.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">⭐</span>
              <span className="text-base font-semibold text-gray-800">{repo.stars_count}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">🍴</span>
              <span className="text-base font-semibold text-gray-800">{repo.forks_count}</span>
            </div>
            {repo.watchers_count !== undefined && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">👀</span>
                <span className="text-base font-semibold text-gray-800">{repo.watchers_count}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Branch:</span>
              <span className="text-base font-semibold text-gray-800">{repo.default_branch || "main"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Updated:</span>
              <span className="text-base font-semibold text-gray-800">
                {new Date(repo.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="qubot">
          <TabsList className="mx-auto mb-8 w-full max-w-md grid grid-cols-2">
            <TabsTrigger value="qubot">Qubot Card</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="qubot" className="space-y-4">
            {config ? (
              <div>
                <p className="text-sm text-gray-600">
                  Below is the <strong>config.json</strong> file:
                </p>
                <pre className="bg-gray-100 p-4 rounded text-sm font-mono overflow-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                {!showCreateForm ? (
                  <Button onClick={handleCreateQubotCardClick}>
                    Create Qubot Card
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Edit the JSON below, then click Save to create{" "}
                      <strong>config.json</strong>.
                    </p>
                    <textarea
                      className="w-full h-64 border rounded p-2 text-sm font-mono"
                      value={qubotCardContent}
                      onChange={(e) => setQubotCardContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveQubotCard}>Save Qubot Card</Button>
                      <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="code">
            <div className="flex flex-col md:flex-row gap-8">
              {/* File Explorer & README */}
              <div className="md:w-1/3">
                <div className="border rounded-md overflow-hidden mb-4">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <strong>Files</strong>
                  </div>
                  {files.length === 0 ? (
                    <div className="p-4 text-gray-500 text-sm">No files found.</div>
                  ) : (
                    <ul>
                      {files.map((file) => (
                        <li
                          key={file.sha || file.name}
                          onClick={() => handleFileClick(file)}
                          className="px-4 py-2 border-b last:border-none hover:bg-gray-50 cursor-pointer flex items-center"
                        >
                          {file.type === "dir" ? "📁" : "📄"}{" "}
                          <span className="ml-2 text-blue-600">{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border rounded-md">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <strong>README.md</strong>
                  </div>
                  <div className="p-4 prose max-w-none text-sm">
                    {readme ? (
                      <ReactMarkdown>{readme}</ReactMarkdown>
                    ) : (
                      <p className="italic text-gray-500">No README found.</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Code Editor */}
              <div className="md:w-2/3">
                {selectedFile ? (
                  <div className="border rounded-md">
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                      <strong>{selectedFile}</strong>
                      { !isEditing && (
                        <Button onClick={() => setIsEditing(true)} className="text-sm">
                          Edit
                        </Button>
                      )}
                      { isEditing && (
                        <div className="flex gap-2">
                          <Button onClick={handleSaveFile} disabled={editorLoading} className="text-sm">
                            {editorLoading ? "Saving..." : "Save"}
                          </Button>
                          <Button onClick={() => setIsEditing(false)} variant="secondary" className="text-sm">
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {editorLoading ? (
                        <div className="text-gray-500 text-sm">Loading...</div>
                      ) : (
                        isEditing ? (
                          <textarea
                            className="w-full h-96 border rounded p-2 text-sm font-mono"
                            value={fileContent}
                            onChange={(e) => setFileContent(e.target.value)}
                          />
                        ) : (
                          <pre className="w-full h-96 overflow-auto p-2 text-sm font-mono bg-gray-100 rounded">
                            {fileContent}
                          </pre>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Select a file to view/edit.</div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
