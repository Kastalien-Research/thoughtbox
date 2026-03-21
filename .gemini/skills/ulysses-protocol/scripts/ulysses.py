#!/usr/bin/env python3
import sys
import json
import os
import argparse
from datetime import datetime

STATE_DIR = ".ulysses"
STATE_FILE = os.path.join(STATE_DIR, "session.json")

def load_state():
    if not os.path.exists(STATE_FILE):
        return {
            "S": 0,
            "surprise_register": [],
            "checkpoints": [],
            "history": [],
            "hypotheses": [],
            "pruned_steps": [],
            "active_step": None,
            "start_time": datetime.now().isoformat()
        }
    with open(STATE_FILE, 'r') as f:
        return json.load(f)

def save_state(state):
    if not os.path.exists(STATE_DIR):
        os.makedirs(STATE_DIR)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def init_session(args):
    state = {
        "S": 0,
        "surprise_register": [],
        "checkpoints": ["initial"],
        "history": [],
        "hypotheses": [],
        "pruned_steps": [],
        "active_step": None,
        "start_time": datetime.now().isoformat()
    }
    save_state(state)
    print("✅ Ulysses Protocol Session Initialized.")
    print("State: S=0 (PLAN)")

def plan_step(args):
    state = load_state()
    if state["S"] == 2:
        print("❌ Error: Currently in REFLECT phase (S=2). Must run 'reflect' first.")
        return

    step = {
        "phase": "PLAN" if state["S"] == 0 else "RECOVERY",
        "primary": args.primary,
        "recovery": args.recovery,
        "irreversible": args.irreversible,
        "timestamp": datetime.now().isoformat()
    }
    state["active_step"] = step
    save_state(state)
    print(f"✅ Step Recorded ({step['phase']})")
    print(f"Primary: {step['primary']}")
    print(f"Recovery: {step['recovery']}")
    if step['irreversible']:
        print("⚠️  Warning: Step is IRREVERSIBLE. Ensure rollback info is recorded.")

def assess_outcome(args):
    state = load_state()
    if not state["active_step"]:
        print("❌ Error: No active step found. Run 'plan' first.")
        return

    outcome = {
        "step": state["active_step"],
        "assessment": args.assessment,
        "details": args.details,
        "timestamp": datetime.now().isoformat()
    }
    state["history"].append(outcome)
    state["active_step"] = None

    if args.assessment == "expected":
        state["S"] = 0
        state["checkpoints"].append(f"checkpoint_{len(state['checkpoints'])}")
        print("✅ Outcome: Expected. Resetting to S=0. Checkpoint created.")
    elif args.assessment == "unexpected-favorable":
        if args.accept_favorable:
            state["S"] = 0
            state["checkpoints"].append(f"checkpoint_{len(state['checkpoints'])}")
            print("✅ Outcome: Accepted (Favorable). Resetting to S=0. Checkpoint created.")
        else:
            print("⚠️  Unexpected-Favorable outcome treated as surprise (default).")
            process_surprise(state, outcome, args.severity)
    else: # unexpected-unfavorable
        process_surprise(state, outcome, args.severity)

    save_state(state)

def process_surprise(state, outcome, severity):
    if not severity:
        print("❌ Error: Surprise encountered but no --severity provided (1 or 2).")
        return

    print(f"💥 Surprise Encountered. Severity: {severity}")
    
    state["surprise_register"].append({
        "details": outcome["details"],
        "severity": severity,
        "timestamp": outcome["timestamp"]
    })
    state["surprise_register"] = state["surprise_register"][-3:]

    if severity == "2":
        state["S"] = 2
        print("🚨 Flagrant-2: Immediate REFLECT (S=2).")
    else:
        state["S"] += 1
        if state["S"] > 2:
            state["S"] = 2
            print("🚨 Two consecutive surprises: REFLECT (S=2).")
        else:
            print(f"➡️  S={state['S']}. Proceed to {'RECOVERY' if state['S']==1 else 'REFLECT'}.")

def reflect(args):
    state = load_state()
    if state["S"] != 2:
        print(f"⚠️  Not in REFLECT phase (S={state['S']}). Forcing REFLECT.")
    
    hypothesis = {
        "statement": args.statement,
        "falsification": args.falsification,
        "timestamp": datetime.now().isoformat()
    }
    state["hypotheses"].append(hypothesis)
    state["S"] = 0 # Reset after reflection
    save_state(state)
    print("🧠 Reflection Recorded.")
    print(f"Hypothesis: {hypothesis['statement']}")
    print(f"Falsification: {hypothesis['falsification']}")
    print("✅ S reset to 0. Ready for next PLAN phase.")

def show_status(args):
    state = load_state()
    print(f"--- Ulysses Status (S={state['S']}) ---")
    if state["active_step"]:
        print(f"Active Step: {state['active_step']['primary']} ({state['active_step']['phase']})")
    print(f"Last Checkpoint: {state['checkpoints'][-1] if state['checkpoints'] else 'None'}")
    print(f"Surprise Register: {len(state['surprise_register'])} items")
    if state["hypotheses"]:
        print(f"Current Hypothesis: {state['hypotheses'][-1]['statement']}")
    print("--------------------------------")

def main():
    parser = argparse.ArgumentParser(description="Ulysses Protocol State Manager")
    subparsers = parser.add_subparsers()

    # init
    p_init = subparsers.add_parser('init')
    p_init.set_defaults(func=init_session)

    # plan
    p_plan = subparsers.add_parser('plan')
    p_plan.add_argument('primary', help="Primary step description")
    p_plan.add_argument('recovery', help="Recovery step description")
    p_plan.add_argument('--irreversible', action='store_true', help="Mark step as irreversible")
    p_plan.set_defaults(func=plan_step)

    # outcome
    p_outcome = subparsers.add_parser('outcome')
    p_outcome.add_argument('assessment', choices=['expected', 'unexpected-favorable', 'unexpected-unfavorable'])
    p_outcome.add_argument('--details', default="", help="Outcome details")
    p_outcome.add_argument('--severity', choices=['1', '2'], help="Surprise severity (required for surprises)")
    p_outcome.add_argument('--accept-favorable', action='store_true', help="Accept unexpected-favorable as expected")
    p_outcome.set_defaults(func=assess_outcome)

    # reflect
    p_reflect = subparsers.add_parser('reflect')
    p_reflect.add_argument('statement', help="Hypothesis statement")
    p_reflect.add_argument('falsification', help="Falsification criteria")
    p_reflect.set_defaults(func=reflect)

    # status
    p_status = subparsers.add_parser('status')
    p_status.set_defaults(func=show_status)


    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
