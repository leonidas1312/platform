import type { Context } from "@netlify/functions";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";

export default async (req: Request, context: Context): Promise<Response> => {
  try {
    // Parse the JSON payload.
    const { code } = await req.json();
    if (!code) {
      return new Response(
        JSON.stringify({ output: "No code provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a temporary file path and write the code to it.
    const tempFilePath = join(tmpdir(), `temp-${Date.now()}.py`);
    await fs.writeFile(tempFilePath, code, "utf8");

    // Spawn the Python process.
    const pythonProcess = spawn("python", [tempFilePath]);
    const encoder = new TextEncoder();

    // Create a ReadableStream to stream the Python process output.
    const stream = new ReadableStream({
      start(controller) {
        // Enqueue stdout data as it arrives.
        pythonProcess.stdout.on("data", (data: Buffer) => {
          controller.enqueue(data);
        });

        // Enqueue stderr data as it arrives.
        pythonProcess.stderr.on("data", (data: Buffer) => {
          controller.enqueue(data);
        });

        // When the process closes, send the exit code and close the stream.
        pythonProcess.on("close", async (exitCode: number) => {
          controller.enqueue(encoder.encode(`\nProcess exited with code ${exitCode}`));
          await fs.unlink(tempFilePath).catch(() => {});
          controller.close();
        });

        // On error, enqueue the error message and terminate the stream.
        pythonProcess.on("error", async (err: Error) => {
          controller.enqueue(encoder.encode(`\nError: ${err.message}`));
          await fs.unlink(tempFilePath).catch(() => {});
          controller.error(err);
        });
      },
    });

    // Return the streaming response.
    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ output: `Server error: ${err.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
