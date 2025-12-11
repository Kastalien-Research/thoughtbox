/**
 * Observatory UI Module
 *
 * Exports the self-contained HTML UI for the Observatory visualization.
 * The HTML includes all CSS and JavaScript inline, requiring no external dependencies.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the HTML file at module load time
const htmlPath = join(__dirname, "observatory.html");

/**
 * The complete Observatory UI HTML.
 * This is a self-contained HTML document with inline CSS and JavaScript.
 */
let OBSERVATORY_HTML: string;

try {
  OBSERVATORY_HTML = readFileSync(htmlPath, "utf-8");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    `[Observatory] Failed to load UI HTML from ${htmlPath}: ${errorMessage}`
  );
  // Provide a minimal fallback HTML with error message
  OBSERVATORY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Observatory - Error</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #111827;
      color: #f3f4f6;
    }
    .error {
      text-align: center;
      padding: 2rem;
      max-width: 600px;
    }
    h1 { color: #ef4444; margin-bottom: 1rem; }
    p { line-height: 1.6; color: #9ca3af; }
    code { background: #1f2937; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
  </style>
</head>
<body>
  <div class="error">
    <h1>Observatory UI Error</h1>
    <p>Failed to load the Observatory UI. The HTML file could not be read.</p>
    <p><code>${errorMessage}</code></p>
  </div>
</body>
</html>`;
}

export { OBSERVATORY_HTML };
