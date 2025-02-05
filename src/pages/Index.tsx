import { RepositoryCard } from "@/components/RepositoryCard";

// Example data - replace with your actual data
const repositories = [
  {
    name: "awesome-project",
    description: "A fantastic project that solves all your problems",
    stars: 128,
    forks: 23,
    updatedAt: "2024-02-20",
    installCommand: "npm install awesome-project",
    usage: `import { awesome } from 'awesome-project';\n\nawesome.doSomething();`,
    docsUrl: "https://github.com/org/awesome-project",
  },
  {
    name: "cool-library",
    description: "The coolest library you'll ever use",
    stars: 256,
    forks: 45,
    updatedAt: "2024-02-18",
    installCommand: "npm install cool-library",
    usage: `import { cool } from 'cool-library';\n\ncool.makeItAwesome();`,
    docsUrl: "https://github.com/org/cool-library",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        <h1 className="text-4xl font-bold text-github-gray mb-8">Our Repositories</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {repositories.map((repo) => (
            <RepositoryCard key={repo.name} repo={repo} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;