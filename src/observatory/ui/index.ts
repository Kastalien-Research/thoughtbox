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
export const OBSERVATORY_HTML = readFileSync(htmlPath, "utf-8");
