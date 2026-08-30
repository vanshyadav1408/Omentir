import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("SEO content")
    .items([
      S.listItem()
        .title("Features")
        .child(
          S.documentTypeList("seoPage")
            .title("Features")
            .filter('_type == "seoPage" && family == "features"')
        ),
      S.listItem()
        .title("Comparisons")
        .child(
          S.documentTypeList("seoPage")
            .title("Comparisons")
            .filter('_type == "seoPage" && family == "comparisons"')
        ),
      S.listItem()
        .title("Integrations")
        .child(
          S.documentTypeList("seoPage")
            .title("Integrations")
            .filter('_type == "seoPage" && family == "integrations"')
        ),
      S.listItem()
        .title("Use cases")
        .child(
          S.documentTypeList("seoPage")
            .title("Use cases")
            .filter('_type == "seoPage" && family == "use-cases"')
        ),
      S.listItem()
        .title("Alternatives")
        .child(
          S.documentTypeList("seoPage")
            .title("Alternatives")
            .filter('_type == "seoPage" && family == "alternatives"')
        ),
      S.divider(),
      S.documentTypeListItem("blogPost").title("Blogs"),
      S.documentTypeListItem("helpArticle").title("Help"),
      S.documentTypeListItem("guide").title("Guides"),
      S.documentTypeListItem("legalPage").title("Legal"),
    ]);
