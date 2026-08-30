"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

export default defineConfig({
  name: "omentir",
  title: "Omentir",
  projectId: projectId || "placeholder",
  dataset,
  // Always the Next.js route. Host-root `/` on sanity.omentir.com is a
  // redirect to /studio so this path and the browser URL stay aligned.
  basePath: "/studio",
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
});
