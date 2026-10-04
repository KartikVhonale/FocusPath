import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  FileText,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Layers,
  BookOpen,
  FolderTree,
  ArrowRight,
  RefreshCw,
  Save,
  CheckCircle2,
  Copy,
  Lock,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Tooltip from '../components/Tooltip';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../utils/haptics';
import { Panel, PanelGroup, PanelResizeHandle } from '../components/ResizablePanels';
import EmptyState from '../components/EmptyState';

// Helper to count total leaf nodes recursively
function countLeafNodes(nodes) {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return 0;
  let count = 0;
  for (const node of nodes) {
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      count += countLeafNodes(node.children);
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Recursive EditableTree Component
 * Supports inline editing, adding child nodes, and deleting nodes with Framer Motion spring physics.
 */
function TreeNode({ node, depth = 0, onUpdateTitle, onAddChild, onDeleteNode, isLocked = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(node.title);

  const handleTitleSubmit = () => {
    if (editedTitle.trim()) {
      onUpdateTitle(node.id, editedTitle.trim());
    } else {
      setEditedTitle(node.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditedTitle(node.title);
      setIsEditing(false);
    }
  };

  const hasChildren = node.children && node.children.length > 0;

  // Level-specific styling
  const nodeIcon =
    depth === 0 ? (
      <Layers className="w-4 h-4 text-primary shrink-0" />
    ) : depth === 1 ? (
      <BookOpen className="w-3.5 h-3.5 text-secondary shrink-0" />
    ) : (
      <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-white/30 shrink-0 ml-1 mr-1" />
    );

  const levelBadge =
    depth === 0 ? 'Subject' : depth === 1 ? 'Chapter' : depth === 2 ? 'Topic' : 'Subtopic';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
      className="space-y-1.5"
    >
      {/* Node Row */}
      <div
        className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border transition-all duration-200 ${
          depth === 0
            ? 'bg-slate-100/90 dark:bg-white/[0.04] border-black/5 dark:border-white/10 font-bold'
            : depth === 1
              ? 'bg-surface-light dark:bg-surface-dark border-black/5 dark:border-white/5 hover:border-primary/30 shadow-sm'
              : 'bg-transparent border-transparent hover:bg-slate-100/60 dark:hover:bg-white/[0.02]'
        }`}
        style={{ marginLeft: `${Math.min(depth * 18, 72)}px` }}
      >
        {/* Left: Icon, Type Badge & Editable Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {nodeIcon}

          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60 font-mono hidden sm:inline-block">
            {levelBadge}
          </span>

          {isEditing && !isLocked ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 bg-white dark:bg-black/40 border border-primary rounded-xl px-2.5 py-1 text-xs tracking-wide text-text-main dark:text-text-darkMain outline-none shadow-sm font-medium"
            />
          ) : (
            <span
              onClick={() => {
                if (!isLocked) setIsEditing(true);
              }}
              title={isLocked ? 'Curriculum managed by instructor' : 'Click to rename'}
              className={`text-xs tracking-wide text-text-main dark:text-text-darkMain truncate font-medium flex-1 py-0.5 ${
                !isLocked ? 'cursor-text hover:text-primary' : 'cursor-default'
              }`}
            >
              {node.title}
            </span>
          )}
        </div>

        {/* Right: Hover Node Controls (+ Child, Delete) - Hidden if isLocked */}
        {!isLocked && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content={`Add child under ${node.title}`} position="top">
              <button
                type="button"
                onClick={() => onAddChild(node.id)}
                className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-accent hover:text-white text-label-secondary flex items-center justify-center transition-all duration-150 active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip content="Delete node & sub-items" position="top">
              <button
                type="button"
                onClick={() => onDeleteNode(node.id)}
                className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-[#FF3B30] hover:text-white text-label-secondary flex items-center justify-center transition-all duration-150 active:scale-90"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Recursive Children with Spring Animations */}
      {hasChildren && (
        <AnimatePresence>
          <div className="space-y-1.5 border-l-2 border-slate-200 dark:border-white/10 ml-4 pl-1">
            {node.children.map((childNode) => (
              <TreeNode
                key={childNode.id}
                node={childNode}
                depth={depth + 1}
                onUpdateTitle={onUpdateTitle}
                onAddChild={onAddChild}
                onDeleteNode={onDeleteNode}
                isLocked={isLocked}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

export default function SyllabusBuilder({ isModal = false, onClose = null }) {
  const { fetchExams, fetchDashboard } = useApp();
  const { isManagedStudent, isLockedByTeacher, teacherName } = useAuth();
  const isLocked = isManagedStudent || isLockedByTeacher;

  const [activeImportTab, setActiveImportTab] = useState('url'); // 'url' | 'text'
  const [examName, setExamName] = useState('New Exam Syllabus');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // The active tree being edited in the Right Pane
  const [treeData, setTreeData] = useState([]);

  // Preset sample PDF text for instant testing
  const samplePdfText = `Paper 1: General Studies & Engineering Aptitude
Chapter 1: Engineering Ethics and Professional Values
- Environmental Pollution and Degradation
- Climate Change Standards
- Industrial Safety Protocols
Chapter 2: Project Management and Methodology
- Project Life Cycle and Initiation
- Critical Path Method (CPM) and PERT
- Work Breakdown Structure (WBS)
Paper 2: Technical Specialization
Chapter 3: Thermodynamics and Fluid Mechanics
- First and Second Laws of Thermodynamics
- Navier-Stokes Equations
- Bernoulli Principle and Boundary Layer`;

  const sampleUrlPresets = [
    {
      name: 'GATE 2026 CS Syllabus',
      url: 'https://gate2026.iitk.ac.in',
    },
    {
      name: 'UPSC Civil Services Prelims',
      url: 'https://en.wikipedia.org/wiki/Civil_Services_Examination',
    },
  ];

  // Import from URL
  const handleFetchFromUrl = async (e) => {
    if (e) e.preventDefault();
    if (!urlInput.trim() || !urlInput.startsWith('http')) {
      toast.error('Please enter a valid HTTP or HTTPS website URL');
      return;
    }

    setIsLoading(true);
    hapticFeedback.medium();

    try {
      const res = await api.post('/syllabus/scrape-url', {
        url: urlInput.trim(),
        examName: examName.trim() || 'Imported Syllabus',
      });

      if (res.data?.success && res.data.syllabus?.tree) {
        hapticFeedback.success();
        setTreeData(res.data.syllabus.tree);
        if (res.data.syllabus.name) setExamName(res.data.syllabus.name);
        toast.success(
          `🎉 Successfully imported ${res.data.syllabus.totalLeafNodes} topics from URL!`
        );
      }
    } catch (err) {
      console.error('Scrape error:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch syllabus from URL');
    } finally {
      setIsLoading(false);
    }
  };

  // Import from Pasted Text
  const handleParseText = async (e) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || textInput.length < 15) {
      toast.error('Please paste at least a few lines of syllabus text');
      return;
    }

    setIsLoading(true);
    hapticFeedback.medium();

    try {
      const res = await api.post('/syllabus/parse-text', {
        text: textInput.trim(),
        examName: examName.trim() || 'Text Syllabus',
      });

      if (res.data?.success && res.data.syllabus?.tree) {
        hapticFeedback.success();
        setTreeData(res.data.syllabus.tree);
        toast.success(
          `🎉 Successfully parsed ${res.data.syllabus.totalLeafNodes} topics from text!`
        );
      }
    } catch (err) {
      console.error('Parse error:', err);
      toast.error(err.response?.data?.message || 'Failed to parse text');
    } finally {
      setIsLoading(false);
    }
  };

  // Tree Manipulation Handlers
  const handleUpdateTitle = (nodeId, newTitle) => {
    hapticFeedback.tap();
    function updateRecursive(nodes) {
      return nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, title: newTitle };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateRecursive(n.children) };
        }
        return n;
      });
    }
    setTreeData((prev) => updateRecursive(prev));
  };

  const handleAddChild = (parentId) => {
    hapticFeedback.light();
    const newChild = {
      id: `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: 'New Chapter / Topic',
      type: 'topic',
      children: [],
    };

    function addRecursive(nodes) {
      return nodes.map((n) => {
        if (n.id === parentId) {
          return {
            ...n,
            children: [...(n.children || []), newChild],
          };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: addRecursive(n.children) };
        }
        return n;
      });
    }

    setTreeData((prev) => addRecursive(prev));
  };

  const handleDeleteNode = (nodeId) => {
    hapticFeedback.medium();
    function deleteRecursive(nodes) {
      return nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => ({
          ...n,
          children: n.children ? deleteRecursive(n.children) : [],
        }));
    }
    setTreeData((prev) => deleteRecursive(prev));
  };

  const handleAddRootSubject = () => {
    hapticFeedback.tap();
    const newSubject = {
      id: `subj-${Date.now().toString(36)}`,
      title: 'New Subject',
      type: 'subject',
      children: [
        {
          id: `chap-${Date.now().toString(36)}`,
          title: 'Chapter 1: Overview',
          type: 'chapter',
          children: [],
        },
      ],
    };
    setTreeData((prev) => [...prev, newSubject]);
  };

  // Commit and Save Exam Template to MongoDB
  const handleSaveExamTemplate = async () => {
    if (!examName.trim()) {
      toast.error('Please enter an exam title before saving');
      return;
    }
    if (treeData.length === 0) {
      toast.error('The syllabus tree is empty. Import or add topics first.');
      return;
    }

    setIsSaving(true);
    hapticFeedback.success();

    try {
      const res = await api.post('/syllabus/save-template', {
        name: examName.trim(),
        tree: treeData,
      });

      if (res.data?.success) {
        toast.success(res.data.message || '🎉 Saved exam template to MongoDB!');
        await fetchExams();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Save template error:', err);
      toast.error(err.response?.data?.message || 'Failed to save exam template');
    } finally {
      setIsSaving(false);
    }
  };

  const totalLeafNodes = countLeafNodes(treeData);

  // Left Pane JSX (Import & Inspector Tools)
  const renderLeftPane = () => (
    <div className="space-y-5 lg:sticky lg:top-6">
      <div className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-5">
        {/* Exam Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs tracking-wide font-bold uppercase tracking-wider text-text-muted dark:text-text-darkMuted block">
            Exam Title
          </label>
          <input
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="e.g. GATE Computer Science 2026, SSC CGL"
            className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-xs tracking-wide text-text-main dark:text-text-darkMain font-bold focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Import Method Tabs (Segmented Control) */}
        <div className="bg-slate-200/80 dark:bg-white/10 p-1 rounded-2xl flex relative backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              setActiveImportTab('url');
            }}
            className={`flex-1 py-2 text-xs tracking-wide font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeImportTab === 'url'
                ? 'bg-surface-light dark:bg-surface-dark text-text-main dark:text-text-darkMain shadow-sm'
                : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Import from URL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              setActiveImportTab('text');
            }}
            className={`flex-1 py-2 text-xs tracking-wide font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeImportTab === 'text'
                ? 'bg-surface-light dark:bg-surface-dark text-text-main dark:text-text-darkMain shadow-sm'
                : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Import from Text</span>
          </button>
        </div>

        {/* TAB 1: Import from URL */}
        {activeImportTab === 'url' && (
          <form onSubmit={handleFetchFromUrl} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain block">
                Educational Portal / Webpage URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/syllabus-guide"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-xs tracking-wide font-mono text-text-main dark:text-text-darkMain placeholder-text-muted/60 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Sample Presets */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted dark:text-text-darkMuted block">
                Quick Sample Presets:
              </span>
              <div className="flex flex-col gap-1.5">
                {sampleUrlPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setExamName(preset.name);
                      setUrlInput(preset.url);
                    }}
                    className="text-left py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] text-text-muted hover:text-text-main transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-semibold">{preset.name}</span>
                    <span className="text-[10px] text-primary">Select →</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing Website DOM...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Fetch Syllabus</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: Import from Raw Text */}
        {activeImportTab === 'text' && (
          <form onSubmit={handleParseText} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-wide font-semibold text-text-main dark:text-text-darkMain block">
                  Paste Syllabus Text from PDF / Doc
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTextInput(samplePdfText);
                    setExamName('IES / ESE Engineering');
                    toast.success('Sample syllabus text loaded');
                  }}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Load Sample Text</span>
                </button>
              </div>
              <textarea
                rows={8}
                placeholder="Paste copied text here (e.g. Unit 1: Physics \n Chapter 1: Kinematics \n - Speed and Velocity)"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-xs tracking-wide font-mono text-text-main dark:text-text-darkMain placeholder-text-muted/60 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Structure...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Text</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  // Right Pane JSX (Interactive Tree Editor & Actions)
  const renderRightPane = () => (
    <div className="space-y-5">
      <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark space-y-6 relative">
        {/* Header & Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-secondary" />
            <div>
              <h2 className="text-base font-black text-text-main dark:text-text-darkMain tracking-tight">
                {examName || 'Untitled Syllabus Tree'}
              </h2>
              <p className="text-[11px] text-text-muted dark:text-text-darkMuted">
                Click any title to edit inline • Hover for node controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs tracking-wide font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              {totalLeafNodes} Total Topics
            </span>

            {!isLocked && (
              <button
                type="button"
                onClick={handleAddRootSubject}
                className="px-3 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-xs tracking-wide font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            )}
          </div>
        </div>

        {/* Tree View or Empty State */}
        {treeData.length > 0 ? (
          <div className="space-y-3 min-h-[380px] max-h-[620px] overflow-y-auto pr-1">
            <AnimatePresence>
              {treeData.map((rootNode) => (
                <TreeNode
                  key={rootNode.id}
                  node={rootNode}
                  depth={0}
                  onUpdateTitle={handleUpdateTitle}
                  onAddChild={handleAddChild}
                  onDeleteNode={handleDeleteNode}
                  isLocked={isLocked}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={FolderTree}
            title="Syllabus Tree is Empty"
            description={
              isLocked
                ? 'No syllabus structure has been assigned by your cohort instructor yet.'
                : 'Use the Left Pane to import from a website URL, paste syllabus text from a PDF, or click "Add Subject" to construct manually.'
            }
            actionText={!isLocked ? 'Add Root Subject' : undefined}
            onAction={!isLocked ? handleAddRootSubject : undefined}
            badge="Curriculum Empty"
          />
        )}

        {/* Sticky Save Bar (Native Apple iOS Blue #007AFF) - Hidden if isLocked */}
        {!isLocked ? (
          <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between sticky bottom-0 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md py-3 -mx-2 px-2 rounded-2xl z-20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
                Ready to commit{' '}
                <strong className="text-text-main dark:text-text-darkMain font-bold">
                  {totalLeafNodes}
                </strong>{' '}
                topics into database
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveExamTemplate}
              disabled={isSaving || treeData.length === 0}
              className="px-6 py-3.5 bg-accent hover:opacity-90 active:scale-95 text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {isSaving ? (
                <span>Saving to Database...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Exam Template</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between py-2 text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-label-secondary" />
              <span>Syllabus locked by cohort instructor. Read-only preview.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pt-2 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-apple dark:shadow-apple-dark">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black text-text-main dark:text-text-darkMain tracking-tight">
              Syllabus Ingestion Studio
            </h1>
          </div>
          <p className="text-xs tracking-wide text-text-muted dark:text-text-darkMuted">
            Scrape any syllabus URL, parse PDF text, or visually build multi-level exam trees with
            instant recalculation.
          </p>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-start sm:self-auto p-2 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Managed Student Lock Banner */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-background-elevated border-[0.5px] border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-label"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-label" />
            </div>
            <div>
              <span className="font-bold text-sm block">🔒 Syllabus Managed by Instructor</span>
              <p className="text-[11px] text-label-secondary pt-0.5">
                {teacherName
                  ? `Your curriculum is managed directly by ${teacherName}. Node editing and importing are locked.`
                  : 'Your curriculum is managed directly by your instructor. Node editing and importing are locked.'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-border text-label-secondary">
            Read Only
          </span>
        </motion.div>
      )}

      {/* Desktop Draggable Resizable Split Pane (mimicking Xcode or Mac Finder) */}
      <div className="hidden lg:block w-full">
        <PanelGroup direction="horizontal" className="min-h-[640px] w-full items-start gap-1">
          <Panel defaultSize={42} minSize={30} maxSize={55} className="pr-3">
            {renderLeftPane()}
          </Panel>
          <PanelResizeHandle className="w-3 hover:w-4 flex items-center justify-center cursor-col-resize group transition-all py-16 select-none shrink-0">
            <div className="w-1 h-14 rounded-full bg-black/15 dark:bg-white/20 group-hover:bg-primary group-hover:h-24 transition-all duration-200" />
          </PanelResizeHandle>
          <Panel defaultSize={58} minSize={45} className="pl-3">
            {renderRightPane()}
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile Stacked View */}
      <div className="lg:hidden space-y-6">
        {renderLeftPane()}
        {renderRightPane()}
      </div>
    </div>
  );
}


