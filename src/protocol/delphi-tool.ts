import { z } from "zod";
import type { ProtocolHandler } from "./handler.js";
import type { InMemoryProtocolHandler } from "./in-memory-handler.js";
import type { ThoughtHandler } from "../thought-handler.js";
import type { KnowledgeStorage } from "../knowledge/types.js";
import type { DelphiTerminal } from "./types.js";

export const delphiToolInputSchema = z.object({
  operation: z.enum([
    "init", "hypothesize", "discriminate",
    "probe", "assess", "destabilize",
    "witness", "complete", "status",
  ]),
  // init
  question: z.string().optional()
    .describe("Research question for init"),
  resolutionClass: z.enum([
    "decisive", "corroborative", "experimental", "evaluative",
  ]).optional().describe("Resolution class for init"),
  questionType: z.string().optional()
    .describe("Type of question (e.g., causal, comparative)"),
  scope: z.string().optional()
    .describe("Scope boundary for the question"),
  admissibleEvidenceClasses: z.array(z.string()).optional()
    .describe("Allowed evidence source classes"),
  inadmissibleEvidenceClasses: z.array(z.string()).optional()
    .describe("Excluded evidence source classes"),
  // hypothesize
  hypotheses: z.array(z.object({
    statement: z.string(),
    supportPattern: z.string(),
    falsificationCriteria: z.string(),
    incomparableConditions: z.string().optional(),
  })).optional().describe("2-4 competing hypotheses"),
  // discriminate
  discriminants: z.array(z.object({
    id: z.string(),
    essential: z.boolean(),
    closureRule: z.object({
      slots: z.array(z.object({
        id: z.string(),
        description: z.string(),
        requiredSourceClass: z.string().optional(),
        requiresIndependence: z.boolean().optional(),
      })),
    }),
    bearingOn: z.array(z.string()),
    blockConditions: z.string().optional(),
  })).optional().describe("1-5 discriminants with closure rules"),
  // probe
  description: z.string().optional()
    .describe("Probe description"),
  targetDiscriminant: z.string().optional()
    .describe("Discriminant ID this probe targets"),
  targetSlot: z.string().optional()
    .describe("Evidence slot ID this probe targets"),
  interpretationMap: z.record(z.string()).optional()
    .describe("Map of hypothesisId → predicted outcome"),
  probeType: z.enum([
    "observational", "computational", "archival",
    "experimental", "capability_acquiring",
  ]).optional().describe("Type of probe"),
  bound: z.string().optional()
    .describe("Resource/time bound for probe"),
  challengeProbe: z.object({
    description: z.string(),
    type: z.string(),
  }).optional().describe("Pre-committed adversarial challenge"),
  // assess
  finding: z.string().optional()
    .describe("What was found"),
  source: z.string().optional()
    .describe("Source of finding"),
  sourceClass: z.string().optional()
    .describe("Classification of source"),
  independenceClass: z.string().optional()
    .describe("Independence classification"),
  admissible: z.boolean().optional()
    .describe("Whether finding is admissible"),
  contaminated: z.boolean().optional()
    .describe("Whether probe contaminated the evidence"),
  filledSlots: z.array(z.string()).optional()
    .describe("Slot IDs filled by this finding"),
  hypothesisEffects: z.record(
    z.enum(["supports", "weakens", "neutral"]),
  ).optional().describe("Effect on each hypothesis"),
  materialChange: z.boolean().optional()
    .describe("Whether this discriminated between hypotheses"),
  // destabilize
  challengeResult: z.string().optional()
    .describe("Result of executing the challenge probe"),
  // witness
  witnessType: z.string().optional()
    .describe("Type of witness challenge"),
  challenge: z.string().optional()
    .describe("The challenge posed"),
  response: z.string().optional()
    .describe("Response to the challenge"),
  // complete
  terminalState: z.enum([
    "supported_thesis", "refined_question",
    "capability_gap", "irreducible_uncertainty",
  ]).optional().describe("Terminal state"),
  strength: z.enum(["verified", "supported"]).optional()
    .describe("Thesis strength (for supported_thesis)"),
  assurance: z.enum(["witnessed", "reduced-assurance"]).optional()
    .describe("Assurance level"),
  summary: z.string().optional()
    .describe("Terminal summary"),
  report: z.object({
    question: z.string(),
    hypotheses: z.array(z.object({
      id: z.string(),
      statement: z.string(),
      status: z.string(),
      evidenceChain: z.array(z.string()),
    })),
    discriminants: z.array(z.object({
      id: z.string(),
      status: z.string(),
      filledSlots: z.number(),
      totalSlots: z.number(),
    })),
    evidenceCount: z.number(),
    probeCount: z.number(),
    nCounterHistory: z.array(z.number()),
  }).optional().describe("Terminal report"),
});

