export type ComponentTemplate = "Microservice" | "Infrastructure" | "Database" | "Frontend" | "Sidecar" | "Messaging" | "Library" | "Misc"
export type InterfaceTemplate = "GraphQL" | "REST" | "gRPC" | "Messaging_Consumer"
export type RelationTemplate = "General" | "Includes" | "Calls" | "Hosted_On" | "Uses_Sidecar" | "DB_Connection"

export interface Relation {
    to: string;
    template: RelationTemplate;
}

export interface Interface {
    name: string;
    template: InterfaceTemplate;
    relations: Relation[];
}

export interface Component {
    name: string;
    template: ComponentTemplate;
    interfaces: Record<string, Interface>;
    relations: Relation[];
}

export type Model = Record<string, Component>;