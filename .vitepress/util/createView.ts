import { Graph } from "@gropius/graph-editor";
import { parse } from "yaml";
import { Model } from "./model";
import { componentStyles, interfaceStyles, relationStyles } from "./styles";

// TODO this is basically the parseModel function just with some filtering for tests.
//  Needs more work though, as the filtered model must be parsed back towards yaml for the editor
export function createView(model: string): Graph {
    const parsedModel = parse(model) as Model;
    const components = [];
    const relations = [];
    let relationIdCounter = 0;

    for (const [key, component] of Object.entries(parsedModel)) {
        // Filter the relations to include only those of type "Includes"
        const filteredComponentRelations = (component?.relations ?? [])
            .filter(relation => relation.template === "Includes");

        // Check if the component has any filtered relations
        if (filteredComponentRelations.length > 0) {
            // Push the component with its interfaces
            components.push({
                id: key,
                name: component?.name ?? key,
                style: componentStyles[component?.template ?? "Misc"] ?? componentStyles.Misc,
                template: component?.template ?? "Misc",
                issueTypes: [],
                contextMenu: "",
                interfaces: Object.entries(component?.interfaces ?? {}).map(([key, iface]) => {
                    const filteredInterfaceRelations = (iface.relations ?? [])
                        .filter(relation => relation.template === "Includes");

                    relations.push(
                        ...filteredInterfaceRelations.map((relation) => ({
                            id: `${key}-${relation.to}-${relationIdCounter++}`,
                            name: "Unnamed",
                            start: key,
                            end: relation.to,
                            style: relationStyles[relation.template ?? "General"] ?? relationStyles.General,
                            template: relation.template ?? "General",
                            contextMenu: ""
                        }))
                    );

                    return {
                        id: key,
                        name: iface?.name,
                        style: interfaceStyles[iface?.template ?? "REST"] ?? interfaceStyles.REST,
                        template: iface?.template ?? "REST",
                        issueTypes: [],
                        contextMenu: ""
                    };
                })
            });

            // Push filtered component relations
            relations.push(
                ...filteredComponentRelations.map(relation => ({
                    id: `${key}-${relation.to}-${relationIdCounter++}`,
                    name: "Unnamed",
                    start: key,
                    end: relation.to,
                    style: relationStyles[relation.template ?? "General"] ?? relationStyles.General,
                    template: relation.template ?? "General",
                    contextMenu: ""
                }))
            );
        }
    }

    return {
        components,
        relations,
        issueRelations: []
    };
}
