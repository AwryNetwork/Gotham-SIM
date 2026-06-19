import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

let registered = false;

export function ensureCytoscapeExtensionsRegistered() {
  if (registered) return;
  cytoscape.use(fcose);
  registered = true;
}