export type DelphiToolInput = z.infer<typeof delphiToolInputSchema>;

export const DELPHI_TOOL = {
  name: "thoughtbox_delphi",
  description: `Delphi Protocol: discrimination-gated epistemic inquiry for autonomous agents. Prevents unbounded research via finite hypotheses, finite discriminants with closure rules, pre-committed adversarial challenges, and forced synthesis on non-discrimination.

Operations:
- init: Operationalize a question into a bounded frame (args: { question, resolutionClass, questionType?, scope?, admissibleEvidenceClasses?, inadmissibleEvidenceClasses? })
- hypothesize: Declare 2-4 competing hypotheses (args: { hypotheses: [{ statement, supportPattern, falsificationCriteria, incomparableConditions? }] })
- discriminate: Declare 1-5 discriminants with finite closure rules (args: { discriminants: [{ id, essential, closureRule: { slots }, bearingOn }] })
- probe: Record bounded investigation with pre-committed challenge (args: { description, targetDiscriminant, targetSlot, interpretationMap, probeType, bound, challengeProbe })
- assess: Score probe result, update N counter (args: { finding, source, sourceClass, independenceClass, admissible, contaminated, filledSlots, hypothesisEffects, materialChange })
- destabilize: Execute pre-committed challenge probe (args: { challengeResult, materialChange })
- witness: Invoke Iron Witness adversarial challenge (args: { witnessType, challenge, response })
- complete: Terminal state with full report (args: { terminalState, strength?, assurance?, summary, report })
- status: Show current session state (N counter, phase, hypotheses, discriminants, evidence)`,
  inputSchema: delphiToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class DelphiTool {
  private activeSessionId: string | null = null;

  constructor(
    private handler: ProtocolHandler | InMemoryProtocolHandler,
    private thoughtHandler?: ThoughtHandler,
    private knowledgeStorage?: KnowledgeStorage,
  ) {}

  async handle(input: DelphiToolInput) {
    let result: Record<string, unknown>;

    switch (input.operation) {
      case "init": {
        result = await this.handler.delphiInit({
          question: input.question!,
          resolutionClass: input.resolutionClass!,
          questionType: input.questionType,
          scope: input.scope,
          admissibleEvidenceClasses: input.admissibleEvidenceClasses,
          inadmissibleEvidenceClasses: input.inadmissibleEvidenceClasses,
        });
        this.activeSessionId = result.session_id as string;
        await this.bridgeThought(
          `[Delphi:init] Question: ${input.question}. Resolution: ${input.resolutionClass}`,
          'action_report',
        );
        break;
      }
      case "hypothesize": {
        const sid = this.requireSession();
        result = await this.handler.delphiHypothesize(sid, {
          hypotheses: input.hypotheses!,
        });
        const statements = input.hypotheses!
          .map(h => h.statement).join('; ');
        await this.bridgeThought(
          `[Delphi:hypothesize] ${input.hypotheses!.length} hypotheses declared: ${statements}`,
          'reasoning',
        );
        break;
      }
      case "discriminate": {
        const sid = this.requireSession();
        result = await this.handler.delphiDiscriminate(sid, {
          discriminants: input.discriminants!,
        });
        const ids = input.discriminants!.map(d => d.id).join(', ');
        const essentialIds = input.discriminants!
          .filter(d => d.essential).map(d => d.id).join(', ');
        await this.bridgeThought(
          `[Delphi:discriminate] ${input.discriminants!.length} discriminants: ${ids}. Essential: ${essentialIds || 'none'}`,
          'reasoning',
        );
        break;
      }
      case "probe": {
        const sid = this.requireSession();
        result = await this.handler.delphiProbe(sid, {
          description: input.description!,
          targetDiscriminant: input.targetDiscriminant!,
          targetSlot: input.targetSlot!,
          interpretationMap: input.interpretationMap!,
          probeType: input.probeType!,
          bound: input.bound!,
          challengeProbe: input.challengeProbe!,
        });
        await this.bridgeThought(
          `[Delphi:probe] ${input.probeType} targeting ${input.targetDiscriminant}.${input.targetSlot}: ${input.description}. Challenge pre-committed: ${input.challengeProbe!.description}`,
          'action_report',
        );
        break;
      }
      case "assess": {
        const sid = this.requireSession();
        result = await this.handler.delphiAssess(sid, {
          finding: input.finding!,
          source: input.source!,
          sourceClass: input.sourceClass!,
          independenceClass: input.independenceClass!,
          admissible: input.admissible!,
          contaminated: input.contaminated!,
          filledSlots: input.filledSlots!,
          hypothesisEffects: input.hypothesisEffects!,
          materialChange: input.materialChange!,
        });
        await this.bridgeThought(
          `[Delphi:assess] ${input.materialChange ? "DISCRIMINATING" : "NON-DISCRIMINATING"}. Finding: ${input.finding}. Filled: ${input.filledSlots?.join(', ') ?? 'none'}`,
          'reasoning',
        );
        break;
      }
      case "destabilize": {
        const sid = this.requireSession();
        result = await this.handler.delphiDestabilize(sid, {
          challengeResult: input.challengeResult!,
          materialChange: input.materialChange!,
        });
        await this.bridgeThought(
          `[Delphi:destabilize] Challenge executed. ${input.materialChange ? "Landscape changed" : "N\u21922, entering SYNTHESIZE"}`,
          'decision_frame',
        );
        break;
      }
      case "witness": {
        const sid = this.requireSession();
        result = await this.handler.delphiWitness(sid, {
          witnessType: input.witnessType!,
          challenge: input.challenge!,
          response: input.response!,
        });
        await this.bridgeThought(
          `[Delphi:witness] Iron Witness challenge: ${input.challenge}. Response: ${input.response}`,
          'decision_frame',
        );
        break;
      }
      case "complete": {
        const sid = this.requireSession();
        result = await this.handler.delphiComplete(sid, {
          terminalState: input.terminalState!,
          strength: input.strength,
          assurance: input.assurance,
          summary: input.summary!,
          report: input.report!,
        });
        await this.bridgeThought(
          `[Delphi:complete] ${input.terminalState} (${input.strength ?? 'n/a'}, ${input.assurance ?? 'n/a'}): ${input.summary}`,
          'action_report',
        );
        await this.bridgeKnowledge(
          input.terminalState!,
          input.summary,
          input.strength,
          input.assurance,
          input.report,
        );
        this.activeSessionId = null;
        break;
      }
      case "status": {
        result = await this.handler.delphiStatus();
        if (result.session_id) {
          this.activeSessionId = result.session_id as string;
        }
        break;
      }
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result!, null, 2),
      }],
    };
  }

  private requireSession(): string {
    if (!this.activeSessionId) {
      throw new Error("No active Delphi session. Call init first.");
    }
    return this.activeSessionId;
  }

  private async bridgeThought(
    content: string,
    thoughtType: 'reasoning' | 'decision_frame' | 'action_report',
  ): Promise<void> {
    if (!this.thoughtHandler) return;
    if (!this.thoughtHandler.getCurrentSessionId()) return;
    try {
      await this.thoughtHandler.processThought({
        thought: content,
        thoughtType,
        nextThoughtNeeded: true,
      });
    } catch {
      // Bridge failure is non-fatal
    }
  }

  private async bridgeKnowledge(
    terminalState: DelphiTerminal,
    summary?: string,
    strength?: string,
    assurance?: string,
    report?: DelphiToolInput['report'],
  ): Promise<void> {
    if (!this.knowledgeStorage) return;
    if (!summary) return;

    try {
      const entityTypeMap: Record<DelphiTerminal, {
        type: 'Insight' | 'Concept' | 'Decision';
        label: string;
      }> = {
        supported_thesis: {
          type: 'Insight',
          label: `Thesis: ${summary.slice(0, 80)}`,
        },
        refined_question: {
          type: 'Concept',
          label: `Refined: ${summary.slice(0, 80)}`,
        },
        capability_gap: {
          type: 'Insight',
          label: `Gap: ${summary.slice(0, 80)}`,
        },
        irreducible_uncertainty: {
          type: 'Decision',
          label: `Uncertain: ${summary.slice(0, 80)}`,
        },
      };

      const mapping = entityTypeMap[terminalState];

      const entity = await this.knowledgeStorage.createEntity({
        name: `Delphi: ${summary.slice(0, 80)}`,
        type: mapping.type,
        label: mapping.label,
        properties: {
          protocol: 'delphi',
          terminalState,
          strength: strength ?? null,
          assurance: assurance ?? null,
          protocolSessionId: this.activeSessionId,
          resolutionClass: report
            ? 'from_report' : null,
        },
      });

      await this.knowledgeStorage.addObservation({
        entity_id: entity.id,
        content: summary,
        source_session:
          this.thoughtHandler?.getCurrentSessionId() ?? undefined,
      });

      if (report) {
        for (const h of report.hypotheses) {
          if (h.evidenceChain.length > 0) {
            await this.knowledgeStorage.addObservation({
              entity_id: entity.id,
              content: `Hypothesis "${h.statement}" (${h.status}): evidence=${h.evidenceChain.join(', ')}`,
              source_session:
                this.thoughtHandler?.getCurrentSessionId() ?? undefined,
            });
          }
        }
      }
    } catch {
      // Bridge failure is non-fatal
    }
  }
}
