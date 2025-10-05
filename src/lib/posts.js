export const posts = [
  {
    id: 1,
    userId: 1,
    content: "Finished revising calculus today! Finally understood integration by parts 🎉 #study #math #progress",
    image: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d",
    likes: 120,
    comments: 14,
    timestamp: "2025-10-03T14:30:00Z",
    tags: ["study", "math", "progress"],
  },
  {
    id: 2,
    userId: 2,
    content: "Just deployed my first full-stack app with Vite and FastAPI! It's small, but I learned so much. #coding #project #webdev",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    likes: 256,
    comments: 31,
    timestamp: "2025-10-05T08:15:00Z",
    tags: ["coding", "webdev", "ai"],
  },
  {
    id: 3,
    userId: 3,
    content: "Quick sketch of the campus garden. Drawing between study breaks helps me focus better! #art #relax #campuslife",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    likes: 193,
    comments: 22,
    timestamp: "2025-09-28T09:42:00Z",
    tags: ["art", "studybreak", "creative"],
  },
  {
    id: 4,
    userId: 4,
    content: "Set up an Arduino system that monitors dorm room temperature and sends alerts to my phone. #iot #engineering #automation",
    image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e",
    likes: 278,
    comments: 35,
    timestamp: "2025-10-01T16:50:00Z",
    tags: ["iot", "engineering", "innovation"],
  },
  {
    id: 5,
    userId: 5,
    content: "Studying Japanese verbs today. I found out that taberu and nomu follow the same pattern! #languagelearning #studygram",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
    likes: 89,
    comments: 11,
    timestamp: "2025-09-30T11:00:00Z",
    tags: ["languagelearning", "japanese", "study"],
  },
  {
    id: 6,
    userId: 2,
    content: "Experimenting with an OpenAI API today to build a mini chatbot. It is replying better than I expected! #ai #coding #learning",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    likes: 340,
    comments: 47,
    timestamp: "2025-10-06T09:25:00Z",
    tags: ["ai", "project", "innovation"],
  },
  {
    id: 7,
    userId: 1,
    content: "Morning run, coffee, and study notes equals the best start to the day! #routine #study #motivation",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
    likes: 152,
    comments: 19,
    timestamp: "2025-10-02T06:30:00Z",
    tags: ["motivation", "routine", "lifestyle"],
  },
  {
    id: 8,
    userId: 4,
    content: "Testing a new PCB design for my IoT controller. If it works, I will share the 3D print files. #engineering #pcb #project",
    image: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3",
    likes: 190,
    comments: 23,
    timestamp: "2025-09-29T12:20:00Z",
    tags: ["engineering", "hardware", "iot"],
  },
  {
    id: 9,
    userId: 5,
    content: "Visited a local cafe to study vocabulary today. The atmosphere helps so much. #study #travel #language",
    image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df",
    likes: 134,
    comments: 12,
    timestamp: "2025-10-03T10:45:00Z",
    tags: ["study", "travel", "culture"],
  },
  {
    id: 10,
    userId: 3,
    content: "Color practice session with watercolor. Sometimes I paint just to clear my mind. #arttherapy #creativity #relax",
    image: "https://images.unsplash.com/photo-1473187983305-f615310e7daa",
    likes: 178,
    comments: 21,
    timestamp: "2025-10-04T18:05:00Z",
    tags: ["art", "relax", "creativity"],
  },
];

export function sortPosts(data = posts) {
  return [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getPosts() {
  return sortPosts();
}

export function getPostsByUser(userId) {
  return sortPosts(posts.filter(post => post.userId === userId));
}
