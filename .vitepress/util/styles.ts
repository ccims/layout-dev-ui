import { ShapeStyle, RelationStyle } from "@gropius/graph-editor";
import { ComponentTemplate, InterfaceTemplate, RelationTemplate } from "./model";

export const componentStyles: Record<ComponentTemplate, ShapeStyle> = {
    Microservice: {
        shape: "HEXAGON",
        stroke: {}
    },
    Infrastructure: {
        shape: "RECT",
        radius: 5,
        stroke: {}
    },
    Database: {
        shape: "CIRCLE",
        stroke: {}
    },
    Frontend: {
        shape: "RECT",
        stroke: {}
    },
    Sidecar: {
        shape: "RHOMBUS",
        stroke: {}
    },
    Messaging: {
        shape: "RHOMBUS",
        radius: 5,
        stroke: {}
    },
    Library: {
        shape: "ELLIPSE",
        stroke: {}
    },
    Misc: {
        shape: "RECT",
        stroke: {}
    }
};

export const interfaceStyles: Record<InterfaceTemplate, ShapeStyle> = {
    GraphQL: {
        shape: "HEXAGON",
        stroke: {}
    },
    REST: {
        shape: "CIRCLE",
        stroke: {}
    },
    gRPC: {
        shape: "RHOMBUS",
        stroke: {}
    },
    Messaging_Consumer: {
        shape: "RHOMBUS",
        stroke: {}
    }
};

export const relationStyles: Record<RelationTemplate, RelationStyle> = {
    General: {
        marker: "ARROW",
        stroke: {}
    },
    Includes: {
        marker: "FILLED_CIRCLE",
        stroke: {}
    },
    Calls: {
        marker: "FILLED_TRIANGLE",
        stroke: {}
    },
    Hosted_On: {
        marker: "TRIANGLE",
        stroke: {}
    },
    Uses_Sidecar: {
        marker: "CIRCLE",
        stroke: {}
    },
    DB_Connection: {
        marker: "DIAMOND",
        stroke: {}
    }
};
