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
  template: string;
  interfaces: Interface[];
  size: Size;
}

interface Interface extends Node {
  name: string;
  style: ShapeStyle;
  template: string;
  size: Size;
}

interface Relation extends Node {
  name: string;
  start: string;
  end: string;
  style: RelationStyle;
  template: string;
}

interface Node {
  id: string;
}

interface Size {
  width: number;
  height: number;
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

type Marker = "ARROW" | "DIAMOND" | "FILLED_DIAMOND" | "TRIANGLE" | "FILLED_TRIANGLE" | "CIRCLE" | "FILLED_CIRCLE";
```

::: info
Note: this may be extended in the future to contain the size of components / interfaces.
Further, the actual response body contains some additional fields which can be safely ignored.
:::

## Expected Response Format

```ts
type ResponseBody =
  | {
      status: "success";
      data: GraphLayout;
    }
  | {
      status: "error";
      message: string;
    };

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
