import { apiVersion, dataset, projectId } from "./env";

export const readToken = process.env.SANITY_API_READ_TOKEN || "";

export { apiVersion, dataset, projectId };
