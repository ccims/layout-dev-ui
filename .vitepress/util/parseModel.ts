import { Graph } from "@gropius/graph-editor";
import { parse } from "yaml";
import { Model } from "./model";
import { componentStyles, interfaceStyles, relationStyles } from "./styles";

export function parseModel(model: string): Graph {
    const parsedModel = parse(model) as Model;
    const components = [];
    const relations = [];
    let relationIdCounter = 0;
    for (const [key, component] of Object.entries(parsedModel)) {
        components.push({
            id: key,
            name: component?.name ?? key,
            style: componentStyles[component?.template ?? "Misc"] ?? componentStyles.Misc,
            template: component?.template ?? "Misc",
            issueTypes: [],
            contextMenu: "",
            interfaces: Object.entries(component?.interfaces ?? {}).map(
                ([key, iface]) => {
                    relations.push(
                        ...(iface.relations ?? []).map((relation) => ({
                            id: `${key}-${relation.to}-${relationIdCounter++}`,
                            name: "Unnamed",
                            start: key,
                            end: relation.to,
                            style: relationStyles[relation.template ?? "General"] ?? relationStyles.General,
                            template: relation.template ?? "General",
                            contextMenu: "",
                        }))
                    );
                    return {
                        id: key,
                        name: iface?.name,
                        style: interfaceStyles[iface?.template ?? "REST"] ?? interfaceStyles.REST,
                        template: iface?.template ?? "REST",
                        issueTypes: [],
                        contextMenu: "",
                    };
                }
            ),
        });
        relations.push(
            ...(component?.relations ?? []).map((relation) => ({
                id: `${key}-${relation.to}-${relationIdCounter++}`,
                name: "Unnamed",
                start: key,
                end: relation.to,
                style: relationStyles[relation.template ?? "General"] ?? relationStyles.General,
                template: relation.template ?? "General",
                contextMenu: "",
            }))
        );
    }
    return {
        components,
        relations,
        issueRelations: [],
    };
}
