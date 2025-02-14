
export interface GitHubRepo {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
}

export interface CategoryData {
  label: string;
  description: string;
  icon?: React.ReactNode;
  repos: string[];
}

export interface FormattedRepo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  updatedAt: string;
  docsUrl: string;
}
