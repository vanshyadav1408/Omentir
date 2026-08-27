export const NAV = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "AI Agents" },
  { id: "messages", label: "Messages" },
  { id: "leads", label: "Leads" },
] as const;

export const FILTERS = ["VP Sales", "Head of Growth", "B2B SaaS", "United States"] as const;

export const MATCHES = [
  { label: "Title", value: "VP Sales" },
  { label: "Industry", value: "B2B SaaS" },
  { label: "Location", value: "United States" },
  { label: "Company size", value: "11 - 50" },
] as const;

export const LEADS = [
  { name: "Priya Nair", title: "Head of Growth", score: 94, status: "Messaged" },
  { name: "James Okonkwo", title: "Founder", score: 91, status: "Invited" },
  { name: "Elena Voss", title: "VP Sales", score: 88, status: "Replied" },
  { name: "Noah Berg", title: "CRO", score: 86, status: "Messaged" },
  { name: "Amina Rahman", title: "Head of Sales", score: 84, status: "New" },
  { name: "Dana Whitfield", title: "VP Revenue", score: 79, status: "New" },
  { name: "Marco Silva", title: "Sales Director", score: 74, status: "New" },
  { name: "Tomas Keller", title: "Account Manager", score: 52, status: "Low fit" },
  { name: "Chris Pell", title: "Sales intern", score: 41, status: "Low fit" },
] as const;

export const SCAN_FACES = [
  "Priya Nair",
  "James Okonkwo",
  "Elena Voss",
  "Noah Berg",
  "Amina Rahman",
  "Chris Pell",
] as const;

export const FACE_FILE: Record<string, string> = {
  You: "home-mock/you.jpg",
  "Priya Nair": "home-mock/priya-nair.jpg",
  "James Okonkwo": "home-mock/james-okonkwo.jpg",
  "Elena Voss": "home-mock/elena-voss.jpg",
  "Chris Pell": "home-mock/chris-pell.jpg",
  "Amina Rahman": "home-mock/amina-rahman.jpg",
  "Noah Berg": "home-mock/noah-berg.jpg",
};

export type ChatEvent =
  | { kind: "sys"; text: string }
  | { kind: "you"; text: string; when?: string }
  | { kind: "them"; text: string; when?: string };

export type Thread = {
  name: string;
  title: string;
  preview: string;
  time: string;
  booked?: boolean;
  interested?: boolean;
  log: ChatEvent[];
};

export const THREADS: Thread[] = [
  {
    name: "Elena Voss",
    title: "VP Sales",
    preview: "Yes, booked Thursday 11am PT.",
    time: "2m",
    booked: true,
    log: [
      { kind: "sys", text: "Invite sent Monday 8:04am" },
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "Hi, saw you're hiring AEs. Will the new reps be building their own pipeline too?",
        when: "Tue 9:12am",
      },
      {
        kind: "them",
        text: "Yes, for now. We don't have SDR coverage yet.",
        when: "Wed 4:18pm",
      },
      { kind: "sys", text: "Follow-up sent after 3 days" },
      {
        kind: "you",
        text: "That's the gap I'm working on at Harborline. Want to see how we find buyers on LinkedIn without adding an SDR team?",
        when: "Fri 9:02am",
      },
      {
        kind: "them",
        text: "Yes, that'd be useful. Thursday morning?",
        when: "Fri 11:41am",
      },
      {
        kind: "you",
        text: "Thursday works. Here's my calendar: calendly.com/you/20min",
        when: "Fri 11:58am",
      },
      {
        kind: "them",
        text: "Yes, booked Thursday 11am PT.",
        when: "Fri 12:06pm",
      },
    ],
  },
  {
    name: "Priya Nair",
    title: "Head of Growth",
    preview: "You: Harborline just opened an AE seat.",
    time: "1h",
    log: [
      { kind: "sys", text: "Connection request accepted" },
      { kind: "you", text: "Harborline just opened an AE seat. Who owns filling it?" },
    ],
  },
  {
    name: "Dana Whitfield",
    title: "VP Revenue",
    preview: "Interested. What does setup look like?",
    time: "2h",
    interested: true,
    log: [
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "Saw the AE roles. Do new reps have to build pipeline themselves right now?",
      },
      { kind: "them", text: "Interested. What does setup look like?" },
    ],
  },
  {
    name: "Noah Berg",
    title: "CRO",
    preview: "Next quarter is tight on new tools.",
    time: "3h",
    log: [
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "If AE hires are expected to find their own meetings, that's the part we help with.",
      },
      { kind: "them", text: "Next quarter is tight on new tools." },
    ],
  },
  {
    name: "James Okonkwo",
    title: "Founder",
    preview: "Connection request sent",
    time: "1d",
    log: [{ kind: "sys", text: "Connection request sent" }],
  },
  {
    name: "Marco Silva",
    title: "Sales Director",
    preview: "Follow-up scheduled for Monday",
    time: "2d",
    log: [
      { kind: "sys", text: "Connection request accepted" },
      {
        kind: "you",
        text: "Curious how new AEs get their first meetings in the first 90 days.",
      },
      { kind: "sys", text: "Follow-up scheduled for Monday" },
    ],
  },
];

export const PRODUCT_FIELDS = [
  { label: "Company Name", value: "Harborline" },
  { label: "Website", value: "harborline.com" },
  { label: "Industry", value: "Software Development & SaaS" },
  { label: "Company Size", value: "11 - 50 employees" },
  {
    label: "Company Description",
    value: "We help VP Sales fill AE pipeline from LinkedIn without an SDR team.",
    wide: true,
  },
  {
    label: "Pain Points",
    value: "AE seats open, no SDR team, outbound lives in the founder's LinkedIn.",
    wide: true,
  },
  { label: "Demo booking link", value: "calendly.com/you/20min", wide: true },
] as const;

export const CAPTIONS = [
  "Briefly describe your product",
  "Watch Omentir find matching leads",
  "See Omentir book you meetings.",
] as const;

export const NARRATION =
  "Omentir will find you customers. Describe your product. It finds matching leads on LinkedIn, sends invites and follow-ups from your account, and books meetings into one inbox. Forty-nine dollars a month. Three bookings a week, or you pay nothing.";

/** First voiced frame. Matches the launch script word clock. */
export const VO_FROM = 8;
