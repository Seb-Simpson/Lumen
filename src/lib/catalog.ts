export type Subject = {
  slug: string;
  name: string;
  category: string;
  description: string;
  question: string;
  detail: string;
  image: string;
  related: string[];
  topics: string[];
  level: string;
};
export const subjects: Subject[] = [
  {
    slug: "astronomy",
    name: "Astronomy",
    category: "Explore the universe",
    description: "A little perspective. An infinite number of questions.",
    question: "What lies beyond what we can see?",
    detail:
      "From our closest celestial neighbours to the edge of the observable universe, astronomy is the story of how we came to understand our place in the cosmos.",
    related: ["physics", "mathematics", "earth-science"],
    topics: ["The solar system", "Stellar evolution", "Galaxies", "Cosmology"],
    level: "All levels",
    image: "astronomy.webp",
  },
  {
    slug: "physics",
    name: "Physics",
    category: "Science & discovery",
    description: "The extraordinary rules of the everyday.",
    question: "What is the universe made of?",
    detail:
      "Explore matter, energy, motion and the elegant laws that connect them. Begin with familiar observations and work towards the most surprising ideas in modern science.",
    related: ["astronomy", "mathematics", "chemistry"],
    topics: ["Motion & forces", "Energy", "Waves & light", "Quantum ideas"],
    level: "All levels",
    image: "physics.webp",
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    category: "Patterns & possibilities",
    description: "Find the hidden patterns that connect our world.",
    question: "Can a pattern explain everything?",
    detail:
      "Mathematics is a language for patterns, structures and change. Explore the beauty of a good question, the precision of a proof and the ways abstract ideas shape everyday life.",
    related: ["physics", "computing", "economics"],
    topics: ["Patterns & proof", "Geometry", "Calculus", "Probability"],
    level: "All levels",
    image: "mathematics.webp",
  },
  {
    slug: "biology",
    name: "Biology",
    category: "The living world",
    description: "Life, in all its remarkable complexity.",
    question: "What does it mean to be alive?",
    detail:
      "Follow life from molecular mechanisms to whole ecosystems. Discover the shared processes, extraordinary adaptations and evolutionary histories of living things.",
    related: ["chemistry", "earth-science", "philosophy"],
    topics: ["Cells", "Evolution", "Genetics", "Ecology"],
    level: "All levels",
    image: "biology.webp",
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    category: "Science & discovery",
    description: "Small interactions. World-changing possibilities.",
    question: "How does matter become something new?",
    detail:
      "Discover how atoms combine and substances transform. Chemistry connects the microscopic world to materials, medicine, living systems and the environment.",
    related: ["physics", "biology", "earth-science"],
    topics: ["Atoms & bonds", "Reactions", "Organic chemistry", "Materials"],
    level: "All levels",
    image: "chemistry.webp",
  },
  {
    slug: "history",
    name: "History",
    category: "History & civilisation",
    description: "Understand the past. See the present differently.",
    question: "Whose stories shape our world?",
    detail:
      "Explore the people, places and decisions that shaped societies. Learn to question sources, weigh evidence and consider the many perspectives through which the past is understood.",
    related: ["economics", "philosophy", "literature"],
    topics: [
      "Ancient civilisations",
      "World histories",
      "Sources & evidence",
      "Modern world",
    ],
    level: "All levels",
    image: "history.webp",
  },
  {
    slug: "computing",
    name: "Computing",
    category: "Technology & computing",
    description: "Understand the ideas behind the digital world.",
    question: "What can a machine understand?",
    detail:
      "Look beneath the screen at algorithms, information and systems. Develop a thoughtful understanding of how computers work and how technology changes society.",
    related: ["mathematics", "philosophy", "economics"],
    topics: [
      "Algorithms",
      "Computer systems",
      "Networks",
      "Artificial intelligence",
    ],
    level: "All levels",
    image: "computing.webp",
  },
  {
    slug: "economics",
    name: "Economics",
    category: "Economics & society",
    description: "People, choices and the systems between them.",
    question: "What do we value — and why?",
    detail:
      "Understand how people and institutions make choices with limited resources. Examine markets, policy and the trade-offs that shape our shared world.",
    related: ["history", "mathematics", "philosophy"],
    topics: ["Incentives", "Markets", "Public policy", "Economic history"],
    level: "All levels",
    image: "economics.webp",
  },
  {
    slug: "literature",
    name: "Literature & language",
    category: "Words & worlds",
    description: "Discover the worlds that words can open.",
    question: "How do stories change the way we see?",
    detail:
      "Explore the craft of writing and the rich possibilities of language. Read across periods and cultures, and develop the tools to interpret stories with care.",
    related: ["history", "philosophy", "arts"],
    topics: [
      "Close reading",
      "World literature",
      "Poetry",
      "Language & meaning",
    ],
    level: "All levels",
    image: "literature.webp",
  },
  {
    slug: "earth-science",
    name: "Earth & nature",
    category: "Nature & earth",
    description: "A deeper understanding of the planet we call home.",
    question: "How does a planet stay alive?",
    detail:
      "Read the planet’s history in rocks, oceans and air. Connect geological time, climate systems and the environments that sustain life.",
    related: ["biology", "chemistry", "astronomy"],
    topics: ["Geological time", "Climate", "Oceans", "Planetary systems"],
    level: "All levels",
    image: "earth-science.webp",
  },
  {
    slug: "philosophy",
    name: "Philosophy",
    category: "Philosophy & ideas",
    description: "Better questions. Broader perspectives.",
    question: "How should we live?",
    detail:
      "Think carefully about knowledge, reality, ethics and meaning. Encounter different traditions of thought and learn to construct, test and challenge an argument.",
    related: ["history", "literature", "computing"],
    topics: ["Ethics", "Knowledge", "Logic", "Mind & consciousness"],
    level: "All levels",
    image: "philosophy.webp",
  },
  {
    slug: "arts",
    name: "Creative arts",
    category: "Art & imagination",
    description: "Look closer. Find a new way of seeing.",
    question: "What makes something art?",
    detail:
      "Explore how people give ideas form through images, objects, spaces and sound. Develop visual literacy and discover the relationships between craft, culture and imagination.",
    related: ["literature", "history", "mathematics"],
    topics: ["Ways of seeing", "Art history", "Design", "Creative practice"],
    level: "All levels",
    image: "arts.webp",
  },
];
export type LearningPath = {
  slug: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  steps: { title: string; description: string }[];
};
export const paths: LearningPath[] = [
  {
    slug: "a-place-in-the-universe",
    title: "A place in the universe",
    description:
      "From our own solar system to the biggest questions in cosmology.",
    subject: "astronomy",
    level: "Beginner",
    steps: [
      {
        title: "Our solar system",
        description:
          "Identify the Sun, planets and smaller bodies; consider how the system formed.",
      },
      {
        title: "The lives of stars",
        description:
          "Explore how stars form, generate energy and change over time.",
      },
      {
        title: "A universe of galaxies",
        description: "Understand the scale, structure and motion of galaxies.",
      },
      {
        title: "The expanding universe",
        description:
          "Consider the evidence for cosmic expansion and the questions that remain.",
      },
    ],
  },
  {
    slug: "the-art-of-thinking",
    title: "The art of thinking clearly",
    description:
      "Build a toolkit for asking sharper questions and evaluating ideas.",
    subject: "philosophy",
    level: "Beginner",
    steps: [
      {
        title: "Ask a better question",
        description: "Separate questions of fact, meaning and value.",
      },
      {
        title: "Arguments & evidence",
        description:
          "Identify premises, conclusions and the evidence that connects them.",
      },
      {
        title: "Challenge your assumptions",
        description:
          "Consider alternative explanations and recognise cognitive biases.",
      },
    ],
  },
  {
    slug: "patterns-to-programs",
    title: "From patterns to programs",
    description: "Meet the mathematical ideas at the heart of computing.",
    subject: "computing",
    level: "Beginner",
    steps: [
      {
        title: "Patterns & abstraction",
        description:
          "Describe a pattern precisely and separate the essential from the incidental.",
      },
      {
        title: "Thinking in algorithms",
        description: "Break a problem into clear, testable steps.",
      },
      {
        title: "Data & decisions",
        description: "Explore how information is represented and compared.",
      },
    ],
  },
  {
    slug: "a-living-planet",
    title: "A living planet",
    description:
      "Connect the Earth’s systems with the remarkable diversity of life.",
    subject: "earth-science",
    level: "Beginner",
    steps: [
      {
        title: "Deep time",
        description: "Build a sense of the Earth’s geological timescale.",
      },
      {
        title: "Life in balance",
        description: "Trace energy and nutrients through an ecosystem.",
      },
      {
        title: "A changing climate",
        description:
          "Understand the difference between weather, climate and long-term change.",
      },
    ],
  },
];
export const getSubject = (slug: string) =>
  subjects.find((s) => s.slug === slug);
