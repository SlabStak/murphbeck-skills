import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { CreateApiKeyForm } from "./create-key-form";
import { DeleteApiKeyButton } from "./delete-key-button";

export const metadata = {
  title: "API Keys",
  description: "Manage your API keys",
};

export default async function ApiKeysPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    include: {
      apiKeys: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const apiKeys = dbUser?.apiKeys || [];

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your API keys for programmatic access
        </p>
      </div>

      <div className="space-y-8">
        {/* Create New Key */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Create New Key</h2>
          <CreateApiKeyForm />
        </section>

        {/* Existing Keys */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Your API Keys</h2>

          {apiKeys.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <p className="text-muted-foreground">
                No API keys yet. Create one above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{key.name}</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      {key.key.slice(0, 12)}...{key.key.slice(-4)}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Created {formatDate(key.createdAt)}</span>
                      {key.lastUsedAt && (
                        <span>Last used {formatDate(key.lastUsedAt)}</span>
                      )}
                      {key.expiresAt && (
                        <span>Expires {formatDate(key.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                  <DeleteApiKeyButton keyId={key.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Usage Instructions */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Usage</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Include your API key in the Authorization header:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            <code>
              {`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.yourdomain.com/v1/resource`}
            </code>
          </pre>
        </section>
      </div>
    </div>
  );
}
