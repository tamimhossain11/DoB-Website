/**
 * ─────────────────────────────────────────────────────────────
 *  Dreams of Bangladesh — site content
 *  Everything the site says lives here. Edit this file to change
 *  copy, stats, projects, competitions, team and contact details
 *  without touching any component.
 *
 *  ⚠ Items marked "// VERIFY" are drawn from public reporting and
 *  should be confirmed against your own records before launch.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: 'Dreams of Bangladesh',
  short: 'DOB',
  tagline: 'Robotics · Rovers · Exploration',
  email: 'dreamsofbangladesh@gmail.com', // confirmed by the WICE 2026 press release
  phone: '+880 1746 342152',
  phoneAlt: '+880 1754-002201',
  location: 'West Dhanmondi R/A, Bosila, Mohammadpur, Dhaka',
  website: 'dreamsofbangladesh.com',
  founded: 2021, // confirmed by the WICE 2026 press release
}

export const nav = [
  { label: 'Mission', href: '#mission' },
  { label: 'Projects', href: '#projects' },
  { label: 'Campaigns', href: '#campaigns' },
  { label: 'Team', href: '#team' },
  { label: 'Partners', href: '#partners' },
]

export const hero = {
  kicker: 'Youth-led robotics · Dhaka, Bangladesh',
  headline: ['We build machines', 'that carry a flag'],
  lede: 'Dreams of Bangladesh is a student-led engineering team designing rovers, autonomous surface and underwater vehicles, and exploration systems — and racing them against the best universities on Earth.',
  primaryCta: { label: 'See our machines', href: '#projects' },
  secondaryCta: { label: 'Partner with us', href: '#partners' },
  badges: ['NASA Human Exploration Rover Challenge', 'European Rover Challenge', 'RoboSub', 'RoboBoat'],
}

export const stats = [
  { value: 'Top 10', label: 'NASA Human Exploration Rover Challenge', note: 'Only Asian team at that stage' }, // VERIFY
  { value: '4', label: 'International campaigns entered', note: 'Land, sea and surface' }, // VERIFY
  { value: '60+', label: 'Student engineers mobilised', note: 'Across partner institutions' }, // VERIFY
  { value: '1', label: 'Best Innovator Award', note: 'Presented by Dr. Muhammad Yunus' }, // VERIFY
]

/* Scrolling marquee under the hero */
export const marquee = [
  'Design',
  'Fabricate',
  'Test',
  'Fail',
  'Iterate',
  'Compete',
  'Bring it home',
]

export const mission = {
  kicker: 'The mission',
  heading: 'A country of 170 million deserves a seat at the engineering table.',
  body: [
    'Dreams of Bangladesh started with a simple refusal: that world-class engineering happens somewhere else, to someone else. We are students and recent graduates from institutions across Bangladesh who build competition-grade robots in workshops we assembled ourselves.',
    'Every season we pick a hard problem — traverse lunar terrain, navigate an unmapped channel, hold depth and heading with no GPS — and we build the machine that solves it. Then we take it abroad and put it on the line against teams with a hundred times our budget.',
  ],
  pillars: [
    {
      title: 'Engineering, end to end',
      body: 'Chassis, drivetrain, electronics, firmware, autonomy stack and ground station — designed, machined and written in house.',
    },
    {
      title: 'Competition as a forcing function',
      body: 'International deadlines and scored runs are honest teachers. A rover either climbs the obstacle or it does not.',
    },
    {
      title: 'Open the door behind us',
      body: 'Every member trains the next intake. Documentation, build logs and design reviews stay with the team, not with individuals.',
    },
  ],
}

export const projects = [
  {
    code: 'DOB-R1',
    name: 'Rover Programme',
    domain: 'Terrestrial · Human-powered & remote',
    year: 'Ongoing',
    summary:
      'A collapsible, human-powered rover engineered for simulated lunar and Martian terrain — crater rims, boulder fields, loose regolith and erosion ruts.',
    specs: [
      ['Chassis', 'Welded 6061-T6 space frame'],
      ['Drive', 'Chain-driven, independently sprung'],
      ['Stow', 'Folds to a 5 ft × 5 ft × 5 ft cube'],
      ['Tasks', 'On-board sample collection & survey'],
    ],
    accent: 'flag',
  },
  {
    code: 'DOB-A1',
    name: 'Autonomous Underwater Vehicle',
    domain: 'Subsea · Fully autonomous',
    year: 'Ongoing',
    summary:
      'An AUV that holds depth and heading without GPS, identifies scored targets by vision, and completes a mission plan with no operator in the loop.',
    specs: [
      ['Hull', 'Pressure-rated acrylic + aluminium end caps'],
      ['Thrust', '8-thruster vectored configuration'],
      ['Sense', 'Stereo vision, IMU, depth, hydrophones'],
      ['Stack', 'ROS 2 · behaviour-tree mission planner'],
    ],
    accent: 'crimson',
  },
  {
    code: 'DOB-S1',
    name: 'Autonomous Surface Vessel',
    domain: 'Surface · Fully autonomous',
    year: 'Ongoing',
    summary:
      'A catamaran ASV that reads a buoy channel, docks unaided and delivers payload — built for the delta country that raised it.',
    specs: [
      ['Hull', 'Twin-hull composite catamaran'],
      ['Drive', 'Differential electric propulsion'],
      ['Sense', 'LiDAR, RGB camera, RTK GNSS'],
      ['Autonomy', 'Perception → planner → controller'],
    ],
    accent: 'flag',
  },
  {
    code: 'DOB-X',
    name: 'Ground Control and Telemetry',
    domain: 'Software · Cross-programme',
    year: 'Ongoing',
    summary:
      'One ground station for every machine we field: live telemetry, video, health monitoring, run logging and post-run analysis.',
    specs: [
      ['Link', 'Long-range telemetry with failsafe'],
      ['UI', 'Web-based operator console'],
      ['Data', 'Full-run replay & flight review'],
      ['Safety', 'Hardware e-stop, watchdog, geofence'],
    ],
    accent: 'crimson',
  },
]

