# Gropius Layout DEV UI

## Request Format

```ts
type RequestBody = Graph;

interface Graph {
    components: ComponentVersion[];
    relations: Relation[];
}

interface ComponentVersion extends Node {
    name: string;
    style: ShapeStyle;
    interfaces: Interface[];
}

interface Interface extends Node {
    name: string;
    style: ShapeStyle;
};

interface Relation extends Node {
    name: string;
    start: string;
    end: string;
    style: RelationStyle;
}

interface Node {
    id: string;
}

interface StrokeStyle {
    stroke?: {
        color?: string;
        dash?: number[];
    };
}

interface FillStyle {
    fill?: {
        color: string;
    };
}

interface ShapeStyle extends StrokeStyle, FillStyle {
    shape: Shape;
    radius?: number;
}

interface RelationStyle extends StrokeStyle {
    marker: Marker;
}

type Shape = "RECT" | "CIRCLE" | "ELLIPSE" | "RHOMBUS" | "HEXAGON";

type Marker =
    | "ARROW"
    | "DIAMOND"
    | "FILLED_DIAMOND"
    | "TRIANGLE"
    | "FILLED_TRIANGLE"
    | "CIRCLE"
    | "FILLED_CIRCLE";
```

::: info
Note: this may be extended in the future to contain the size of components / interfaces.
Further, the actual response body contains some additional fields which can be safely ignored.
:::



## Expected Response Format

```ts
type ResponseBody = GraphLayout;

interface GraphLayout {
  [id: string]: ElementLayout | RelationLayout;
}

interface ElementLayout {
  pos: Point;
}

interface RelationLayout {
  points: Point[];
}

interface Point {
  x: number;
  y: number;
}
```
