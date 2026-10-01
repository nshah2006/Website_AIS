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
    body: "Workshops are where you get your hands on the tools employers actually use, like SQL, Python, Excel, and cloud platforms. Many sessions run with industry partners, so what you practice in the room is what you'll use on the job.",
    events: ["SQL & Python Workshop", "Resume Workshop", "Excel Bootcamp", "Data Analytics Workshop", "Financial Modeling Workshop"],
  },
  {
    slug: "technology",
    label: "Technology",
    lead: "See where technology is taking business.",
    body: "Tech talks, panels, and deep dives bring you face to face with the people who build and use the technology changing how companies work, from cloud computing and cybersecurity to AI.",
    events: ["AI in Finance Tech Talk", "Hackathon: Build for Business", "Cloud Computing Deep Dive", "Cybersecurity Panel", "Tech Industry Panel"],
  },
  {
    slug: "data",
    label: "Data",
    lead: "Turn data into decisions.",
    body: "Data is at the heart of information systems. You'll learn to query it, analyze it, and turn it into charts, so a pile of numbers becomes an answer a business can act on.",
    events: ["SQL & Python Workshop", "Data Analytics Workshop", "Data Visualization Bootcamp", "SQL for Business Analysts"],
  },
  {
    slug: "business",
    label: "Business",
    lead: "Connect the technical to the strategic.",
    body: "Case competitions, hackathons, and business-focused sessions give you real business problems to solve, from financial modeling to product management and project delivery, the same kinds of challenges you'll meet at work.",
    events: ["Case Competition Finals", "Financial Modeling Workshop", "Product Management 101", "Agile Project Management"],
  },
  {
    slug: "community",
    label: "Community",
    lead: "Open to every major.",
    body: "You don't need a CS degree. We have students from business, engineering, arts, sciences, and everything in between. If you're curious about how technology shapes business, you'll fit right in. Most friendships start at our socials and info sessions.",
    events: ["Poker Night", "Fall Kickoff Social", "Spring Info Session"],
  },
  {
    slug: "career",
    label: "Career",
    lead: "From your first meeting to your first offer.",
    body: "Resume workshops, career fair prep, and networking nights with recruiters from our 18+ partner companies help you turn what you've learned into internships and offers.",
    events: ["Networking Night", "Resume Workshop", "Career Fair Prep Session", "Consulting Networking Night"],
  },
]
