import type { StylesheetJson } from 'cytoscape'

/**
 * Cytoscape stylesheet per SPEC-KNOWLEDGE-GRAPH-UI §12.3 (data-attribute
 * selectors, Composio-ported palette). Identity is double-encoded: entity
 * type maps to shape AND fill; relation type maps to color AND line style.
 */
export const cytoscapeStylesheet: StylesheetJson = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'font-size': '11px',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '140px',
      width: 'mapData(importance, 0, 1, 36, 120)',
      height: 'mapData(importance, 0, 1, 36, 120)',
      'border-width': 2,
      'border-color': '#201812',
      padding: '10px',
    },
  },
  { selector: 'node[type = "Insight"]', style: { shape: 'ellipse', 'background-color': '#93c5fd' } },
  { selector: 'node[type = "Concept"]', style: { shape: 'round-rectangle', 'background-color': '#86efac' } },
  { selector: 'node[type = "Workflow"]', style: { shape: 'hexagon', 'background-color': '#fcd34d' } },
  { selector: 'node[type = "Decision"]', style: { shape: 'diamond', 'background-color': '#f9a8d4' } },
  { selector: 'node[type = "Agent"]', style: { shape: 'pentagon', 'background-color': '#2d3748', color: '#fff' } },

  // Orphan highlight — no incoming provenance relation (§12.10)
  { selector: 'node[isOrphan = "true"]', style: { 'border-width': 3, 'border-color': '#b91c1c' } },

  {
    selector: 'edge',
    style: {
      width: 1.5,
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
      label: 'data(type)',
      'font-size': '9px',
      'text-background-color': '#fffdfa',
      'text-background-opacity': 0.9,
      'text-background-padding': '2px',
      'line-opacity': 0.55,
    },
  },
  { selector: 'edge[type = "DEPENDS_ON"]', style: { 'line-color': '#d35400', 'target-arrow-color': '#d35400' } },
  { selector: 'edge[type = "BUILDS_ON"]', style: { 'line-color': '#16a34a', 'target-arrow-color': '#16a34a' } },
  { selector: 'edge[type = "EXTRACTED_FROM"]', style: { 'line-color': '#0f766e', 'target-arrow-color': '#0f766e', 'line-style': 'dotted' } },
  { selector: 'edge[type = "APPLIED_IN"]', style: { 'line-color': '#d97706', 'target-arrow-color': '#d97706' } },
  { selector: 'edge[type = "CONTRADICTS"]', style: { 'line-color': '#dc2626', 'target-arrow-color': '#dc2626', 'line-style': 'dashed' } },
  { selector: 'edge[type = "SUPERSEDES"]', style: { 'line-color': '#0d9488', 'target-arrow-color': '#0d9488' } },
  { selector: 'edge[type = "RELATES_TO"]', style: { 'line-color': '#6d6258', 'target-arrow-color': '#6d6258', 'line-style': 'dotted' } },
  { selector: 'edge[type = "LEARNED_BY"]', style: { 'line-color': '#c4b5fd', 'target-arrow-color': '#c4b5fd', 'line-style': 'dotted' } },
  { selector: 'edge[type = "MERGED_FROM"]', style: { 'line-color': '#4338ca', 'target-arrow-color': '#4338ca' } },

  // Overlay selection (Composio pattern — not a heavy border)
  { selector: ':selected', style: { 'overlay-opacity': 0.15, 'overlay-color': '#111827' } },
]
