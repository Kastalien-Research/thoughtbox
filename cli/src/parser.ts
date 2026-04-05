import * as ts from "typescript";
import * as path from "node:path";
import * as fs from "node:fs";

export interface ModuleInfo {
  name: string;
  path: string;
  fileCount: number;
  exports: string[];
  hasTests: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
}

export interface ProjectModel {
  modules: ModuleInfo[];
  edges: DependencyEdge[];
  projectRoot: string;
}

function findModuleName(
  filePath: string,
  projectRoot: string,
  moduleDirs: Map<string, string>,
): string {
  const rel = path.relative(projectRoot, filePath);
  for (const [dir, name] of moduleDirs) {
    if (rel.startsWith(dir + path.sep) || rel === dir) {
      return name;
    }
  }
  return "root";
}

function extractExports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ES2022,
    true,
  );
  const exports: string[] = [];

  for (const stmt of sourceFile.statements) {
    const mods = ts.canHaveModifiers(stmt)
      ? ts.getModifiers(stmt)
      : undefined;
    const isExported = mods?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    );

    if (isExported) {
      if (
        ts.isFunctionDeclaration(stmt) ||
        ts.isClassDeclaration(stmt) ||
        ts.isInterfaceDeclaration(stmt) ||
        ts.isTypeAliasDeclaration(stmt) ||
        ts.isEnumDeclaration(stmt)
      ) {
        if (stmt.name) {
          exports.push(stmt.name.text);
        }
      } else if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.push(decl.name.text);
          }
        }
      }
    }

    if (ts.isExportDeclaration(stmt) && stmt.exportClause) {
      if (ts.isNamedExports(stmt.exportClause)) {
        for (const spec of stmt.exportClause.elements) {
          exports.push(spec.name.text);
        }
      }
    }
  }

  return exports;
}

function collectImportedModules(
  filePath: string,
  projectRoot: string,
  moduleDirs: Map<string, string>,
): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ES2022,
    true,
  );
  const targets: string[] = [];

  for (const stmt of sourceFile.statements) {
    // Handle both imports and re-exports (export { x } from './module')
    let specifier: string | null = null;
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      specifier = stmt.moduleSpecifier.text;
    } else if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)) {
      specifier = stmt.moduleSpecifier.text;
    }
    if (!specifier || !specifier.startsWith(".")) continue;

    const dir = path.dirname(filePath);
    // Strip .js/.ts extensions for resolution (TS projects import with .js but files are .ts)
    const cleanSpecifier = specifier.replace(/\.(js|ts)$/, '');
    const resolved = path.resolve(dir, cleanSpecifier);
    const rel = path.relative(projectRoot, resolved);

    for (const [moduleDir, moduleName] of moduleDirs) {
      if (
        rel.startsWith(moduleDir + path.sep) ||
        rel === moduleDir
      ) {
        targets.push(moduleName);
        break;
      }
    }
  }

  return targets;
}

export function parseTypeScriptProject(
  projectDir: string,
): ProjectModel {
  const absDir = path.resolve(projectDir);

  const configPath = ts.findConfigFile(
    absDir,
    ts.sys.fileExists,
    "tsconfig.json",
  );
  if (!configPath) {
    throw new Error(
      `No tsconfig.json found in ${absDir}`,
    );
  }

  const configFile = ts.readConfigFile(
    configPath,
    ts.sys.readFile,
  );
  if (configFile.error) {
    const msg = ts.flattenDiagnosticMessageText(
      configFile.error.messageText,
      "\n",
    );
    throw new Error(`Failed to read tsconfig.json: ${msg}`);
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  const sourceRoot = parsed.options.rootDir
    ?? path.dirname(configPath);
  const relSourceRoot = path.relative(absDir, sourceRoot);

  const tsFiles = parsed.fileNames.filter(
    (f) => !f.endsWith(".d.ts"),
  );

  const moduleDirs = new Map<string, string>();
  for (const file of tsFiles) {
    const basename = path.basename(file);
    if (basename === "index.ts" || basename === "index.js") {
      const dir = path.dirname(file);
      const relDir = path.relative(absDir, dir);
      if (relDir !== relSourceRoot) {
        const name = path.basename(dir);
        moduleDirs.set(relDir, name);
      }
    }
  }

  const moduleFiles = new Map<string, string[]>();
  const moduleTestFlags = new Map<string, boolean>();
  for (const name of moduleDirs.values()) {
    moduleFiles.set(name, []);
    moduleTestFlags.set(name, false);
  }
  moduleFiles.set("root", []);
  moduleTestFlags.set("root", false);

  for (const file of tsFiles) {
    const name = findModuleName(file, absDir, moduleDirs);
    moduleFiles.get(name)?.push(file);
    if (
      file.includes(".test.") ||
      file.includes(".spec.") ||
      file.includes("__tests__")
    ) {
      moduleTestFlags.set(name, true);
    }
  }

  const modules: ModuleInfo[] = [];
  for (const [relDir, name] of moduleDirs) {
    const indexFile = path.join(absDir, relDir, "index.ts");
    const indexFileJs = path.join(absDir, relDir, "index.js");
    const idx = fs.existsSync(indexFile)
      ? indexFile
      : indexFileJs;
    modules.push({
      name,
      path: relDir,
      fileCount: moduleFiles.get(name)?.length ?? 0,
      exports: fs.existsSync(idx) ? extractExports(idx) : [],
      hasTests: moduleTestFlags.get(name) ?? false,
    });
  }

  const rootFiles = moduleFiles.get("root") ?? [];
  if (rootFiles.length > 0) {
    const rootIndexPath = path.join(
      absDir,
      relSourceRoot,
      "index.ts",
    );
    modules.unshift({
      name: "root",
      path: relSourceRoot,
      fileCount: rootFiles.length,
      exports: fs.existsSync(rootIndexPath)
        ? extractExports(rootIndexPath)
        : [],
      hasTests: moduleTestFlags.get("root") ?? false,
    });
  }

  const edgeSet = new Set<string>();
  const edges: DependencyEdge[] = [];
  for (const file of tsFiles) {
    const fromModule = findModuleName(
      file,
      absDir,
      moduleDirs,
    );
    const imported = collectImportedModules(
      file,
      absDir,
      moduleDirs,
    );
    for (const toModule of imported) {
      if (toModule === fromModule) continue;
      const key = `${fromModule}->${toModule}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ from: fromModule, to: toModule });
      }
    }
  }

  return { modules, edges, projectRoot: absDir };
}
