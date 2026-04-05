export interface ModuleInfo {
  name: string;
  path: string;
  dependentCount: number;
}

export interface ResolvedModule {
  name: string;
  dependentCount: number;
}

export class ModuleCache {
  private modules: ModuleInfo[];
  private projectRoot: string | null;

  private constructor(modules: ModuleInfo[], projectRoot?: string) {
    // Sort by path length descending for longest-prefix matching
    this.modules = modules.sort(
      (a, b) => b.path.length - a.path.length,
    );
    this.projectRoot = projectRoot ?? null;
  }

  static fromModules(
    modules: ModuleInfo[],
    projectRoot?: string,
  ): ModuleCache {
    return new ModuleCache(modules, projectRoot);
  }

  resolveFile(filePath: string): ResolvedModule | null {
    let normalized = filePath;

    // Strip project root prefix if present
    if (
      this.projectRoot
      && normalized.startsWith(this.projectRoot)
    ) {
      normalized = normalized.slice(this.projectRoot.length);
      if (normalized.startsWith('/')) {
        normalized = normalized.slice(1);
      }
    }

    // Longest prefix match
    for (const mod of this.modules) {
      if (
        normalized.startsWith(mod.path + '/')
        || normalized === mod.path
      ) {
        return {
          name: mod.name,
          dependentCount: mod.dependentCount,
        };
      }
    }

    return null;
  }
}
