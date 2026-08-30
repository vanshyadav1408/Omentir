"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { studioBasePathForHost } from "./src/sanity/studio-host";

function studioBasePath() {
  if (typeof window === "undefined") return "/studio";
  return studioBasePathForHost(window.location.hostname);
}

export default defineConfig({
  name: "omentir",
  title: "Omentir",
  projectId: projectId || "placeholder",
  dataset,
  basePath: studioBasePath(),
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
});