export const getPath = (slug: string) => paths.find((p) => p.slug === slug);
export type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: "subject" | "path";
  url: string;
  subject: string;
  image: string;
  level: string;
};
function distance(a: string, b: string) {
  const v = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let prev = v[0];
    v[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const old = v[j + 1];
      v[j + 1] = Math.min(
        v[j + 1] + 1,
        v[j] + 1,
        prev + (a[i] === b[j] ? 0 : 1),
      );
      prev = old;
    }
  }
  return v[b.length];
}
export async function getSearchResults(
  query: string,
  type = "",
  subject = "",
  level = "",
  sort = "relevance",
): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase().slice(0, 120);
  const all: SearchResult[] = [
    ...subjects.map((s) => ({
      id: s.slug,
      title: s.name,
      description: s.description + " " + s.topics.join(" "),
      type: "subject" as const,
      url: "/subjects/" + s.slug,
      subject: s.slug,
      image: s.image,
      level: s.level,
    })),
    ...paths.map((p) => ({
      id: p.slug,
      title: p.title,
      description: p.description,
      type: "path" as const,
      url: "/learning-paths/" + p.slug,
      subject: p.subject,
      image: getSubject(p.subject)!.image,
      level: p.level,
    })),
  ];
  const scored = all.map((r) => {
    const title = r.title.toLowerCase();
    const words = (
      title +
      " " +
      r.description.toLowerCase() +
      " " +
      r.subject
    ).split(/\W+/);
    const tokens = q.split(/\s+/);
    const score = q
      ? tokens.reduce(
          (n, t) =>
            n +
            (title.includes(t)
              ? 10
              : words.some((w) => w.includes(t))
                ? 4
                : words.some((w) => t.length > 3 && distance(w, t) <= 1)
                  ? 2
                  : -30),
          0,
        )
      : 1;
    return { r, score };
  });
  return scored
    .filter(
      ({ r, score }) =>
        score > 0 &&
        (!type || r.type === type) &&
        (!subject || r.subject === subject) &&
        (!level || r.level === level || r.level === "All levels"),
    )
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.r.title.localeCompare(b.r.title)
        : b.score - a.score,
    )
    .map((x) => x.r);
}
