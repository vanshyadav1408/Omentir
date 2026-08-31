export const SUPPORT_WIDGET_GREETING = "How can we help?";

const GREETING_ATTR = "data-omentir-support-greeting";

export function shouldInjectSupportGreeting(input: {
  hasComposer: boolean;
  isIdentificationForm: boolean;
  hasGreeting: boolean;
  posthogBubbleCount: number;
}) {
  return (
    input.hasComposer &&
    !input.isIdentificationForm &&
    !input.hasGreeting &&
    input.posthogBubbleCount === 0
  );
}

function isIdentificationForm(root: ParentNode) {
  return [...root.querySelectorAll("button")].some(
    (button) => (button.textContent || "").trim() === "Start Chat",
  );
}

function posthogMessageBubbles(root: ParentNode) {
  return [...root.querySelectorAll<HTMLElement>("div")].filter((el) => {
    if (el.hasAttribute(GREETING_ATTR)) return false;
    return el.style.maxWidth === "85%";
  });
}

export function ensureSupportWidgetGreeting(root: ParentNode) {
  if (
    !shouldInjectSupportGreeting({
      hasComposer: Boolean(root.querySelector("textarea")),
      isIdentificationForm: isIdentificationForm(root),
      hasGreeting: Boolean(root.querySelector(`[${GREETING_ATTR}]`)),
      posthogBubbleCount: posthogMessageBubbles(root).length,
    })
  ) {
    return;
  }

  const composer = root.querySelector("textarea");
  const messages = composer?.parentElement?.previousElementSibling;
  if (!(messages instanceof HTMLElement)) return;

  const bubble = document.createElement("div");
  bubble.setAttribute(GREETING_ATTR, "true");
  bubble.style.cssText =
    "display:flex;flex-direction:column;max-width:85%;align-self:flex-start;align-items:flex-start;";
  bubble.innerHTML = `<div style="font-size:10px;color:#939393;margin-bottom:4px;font-weight:500;">Support</div><div style="padding:8px 12px;border-radius:8px;border-bottom-left-radius:2px;font-size:12px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;background:white;color:#020617;border:1.5px solid #dcdcdc;"></div>`;
  const body = bubble.lastElementChild;
  if (body) body.textContent = SUPPORT_WIDGET_GREETING;
  messages.insertBefore(bubble, messages.firstChild);
}

export function watchSupportWidgetGreeting() {
  if (typeof document === "undefined") return () => undefined;
  const run = () => {
    const root = document.getElementById("ph-conversations-widget-container");
    if (root) ensureSupportWidgetGreeting(root);
  };
  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
  run();
  return () => observer.disconnect();
}
