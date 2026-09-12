---
name: linkedin-outreach
description: >
  Run LinkedIn prospecting and outreach through Omentir MCP. Use this when a
  Grok Bot or Cursor agent should find people, score fit, draft messages, or
  check campaigns. Never sign into LinkedIn on the Bot computer.
---

# LinkedIn outreach through Omentir

Omentir already holds the user's LinkedIn connection and daily send limits. Talk to that workspace over MCP. Do not open LinkedIn in the Bot browser. Do not ask the user to take over for a LinkedIn password, passkey, two-factor code, or CAPTCHA.

## First calls

1. `omentir_get_context`
2. `omentir_get_product_profile`
3. `omentir_list_linkedin_accounts`
4. `omentir_list_agents`

If LinkedIn is not connected or My Product is empty, stop and tell the user to finish that in Omentir. Do not guess ICP from a homepage.

## Finding people

- Classic finder: `omentir_create_agent` with a prompt plus titles, industries, locations, and keywords. Show the config and wait for a yes before creating.
- Steal Customers: `mode: "steal_customers"` plus competitor or founder URLs. My Product must already be set.
- After create, discovery can still be empty. Use `omentir_list_activity` before treating that as failure.
- Score from evidence on the lead. Rewrite a note that could fit two buyers.

## Sending

Default to research and drafts only. Do not send, enroll, or reply unless the user asks in this session.

If they do ask to send, Omentir's planner owns timing. Read `omentir_list_scheduled_actions` for committed send times. Stay inside `omentir_get_context` remaining invite and message allowance.

Replies only go through `omentir_reply_to_lead` on an existing thread.

## Grok Bot

Installed plugins are account-wide. Attach this plugin with `@omentir`. Keep this stop rule in the Bot description: research and draft only. Never send. Never enroll. Never sign into LinkedIn.
