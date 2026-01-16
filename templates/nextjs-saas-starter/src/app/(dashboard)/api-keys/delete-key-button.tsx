"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteApiKeyButton({ keyId }: { keyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting API key:", error);
      alert("Failed to delete API key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md px-3 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
