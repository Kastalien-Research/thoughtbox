/**
 * TS-FIXTURE validators for Spec 07 — Deliberation Without Commitment
 *
 * Validates:
 * - V7.1: DecisionOption union — per-element structural typing
 * - V7.5: Narrowing — if (option.selected) { option.reason; } compiles
 *
 * @see .specs/cognitive-harness-improvements/07-deliberation-without-commitment.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V7.1, V7.5
 */

import { expectType } from 'tsd';

// =============================================================================
// V7.1 — DecisionOption union structural typing
// =============================================================================

/**
 * V7.1: DecisionOption is a discriminated union:
 * - UnselectedOption: { label: string; selected?: false }
 * - SelectedOption: { label: string; selected: true; reason?: string }
 *
 * Invalid structures should be rejected at compile time.
 */
type DecisionOption = 
  | { label: string; selected?: false }
  | { label: string; selected: true; reason?: string };

// V7.1: Invalid structures should be type errors
function v7_1_invalid_structures() {
  // @ts-expect-error — 'yes' is not a valid selected value (must be true or false/undefined)
  const invalid1: DecisionOption = { label: 'A', selected: 'yes' };

  // @ts-expect-error — selected: true requires label
  const invalid2: DecisionOption = { selected: true };

  // @ts-expect-error — selected: 1 is not valid
  const invalid3: DecisionOption = { label: 'A', selected: 1 as unknown as true };

  // @ts-expect-error — extra unknown field in strict mode
  const invalid4: DecisionOption = { label: 'A', selected: false, unknownField: 'bad' };
}

// V7.1: Valid structures should compile
function v7_1_valid_structures() {
  // Unselected options (selected is false or undefined)
  const opt1: DecisionOption = { label: 'A' };
  const opt2: DecisionOption = { label: 'B', selected: false };

  expectType<string>(opt1.label);
  expectType<string>(opt2.label);

  // Selected option
  const opt3: DecisionOption = { label: 'C', selected: true };
  expectType<string>(opt3.label);
  expectType<true>(opt3.selected);

  // Selected option with reason
  const opt4: DecisionOption = { label: 'D', selected: true, reason: "Because it's best" };
  expectType<string>(opt4.reason);
}

// =============================================================================
// V7.5 — Type narrowing on selected discriminant
// =============================================================================

/**
 * V7.5: Inside an `if (option.selected)` block, TypeScript should narrow
 * the type to the selected branch, making `option.reason` accessible
 * without optional chaining.
 */
function v7_5_narrowing_check(option: DecisionOption) {
  if (option.selected) {
    // Inside this block, TypeScript knows option is SelectedOption
    expectType<string>(option.label);
    expectType<true>(option.selected);

    // V7.5: reason should be accessible (it's in scope for selected options)
    // Note: reason is optional, so it may be undefined
    const reason: string | undefined = option.reason;
    expectType<string | undefined>(reason);

    // Can use reason directly
    if (option.reason) {
      const reasonLength: number = option.reason.length;
      expectType<number>(reasonLength);
    }
  } else {
    // Inside else block, option is UnselectedOption
    expectType<string>(option.label);
    expectType<false | undefined>(option.selected);

    // reason is not in scope here (only exists on SelectedOption)
    // @ts-expect-error — reason only exists on selected options
    const reason: string = option.reason;
  }
}

// V7.5: Narrowing works with type guards
function v7_5_type_guard(option: DecisionOption) {
  // Using Boolean coercion for narrowing
  if (option.selected === true) {
    expectType<string>(option.label);
    expectType<string | undefined>(option.reason);
  }

  // Negation narrowing
  if (!option.selected) {
    expectType<string>(option.label);
    // @ts-expect-error — reason not available on unselected
    const reason: string = option.reason;
  }
}

// V7.5: Narrowing in array operations
function v7_5_array_narrowing(options: DecisionOption[]) {
  for (const option of options) {
    if (option.selected) {
      expectType<string>(option.label);
      expectType<string | undefined>(option.reason);
    }
  }

  // find() with narrowing
  // Note: TypeScript doesn't narrow find() results based on predicate,
  // so we explicitly check the discriminant property
  const selected = options.find(o => o.selected);
  if (selected && selected.selected === true) {
    expectType<string>(selected.label);
    expectType<string | undefined>(selected.reason);
  }
}
