// types/next.d.ts
import "next";

declare module "next" {
  interface RouteContext<P = {}> {
    params: P;
  }
}
