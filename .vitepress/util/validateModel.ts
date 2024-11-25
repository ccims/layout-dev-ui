import { Graph } from "@gropius/graph-editor";

export function validateModel(model: Graph) {
    const existingIds = new Set<string>();
    const relationIds = new Set<string>();
    for (const component of model.components) {
        if (existingIds.has(component.id)) {
            throw new Error(`Duplicate component ID: ${component.id}`);
        }
        existingIds.add(component.id);
        for (const inter of component.interfaces) {
            if (existingIds.has(inter.id)) {
                throw new Error(`Duplicate interface ID: ${inter.id}`);
            }
            existingIds.add(inter.id);
        }
    }
    for (const relation of model.relations) {
        if (existingIds.has(relation.id) || relationIds.has(relation.id)) {
            throw new Error(`Duplicate relation ID: ${relation.id}`);
        }
        relationIds.add(relation.id);
        if (!existingIds.has(relation.start)) {
            throw new Error(`Relation start ID not found: ${relation.start}`);
        }
        if (!existingIds.has(relation.end)) {
            throw new Error(`Relation end ID not found: ${relation.end}`);
        }
    }
}
