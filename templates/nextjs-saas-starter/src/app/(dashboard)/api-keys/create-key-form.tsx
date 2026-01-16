"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateApiKeyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create API key");
      }

      const data = await response.json();
      setNewKey(data.key);
      setName("");
      router.refresh();
    } catch (error) {
      console.error("Error creating API key:", error);
      alert("Failed to create API key");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!newKey) return;

    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (newKey) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
            API key created successfully! Copy it now - you won&apos;t be able
            to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white p-2 font-mono text-sm dark:bg-gray-800">
              {newKey}
            </code>
            <button
              onClick={copyToClipboard}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <button
          onClick={() => setNewKey(null)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Create another key
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Key name (e.g., Production, Development)"
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        required
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Key"}
      </button>
    </form>
  );
}