export const campaigns = [
  {
    year: '2026',
    name: 'European Rover Challenge',
    place: 'Poland',
    status: 'Qualified',
    body: 'Selected to compete in the international rover competition held on one of the largest artificial Mars yards in Europe.', // VERIFY
  },
  {
    year: '2025',
    name: 'RoboBoat',
    place: 'Sarasota, Florida, USA',
    status: 'Competed',
    body: 'Fielded an autonomous surface vessel against university teams from across the world.', // VERIFY
  },
  {
    year: '2025',
    name: 'RoboSub',
    place: 'Irvine, California, USA',
    status: 'Competed',
    body: 'Entered the international autonomous underwater vehicle competition hosted by RoboNation.', // VERIFY
  },
  {
    year: '2024',
    name: 'NASA Human Exploration Rover Challenge',
    place: 'Huntsville, Alabama, USA',
    status: 'Top 10 · Only Asian team',
    body: 'Placed in the global top ten at NASA Marshall Space Flight Center — the only team from Asia at that stage of the competition.', // VERIFY
  },
]

export const awards = [
  { title: 'Best Innovator Award', by: 'Presented by Dr. Muhammad Yunus', year: '—' }, // VERIFY
  { title: 'Top 10 — Global', by: 'NASA Human Exploration Rover Challenge', year: '2024' }, // VERIFY
  { title: 'Only Asian team at stage', by: 'NASA HERC final excursion', year: '2024' }, // VERIFY
]

export const divisions = [
  {
    name: 'Mechanical',
    body: 'Structures, drivetrain, suspension, manipulators, manufacturing and tolerance.',
    tags: ['CAD', 'FEA', 'Machining', 'Composites'],
  },
  {
    name: 'Electrical',
    body: 'Power distribution, motor control, harnessing, PCB design and failure-safe wiring.',
    tags: ['PCB', 'Power', 'Motors', 'Harness'],
  },
  {
    name: 'Software & Autonomy',
    body: 'Perception, state estimation, planning, control loops and the ground station.',
    tags: ['ROS 2', 'C++', 'Python', 'Vision'],
  },
  {
    name: 'Operations',
    body: 'Logistics, documentation, sponsorship, travel and competition compliance.',
    tags: ['Docs', 'Outreach', 'Funding', 'Logistics'],
  },
]

/* Replace with your real roster — photo is optional (initials are used as fallback). */
export const team = [
  { name: 'Team Lead', role: 'Team Captain', division: 'Operations' },
  { name: 'Mechanical Lead', role: 'Head of Structures', division: 'Mechanical' },
  { name: 'Electrical Lead', role: 'Head of Power & Control', division: 'Electrical' },
  { name: 'Autonomy Lead', role: 'Head of Software', division: 'Software & Autonomy' },
  { name: 'Systems Engineer', role: 'Integration & Test', division: 'Mechanical' },
  { name: 'Outreach Lead', role: 'Partnerships', division: 'Operations' },
]

export const partners = {
  kicker: 'Partners & sponsors',
  heading: 'Every bolt on our rover was paid for by someone who believed first.',
  body: 'We travel with excess baggage full of aluminium and hope. Sponsorship pays for materials, machining, shipping and the flights that put a Bangladeshi team on an international field. If your organisation wants its name on that machine, we would like to talk.',
  tiers: [
    {
      name: 'Title Partner',
      body: 'Primary placement on the machine, team kit, ground station and every competition photograph.',
      perks: ['Logo on chassis & kit', 'Named in all press', 'Annual design review invite', 'Recruiting access'],
      featured: true,
    },
    {
      name: 'Systems Partner',
      body: 'Back a specific subsystem — drivetrain, power, autonomy — and be credited on it.',
      perks: ['Subsystem naming', 'Logo on team kit', 'Build-log features'],
      featured: false,
    },
    {
      name: 'In-Kind Partner',
      body: 'Materials, machining time, components, software licences, workshop or travel support.',
      perks: ['Logo on site & kit', 'Social features', 'Team visit'],
      featured: false,
    },
  ],
}

export const join = {
  kicker: 'Join the team',
  heading: 'We are looking for people who finish things.',
  body: 'You do not need a perfect CV. You need to be able to pick up a problem, stay with it past the point it stops being fun, and hand back something that works. We will teach you the rest.',
  points: [
    'Open to students and recent graduates across Bangladesh',
    'Mechanical, electrical, software and operations intakes',
    'Training provided — prior competition experience not required',
    'Expect long build weekends and honest design reviews',
  ],
  cta: { label: 'Write to us', href: 'mailto:dreamsofbangladesh@gmail.com' },
}

/** Official Facebook page — the team's main public channel. */
export const facebook = {
  label: 'Facebook',
  handle: '@dreamsofbangladeshoffcial',
  href: 'https://www.facebook.com/dreamsofbangladeshoffcial',
}

export const socials = [
  { label: facebook.label, href: facebook.href },
  { label: 'LinkedIn', href: '#' }, // VERIFY
  { label: 'Instagram', href: '#' }, // VERIFY
  { label: 'YouTube', href: '#' }, // VERIFY
]
