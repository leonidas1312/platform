// pages/api/github/token.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createAppAuth } from "@octokit/auth-app";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import fs from "fs";
import path from "path";

// Load the GitHub private key from an environment variable if available,
// otherwise attempt to read it from a .pem file.
let githubPrivateKey: string;

if (process.env.PRIVATE_KEY_GITHUB) {
  // Replace literal "\n" with actual newlines
  githubPrivateKey = process.env.PRIVATE_KEY_GITHUB.replace(/\\n/g, "\n");
} else {
  // Adjust the file path as needed.
  const keyPath = path.resolve(process.cwd(), "secrets", "github-private-key.pem");
  try {
    githubPrivateKey = fs.readFileSync(keyPath, "utf8");
  } catch (err) {
    throw new Error("Missing GitHub private key. Set PRIVATE_KEY_GITHUB env variable or ensure the PEM file exists.");
  }
}

if (!process.env.APP_ID_GITHUB) {
  throw new Error("Missing APP_ID_GITHUB environment variable");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests.
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Create a Supabase server client to validate the user's session.
  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User not authenticated:", userError);
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validate the query parameter: installationId must be provided.
  const { installationId } = req.query;
  if (!installationId || typeof installationId !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid installationId parameter" });
  }

  try {
    // Create an auth instance for your GitHub App.
    const auth = createAppAuth({
      appId: Number(process.env.APP_ID_GITHUB),
      privateKey: githubPrivateKey,
      installationId: Number(installationId),
    });

    // Generate a short-lived installation token (expires in ~60 minutes by default).
    const { token } = await auth({ type: "installation" });

    // Optionally log token generation events here for audit purposes.
    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating installation token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
