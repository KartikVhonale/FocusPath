import { create } from 'zustand';

/**
 * Zustand Store for 4-Level Deep Syllabus Tree Expansion & Local Navigation State
 * Prevents tree collapses or UI flashing during optimistic updates and background re-renders.
 */
export const useSyllabusStore = create((set, get) => ({
  expandedSubjects: {},
  expandedChapters: {},
  expandedTopics: {},

  toggleSubject: (sIdx) =>
    set((state) => ({
      expandedSubjects: {
        ...state.expandedSubjects,
        [sIdx]: state.expandedSubjects[sIdx] === undefined ? false : !state.expandedSubjects[sIdx],
      },
    })),

  toggleChapter: (chapKey) =>
    set((state) => ({
      expandedChapters: {
        ...state.expandedChapters,
        [chapKey]:
          state.expandedChapters[chapKey] === undefined ? false : !state.expandedChapters[chapKey],
      },
    })),

  toggleTopic: (topKey) =>
    set((state) => ({
      expandedTopics: {
        ...state.expandedTopics,
        [topKey]:
          state.expandedTopics[topKey] === undefined ? false : !state.expandedTopics[topKey],
      },
    })),

  setSubjectExpanded: (sIdx, isExpanded) =>
    set((state) => ({
      expandedSubjects: { ...state.expandedSubjects, [sIdx]: isExpanded },
    })),

  setChapterExpanded: (chapKey, isExpanded) =>
    set((state) => ({
      expandedChapters: { ...state.expandedChapters, [chapKey]: isExpanded },
    })),

  setTopicExpanded: (topKey, isExpanded) =>
    set((state) => ({
      expandedTopics: { ...state.expandedTopics, [topKey]: isExpanded },
    })),

  expandAll: (subjects = []) => {
    const expSub = {};
    const expChap = {};
    const expTop = {};

    subjects.forEach((subj, sIdx) => {
      expSub[sIdx] = true;
      (subj.chapters || []).forEach((chap, cIdx) => {
        expChap[`${sIdx}-${cIdx}`] = true;
        (chap.topics || []).forEach((_, tIdx) => {
          expTop[`${sIdx}-${cIdx}-${tIdx}`] = true;
        });
      });
    });

    set({
      expandedSubjects: expSub,
      expandedChapters: expChap,
      expandedTopics: expTop,
    });
  },

  collapseAll: () =>
    set({
      expandedSubjects: {},
      expandedChapters: {},
      expandedTopics: {},
    }),

  expandMatchingBranches: (searchQuery, subjects = []) => {
    if (!searchQuery || !searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const newExpSub = {};
    const newExpChap = {};
    const newExpTop = {};

    subjects.forEach((subj, sIdx) => {
      const subjName = subj.subjectName || subj.name || `Subject ${sIdx + 1}`;
      (subj.chapters || []).forEach((chap, cIdx) => {
        const chapName = chap.chapterName || chap.title || `Chapter ${cIdx + 1}`;
        (chap.topics || []).forEach((top, tIdx) => {
          const topTitle = top.title || `Topic ${tIdx + 1}`;
          const subMatch = (top.subtopics || []).some((st) =>
            (st.title || '').toLowerCase().includes(q)
          );
          if (
            subMatch ||
            topTitle.toLowerCase().includes(q) ||
            chapName.toLowerCase().includes(q) ||
            subjName.toLowerCase().includes(q)
          ) {
            newExpSub[sIdx] = true;
            newExpChap[`${sIdx}-${cIdx}`] = true;
            newExpTop[`${sIdx}-${cIdx}-${tIdx}`] = true;
          }
        });
      });
    });

    set((state) => ({
      expandedSubjects: { ...state.expandedSubjects, ...newExpSub },
      expandedChapters: { ...state.expandedChapters, ...newExpChap },
      expandedTopics: { ...state.expandedTopics, ...newExpTop },
    }));
  },
}));

export default useSyllabusStore;
