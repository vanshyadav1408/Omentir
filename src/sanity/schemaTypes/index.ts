import {
  blogBody,
  codeBlock,
  contentTable,
  contentTableRow,
  guideSection,
  legalSection,
  seoComparisonRow,
  seoComparisonTable,
  seoConnect,
  seoCta,
  seoFaqItem,
  seoPhase,
  seoRelatedLink,
  seoRoundupItem,
  seoSection,
  seoSetupStep,
  seoThreadLine,
} from "./objects";
import { blogPost } from "./blogPost";
import { guide } from "./guide";
import { helpArticle } from "./helpArticle";
import { legalPage } from "./legalPage";
import { seoPage } from "./seoPage";

export const schemaTypes = [
  seoFaqItem,
  seoRelatedLink,
  seoSection,
  seoSetupStep,
  seoCta,
  seoComparisonRow,
  seoComparisonTable,
  seoRoundupItem,
  seoPhase,
  seoThreadLine,
  seoConnect,
  guideSection,
  legalSection,
  contentTableRow,
  contentTable,
  codeBlock,
  blogBody,
  seoPage,
  blogPost,
  helpArticle,
  guide,
  legalPage,
];
