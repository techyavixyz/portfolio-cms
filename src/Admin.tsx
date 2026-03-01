import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  X,
  Code,
  User,
  Briefcase,
  Save,
  GripVertical,
  Upload,
  Loader2,
  BookOpen,
  ArrowLeft,
  Edit,
  Sparkles,
  LogOut
} from 'lucide-react';
import { Settings, Project, Skill, Post } from './types';
import { ResponsiveImage } from './components/ResponsiveImage';
import { Modal } from './components/Modal';
import { Input } from './components/Input';
import { MarkdownEditor } from './components/MarkdownEditor';
import { useAuth } from './contexts/AuthContext';

export default function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<{ settings: Settings; projects: Project[]; skills: Skill[]; posts: Post[] } | null>(null);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Form states
  const [settingsForm, setSettingsForm] = useState<Settings | null>(null);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', image_url: '', link: '', tags: '', content: '' });
  const [skillForm, setSkillForm] = useState({ name: '', category: '', proficiency: 80 });
  const [postForm, setPostForm] = useState({ title: '', content: '', excerpt: '', image_url: '', tags: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const json = await res.json();
      setData(json);
      setSettingsForm(json.settings);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settingsForm) return;
    if (!confirm('Update portfolio settings?')) return;
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    });
    setIsEditingSettings(false);
    fetchData();
  };

  const handleAddProject = async () => {
    const isEditing = !!editingProject;
    if (!confirm(isEditing ? 'Save changes to this project?' : 'Add this new project?')) return;
    const url = isEditing ? `/api/projects/${editingProject.id}` : '/api/projects';
    const method = isEditing ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectForm),
    });
    
    setShowAddProject(false);
    setEditingProject(null);
    setProjectForm({ title: '', description: '', image_url: '', link: '', tags: '', content: '' });
    fetchData();
  };

  const handleEditProject = (project: Project) => {
    if (!confirm('Do you want to edit this project?')) return;
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      image_url: project.image_url,
      link: project.link,
      tags: project.tags,
      content: project.content || ''
    });
    setShowAddProject(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.imageUrl) setProjectForm(prev => ({ ...prev, image_url: json.imageUrl }));
    } catch (err) {
      console.error('Upload failed', err);
      setProjectForm(prev => ({ ...prev, image_url: '' }));
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handlePostFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    if ('files' in e.target && e.target.files) {
      file = (e.target as HTMLInputElement).files?.[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.imageUrl) setPostForm(prev => ({ ...prev, image_url: json.imageUrl }));
    } catch (err) {
      console.error('Upload failed', err);
      setPostForm(prev => ({ ...prev, image_url: '' }));
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleGenerateProjectImage = async () => {
    if (!projectForm.title) {
      alert("Please enter a project title first to use as a prompt.");
      return;
    }
    if (!confirm('Generate a new project image using AI? This will replace the current image URL.')) return;
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A high-quality, professional, minimalist portfolio project cover image for a project titled: "${projectForm.title}". The style should be modern, clean, and abstract, suitable for a web developer's portfolio.` }] },
      });
      let base64Image = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      if (base64Image) {
        const uploadRes = await fetch("/api/upload-base64", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Data: base64Image }),
        });
        const data = await uploadRes.json();
        if (data.imageUrl) setProjectForm(prev => ({ ...prev, image_url: data.imageUrl }));
      }
    } catch (error) {
      console.error("AI Generation error:", error);
      alert("Failed to generate image with AI. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (showAddPost) handlePostFileUpload(e);
      else handleFileUpload(e);
    }
  };

  const handleReorderProjects = async (newProjects: Project[]) => {
    if (!data) return;
    setData({ ...data, projects: newProjects });
    await fetch('/api/projects/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: newProjects.map(p => p.id) }),
    });
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddSkill = async () => {
    if (!confirm('Add this skill?')) return;
    await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skillForm),
    });
    setShowAddSkill(false);
    setSkillForm({ name: '', category: '', proficiency: 80 });
    fetchData();
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    await fetch(`/api/skills/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddPost = async () => {
    const isEditing = !!editingPost;
    if (!confirm(isEditing ? 'Save changes to this blog post?' : 'Add this new blog post?')) return;
    const url = isEditing ? `/api/posts/${editingPost.id}` : '/api/posts';
    const method = isEditing ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postForm),
    });
    setShowAddPost(false);
    setEditingPost(null);
    setPostForm({ title: '', content: '', excerpt: '', image_url: '', tags: '', date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleEditPost = (post: Post) => {
    if (!confirm('Do you want to edit this blog post?')) return;
    setEditingPost(post);
    setPostForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      image_url: post.image_url,
      tags: post.tags,
      date: post.date ? new Date(post.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowAddPost(true);
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Portfolio CMS</h1>
            {user && (
              <p className="text-sm text-stone-500 mt-2">
                Signed in as <span className="font-medium text-stone-700">{user.email}</span>
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <Link to="/" className="text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2">
              <ArrowLeft size={16} /> Back to Site
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => setIsEditingSettings(true)} className="p-8 bg-white rounded-3xl border border-stone-200 hover:shadow-xl transition-all flex flex-col items-center gap-4 text-center group">
            <div className="p-4 bg-stone-100 rounded-2xl group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors"><User size={32} /></div>
            <div><h3 className="font-bold text-lg">Profile Settings</h3><p className="text-sm text-stone-500">Update your bio, contact info, and site settings.</p></div>
          </button>
          <button onClick={() => setShowAddProject(true)} className="p-8 bg-white rounded-3xl border border-stone-200 hover:shadow-xl transition-all flex flex-col items-center gap-4 text-center group">
            <div className="p-4 bg-stone-100 rounded-2xl group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors"><Briefcase size={32} /></div>
            <div><h3 className="font-bold text-lg">Manage Projects</h3><p className="text-sm text-stone-500">Add, edit, or remove your portfolio projects.</p></div>
          </button>
          <button onClick={() => setShowAddPost(true)} className="p-8 bg-white rounded-3xl border border-stone-200 hover:shadow-xl transition-all flex flex-col items-center gap-4 text-center group">
            <div className="p-4 bg-stone-100 rounded-2xl group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors"><BookOpen size={32} /></div>
            <div><h3 className="font-bold text-lg">Blog Management</h3><p className="text-sm text-stone-500">Write new posts or manage existing ones.</p></div>
          </button>
        </div>

        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
            <button onClick={() => setShowAddProject(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-50 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"><Plus size={16} /> Add Project</button>
          </div>
          <Reorder.Group axis="y" values={data.projects} onReorder={handleReorderProjects} className="space-y-4">
            {data.projects.map((project) => (
              <Reorder.Item key={project.id} value={project} className="p-6 bg-white rounded-2xl border border-stone-200 flex gap-6 items-center group">
                <div className="cursor-grab active:cursor-grabbing text-stone-300 group-hover:text-stone-900 transition-colors"><GripVertical size={24} /></div>
                <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0"><ResponsiveImage src={project.image_url || 'https://picsum.photos/seed/project/800/600'} alt={project.title} className="w-full h-full object-cover" sizes="128px" /></div>
                <div className="flex-1"><h3 className="text-xl font-bold">{project.title}</h3><p className="text-stone-500 text-sm line-clamp-1">{project.description}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditProject(project)} className="p-2 text-stone-500 hover:bg-stone-50 rounded-full transition-colors"><Edit size={20} /></button>
                  <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold tracking-tight">Blog Posts</h2>
            <button onClick={() => setShowAddPost(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-50 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"><Plus size={16} /> New Post</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.posts.map((post) => (
              <div key={post.id} className="p-6 bg-white rounded-2xl border border-stone-200 flex flex-col gap-4 group">
                <div className="aspect-video rounded-xl overflow-hidden"><ResponsiveImage src={post.image_url || 'https://picsum.photos/seed/blog/800/600'} alt={post.title} className="w-full h-full object-cover" /></div>
                <div className="flex-1"><h3 className="text-xl font-bold">{post.title}</h3><p className="text-stone-500 text-sm line-clamp-2">{post.excerpt}</p></div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => handleEditPost(post)} className="p-2 text-stone-500 hover:bg-stone-50 rounded-full transition-colors"><Edit size={20} /></button>
                  <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
            <button onClick={() => setShowAddSkill(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-50 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"><Plus size={16} /> Add Skill</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.skills.map((skill) => (
              <div key={skill.id} className="p-4 bg-white rounded-2xl border border-stone-200 flex justify-between items-center group">
                <div><h4 className="font-bold">{skill.name}</h4><p className="text-xs text-stone-400">{skill.category}</p></div>
                <button onClick={() => handleDeleteSkill(skill.id)} className="p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditingSettings && (
          <Modal title="Edit Profile" onClose={() => setIsEditingSettings(false)}>
            <div className="space-y-4">
              <Input label="Name" value={settingsForm?.name || ''} onChange={v => setSettingsForm(s => s ? {...s, name: v} : null)} />
              <Input label="Title" value={settingsForm?.title || ''} onChange={v => setSettingsForm(s => s ? {...s, title: v} : null)} />
              <Input label="Bio" value={settingsForm?.bio || ''} onChange={v => setSettingsForm(s => s ? {...s, bio: v} : null)} textarea />
              <Input label="Email" value={settingsForm?.email || ''} onChange={v => setSettingsForm(s => s ? {...s, email: v} : null)} />
              <Input label="Avatar URL" value={settingsForm?.avatar_url || ''} onChange={v => setSettingsForm(s => s ? {...s, avatar_url: v} : null)} />
              <div className="flex gap-4">
                <Input label="Github" value={settingsForm?.github || ''} onChange={v => setSettingsForm(s => s ? {...s, github: v} : null)} />
                <Input label="Linkedin" value={settingsForm?.linkedin || ''} onChange={v => setSettingsForm(s => s ? {...s, linkedin: v} : null)} />
              </div>
              <div className="pt-4 border-t border-stone-100">
                <h4 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">Contact Section</h4>
                <Input label="Contact Heading" value={settingsForm?.contact_heading || ''} onChange={v => setSettingsForm(s => s ? {...s, contact_heading: v} : null)} />
                <Input label="Contact Subheading" value={settingsForm?.contact_subheading || ''} onChange={v => setSettingsForm(s => s ? {...s, contact_subheading: v} : null)} textarea />
              </div>
              <div className="pt-4 border-t border-stone-100">
                <h4 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">Website Settings</h4>
                <Input label="Footer Name" value={settingsForm?.footer_name || ''} onChange={v => setSettingsForm(s => s ? {...s, footer_name: v} : null)} />
                <Input label="Footer Copyright Text" value={settingsForm?.footer_copyright || ''} onChange={v => setSettingsForm(s => s ? {...s, footer_copyright: v} : null)} />
                <div className="flex items-center gap-3 py-2">
                  <input type="checkbox" id="show_social_footer" checked={settingsForm?.show_social_footer !== 0} onChange={e => setSettingsForm(s => s ? {...s, show_social_footer: e.target.checked ? 1 : 0} : null)} className="w-4 h-4 accent-stone-900 rounded" />
                  <label htmlFor="show_social_footer" className="text-sm font-medium text-stone-700">Show social links in footer</label>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input type="checkbox" id="open_to_work" checked={settingsForm?.open_to_work !== 0} onChange={e => setSettingsForm(s => s ? {...s, open_to_work: e.target.checked ? 1 : 0} : null)} className="w-4 h-4 accent-stone-900 rounded" />
                  <label htmlFor="open_to_work" className="text-sm font-medium text-stone-700">Show "Open to work" badge</label>
                </div>
              </div>
              <button onClick={handleSaveSettings} className="w-full py-3 bg-stone-900 text-stone-50 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={18} /> Save Changes</button>
            </div>
          </Modal>
        )}

        {showAddProject && (
          <Modal title={editingProject ? "Edit Project" : "Add Project"} wide onClose={() => { setShowAddProject(false); setEditingProject(null); setProjectForm({ title: '', description: '', image_url: '', link: '', tags: '', content: '' }); }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Input label="Title" value={projectForm.title} onChange={v => setProjectForm({...projectForm, title: v})} />
                <Input label="Description" value={projectForm.description} onChange={v => setProjectForm({...projectForm, description: v})} textarea />
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Project Image</label>
                  <div className="flex flex-col gap-4">
                    {projectForm.image_url ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-stone-200 group/img">
                        <ResponsiveImage src={projectForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="p-2 bg-white rounded-full text-stone-900 cursor-pointer hover:scale-110 transition-transform"><Upload size={18} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} /></label>
                          <button onClick={() => setProjectForm(prev => ({ ...prev, image_url: '' }))} className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                        </div>
                        {uploading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 text-stone-900 animate-spin" /></div>}
                      </div>
                    ) : (
                      <label onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-xl cursor-pointer transition-all group ${dragActive ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-900 hover:bg-stone-50'}`}>
                        <div className="flex flex-col items-center gap-2">{uploading ? <Loader2 className="w-8 h-8 text-stone-400 animate-spin" /> : <><Upload className={`w-8 h-8 transition-colors ${dragActive ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-900'}`} /><span className={`text-sm font-medium transition-colors ${dragActive ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-900'}`}>{dragActive ? 'Drop image here' : 'Click or drag image to upload'}</span></>}</div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-grow"><Input label="" value={projectForm.image_url} onChange={v => setProjectForm({...projectForm, image_url: v})} /></div>
                      <button type="button" onClick={handleGenerateProjectImage} disabled={generating || uploading} className="px-4 bg-stone-100 border border-stone-200 rounded-xl hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 text-stone-600 disabled:opacity-50" title="Generate with AI">{generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}<span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">AI</span></button>
                    </div>
                  </div>
                </div>
                <Input label="Link" value={projectForm.link} onChange={v => setProjectForm({...projectForm, link: v})} />
                <Input label="Tags (comma separated)" value={projectForm.tags} onChange={v => setProjectForm({...projectForm, tags: v})} />
              </div>
              <div className="flex flex-col h-full">
                <MarkdownEditor value={projectForm.content} onChange={v => setProjectForm({...projectForm, content: v})} />
                <div className="mt-8"><button onClick={handleAddProject} disabled={uploading} className="w-full py-3 bg-stone-900 text-stone-50 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">{editingProject ? "Save Changes" : "Add Project"}</button></div>
              </div>
            </div>
          </Modal>
        )}

        {showAddSkill && (
          <Modal title="Add Skill" onClose={() => setShowAddSkill(false)}>
            <div className="space-y-4">
              <Input label="Skill Name" value={skillForm.name} onChange={v => setSkillForm({...skillForm, name: v})} />
              <Input label="Category" value={skillForm.category} onChange={v => setSkillForm({...skillForm, category: v})} />
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Proficiency ({skillForm.proficiency}%)</label>
                <input type="range" min="0" max="100" value={skillForm.proficiency} onChange={e => setSkillForm({...skillForm, proficiency: parseInt(e.target.value)})} className="w-full accent-stone-900" />
              </div>
              <button onClick={handleAddSkill} className="w-full py-3 bg-stone-900 text-stone-50 rounded-xl font-bold">Add Skill</button>
            </div>
          </Modal>
        )}

        {showAddPost && (
          <Modal title={editingPost ? "Edit Post" : "Add Post"} wide onClose={() => { setShowAddPost(false); setEditingPost(null); setPostForm({ title: '', content: '', excerpt: '', image_url: '', tags: '', date: new Date().toISOString().split('T')[0] }); }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Input label="Title" value={postForm.title} onChange={v => setPostForm({...postForm, title: v})} />
                <Input label="Date" type="date" value={postForm.date} onChange={v => setPostForm({...postForm, date: v})} />
                <Input label="Excerpt" value={postForm.excerpt} onChange={v => setPostForm({...postForm, excerpt: v})} textarea />
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Post Image</label>
                  <div className="flex flex-col gap-4">
                    {postForm.image_url ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-stone-200 group/img">
                        <ResponsiveImage src={postForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="p-2 bg-white rounded-full text-stone-900 cursor-pointer hover:scale-110 transition-transform"><Upload size={18} /><input type="file" className="hidden" accept="image/*" onChange={handlePostFileUpload} disabled={uploading} /></label>
                          <button onClick={() => setPostForm(prev => ({ ...prev, image_url: '' }))} className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                        </div>
                        {uploading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 text-stone-900 animate-spin" /></div>}
                      </div>
                    ) : (
                      <label onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-xl cursor-pointer transition-all group ${dragActive ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-900 hover:bg-stone-50'}`}>
                        <div className="flex flex-col items-center gap-2">{uploading ? <Loader2 className="w-8 h-8 text-stone-400 animate-spin" /> : <><Upload className={`w-8 h-8 transition-colors ${dragActive ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-900'}`} /><span className={`text-sm font-medium transition-colors ${dragActive ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-900'}`}>{dragActive ? 'Drop image here' : 'Click or drag image to upload'}</span></>}</div>
                        <input type="file" className="hidden" accept="image/*" onChange={handlePostFileUpload} disabled={uploading} />
                      </label>
                    )}
                    <Input label="" value={postForm.image_url} onChange={v => setPostForm({...postForm, image_url: v})} />
                  </div>
                </div>
                <Input label="Tags (comma separated)" value={postForm.tags} onChange={v => setPostForm({...postForm, tags: v})} />
              </div>
              <div className="flex flex-col h-full">
                <MarkdownEditor value={postForm.content} onChange={v => setPostForm({...postForm, content: v})} />
                <div className="mt-8"><button onClick={handleAddPost} disabled={uploading} className="w-full py-3 bg-stone-900 text-stone-50 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">{editingPost ? "Save Changes" : "Add Post"}</button></div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
