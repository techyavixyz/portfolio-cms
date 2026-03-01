export interface Settings {
  name: string;
  title: string;
  bio: string;
  email: string;
  github: string;
  linkedin: string;
  avatar_url: string;
  contact_heading: string;
  contact_subheading: string;
  footer_copyright: string;
  footer_name: string;
  show_social_footer: number;
  open_to_work: number;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string;
  link: string;
  tags: string;
  content: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  proficiency: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  tags: string;
  date: string;
}

export interface Comment {
  id: number;
  post_id: number;
  name: string;
  content: string;
  date: string;
}
