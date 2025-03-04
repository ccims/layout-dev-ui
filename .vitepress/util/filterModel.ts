import { LayoutGraph } from "./parseModel";

export function filterModel(
    model: LayoutGraph,
    disabledComponents: Set<string>,
    disabledRelations: Set<string>,
    hideDisconnected: boolean,
    hideInterfaces: boolean
): LayoutGraph {
    let filteredComponents = model.components.filter((component) => !disabledComponents.has(component.template));
    const remainingNodes = new Set<string>();
    for (const component of filteredComponents) {
        remainingNodes.add(component.id);
        for (const iface of component.interfaces) {
            remainingNodes.add(iface.id);
        }
    }
    let filteredRelations = model.relations.filter((relation) => {
        return (
            remainingNodes.has(relation.start) &&
            remainingNodes.has(relation.end) &&
            !disabledRelations.has(relation.template)
        );
    });
    if (hideDisconnected) {
        const connectedNodes = new Set<string>();
        for (const relation of filteredRelations) {
            connectedNodes.add(relation.start);
            connectedNodes.add(relation.end);
        }
        filteredComponents = filteredComponents.filter(
            (component) =>
                connectedNodes.has(component.id) || component.interfaces.some((iface) => connectedNodes.has(iface.id))
        );
    }
    if (hideInterfaces) {
        const componentLookup = new Map<string, string>();
        filteredComponents = filteredComponents.map((component) => {
            component.interfaces.forEach((iface) => {
                componentLookup.set(iface.id, component.id);
            });
            return {
                ...component,
                interfaces: []
            };
        });
        filteredRelations = filteredRelations.map((relation) => ({
            ...relation,
            start: componentLookup.get(relation.start) || relation.start,
            end: componentLookup.get(relation.end) || relation.end
        }));
    }
    return {
        components: filteredComponents,
        relations: filteredRelations,
        issueRelations: []
    };
}
