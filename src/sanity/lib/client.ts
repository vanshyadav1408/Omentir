import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, readToken } from "../env.server";

export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: false,
  token: readToken || undefined,
  perspective: "published",
  stega: false,
});
