import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { Settings, Project, Skill, Post } from './types';
import { ResponsiveImage } from './components/ResponsiveImage';
import { Input } from './components/Input';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const Admin = lazy(() => import('./Admin'));
const Login = lazy(() => import('./pages/Login'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/*" element={<MainApp />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

function MainApp() {
  const [data, setData] = useState<{ settings: Settings; projects: Project[]; skills: Skill[]; posts: Post[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const fetchData = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { settings, projects, skills, posts } = data;
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags.split(',').map(t => t.trim()).filter(t => t !== '')))).sort();
  const filteredProjects = filterTag ? projects.filter(p => p.tags.split(',').map(t => t.trim()).includes(filterTag)) : projects;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-stone-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-stone-50/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight">{settings.name}</Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest opacity-60">
            <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
            <Link to="/blog" className="hover:opacity-100 transition-opacity">Blog</Link>
            {location.pathname === '/' && (
              <>
                <a href="#projects" className="hover:opacity-100 transition-opacity">Projects</a>
                <a href="#skills" className="hover:opacity-100 transition-opacity">Skills</a>
              </>
            )}
            <a href="#contact" className="hover:opacity-100 transition-opacity">Contact</a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-stone-100 bg-stone-50 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6 text-sm font-bold uppercase tracking-widest text-stone-500">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-stone-900 transition-colors">Home</Link>
                <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-stone-900 transition-colors">Blog</Link>
                {location.pathname === '/' && (
                  <>
                    <a href="#projects" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-stone-900 transition-colors">Projects</a>
                    <a href="#skills" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-stone-900 transition-colors">Skills</a>
                  </>
                )}
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-stone-900 transition-colors">Contact</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <Routes>
        <Route path="/" element={
          <Home 
            settings={settings} 
            projects={projects} 
            filteredProjects={filteredProjects}
            skills={skills}
            allTags={allTags}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
          />
        } />
        <Route path="/blog" element={
          <BlogList posts={posts} />
        } />
        <Route path="/blog/:id" element={
          <PostDetail posts={posts} />
        } />
        <Route path="/project/:id" element={
          <ProjectDetail projects={projects} />
        } />
      </Routes>

      {/* Global Footer / Contact Section */}
      <section id="contact" className="py-20 px-6 bg-stone-900 text-stone-50">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.4em] text-stone-500">{settings.contact_heading || 'Get in touch'}</span>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter whitespace-pre-line">{settings.contact_subheading || "Let's build something\nextraordinary."}</h2>
          </div>
          <a 
            href={`mailto:${settings.email}`}
            className="inline-flex items-center gap-4 text-2xl md:text-4xl font-medium hover:text-stone-400 transition-colors group"
          >
            {settings.email}
            <ChevronRight className="group-hover:translate-x-2 transition-transform" size={32} />
          </a>
          <div className="pt-12 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-stone-500">
            <p>© {new Date().getFullYear()} <Link to="/" className="text-stone-50 hover:opacity-70 transition-opacity font-bold">{settings.footer_name || settings.name}</Link>. {settings.footer_copyright || "All rights reserved."}</p>
            {settings.show_social_footer !== 0 && (
              <div className="flex gap-8">
                <a href={settings.github} target="_blank" rel="noreferrer" className="hover:text-stone-50">Github</a>
                <a href={settings.linkedin} target="_blank" rel="noreferrer" className="hover:text-stone-50">Linkedin</a>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Home({ 
  settings, 
  filteredProjects, 
  skills, 
  allTags, 
  filterTag, 
  setFilterTag
}: any) {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 space-y-6"
            >
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">
                {settings.title}
              </h1>
              <p className="text-xl text-stone-600 max-w-lg leading-relaxed">
                {settings.bio}
              </p>
              <div className="flex gap-4 pt-4">
                <a href={settings.github} target="_blank" rel="noreferrer" className="p-3 border border-stone-200 rounded-full hover:bg-stone-900 hover:text-stone-50 transition-colors">
                  <Github size={20} />
                </a>
                <a href={settings.linkedin} target="_blank" rel="noreferrer" className="p-3 border border-stone-200 rounded-full hover:bg-stone-900 hover:text-stone-50 transition-colors">
                  <Linkedin size={20} />
                </a>
                <a href={`mailto:${settings.email}`} className="p-3 border border-stone-200 rounded-full hover:bg-stone-900 hover:text-stone-50 transition-colors">
                  <Mail size={20} />
                </a>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden border-8 border-white shadow-2xl rotate-3">
                <ResponsiveImage src={settings.avatar_url} alt={settings.name} className="w-full h-full object-cover" priority />
              </div>
              {settings.open_to_work !== 0 && (
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center text-stone-50 -rotate-12">
                  <span className="text-xs font-bold uppercase tracking-widest text-center">Open to<br/>Work</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Selected Work</span>
              <h2 className="text-4xl font-bold tracking-tight">Case Studies</h2>
            </div>
          </div>

          {/* Filter Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              <button
                onClick={() => setFilterTag(null)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  filterTag === null 
                    ? 'bg-stone-900 text-stone-50' 
                    : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                }`}
              >
                All
              </button>
              {allTags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    filterTag === tag 
                      ? 'bg-stone-900 text-stone-50' 
                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project: any) => (
                <motion.div 
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative"
                >
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-6 relative">
                    <ResponsiveImage 
                      src={project.image_url || 'https://picsum.photos/seed/project/800/600'} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Link to={`/project/${project.id}`} className="p-4 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform">
                        <ExternalLink size={24} />
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {project.tags.split(',').map((tag: string) => (
                        <button 
                          key={tag} 
                          onClick={() => setFilterTag(tag.trim())}
                          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded hover:bg-stone-900 hover:text-stone-50 hover:border-stone-900 transition-all"
                        >
                          {tag.trim()}
                        </button>
                      ))}
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">
                      <Link to={`/project/${project.id}`} className="hover:underline decoration-stone-300 underline-offset-4">
                        {project.title}
                      </Link>
                    </h3>
                    <p className="text-stone-600 leading-relaxed">{project.description}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Expertise</span>
              <h2 className="text-4xl font-bold tracking-tight">Skills & Tools</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {skills.map((skill: any, idx: number) => (
              <motion.div 
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 bg-white rounded-2xl border border-stone-200 group relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{skill.category}</span>
                      <h4 className="font-bold text-lg leading-none">{skill.name}</h4>
                    </div>
                    <span className="text-xs font-bold text-stone-900">{skill.proficiency}%</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.proficiency}%` }}
                      viewport={{ once: true }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 40, 
                        damping: 15, 
                        delay: (idx * 0.1) + 0.3 
                      }}
                      className="h-full bg-stone-900"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function BlogList({ posts }: { posts: Post[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Journal</span>
            <h2 className="text-4xl font-bold tracking-tight">Blog Posts</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {currentPosts.map((post: any, idx: number) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <Link to={`/blog/${post.id}`} className="block space-y-6">
                <div className="aspect-video rounded-2xl overflow-hidden bg-stone-100 relative">
                  <ResponsiveImage 
                    src={post.image_url || 'https://picsum.photos/seed/blog/800/600'} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> 5 min read</span>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight group-hover:text-stone-600 transition-colors">{post.title}</h3>
                  <p className="text-stone-600 leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-24 flex flex-col items-center gap-6">
            <div className="h-px w-24 bg-stone-200" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors disabled:opacity-20 disabled:cursor-not-allowed group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Prev
              </button>
              
              <div className="flex items-center px-4 border-x border-stone-100">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => {
                  if (totalPages > 7) {
                    if (number !== 1 && number !== totalPages && (number < currentPage - 1 || number > currentPage + 1)) {
                      if (number === currentPage - 2 || number === currentPage + 2) {
                        return <span key={number} className="w-10 text-center text-stone-300">...</span>;
                      }
                      return null;
                    }
                  }
                  return (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                        currentPage === number 
                          ? 'bg-stone-900 text-stone-50 shadow-lg scale-110' 
                          : 'text-stone-400 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      {number.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors disabled:opacity-20 disabled:cursor-not-allowed group"
              >
                Next <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectDetail({ projects }: { projects: Project[] }) {
  const { id } = useParams();
  const project = projects.find(p => p.id === Number(id));

  if (!project) return <div className="pt-32 text-center">Project not found</div>;

  return (
    <article className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {project.tags.split(',').map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded">
                {tag.trim()}
              </span>
            ))}
          </div>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl">
            {project.description}
          </p>
          {project.link && (
            <a 
              href={project.link} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-stone-50 rounded-xl font-bold hover:bg-stone-800 transition-colors"
            >
              Visit Live Project <ExternalLink size={18} />
            </a>
          )}
        </div>

        {project.image_url && (
          <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <ResponsiveImage src={project.image_url} alt={project.title} className="w-full h-full object-cover" sizes="100vw" priority />
          </div>
        )}

        <div className="prose prose-stone prose-lg max-w-none">
          <Markdown>{project.content || '*No detailed content available for this project yet.*'}</Markdown>
        </div>
      </div>
    </article>
  );
}

function PostDetail({ posts }: { posts: Post[] }) {
  const { id } = useParams();
  const post = posts.find(p => p.id === Number(id));
  const [comments, setComments] = useState<any[]>([]);
  const [commentForm, setCommentForm] = useState({ name: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      fetchComments();
    }
  }, [post]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${id}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.name || !commentForm.content) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentForm),
      });
      if (response.ok) {
        setCommentForm({ name: '', content: '' });
        fetchComments();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return <div className="pt-32 text-center">Post not found</div>;

  return (
    <article className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
          <ArrowLeft size={16} /> Back to Journal
        </Link>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-stone-400">
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> 5 min read</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
            {post.title}
          </h1>
          <div className="flex gap-2">
            {post.tags.split(',').map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-2 py-1 rounded">
                {tag.trim()}
              </span>
            ))}
          </div>

          <div className="pt-4 flex items-center gap-4 border-t border-stone-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Share</span>
            <div className="flex gap-2">
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-all"
                title="Share on Twitter"
              >
                <Twitter size={16} />
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-all"
                title="Share on Facebook"
              >
                <Facebook size={16} />
              </a>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-all"
                title="Share on LinkedIn"
              >
                <Linkedin size={16} />
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-all"
                title="Copy Link"
              >
                <LinkIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {post.image_url && (
          <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <ResponsiveImage src={post.image_url} alt={post.title} className="w-full h-full object-cover" sizes="100vw" priority />
          </div>
        )}

        <div className="prose prose-stone prose-lg max-w-none">
          <Markdown>{post.content}</Markdown>
        </div>

        {/* Comment Section */}
        <div className="pt-20 border-t border-stone-100 space-y-12">
          <div className="space-y-4">
            <h3 className="text-3xl font-bold tracking-tight">Comments ({comments.length})</h3>
            <p className="text-stone-500">Share your thoughts on this post.</p>
          </div>

          <form onSubmit={handleCommentSubmit} className="space-y-6 bg-stone-50 p-8 rounded-3xl border border-stone-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Your Name" 
                value={commentForm.name} 
                onChange={v => setCommentForm({...commentForm, name: v})} 
              />
            </div>
            <Input 
              label="Comment" 
              value={commentForm.content} 
              onChange={v => setCommentForm({...commentForm, content: v})} 
              textarea 
            />
            <button 
              type="submit" 
              disabled={submitting}
              className="px-8 py-3 bg-stone-900 text-stone-50 rounded-xl font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <div className="space-y-8">
            {comments.length === 0 ? (
              <p className="text-center py-12 text-stone-400 italic">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              comments.map((comment) => (
                <motion.div 
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative space-y-3 p-6 bg-white rounded-2xl border border-stone-100 hover:border-stone-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold text-stone-900">{comment.name}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        {new Date(comment.date).toLocaleDateString()} at {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-stone-600 leading-relaxed whitespace-pre-line">{comment.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
