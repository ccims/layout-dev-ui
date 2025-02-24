import { Graph } from "@gropius/graph-editor";
import { parse } from "yaml";
import { Model } from "./model";
import { componentStyles, interfaceStyles, relationStyles } from "./styles";

const DEFAULT = "Default";
const INCLUDES = "Includes";
const HOSTED_ON = "Hosted on";
const CALLS = "Calls";
const DB_CONNECTION = "DB connection";

export function parseModel(model: string, view: string = DEFAULT): Graph {
    const parsedModel = parse(model) as Model;
    const components = [];
    const relations = [];
    let relationIdCounter = 0;
    for (const [key, component] of Object.entries(parsedModel)) {
        const componentRelations = (component?.relations ?? []).map((relation) => ({
            id: `${key}-${relation.to}-${relationIdCounter++}`,
            name: "Unnamed",
            start: key,
            end: relation.to,
            style: relationStyles[relation.template ?? "General"] ?? relationStyles.General,
            template: relation.template ?? "General",
            contextMenu: ""
        }));

        const interfaceRelations = Object.entries(component?.interfaces ?? {}).flatMap(([iKey, iface]) => {
            return (iface.relations ?? []).map((relation) => ({
                id: `${iKey}-${relation.to}-${relationIdCounter++}`,
                name: "Unnamed",
                start: iKey,
                end: relation.to,
                style: relationStyles[relation.template ?? "General"] ?? relationStyles.General,
                template: relation.template ?? "General",
                contextMenu: ""
            }));
        });

        const allRelations = [...interfaceRelations, ...componentRelations];
        let filteredRelations: any[] = [];
        switch (view) {
            case DEFAULT:
                filteredRelations = allRelations;
                break;
            case INCLUDES:
                filteredRelations = allRelations.filter((rel) => rel.template === INCLUDES);
                break;
            case HOSTED_ON:
                filteredRelations = allRelations.filter((rel) => rel.template === HOSTED_ON);
                break;
            case CALLS:
                filteredRelations = allRelations.filter(
                    (rel) => rel.template === DB_CONNECTION || rel.template === CALLS
                );
                break;
        }

        components.push({
            id: key,
            name: component?.name ?? key,
            style: componentStyles[component?.template ?? "Misc"] ?? componentStyles.Misc,
            template: component?.template ?? "Misc",
            issueTypes: [],
            contextMenu: "",
            interfaces:
                view === INCLUDES || view === HOSTED_ON
                    ? []
                    : Object.entries(component?.interfaces ?? {}).map(([iKey, iface]) => ({
                          id: iKey,
                          name: iface?.name,
                          style: interfaceStyles[iface?.template ?? "REST"] ?? interfaceStyles.REST,
                          template: iface?.template ?? "REST",
                          issueTypes: [],
                          contextMenu: ""
                      }))
        });
        relations.push(...filteredRelations);
    }

    if (view !== DEFAULT) {
        const componentIdsWithRelations = new Set<string>();
        for (const relation of relations) {
            componentIdsWithRelations.add(relation.start);
            componentIdsWithRelations.add(relation.end);
        }

        const filteredComponents = components.filter(
            (component) =>
                componentIdsWithRelations.has(component.id) ||
                component.interfaces.some((iface) => componentIdsWithRelations.has(iface.id))
        );
        components.length = 0;
        components.push(...filteredComponents);
    }

    return {
        components,
        relations,
        issueRelations: []
    };
}
