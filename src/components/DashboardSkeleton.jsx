import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-14 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-2xl"></div>

      {/* Main Centerpiece Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center shadow-apple dark:shadow-apple-dark">
        {/* Circular Progress Bar Skeleton Ring */}
        <div className="w-52 h-52 relative my-2 rounded-full border-[10px] border-slate-200 dark:border-[#333333] border-t-primary/40 flex flex-col items-center justify-center">
          <div className="w-24 h-9 bg-slate-200 dark:bg-white/10 rounded-lg mb-2"></div>
          <div className="w-16 h-3 bg-slate-200 dark:bg-white/10 rounded mb-1"></div>
          <div className="w-20 h-3 bg-slate-200 dark:bg-white/10 rounded"></div>
        </div>

        {/* Text Instruction Skeleton */}
        <div className="w-48 h-4 bg-slate-200 dark:bg-white/10 rounded-full mt-4 mb-3"></div>

        {/* Action Buttons Skeleton */}
        <div className="flex items-center gap-3 mt-3 w-full justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/10"></div>
          <div className="flex-1 max-w-[220px] h-12 rounded-2xl bg-primary/40"></div>
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/10"></div>
        </div>
      </div>

      {/* Adaptive Status Card Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-2xl p-4 space-y-3 shadow-apple dark:shadow-apple-dark">
        <div className="flex justify-between items-center">
          <div className="w-32 h-3 bg-slate-200 dark:bg-white/10 rounded"></div>
          <div className="w-24 h-4 bg-slate-200 dark:bg-white/10 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl"></div>
          <div className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl"></div>
        </div>
        <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-2xl shadow-apple dark:shadow-apple-dark"></div>
        <div className="h-20 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-2xl shadow-apple dark:shadow-apple-dark"></div>
      </div>

      {/* Syllabus Bar Skeleton */}
      <div className="h-20 bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 rounded-2xl shadow-apple dark:shadow-apple-dark"></div>
    </div>
  );
}
