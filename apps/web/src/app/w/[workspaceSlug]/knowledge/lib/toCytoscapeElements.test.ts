import { describe, it, expect } from 'vitest'
import {
  toCytoscapeElements,
  provenancedEntityIds,
} from './toCytoscapeElements'
import type { GraphEntity, GraphRelation } from './graphQueries'

function entity(overrides: Partial<GraphEntity> & { id: string }): GraphEntity {
  return {
    name: overrides.id,
    type: 'Insight',
    label: '',
    properties: {},
    created_at: '2026-07-01T00:00:00Z',
    importance_score: 0.5,
    ...overrides,
  }
}

function relation(
  overrides: Partial<GraphRelation> & { id: string; from_id: string; to_id: string },
): GraphRelation {
  return {
    type: 'RELATES_TO',
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

describe('toCytoscapeElements', () => {
  it('maps entities to nodes with type on data and label falling back to name', () => {
    const elements = toCytoscapeElements({
      entities: [
        entity({ id: 'a', label: 'Alpha', type: 'Concept', importance_score: 0.9 }),
        entity({ id: 'b', label: '', name: 'beta-name' }),
      ],
      relations: [],
    })

    expect(elements).toHaveLength(2)
    expect(elements[0].data).toMatchObject({
      id: 'a',
      label: 'Alpha',
      type: 'Concept',
      importance: 0.9,
    })
    expect(elements[1].data.label).toBe('beta-name')
  })

  it('clamps importance to [0, 1]', () => {
    const elements = toCytoscapeElements({
      entities: [
        entity({ id: 'hot', importance_score: 42 }),
        entity({ id: 'cold', importance_score: -3 }),
        entity({ id: 'nan', importance_score: NaN }),
      ],
      relations: [],
    })
    expect(elements.map((e) => e.data.importance)).toEqual([1, 0, 0])
  })

  it('maps relations to edges and drops edges pointing at unloaded nodes', () => {
    const elements = toCytoscapeElements({
      entities: [entity({ id: 'a' }), entity({ id: 'b' })],
      relations: [
        relation({ id: 'r1', from_id: 'a', to_id: 'b', type: 'BUILDS_ON' }),
        relation({ id: 'r2', from_id: 'a', to_id: 'ghost' }),
      ],
    })

    const edges = elements.filter((e) => 'source' in e.data)
    expect(edges).toHaveLength(1)
    expect(edges[0].data).toMatchObject({
      id: 'r1',
      source: 'a',
      target: 'b',
      type: 'BUILDS_ON',
    })
  })

  it('marks entities without incoming provenance relations as orphans', () => {
    const elements = toCytoscapeElements({
      entities: [entity({ id: 'a' }), entity({ id: 'b' }), entity({ id: 'c' })],
      relations: [
        // b has provenance (EXTRACTED_FROM into b)
        relation({ id: 'r1', from_id: 'a', to_id: 'b', type: 'EXTRACTED_FROM' }),
        // c only has a non-provenance incoming relation
        relation({ id: 'r2', from_id: 'a', to_id: 'c', type: 'RELATES_TO' }),
      ],
    })

    const byId = new Map(elements.map((e) => [e.data.id, e.data]))
    expect(byId.get('a')!.isOrphan).toBe('true')
    expect(byId.get('b')!.isOrphan).toBe('false')
    expect(byId.get('c')!.isOrphan).toBe('true')
  })
})

describe('provenancedEntityIds', () => {
  it('collects targets of provenance relations only', () => {
    const ids = provenancedEntityIds([
      relation({ id: 'r1', from_id: 'a', to_id: 'b', type: 'BUILDS_ON' }),
      relation({ id: 'r2', from_id: 'a', to_id: 'c', type: 'LEARNED_BY' }),
      relation({ id: 'r3', from_id: 'a', to_id: 'd', type: 'CONTRADICTS' }),
    ])
    expect(ids).toEqual(new Set(['b', 'c']))
  })
})
