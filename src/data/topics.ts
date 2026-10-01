/* The six areas the hero graph links to, and the Initiatives page that
   explains each. Copy is drawn from what the site already says (What We
   Do, "Open to every major", the event archive); `events` names entries
   in src/data/events.ts, upcoming ones first. */

export type TopicSlug = "workshops" | "technology" | "data" | "business" | "community" | "career"

export interface Topic {
  slug: TopicSlug
  label: string
  lead: string
  body: string
  events: string[]
}

export const TOPICS: Topic[] = [
  {
    slug: "workshops",
    label: "Workshops",
    lead: "Learn the tools by using them.",
    body: "Workshops are where members get hands-on with the tools employers actually use — SQL, Python, Excel, cloud platforms, and more. Sessions are practical and often run alongside industry partners, so what you practice in the room carries straight into internships and jobs.",
    events: ["SQL & Python Workshop", "Resume Workshop", "Excel Bootcamp", "Data Analytics Workshop", "Financial Modeling Workshop"],
  },
  {
    slug: "technology",
    label: "Technology",
    lead: "See where technology is taking business.",
    body: "Tech talks, panels, and deep dives put members in front of the technologies reshaping how companies work — cloud computing, cybersecurity, AI, and what comes next — alongside the professionals who build and use them.",
    events: ["AI in Finance Tech Talk", "Hackathon: Build for Business", "Cloud Computing Deep Dive", "Cybersecurity Panel", "Tech Industry Panel"],
  },
  {
    slug: "data",
    label: "Data",
    lead: "Turn data into decisions.",
    body: "Data sits at the center of information systems. Members build the skills to work with it end to end — querying, analysis, and visualization — so raw numbers become answers a business can act on.",
    events: ["SQL & Python Workshop", "Data Analytics Workshop", "Data Visualization Bootcamp", "SQL for Business Analysts"],
  },
  {
    slug: "business",
    label: "Business",
    lead: "Connect the technical to the strategic.",
    body: "Case competitions, hackathons, and business-focused sessions put members' skills to work on real business problems — financial modeling, product management, and project delivery — the challenges they'll meet in industry.",
    events: ["Case Competition Finals", "Financial Modeling Workshop", "Product Management 101", "Agile Project Management"],
  },
  {
    slug: "community",
    label: "Community",
    lead: "Open to every major.",
    body: "No CS degree required. AIS UTD welcomes students from business, engineering, arts, sciences, and every major in between — if you're curious about how technology shapes the business world, you belong here. Socials and info sessions are where members become friends.",
    events: ["Poker Night", "Fall Kickoff Social", "Spring Info Session"],
  },
  {
    slug: "career",
    label: "Career",
    lead: "From your first meeting to your first offer.",
    body: "Resume workshops, career-fair prep, and networking nights with recruiters from our 18+ partner companies help members turn skills and connections into internships and offers.",
    events: ["Networking Night", "Resume Workshop", "Career Fair Prep Session", "Consulting Networking Night"],
  },
]
