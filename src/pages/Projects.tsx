import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateProject, useProjects, useUpdateProject } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { Project, ProjectStatus, ProjectType } from "@/types";
import { FolderKanban, Plus, Save, CalendarDays, X } from "lucide-react";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

const PROJECT_TYPES: ProjectType[] = [
  "Crop Insurance",
  "Livestock Insurance",
  "ABSS",
  "RCEF Inbred Seed Assistance",
  "Hybrid Seed Assistance",
  "Inbred Seed Fertilizer Assistance",
  "Hybrid Seed Fertilizer Assistance",
  "Farmers Financial Assistance - Loan",
  "Farmers Financial Assistance - RFFA",
  "Rabies Vaccination",
  "Livestock / Poultry Treatment",
  "Training",
  "Technical Assistance",
  "Soil Analysis",
];

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { toasts, success, error: showError } = useToast();

  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isSaving = createProject.isPending || updateProject.isPending;

  const [projectType, setProjectType] = useState<ProjectType>(PROJECT_TYPES[0]);
  const [status, setStatus] = useState<ProjectStatus>("ongoing");
  const [implementedAt, setImplementedAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [filter, setFilter] = useState<"all" | ProjectStatus | "history">("all");
  const [projectToImplement, setProjectToImplement] = useState<Project | null>(null);
  const [implementDate, setImplementDate] = useState<string>("");

  const ongoingProjects = useMemo(
    () => projects.filter((p) => p.status === "ongoing"),
    [projects]
  );
  const implementedProjects = useMemo(
    () => projects.filter((p) => p.status === "implemented"),
    [projects]
  );
  const historyProjects = useMemo(
    () =>
      [...implementedProjects].sort(
        (a, b) => (b.implementedAt?.getTime() ?? 0) - (a.implementedAt?.getTime() ?? 0)
      ),
    [implementedProjects]
  );

  const visibleProjects = useMemo(() => {
    if (filter === "all") return projects;
    if (filter === "history") return historyProjects;
    return projects.filter((p) => p.status === filter);
  }, [filter, projects, historyProjects]);

  const resetForm = () => {
    setProjectType(PROJECT_TYPES[0]);
    setStatus("ongoing");
    setImplementedAt("");
    setNotes("");
  };

  const handleCreate = async () => {
    if (!isAdmin) return;
    if (status === "implemented" && !implementedAt) {
      showError("Please provide the implemented date.");
      return;
    }
    try {
      await createProject.mutateAsync({
        projectType,
        status,
        implementedAt: status === "implemented" ? new Date(implementedAt) : undefined,
        notes: notes.trim() || undefined,
      });
      success("Project added.");
      resetForm();
    } catch (e) {
      console.error(e);
      showError("Failed to add project.");
    }
  };

  const markAsImplemented = async (p: Project) => {
    if (!isAdmin) return;
    try {
      await updateProject.mutateAsync({
        id: p.id,
        data: { status: "implemented", implementedAt: new Date(implementDate) },
      });
      success("Project marked as implemented.");
      setProjectToImplement(null);
      setImplementDate("");
    } catch (e) {
      console.error(e);
      showError("Failed to update project.");
    }
  };

  const openImplementModal = (p: Project) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setImplementDate(`${yyyy}-${mm}-${dd}`);
    setProjectToImplement(p);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}

      {projectToImplement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xl">Mark Project as Implemented</CardTitle>
              <button
                type="button"
                onClick={() => setProjectToImplement(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Project:</span> {projectToImplement.projectType}
              </p>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-earth-700 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-farm-600" />
                  Date Implemented
                </label>
                <input
                  type="date"
                  className="input-modern"
                  value={implementDate}
                  onChange={(e) => setImplementDate(e.target.value)}
                />
                <p className="text-xs text-gray-500">Defaults to today, but you can choose a past date.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setProjectToImplement(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-farm-600 hover:bg-farm-700 text-white"
                  disabled={!implementDate || isSaving}
                  onClick={() => void markAsImplemented(projectToImplement)}
                >
                  {isSaving ? "Saving..." : "Confirm"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="border-b border-gray-200 bg-farm-50/80 rounded-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-farm-100 rounded-2xl">
              <FolderKanban className="w-10 h-10 text-farm-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-gray-900">Projects</h1>
              <p className="text-base md:text-lg text-gray-700">
                Track ongoing, implemented projects and implementation history.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <Card className="card-modern border-farm-200">
          <CardHeader>
            <CardTitle>Add / Implement Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-earth-700">Project</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="input-modern"
                >
                  {PROJECT_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-earth-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="input-modern"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="implemented">Implemented</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-earth-700">Date Implemented</label>
                <input
                  type="date"
                  className="input-modern"
                  value={implementedAt}
                  onChange={(e) => setImplementedAt(e.target.value)}
                  disabled={status !== "implemented"}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-earth-700">Notes (optional)</label>
                <input
                  type="text"
                  className="input-modern"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Brief notes"
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={isSaving} className="btn-farm">
              <Plus className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Add Project"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="card-modern border-gray-200">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Project List</CardTitle>
            <div className="flex items-center gap-2">
              {(["all", "ongoing", "implemented", "history"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    filter === k
                      ? "bg-farm-100 border-farm-300 text-farm-800 font-semibold"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {k === "all" ? "All" : k === "history" ? "History" : k === "ongoing" ? "Ongoing" : "Implemented"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-earth-600">
            Ongoing: {ongoingProjects.length} · Implemented: {implementedProjects.length}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-earth-600">Loading projects...</p>
          ) : visibleProjects.length === 0 ? (
            <p className="text-earth-600">No projects found for this section.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Project</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date Implemented</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                    {isAdmin && <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.projectType}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            p.status === "implemented"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.status === "implemented" ? "Implemented" : "Ongoing"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.implementedAt
                          ? p.implementedAt.toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.notes || "-"}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          {p.status !== "implemented" ? (
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => openImplementModal(p)}
                              disabled={isSaving}
                              className="bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Mark Implemented
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-500">Done</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
