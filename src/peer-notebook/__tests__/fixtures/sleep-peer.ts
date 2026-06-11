// Test fixture entry for LocalProcessRuntimeProvider budget and cancel tests:
// consumes stdin, never writes a result, and sleeps far past any test budget
// so the provider must terminate it.
process.stdin.resume();
setTimeout(() => {
  process.exitCode = 0;
}, 60_000);
