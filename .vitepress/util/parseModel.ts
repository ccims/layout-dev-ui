import { ComponentVersion, Graph, Relation } from "@gropius/graph-editor";
import { parse } from "yaml";
import { Model } from "./model";
import { componentStyles, interfaceStyles, relationStyles } from "./styles";

export function parseModel(model: string): Graph {
    const parsedModel = parse(model) as Model;
    const components: ComponentVersion[] = [];
    const relations: Relation[] = [];
    let relationIdCounter = 0;
    for (const [key, component] of Object.entries(parsedModel)) {
        components.push({
            id: key,
            name: component?.name ?? key,
            style: componentStyles[component?.template ?? "Misc"] ?? componentStyles.Misc,
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
                            contextMenu: "",
                        }))
                    );
                    return {
                        id: key,
                        name: iface?.name,
                        style: interfaceStyles[iface?.template ?? "REST"] ?? interfaceStyles.REST,
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
