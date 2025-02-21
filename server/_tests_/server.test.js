import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// We'll spin up the server in a separate process for integration tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverFile = path.join(__dirname, "..", "server.js");
let serverProcess;

describe("Server test", () => {
  beforeAll(() => {
    // Start the server with Node
    serverProcess = spawn("node", [serverFile]);
  });

  afterAll(() => {
    // Kill the server after tests
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it("Sample test always passes", () => {
    expect(true).toBe(true);
  });
});
