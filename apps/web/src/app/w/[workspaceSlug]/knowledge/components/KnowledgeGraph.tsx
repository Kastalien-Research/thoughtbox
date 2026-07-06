'use client'

import { useEffect, useRef } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import fcose from 'cytoscape-fcose'
import { cytoscapeStylesheet } from './GraphStyles'

// Register layout once at module scope (cytoscape.use is idempotent).
cytoscape.use(fcose)

/** fcose layout per SPEC-KNOWLEDGE-GRAPH-UI §12.4. */
function makeLayout(elementCount: number) {
  return {
    name: 'fcose',
    quality: elementCount > 500 ? 'draft' : 'default',
    animate: false,
    randomize: false,
    fit: true,
    padding: 40,
    nodeSeparation: 100,
    idealEdgeLength: 150,
    nodeRepulsion: (node: { data: (key: string) => unknown }) => {
      const t = node.data('type')
      if (t === 'Decision') return 10000 // decisions are pivotal — spread them
      if (t === 'Agent') return 4000 // agents cluster tighter
      return 6000
    },
    edgeElasticity: (edge: { data: (key: string) => unknown }) => {
      const t = edge.data('type')
      if (t === 'CONTRADICTS') return 0.15
      if (t === 'BUILDS_ON' || t === 'EXTRACTED_FROM') return 0.45
      return 0.3
    },
    gravity: 0.3,
    tilingBySort: true,
    packComponents: true,
    nodeDimensionsIncludeLabels: true, // prevents label clipping/overlap
    uniformNodeDimensions: false,
  }
}

type Props = {
  elements: ElementDefinition[]
  /** Changes when the node set materially changes — triggers a fresh layout. */
  layoutKey: string
  selectedEntityId: string | null
  onNodeSelect: (entityId: string | null) => void
}

export default function KnowledgeGraph({
  elements,
  layoutKey,
  selectedEntityId,
  onNodeSelect,
}: Props) {
  const cyRef = useRef<Core | null>(null)

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    const onTapNode = (evt: cytoscape.EventObject) => {
      onNodeSelect(evt.target.data('id') as string)
    }
    const onTapBackground = (evt: cytoscape.EventObject) => {
      if (evt.target === cy) onNodeSelect(null)
    }
    cy.on('tap', 'node', onTapNode)
    cy.on('tap', onTapBackground)

    return () => {
      cy.off('tap', 'node', onTapNode)
      cy.off('tap', onTapBackground)
      // Don't call cy.destroy() — react-cytoscapejs owns the lifecycle.
    }
    // layoutKey remounts the component; re-bind handlers on the new core.
  }, [onNodeSelect, layoutKey])

  // Reflect external selection (e.g. detail-panel navigation) in the graph.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.nodes(':selected').unselect()
    if (selectedEntityId) {
      const node = cy.getElementById(selectedEntityId)
      if (node.nonempty()) {
        node.select()
        cy.animate({ center: { eles: node }, duration: 200 })
      }
    }
  }, [selectedEntityId])

  return (
    <CytoscapeComponent
      key={layoutKey}
      cy={(cy) => {
        cyRef.current = cy
      }}
      elements={elements}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stylesheet={cytoscapeStylesheet as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layout={makeLayout(elements.length) as any}
      style={{ width: '100%', height: '100%' }}
      minZoom={0.2}
      maxZoom={3}
      wheelSensitivity={0.2}
    />
  )
}
