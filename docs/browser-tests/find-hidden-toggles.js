// See find-hidden-toggles.test.js for why this exists.
//
// Deliberately name-based, not scope-aware: it resolves a `.hidden = `
// assignment to an id by matching the assigned-to identifier against every
// `document.getElementById("id")` binding across *all* provided sources,
// whether that's a local `const`/`let` or an object-literal property name
// (the shape cast-receiver.js/cast-receiver-menu.js use to hand an element
// from one module to another). That's enough for this codebase's actual
// style without building a real scope-aware JS parser.
const BINDING_PATTERN =
  /(?:(?:const|let|var)\s+(\w+)\s*=|(\w+)\s*:)\s*document\.getElementById\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
const HIDDEN_ASSIGNMENT_PATTERN = /(\w+)\.hidden\s*=/g;

export function findHiddenToggledElementIds(sources) {
  const idByBindingName = new Map();
  const toggledBindingNames = new Set();

  for (const { source } of sources) {
    for (const match of source.matchAll(BINDING_PATTERN)) {
      const bindingName = match[1] ?? match[2];
      const id = match[3];
      idByBindingName.set(bindingName, id);
    }
  }

  for (const { source } of sources) {
    for (const match of source.matchAll(HIDDEN_ASSIGNMENT_PATTERN)) {
      toggledBindingNames.add(match[1]);
    }
  }

  const ids = new Set();
  for (const bindingName of toggledBindingNames) {
    const id = idByBindingName.get(bindingName);
    if (id) ids.add(id);
  }

  return [...ids].sort();
}
