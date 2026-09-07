/* The vendored ThreeUI source imports Three.js as "three128" (see next.config.ts
   for the bundler alias). Point the type checker at the installed three types. */
declare module "three128" {
  export * from "three";
}
