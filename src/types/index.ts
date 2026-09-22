export type DomainType = "Technical" | "Corporate" | "Creative";

export type ClubPosition = 
  | "Head" 
  | "co-head"
  | "Maintainer" 
  | "Volunteer";

export interface StatusHistoryEntry {
  position: ClubPosition | string;
  year: string; // e.g. "2024-25", "2023-24"
}

export interface TeamMember {
  _id: string;
  name: string;
  imageUrl: string;
  domain: DomainType;
  caption?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  statusHistory: StatusHistoryEntry[];
  featured?: boolean;
  order?: number; // Optional priority index for ordering within hierarchy
  index?: number; // Alias for order
  regNo?: string; // SRM Registration Number (Internal admin identifier, omitted from public responses)
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubEvent {
  _id: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string;
  date: string;
  time: string;
  venue: string;
  registrationUrl: string;
  active: boolean; // true = upcoming, false = past
  createdAt?: string;
  updatedAt?: string;
}

export interface RecruitmentConfig {
  _id: string;
  enabled: boolean;
  subtitle: string;
  posterUrl: string;
  applyUrl: string;
  title?: string;
  deadline?: string;
  linkedin?: string;
  instagram?: string;
  discord?: string;
  domains?: Array<{
    domain: DomainType;
    roles: string[];
    perks: string[];
    description: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  updatedAt?: string;
}

export interface RecruitmentSubscriber {
  _id: string;
  name: string;
  email: string;
  regNo?: string;
  domainOfInterest: string;
  createdAt: string;
}

export interface CMSUserSession {
  username: string;
  role: "admin";
  iat?: number;
  exp?: number;
}
