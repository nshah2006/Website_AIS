/* Event data shared by the home page, the Events archive and the
   Initiatives page. `date` on upcoming events is either "Mon D, YYYY"
   or a label such as "Date TBA". */

export interface UpcomingEvent {
  name: string
  date: string
  type: string
  desc: string
  partner: string | null
  photo: string
  /* Optional external sign-up form; replaces the in-site RSVP. */
  rsvpUrl?: string
  /* Optional. With `time` ("18:00", Central) the calendar entry is timed;
     without it the event is added as an all-day entry. */
  time?: string
  durationMin?: number
  location?: string
}

export interface PastEvent {
  name: string
  partner: string | null
  date: string
  photo: string
}

export const UPCOMING: UpcomingEvent[] = [
  { name: "Poker Night", date: "Date TBA", type: "Social", desc: "Details coming soon.", partner: null, rsvpUrl: "https://forms.gle/oNEGjTbjvZ3soo6Y6", photo: "1704121421071-72b8509da9a8" },
  { name: "SQL & Python Workshop", date: "Sep 27, 2026", type: "Workshop", desc: "A hands-on session on the basics of querying data and writing scripts.", partner: null, photo: "1516321318423-f06f85e504b3" },
  { name: "Networking Night", date: "Oct 5, 2026", type: "Networking", desc: "Meet consulting and tech recruiters at a relaxed mixer.", partner: "Deloitte", photo: "1515187029135-18ee286d815b" },
]

export const ALL_EVENTS: PastEvent[] = [
  { name: "Resume Workshop", partner: "Capital One", date: "October 2025", photo: "1556761175-b413da4baf72" },
  { name: "AI in Finance Tech Talk", partner: "Goldman Sachs", date: "September 2025", photo: "1504384308090-c894fdcc538d" },
  { name: "Case Competition Finals", partner: null, date: "March 2025", photo: "1522202176988-66273c2fd55f" },
  { name: "Consulting Networking Night", partner: "Deloitte", date: "February 2025", photo: "1515187029135-18ee286d815b" },
  { name: "Hackathon: Build for Business", partner: null, date: "April 2025", photo: "1550751827-4bd374c3f58b" },
  { name: "Spring Info Session", partner: null, date: "January 2025", photo: "1531058020387-3be344556be6" },
  { name: "Excel Bootcamp", partner: "EY", date: "November 2024", photo: "1573496359142-b8d87734a5a2" },
  { name: "Data Analytics Workshop", partner: "Accenture", date: "October 2024", photo: "1559136555-9303baea8ebd" },
  { name: "Career Fair Prep Session", partner: "PwC", date: "September 2024", photo: "1542744173-8e7e53415bb0" },
  { name: "Cloud Computing Deep Dive", partner: "AWS", date: "August 2024", photo: "1451187580459-43490279c0fa" },
  { name: "Product Management 101", partner: "Google", date: "April 2024", photo: "1498050108023-c5249f4df085" },
  { name: "Cybersecurity Panel", partner: "CrowdStrike", date: "March 2024", photo: "1614064641938-beddec4f87a2" },
  { name: "Financial Modeling Workshop", partner: "JP Morgan", date: "February 2024", photo: "1611974789855-9c2a0a7236a3" },
  { name: "Tech Industry Panel", partner: "Meta", date: "January 2024", photo: "1535378917042-10a22c95931a" },
  { name: "Data Visualization Bootcamp", partner: "Tableau", date: "December 2023", photo: "1551288049-bebda4e38f71" },
  { name: "Blockchain & Web3 Overview", partner: null, date: "November 2023", photo: "1639762681485-074b7f938ba0" },
  { name: "Fall Kickoff Social", partner: null, date: "August 2023", photo: "1540575467100-59a4a8e8d2b6" },
  { name: "SQL for Business Analysts", partner: "Microsoft", date: "October 2023", photo: "1516321318423-f06f85e504b3" },
  { name: "UX Research Methods", partner: "IBM", date: "September 2023", photo: "1581291518633-83b4ebd1d83e" },
  { name: "Agile Project Management", partner: "Salesforce", date: "July 2023", photo: "1507679799987-c73779587ccf" },
]
