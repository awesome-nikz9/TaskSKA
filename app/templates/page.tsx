"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/tms/AppShell";
import { useAuth } from "@/lib/auth-context";
import { templateStore, type TaskTemplate, type TemplateCategory, type TaskStatus } from "@/lib/store";
import {
  LayoutTemplate, Plus, Trash2, ArrowRight, FileText, Search, Filter,
  Clock, TrendingUp, Pencil, X, Eye, Star, Tag
} from "lucide-react";
import Link from "next/link";

const CATEGORIES: TemplateCategory[] = [
  "Engineering",
  "Design",
  "QA & Testing",
  "DevOps",
  "Documentation",
  "Management",
  "Other"
];

const STATUS_OPTIONS: TaskStatus[] = ["Not Started", "In Progress", "Blocked", "Completed"];

export default function TemplatesPage() {
  const { user } = useAuth();
  const [allTemplates, setAllTemplates] = useState<TaskTemplate[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TaskTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("Other");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("Not Started");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "All">("All");
  const [showMyOnly, setShowMyOnly] = useState(false);

  const refresh = useCallback(() => {
    setAllTemplates(templateStore.getAll());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const resetForm = () => {
    setName("");
    setTitle("");
    setDescription("");
    setCategory("Other");
    setTags([]);
    setTagInput("");
    setEstimatedHours(undefined);
    setDefaultStatus("Not Started");
    setError("");
    setEditingTemplate(null);
  };

  const openEditForm = (t: TaskTemplate) => {
    if (t.isSystem) return; // system templates can't be edited
    setEditingTemplate(t);
    setName(t.name);
    setTitle(t.title);
    setDescription(t.description);
    setCategory(t.category);
    setTags(t.tags ?? []);
    setEstimatedHours(t.estimatedHours);
    setDefaultStatus(t.defaultStatus ?? "Not Started");
    setShowCreateForm(true);
    setError("");
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (!name.trim() || !title.trim()) {
      setError("Template name and task title are required.");
      return;
    }
    setSaving(true);

    if (editingTemplate) {
      // Update
      templateStore.update(editingTemplate.id, {
        name, title, description, category, tags, estimatedHours, defaultStatus,
      });
      setSuccess(`Template "${name}" updated!`);
    } else {
      // Create
      templateStore.create(user.id, {
        name, title, description, category, tags, estimatedHours, defaultStatus,
      });
      setSuccess(`Template "${name}" created!`);
    }

    setSaving(false);
    resetForm();
    setShowCreateForm(false);
    refresh();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDelete = (id: string) => {
    templateStore.delete(id);
    setDeleteConfirm(null);
    refresh();
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let result = allTemplates;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.title.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower) ||
          t.tags.some((tag) => tag.toLowerCase().includes(lower))
      );
    }
    if (categoryFilter !== "All") {
      result = result.filter((t) => t.category === categoryFilter);
    }
    if (showMyOnly && user) {
      result = result.filter((t) => t.ownerId === user.id);
    }
    // Sort: system first, then by usage, then by name
    return result.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      if (b.usageCount !== a.usageCount) return (b.usageCount ?? 0) - (a.usageCount ?? 0);
      return a.name.localeCompare(b.name);
    });
  }, [allTemplates, searchTerm, categoryFilter, showMyOnly, user]);

  // Category badge color
  const getCategoryColor = (cat: TemplateCategory) => {
    switch (cat) {
      case "Engineering": return "bg-blue-100 text-blue-700";
      case "Design": return "bg-purple-100 text-purple-700";
      case "QA & Testing": return "bg-green-100 text-green-700";
      case "DevOps": return "bg-orange-100 text-orange-700";
      case "Documentation": return "bg-cyan-100 text-cyan-700";
      case "Management": return "bg-pink-100 text-pink-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Task Templates</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Create reusable templates to speed up task creation. (TMS-39)
            </p>
          </div>
          <button
            onClick={() => { setShowCreateForm(true); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        {success && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">{success}</div>
        )}

        {/* Search & Filters */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates by name, title, description, or tags..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | "All")}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showMyOnly}
                onChange={(e) => setShowMyOnly(e.target.checked)}
                className="rounded"
              />
              My Templates Only
            </label>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredTemplates.length} template{filteredTemplates.length === 1 ? "" : "s"} found</span>
            {searchTerm || categoryFilter !== "All" || showMyOnly ? (
              <button
                onClick={() => { setSearchTerm(""); setCategoryFilter("All"); setShowMyOnly(false); }}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-card rounded-xl border border-primary/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "New Template"}
              </h2>
              <button
                onClick={() => { setShowCreateForm(false); resetForm(); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Template Name <span className="text-destructive">*</span></label>
                  <input
                    type="text" required placeholder="e.g. Bug Fix, Feature Request"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Default Task Title <span className="text-destructive">*</span></label>
                <input
                  type="text" required placeholder="e.g. Bug Fix: [Issue Name]"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Default Description (supports Markdown)</label>
                <textarea
                  rows={6} placeholder="## Problem&#10;Describe the issue...&#10;&#10;## Solution&#10;"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Estimated Hours (optional)</label>
                  <input
                    type="number" min="0" step="0.5" placeholder="e.g. 4"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={estimatedHours ?? ""}
                    onChange={(e) => setEstimatedHours(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Default Status</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={defaultStatus}
                    onChange={(e) => setDefaultStatus(e.target.value as TaskStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tags (comma-separated)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. bug, urgent, engineering"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors">
                    Add Tag
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        {t}
                        <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                </button>
                <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }} className="px-4 py-2.5 border border-border text-sm rounded-lg hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Templates Grid */}
        {filteredTemplates.length === 0 && !showCreateForm ? (
          <div className="bg-card rounded-xl border border-dashed border-border p-16 text-center">
                <LayoutTemplate className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No templates found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchTerm || categoryFilter !== "All" || showMyOnly
                ? "Try adjusting your filters."
                : "Create your first template to speed up recurring task creation."}
            </p>
            {!searchTerm && categoryFilter === "All" && !showMyOnly && (
              <button
                onClick={() => { setShowCreateForm(true); resetForm(); }}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((t) => (
              <div key={t.id} className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors group relative">
                {/* System badge */}
                {t.isSystem && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    <Star className="w-3 h-3" /> System
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  {!t.isSystem && t.ownerId === user.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditForm(t)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-foreground mb-1">{t.name}</h3>
                <p className="text-xs text-muted-foreground mb-2 font-mono truncate">{t.title}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(t.category)}`}>
                    {t.category}
                  </span>
                  {t.estimatedHours && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                      <Clock className="w-3 h-3" /> {t.estimatedHours}h
                    </span>
                  )}
                  {t.usageCount > 0 && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                      <TrendingUp className="w-3 h-3" /> {t.usageCount}
                    </span>
                  )}
                </div>

                {t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/5 text-primary text-xs rounded">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                    {t.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">+{t.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewTemplate(t)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <Link
                    href={`/tasks/new?template=${t.id}`}
                    onClick={() => templateStore.incrementUsage(t.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold rounded-lg transition-colors"
                  >
                    Use <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-card rounded-2xl p-6 max-w-2xl w-full border border-border shadow-xl max-h-[90vh] overflow-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{previewTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{previewTemplate.title}</p>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(previewTemplate.category)}`}>
                    {previewTemplate.category}
                  </span>
                  {previewTemplate.estimatedHours && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                      <Clock className="w-3.5 h-3.5" /> {previewTemplate.estimatedHours} hours
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                    Status: {previewTemplate.defaultStatus}
                  </span>
                  {previewTemplate.usageCount > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" /> Used {previewTemplate.usageCount} time{previewTemplate.usageCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {previewTemplate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Tags:</span>
                    {previewTemplate.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Description Preview:</p>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                      {previewTemplate.description || "(No description)"}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/tasks/new?template=${previewTemplate.id}`}
                    onClick={() => { templateStore.incrementUsage(previewTemplate.id); setPreviewTemplate(null); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Use This Template <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border shadow-xl">
              <h3 className="font-bold text-lg mb-2">Delete Template?</h3>
              <p className="text-muted-foreground text-sm mb-5">This will delete the template permanently. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold">
                  Delete
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
