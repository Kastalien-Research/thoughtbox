import chalk from "chalk";
import { EliteArchive } from "./archive.js";
import { ProposeSolutionResponse, BehaviorDimension } from "./types.js";

/**
 * Visualizer generates ASCII/text-based visualizations for MAP-Elites archives
 */
export class Visualizer {
  /**
   * Generate ASCII heatmap for 2D archives
   */
  generate2DHeatmap(archive: EliteArchive): string {
    const dimensions = archive.getDimensions();

    if (dimensions.length !== 2) {
      return this.generateNonVisualSummary(archive);
    }

    const [dim1, dim2] = dimensions;
    const stats = archive.getCoverageStats();
    const elites = archive.getAllElites();

    // Build elite lookup map
    const eliteMap = new Map<string, number>();
    for (const elite of elites) {
      const key = elite.coordinates.join(",");
      eliteMap.set(key, elite.performance);
    }

    // Generate header
    let output = `\n${chalk.bold("Coverage Map")} (${dim1.resolution}×${dim2.resolution} grid)\n`;
    output += `${chalk.cyan(dim1.name)} →\n`;

    // For readability, limit display size
    const maxDisplaySize = 30;
    const displayDim1 = Math.min(dim1.resolution, maxDisplaySize);
    const displayDim2 = Math.min(dim2.resolution, maxDisplaySize);

    // Generate column numbers
    output += "    ";
    for (let i = 0; i < displayDim1; i++) {
      output += i % 10;
    }
    output += "\n";

    // Generate grid
    output += "  ┌" + "─".repeat(displayDim1) + "┐\n";

    for (let y = displayDim2 - 1; y >= 0; y--) {
      output += chalk.yellow(y.toString().padStart(2)) + "│";

      for (let x = 0; x < displayDim1; x++) {
        const key = `${x},${y}`;
        const hasElite = eliteMap.has(key);
        output += hasElite ? chalk.green("■") : chalk.gray("□");
      }

      output += "│";
      if (y === displayDim2 - 1) {
        output += ` ${chalk.yellow("↑ " + dim2.name)}`;
      }
      output += "\n";
    }

    output += "  └" + "─".repeat(displayDim1) + "┘\n";

    // Legend and stats
    output += `\n  ${chalk.green("■")} = elite found  ${chalk.gray("□")} = empty niche\n`;
    output += `\n  ${chalk.bold("Coverage:")} ${stats.coverage.toFixed(1)}% (${stats.filledNiches}/${stats.totalNiches} niches)\n`;
    output += `  ${chalk.bold("Best performance:")} ${stats.bestPerformance.toFixed(4)}\n`;
    output += `  ${chalk.bold("Average performance:")} ${stats.averagePerformance.toFixed(4)}\n`;

    if (
      dim1.resolution > maxDisplaySize ||
      dim2.resolution > maxDisplaySize
    ) {
      output += `\n  ${chalk.yellow("Note: Display limited to " + maxDisplaySize + "×" + maxDisplaySize + " for readability")}\n`;
    }

    return output;
  }

  /**
   * Generate summary for non-2D archives or when visualization isn't practical
   */
  generateNonVisualSummary(archive: EliteArchive): string {
    const dimensions = archive.getDimensions();
    const stats = archive.getCoverageStats();

    let output = `\n${chalk.bold("Archive Summary")}\n`;
    output += `${chalk.bold("Dimensions:")} ${dimensions.length}D\n`;

    for (let i = 0; i < dimensions.length; i++) {
      const dim = dimensions[i];
      output += `  ${i + 1}. ${chalk.cyan(dim.name)}: [${dim.min}, ${dim.max}] (${dim.resolution} bins)\n`;
    }

    output += `\n${chalk.bold("Coverage:")} ${stats.coverage.toFixed(1)}% (${stats.filledNiches}/${stats.totalNiches} niches)\n`;
    output += `${chalk.bold("Best performance:")} ${stats.bestPerformance.toFixed(4)}\n`;
    output += `${chalk.bold("Average performance:")} ${stats.averagePerformance.toFixed(4)}\n`;

    return output;
  }

  /**
   * Generate visualization based on dimensionality
   */
  generateVisualization(archive: EliteArchive): string {
    const dimensions = archive.getDimensions();

    if (dimensions.length === 2) {
      return this.generate2DHeatmap(archive);
    } else {
      return this.generateNonVisualSummary(archive);
    }
  }

  /**
   * Format proposal result for console output
   */
  formatProposalResult(result: ProposeSolutionResponse): string {
    if (!result.success) {
      return chalk.red(`❌ ERROR: ${result.reason}`);
    }

    const coordStr = `[${result.coordinates.join(", ")}]`;
    const stats = result.coverageStats;

    if (result.accepted) {
      if (result.previousElite) {
        // Improvement
        return chalk.green(
          `✅ ACCEPTED ${coordStr} - ${result.reason} (coverage: ${stats.coverage.toFixed(1)}%)`
        );
      } else {
        // New niche
        return chalk.blue(
          `🆕 NEW NICHE ${coordStr} - ${result.reason} (coverage: ${stats.coverage.toFixed(1)}%)`
        );
      }
    } else {
      // Rejected
      return chalk.yellow(
        `❌ REJECTED ${coordStr} - ${result.reason} (coverage: ${stats.coverage.toFixed(1)}%)`
      );
    }
  }

  /**
   * Generate a text-based bar chart showing coverage
   */
  generateCoverageBar(coverage: number, width: number = 40): string {
    const filled = Math.round((coverage / 100) * width);
    const empty = width - filled;
    const bar = chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
    return `[${bar}] ${coverage.toFixed(1)}%`;
  }

  /**
   * Format dimension information
   */
  formatDimensions(dimensions: BehaviorDimension[]): string {
    let output = `${chalk.bold("Dimensions:")} ${dimensions.length}D\n`;
    for (let i = 0; i < dimensions.length; i++) {
      const dim = dimensions[i];
      output += `  ${i + 1}. ${chalk.cyan(dim.name)}: range [${dim.min}, ${dim.max}], resolution ${dim.resolution}\n`;
    }
    return output;
  }
}
