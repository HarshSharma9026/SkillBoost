import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { generateRoadmapStructure, fetchResourcesForSubtopic, generateQuizForModule, generateCommunityThreads, generateDeepAnalysis, generateFlashcards, generateFeedback } from './services/gemini';
import { saveRoadmap, deleteRoadmap, addPoints, logoutUser, subscribeToAuth, subscribeToUserProfile } from './services/storage';
import { Roadmap, User, Subtopic, Module, QuizQuestion, ForumPost, Badge, Flashcard } from './types';
import { Timer } from './components/Timer';
import { ChatAssistant } from './components/ChatAssistant';
import { PlayIcon, CheckCircleIcon, ChevronDownIcon, AcademicCapIcon, CheckIcon, VideoIcon, DocumentTextIcon, BookOpenIcon } from './components/Icons';
import { ProgressBar, BadgeDisplay, Leaderboard } from './components/Gamification';
import { FlashcardReview } from './components/FlashcardReview';
import { ThemeProvider } from './components/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Auth } from './components/Auth';

// --- Dashboard Component ---
const Dashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic) return;
    setLoading(true);
    try {
      const modules = await generateRoadmapStructure(newTopic);
      const newRoadmap: Roadmap = {
        id: `map-${Date.now()}`,
        topic: newTopic,
        createdAt: new Date().toISOString(),
        modules,
        isCompleted: false
      };
      await saveRoadmap(user.id, newRoadmap);
      navigate(`/roadmap/${newRoadmap.id}`);
    } catch (err) {
      alert("Failed to generate roadmap. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this roadmap?')) {
        deleteRoadmap(user.id, id);
    }
  }

  const nextLevelPoints = Math.pow(user.level, 2) * 100;
  const currentLevelBase = Math.pow(user.level - 1, 2) * 100;
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center gap-4">
        <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
            Skill<span className="text-primary">Forge</span> AI
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gamified Intelligent Learning Platform</p>
        </div>
        <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
                onClick={onLogout}
                className="text-sm font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition"
            >
                Log Out
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* User Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-3xl shadow-lg text-white">
                        {user.level > 5 ? '🧙‍♂️' : user.level > 2 ? '🎓' : '👶'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                        <div className="text-primary font-bold">Level {user.level}</div>
                        <div className="text-xs text-slate-400 mt-1">{user.email}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{user.points} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">XP</span></div>
                </div>
            </div>
            
            <div className="mb-6">
                <ProgressBar 
                    current={user.points - currentLevelBase} 
                    max={nextLevelPoints - currentLevelBase} 
                    label="Progress to Next Level"
                />
            </div>

            <div>
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Earned Badges</h3>
                <BadgeDisplay badges={user.badges} />
            </div>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-1">
            <Leaderboard user={user} />
        </div>
      </div>

      <div className="mb-12 bg-indigo-50 dark:bg-indigo-950/30 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-xl font-bold mb-4 text-indigo-900 dark:text-indigo-200">What do you want to learn today?</h2>
            <form onSubmit={handleCreate} className="flex gap-4 flex-col sm:flex-row">
            <input
                type="text"
                className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="e.g. Python, Quantum Physics, Crochet..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
            />
            <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center"
            >
                {loading ? 'Forging...' : 'Start Learning'}
            </button>
            </form>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-200/50 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Your Journeys</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user.roadmaps.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
            No roadmaps yet. Start a new topic above!
          </div>
        )}
        {user.roadmaps.map(map => (
          <div 
            key={map.id} 
            onClick={() => navigate(`/roadmap/${map.id}`)}
            className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
          >
             <button 
                onClick={(e) => handleDelete(e, map.id)}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
            >
                ✕
            </button>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 group-hover:text-primary transition line-clamp-1">{map.topic}</h3>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
              <span>{map.modules.length} Modules</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${map.isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                {map.isCompleted ? 'Done' : 'Active'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ 
                        width: `${(map.modules.reduce((acc, m) => acc + m.subtopics.filter(s => s.isCompleted).length, 0) / 
                                Math.max(1, map.modules.reduce((acc, m) => acc + m.subtopics.length, 0)) * 100) || 0}%` 
                    }}
                />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Roadmap View Component ---
const RoadmapView = ({ user }: { user: User }) => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'modules' | 'community' | 'analytics'>('modules');
  
  // State for modules
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState<string | null>(null);
  const [loadingResources, setLoadingResources] = useState<string | null>(null);
  const [loadingFlashcards, setLoadingFlashcards] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  const [quizModal, setQuizModal] = useState<{ isOpen: boolean, module: Module | null, questions: QuizQuestion[] | null }>({ isOpen: false, module: null, questions: null });
  const [flashcardModal, setFlashcardModal] = useState<{ isOpen: boolean, subtopicTitle: string, cards: Flashcard[] | null }>({ isOpen: false, subtopicTitle: '', cards: null });
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // State for community
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  // State for analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  // Derived state from user prop
  const roadmap = user.roadmaps.find(r => r.id === id);

  useEffect(() => {
    if (activeTab === 'community' && posts.length === 0 && roadmap) {
        setLoadingCommunity(true);
        generateCommunityThreads(roadmap.topic).then(data => {
            setPosts(data);
            setLoadingCommunity(false);
        });
    }
    if (activeTab === 'analytics' && !analytics && roadmap) {
        setLoadingAnalytics(true);
        generateDeepAnalysis(roadmap.topic, roadmap.modules).then(data => {
            setAnalytics(data);
            setLoadingAnalytics(false);
        });
    }
  }, [activeTab, roadmap]);

  if (!roadmap) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Roadmap not found.</div>;

  const showToast = (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
  }

  const handleShare = () => {
      navigator.clipboard.writeText(`https://skillforge.ai/share/${roadmap.id}`);
      showToast("Link copied to clipboard! (Simulated)");
  };

  const handleStartSubtopic = async (modId: string, subId: string) => {
      const newRoadmap = {...roadmap};
      const mod = newRoadmap.modules.find(m => m.id === modId);
      const sub = mod?.subtopics.find(s => s.id === subId);
      if(sub && !sub.isStarted) {
          sub.isStarted = true;
          // Award points call (updates user doc)
          const { newBadges } = await addPoints(user.id, user.points, user.level, user.badges, 10);
          if(newBadges.length > 0) showToast(`Badge Unlocked: ${newBadges[0].name}!`);
          else showToast("Started! +10 XP");
          // Update roadmap state doc
          await saveRoadmap(user.id, newRoadmap);
      }
  }

  const updateSubtopic = async (modId: string, subId: string, updates: Partial<Subtopic>) => {
    const newRoadmap = { ...roadmap };
    const mod = newRoadmap.modules.find(m => m.id === modId);
    if (!mod) return;
    const sub = mod.subtopics.find(s => s.id === subId);
    if (!sub) return;

    if(updates.isCompleted && !sub.isCompleted) {
        const { newBadges } = await addPoints(user.id, user.points, user.level, user.badges, 50);
        if(newBadges.length > 0) showToast(`Badge Unlocked: ${newBadges[0].name}!`);
        else showToast("Completed! +50 XP");
    }

    Object.assign(sub, updates);
    
    const allModulesCompleted = newRoadmap.modules.every(m => m.subtopics.every(s => s.isCompleted) && m.quizCompleted);
    if (allModulesCompleted && !newRoadmap.isCompleted) {
       newRoadmap.isCompleted = true;
    }
    
    await saveRoadmap(user.id, newRoadmap);
  };

  const handleResourceLoad = async (modId: string, subId: string, subTitle: string) => {
    if (expandedSubtopic === subId) {
      setExpandedSubtopic(null);
      return;
    }
    setExpandedSubtopic(subId);
    handleStartSubtopic(modId, subId);

    const mod = roadmap.modules.find(m => m.id === modId);
    const sub = mod?.subtopics.find(s => s.id === subId);

    if (sub && (!sub.resources || sub.resources.length === 0)) {
      setLoadingResources(subId);
      try {
        const resources = await fetchResourcesForSubtopic(roadmap.topic, subTitle);
        await updateSubtopic(modId, subId, { resources });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingResources(null);
      }
    }
  };

  const handleFlashcardOpen = async (modId: string, subId: string, subTitle: string) => {
      const mod = roadmap.modules.find(m => m.id === modId);
      const sub = mod?.subtopics.find(s => s.id === subId);

      if(!sub) return;

      if(sub.flashcards && sub.flashcards.length > 0) {
          setFlashcardModal({ isOpen: true, subtopicTitle: subTitle, cards: sub.flashcards });
      } else {
          setLoadingFlashcards(subId);
          try {
             const cards = await generateFlashcards(roadmap.topic, subTitle);
             await updateSubtopic(modId, subId, { flashcards: cards });
             setFlashcardModal({ isOpen: true, subtopicTitle: subTitle, cards });
          } catch(e) {
             showToast("Failed to generate flashcards.");
          } finally {
             setLoadingFlashcards(null);
          }
      }
  }

  const startQuiz = async (module: Module) => {
    setLoadingQuiz(true);
    try {
      const questions = await generateQuizForModule(module.title, module.subtopics.map(s => s.title));
      setQuizModal({ isOpen: true, module, questions });
    } catch (e) {
      alert("Failed to generate quiz");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const generateAIStats = async () => {
    setLoadingFeedback(true);
    const performanceData = roadmap.modules
        .filter(m => m.quizCompleted)
        .map(m => ({
            module: m.title,
            quizScore: m.quizScore || 0,
            quizTotal: m.quizTotalQuestions || 5,
            subtopics: m.subtopics.map(s => ({ title: s.title, time: s.timeSpentSeconds }))
        }));

    if(performanceData.length === 0) {
        const msg = "Complete at least one module quiz to get personalized AI feedback!";
        const newRoadmap = { ...roadmap, feedback: msg };
        await saveRoadmap(user.id, newRoadmap);
        setLoadingFeedback(false);
        return;
    }

    try {
        const feedback = await generateFeedback(roadmap.topic, performanceData);
        const newRoadmap = { ...roadmap, feedback };
        await saveRoadmap(user.id, newRoadmap);
    } catch(e) {
        console.error("Error generating feedback", e);
    } finally {
        setLoadingFeedback(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 relative">
      {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-[70] animate-fade-in flex items-center">
              <span className="text-xl mr-2">✨</span> {toast}
          </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="text-slate-500 hover:text-primary font-medium flex items-center dark:text-slate-400 dark:hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Dashboard
        </Link>
        <div className="flex gap-2">
            <button onClick={handleShare} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                Share
            </button>
            <ThemeToggle />
            {roadmap.isCompleted && (
            <Link to={`/certificate/${roadmap.id}`} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-yellow-600 transition flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2"/>
                Certificate
            </Link>
            )}
        </div>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{roadmap.topic} Roadmap</h1>
        <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
             <button 
                onClick={generateAIStats} 
                className="text-primary hover:underline flex items-center gap-1"
                disabled={loadingFeedback}
             >
                {loadingFeedback ? (
                    <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Generating Feedback...
                    </>
                ) : 'View/Refresh AI Performance Summary'}
             </button>
        </div>
        {roadmap.feedback && (
            <div className="mt-4 bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 animate-fade-in relative">
                <h4 className="font-bold flex items-center gap-2 mb-2">
                    <span className="text-xl">✨</span> AI Performance Analysis
                </h4>
                <div className="leading-relaxed whitespace-pre-wrap">{roadmap.feedback}</div>
            </div>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
          <button 
            onClick={() => setActiveTab('modules')}
            className={`px-6 py-3 font-medium text-sm transition relative ${activeTab === 'modules' ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
              Modules
              {activeTab === 'modules' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`px-6 py-3 font-medium text-sm transition relative ${activeTab === 'community' ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
              AI Study Group
              {activeTab === 'community' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium text-sm transition relative ${activeTab === 'analytics' ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
              Analytics
              {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
          </button>
      </div>

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-4 animate-fade-in">
            {roadmap.modules.map((module) => {
              const isModuleCompleted = module.subtopics.every(s => s.isCompleted) && module.quizCompleted;
              
              return (
              <div key={module.id} className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden transition-all duration-500 ${
                  isModuleCompleted 
                  ? 'border-emerald-500 dark:border-emerald-600 shadow-md shadow-emerald-50 dark:shadow-emerald-900/10' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}>
                  <button 
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                  <div className="text-left">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        {module.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{module.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                      {isModuleCompleted && (
                      <CheckCircleIcon className="w-6 h-6 text-emerald-500 animate-scale-up" />
                      )}
                      <div className={`transform transition-transform duration-300 ${expandedModule === module.id ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                      </div>
                  </div>
                  </button>

                  {expandedModule === module.id && (
                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="space-y-3">
                      {module.subtopics.map((sub) => (
                          <div key={sub.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                              {/* Status Stripe */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${sub.isCompleted ? 'bg-emerald-500' : sub.isStarted ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                              
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-2">
                                  <div className="flex-1 flex gap-3">
                                      <button
                                          onClick={() => updateSubtopic(module.id, sub.id, { isCompleted: !sub.isCompleted })}
                                          className={`mt-1 min-w-[1.25rem] h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                                              sub.isCompleted 
                                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500'
                                          }`}
                                          title={sub.isCompleted ? "Mark as incomplete" : "Mark as completed"}
                                      >
                                          {sub.isCompleted && <CheckIcon className="w-3.5 h-3.5 stroke-2" />}
                                      </button>
                                      
                                      <div>
                                          <h4 className={`font-medium transition-colors ${sub.isCompleted ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                              {sub.title}
                                          </h4>
                                          <div className="flex gap-4 mt-2">
                                              <button 
                                                  onClick={() => handleResourceLoad(module.id, sub.id, sub.title)}
                                                  className="text-xs text-primary font-medium hover:underline flex items-center"
                                              >
                                                  <span className="mr-1">📚</span> {expandedSubtopic === sub.id ? 'Hide Resources' : 'Show Resources'}
                                              </button>
                                              <button 
                                                  onClick={() => handleFlashcardOpen(module.id, sub.id, sub.title)}
                                                  className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center"
                                                  disabled={loadingFlashcards === sub.id}
                                              >
                                                  <span className="mr-1">⚡</span> 
                                                  {loadingFlashcards === sub.id ? 'Generating Cards...' : 'Practice Flashcards'}
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                                  <Timer 
                                      initialSeconds={sub.timeSpentSeconds}
                                      isCompleted={sub.isCompleted}
                                      onUpdate={(seconds) => updateSubtopic(module.id, sub.id, { timeSpentSeconds: seconds })}
                                      onComplete={() => updateSubtopic(module.id, sub.id, { isCompleted: true })}
                                  />
                              </div>

                          {expandedSubtopic === sub.id && (
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 animate-fade-in pl-2">
                              {loadingResources === sub.id ? (
                                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  <span>AI is curating the best resources for you...</span>
                                  </div>
                              ) : (
                                  <ul className="space-y-3">
                                  {sub.resources?.map((res, idx) => {
                                      let Icon = DocumentTextIcon;
                                      let iconBg = "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
                                      
                                      if (res.type === 'video') {
                                          Icon = VideoIcon;
                                          iconBg = "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
                                      } else if (res.type === 'doc') {
                                          Icon = BookOpenIcon;
                                          iconBg = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
                                      } else {
                                          // article
                                          Icon = DocumentTextIcon;
                                          iconBg = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                                      }

                                      return (
                                          <li key={idx}>
                                              <a 
                                                  href={res.url} 
                                                  target="_blank" 
                                                  rel="noreferrer" 
                                                  className="flex items-start p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group"
                                              >
                                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-3 ${iconBg}`}>
                                                      <Icon className="w-5 h-5" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                      <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary transition truncate pr-2">
                                                          {res.title}
                                                      </h5>
                                                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize flex items-center mt-0.5">
                                                          {res.type}
                                                          <span className="mx-1.5 opacity-50">•</span>
                                                          <span className="group-hover:translate-x-0.5 transition-transform flex items-center text-primary/0 group-hover:text-primary">
                                                              Open <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 ml-0.5"><path fillRule="evenodd" d="M5 10a.75.75 0 0 1 .75-.75h6.638L10.23 7.29a.75.75 0 1 1 1.04-1.08l3.5 3.25a.75.75 0 0 1 0 1.08l-3.5 3.25a.75.75 0 1 1-1.04-1.08l2.158-1.96H5.75A.75.75 0 0 1 5 10Z" clipRule="evenodd" /></svg>
                                                          </span>
                                                      </p>
                                                  </div>
                                              </a>
                                          </li>
                                      );
                                  }) || <li className="text-sm text-slate-400 italic pl-2">No resources available.</li>}
                                  </ul>
                              )}
                              </div>
                          )}
                          </div>
                      ))}
                      </div>

                      <div className="mt-6 flex justify-end">
                          <button 
                              onClick={() => startQuiz(module)}
                              disabled={module.quizCompleted || loadingQuiz}
                              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${module.quizCompleted ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 cursor-default' : 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 shadow-lg shadow-slate-200 dark:shadow-none'}`}
                          >
                              {loadingQuiz ? 'Generating...' : module.quizCompleted ? 'Module Mastered (+100 XP)' : 'Take Module Quiz (Win 100 XP)'}
                          </button>
                      </div>
                  </div>
                  )}
              </div>
            )})}
        </div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
          <div className="animate-fade-in">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <div className="text-2xl">🤖</div>
                  <div>
                      <h3 className="font-bold text-blue-900 dark:text-blue-200">AI Study Group</h3>
                      <p className="text-sm text-blue-800 dark:text-blue-300">These discussions are generated by AI to simulate a classroom environment. Participate to test your understanding!</p>
                  </div>
              </div>

              {loadingCommunity ? (
                  <div className="text-center py-12 text-slate-400">
                      <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full mx-auto mb-2"></div>
                      Finding study partners...
                  </div>
              ) : (
                  <div className="space-y-4">
                      {posts.map((post, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xl">{post.avatar}</div>
                                  <div>
                                      <div className="font-bold text-slate-800 dark:text-white">{post.author}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</div>
                                  </div>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 mb-4">{post.content}</p>
                              
                              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Replies</h4>
                                  {post.replies.map((reply, rIdx) => (
                                      <div key={rIdx} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2 last:mb-0">
                                          <span className="font-bold">{reply.author}:</span>
                                          <span>{reply.content}</span>
                                      </div>
                                  ))}
                              </div>

                              <div className="flex gap-2">
                                  <input type="text" placeholder="Write a reply..." className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-primary outline-none" />
                                  <button className="text-primary font-bold text-sm px-3 hover:bg-primary/5 dark:hover:bg-primary/20 rounded-full">Reply</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
          <div className="animate-fade-in space-y-6">
              {loadingAnalytics ? (
                  <div className="text-center py-12 text-slate-400">
                      <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full mx-auto mb-2"></div>
                      Analyzing performance data...
                  </div>
              ) : analytics ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><span className="mr-2">💪</span> Strong Areas</h3>
                            <div className="flex flex-wrap gap-2">
                                {analytics.strongAreas.length > 0 ? analytics.strongAreas.map((area: string, i: number) => (
                                    <span key={i} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">{area}</span>
                                )) : <span className="text-slate-400 text-sm">Keep studying to identify strengths!</span>}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><span className="mr-2">🧗</span> Growth Opportunities</h3>
                            <div className="flex flex-wrap gap-2">
                                {analytics.struggleAreas.length > 0 ? analytics.struggleAreas.map((area: string, i: number) => (
                                    <span key={i} className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">{area}</span>
                                )) : <span className="text-slate-400 text-sm">No major struggles detected yet.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-3xl shadow-lg">
                        <h3 className="font-bold text-xl mb-2">AI Coach Recommendation</h3>
                        <p className="opacity-90 leading-relaxed text-lg">{analytics.recommendations}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Predicted Challenges</h3>
                        <p className="text-slate-600 dark:text-slate-300">{analytics.predictedChallenges}</p>
                    </div>
                  </>
              ) : (
                  <div className="text-center text-slate-400">Analysis unavailable.</div>
              )}
          </div>
      )}

      <ChatAssistant context={roadmap.topic} />
      
      {/* Quiz Modal */}
      {quizModal.isOpen && quizModal.questions && (
          <QuizComponent 
            questions={quizModal.questions} 
            onClose={() => setQuizModal({...quizModal, isOpen: false})}
            onPass={async (score, total) => {
                 if(quizModal.module) {
                    const newRoadmap = {...roadmap};
                    const mod = newRoadmap.modules.find(m => m.id === quizModal.module!.id);
                    if(mod) {
                        mod.quizCompleted = true;
                        mod.quizScore = score;
                        mod.quizTotalQuestions = total;
                    }
                    
                    // Award Points
                    const basePoints = 100;
                    const bonus = Math.floor((score/total) * 50);
                    const { newBadges } = await addPoints(user.id, user.points, user.level, user.badges, basePoints + bonus);
                    
                    await saveRoadmap(user.id, newRoadmap);
                    
                    let badgeMsg = newBadges.length > 0 ? ` & Unlocked ${newBadges[0].name}` : '';
                    showToast(`Quiz Passed! +${basePoints + bonus} XP${badgeMsg}`);
                 }
                 setQuizModal({...quizModal, isOpen: false});
            }}
          />
      )}

      {/* Flashcard Modal */}
      {flashcardModal.isOpen && flashcardModal.cards && (
          <FlashcardReview 
            cards={flashcardModal.cards}
            subtopicTitle={flashcardModal.subtopicTitle}
            onClose={() => setFlashcardModal({ ...flashcardModal, isOpen: false })}
          />
      )}
    </div>
  );
};

// --- Quiz Component ---
const QuizComponent = ({ questions, onClose, onPass }: { questions: QuizQuestion[], onClose: () => void, onPass: (score: number, total: number) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleAnswer = (option: string) => {
        if(selectedOption) return; 
        setSelectedOption(option);
        if (option === questions[currentIndex].correctAnswer) {
            setScore(s => s + 1);
        }
    }

    const next = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
        } else {
            setShowResult(true);
        }
    }

    if (showResult) {
        const passed = score >= Math.ceil(questions.length * 0.7);
        return (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center animate-fade-in border border-slate-200 dark:border-slate-800">
                    <div className="mb-4 text-4xl">{passed ? '🎉' : '📚'}</div>
                    <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">{passed ? 'Quiz Passed!' : 'Keep Learning'}</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">You got {score} out of {questions.length} correct.</p>
                    <button 
                        onClick={passed ? () => onPass(score, questions.length) : onClose}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90"
                    >
                        {passed ? 'Claim Rewards' : 'Try Later'}
                    </button>
                 </div>
            </div>
        )
    }

    const q = questions[currentIndex];

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full relative animate-fade-in border border-slate-200 dark:border-slate-800">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
                <div className="mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-2">{q.question}</h3>
                </div>
                <div className="space-y-3">
                    {q.options.map((opt, i) => {
                        let btnClass = "w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition dark:text-slate-200";
                        if (selectedOption) {
                            if (opt === q.correctAnswer) btnClass = "w-full text-left p-4 rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
                            else if (opt === selectedOption) btnClass = "w-full text-left p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
                            else btnClass = "w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 opacity-50 dark:text-slate-400";
                        }
                        return (
                            <button key={i} onClick={() => handleAnswer(opt)} className={btnClass} disabled={!!selectedOption}>
                                {opt}
                            </button>
                        )
                    })}
                </div>
                {selectedOption && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={next} className="bg-slate-900 dark:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-600">
                            {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                        </button>
                    </div>
                )}
                 {selectedOption && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800">
                        <strong>Explanation:</strong> {q.explanation}
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Certificate Component ---
const Certificate = ({ user }: { user: User }) => {
    const { id } = useParams<{id: string}>();
    const roadmap = user.roadmaps.find(r => r.id === id);
    const [signed, setSigned] = useState(false);

    if (!roadmap || !roadmap.isCompleted) return <div className="p-10 text-center text-slate-500 dark:text-slate-400">Certificate unavailable. Complete the course first.</div>;

    const print = () => window.print();

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-8 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-none shadow-2xl max-w-4xl w-full border-[20px] border-double border-slate-200 dark:border-slate-700 text-center relative print:shadow-none print:border-4">
                 <Link to={`/roadmap/${id}`} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 print:hidden">← Back</Link>
                 <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-6">
                    <AcademicCapIcon className="w-12 h-12 text-primary" />
                 </div>
                 <h1 className="text-5xl font-serif text-slate-900 dark:text-white mb-2">Certificate of Completion</h1>
                 <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-sm mb-12">This certifies that</p>
                 
                 <h2 className="text-4xl font-bold text-primary mb-6 font-mono">{user.name}</h2>
                 
                 <p className="text-xl text-slate-700 dark:text-slate-300 mb-8">Has successfully completed the comprehensive roadmap for</p>
                 
                 <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 border-b-2 border-slate-100 dark:border-slate-700 pb-4 inline-block px-12">{roadmap.topic}</h3>
                 
                 <div className="grid grid-cols-2 gap-12 text-left mt-12">
                     <div>
                         <p className="text-xs text-slate-400 uppercase">Verified By</p>
                         <p className="font-bold text-lg text-slate-800 dark:text-white mt-1">Skill Boost AI</p>
                         <p className="text-xs text-slate-400 mt-4">Date: {new Date().toLocaleDateString()}</p>
                     </div>
                     <div className="text-right">
                         <p className="text-xs text-slate-400 uppercase">Student Signature</p>
                         {signed ? (
                             <p className="font-script text-2xl text-blue-600 dark:text-blue-400 mt-1 font-cursive" style={{fontFamily: 'cursive'}}>{user.name}</p>
                         ) : (
                             <button onClick={() => setSigned(true)} className="mt-2 text-sm text-primary hover:underline print:hidden">Click to Sign</button>
                         )}
                         <div className="h-px bg-slate-300 dark:bg-slate-600 w-full mt-1"></div>
                     </div>
                 </div>

                 <button onClick={print} className="mt-12 bg-slate-900 dark:bg-slate-700 text-white px-8 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 print:hidden shadow-lg">
                     Download Certificate
                 </button>
            </div>
        </div>
    )
}

// --- App Root ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 1. Listen for Auth State Changes (Login/Logout)
    const unsubscribeAuth = subscribeToAuth((firebaseUser) => {
        if (firebaseUser) {
            // 2. If Logged In, Listen for Firestore User Profile Changes (Points, Roadmaps)
            const unsubscribeProfile = subscribeToUserProfile(firebaseUser.uid, (userData) => {
                setCurrentUser(userData);
                setInitializing(false);
            });
            return () => unsubscribeProfile();
        } else {
            setCurrentUser(null);
            setInitializing(false);
        }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLoginSuccess = () => {
     // App will automatically update via the auth listener
  };

  const handleLogout = () => {
    logoutUser();
  }

  if (initializing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
               <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
      )
  }

  return (
    <ThemeProvider>
        <HashRouter>
        <div className="min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {currentUser ? (
                <Routes>
                    <Route path="/" element={<Dashboard user={currentUser} onLogout={handleLogout} />} />
                    <Route path="/roadmap/:id" element={<RoadmapView user={currentUser} />} />
                    <Route path="/certificate/:id" element={<Certificate user={currentUser} />} />
                </Routes>
            ) : (
                <Auth onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
        </HashRouter>
    </ThemeProvider>
  );
};

export default App;