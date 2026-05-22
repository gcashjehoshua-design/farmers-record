import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { Project, ProjectStatus, ProjectType } from "@/types";
import { FolderKanban, Plus, Save, CalendarDays, X, Trash2 } from "lucide-react";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { toasts, success, error: showError } = useToast();

  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const isSaving = createProject.isPending || updateProject.isPending || deleteProject.isPending;

  const [projectType, setProjectType] = useState<ProjectType>("");
  const [status, setStatus] = useState<ProjectStatus>("ongoing");
  const [implementedAt, setImplementedAt] = useState<string>("");
  const [filter, setFilter] = useState<"all" | ProjectStatus | "history">("all");
  const [projectToImplement, setProjectToImplement] = useState<Project | null>(null);
  const [implementDate, setImplementDate] = useState<string>("");
  
  // Custom Confirmation Modal State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToMakeInactive, setProjectToMakeInactive] = useState<Project | null>(null);

  const byLatestDateDesc = (a: Project, b: Project) => {
    const aTime = (a.implementedAt ?? a.createdAt).getTime();
    const bTime = (b.implementedAt ?? b.createdAt).getTime();
    return bTime - aTime;
  };

  const ongoingProjects = useMemo(
    () => projects.filter((p) => p.status === "ongoing").sort(byLatestDateDesc),
    [projects]
  );
  const implementedProjects = useMemo(
    () => projects.filter((p) => p.status === "implemented").sort(byLatestDateDesc),
    [projects]
  );
  const inactiveProjects = useMemo(
    () => projects.filter((p) => p.status === "inactive").sort(byLatestDateDesc),
    [projects]
  );
  const historyProjects = useMemo(
    () => projects.filter((p) => p.status === "implemented" || p.status === "inactive").sort(byLatestDateDesc),
    [projects]
  );

  const visibleProjects = useMemo(() => {
    if (filter === "all") return [...projects].sort(byLatestDateDesc);
    if (filter === "history") return historyProjects;
    return projects.filter((p) => p.status === filter).sort(byLatestDateDesc);
  }, [filter, projects, historyProjects]);

  const resetForm = () => {
    setProjectType("");
    setStatus("ongoing");
    setImplementedAt("");
  };

  const handleCreate = async () => {
    if (!isAdmin) return;
    if (!projectType.trim()) {
      showError("Please enter a valid project name before saving.");
      return;
    }
    if (status === "implemented" && !implementedAt) {
      showError("Please select the date when this project was implemented.");
      return;
    }
    try {
      await createProject.mutateAsync({
        projectType: projectType.trim(),
        status,
        implementedAt: status === "implemented" ? new Date(implementedAt) : undefined,
      });
      success("The new project has been successfully added to the record.");
      resetForm();
    } catch (e) {
      console.error(e);
      showError("We encountered an issue while trying to save the project. Please try again.");
    }
  };

  const saveImplementDate = async (p: Project) => {
    if (!isAdmin) return;
    try {
      await updateProject.mutateAsync({
        id: p.id,
        data: {
          status: "implemented",
          implementedAt: new Date(implementDate),
        },
      });
      success("Great! The project has been marked as implemented.");
      setProjectToImplement(null);
      setImplementDate("");
    } catch (e) {
      console.error(e);
      showError("We couldn't update the project status. Please check your connection and try again.");
    }
  };

  const handleMakeInactive = async (p: Project) => {
    if (!isAdmin) return;
    try {
      await updateProject.mutateAsync({
        id: p.id,
        data: {
          status: "inactive",
        },
      });
      success(`The project "${p.projectType}" is now marked as inactive.`);
      setProjectToMakeInactive(null);
    } catch (e) {
      console.error(e);
      showError("Failed to update project status. Please try again.");
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

  const handleDelete = async () => {
    if (!isAdmin || !projectToDelete) return;
    try {
      await deleteProject.mutateAsync(projectToDelete.id);
      success(`The project "${projectToDelete.projectType}" has been permanently removed.`);
      setProjectToDelete(null);
    } catch (e) {
      console.error(e);
      showError("The project could not be deleted at this time. Please try again later.");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} />
      ))}

      <ConfirmationModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Delete Project?"
        message={`Are you sure you want to delete "${projectToDelete?.projectType}"? This action is permanent and cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteProject.isPending}
      />

      <ConfirmationModal
        isOpen={!!projectToMakeInactive}
        onClose={() => setProjectToMakeInactive(null)}
        onConfirm={() => void handleMakeInactive(projectToMakeInactive!)}
        title="Make Project Inactive?"
        message={`Are you sure you want to mark "${projectToMakeInactive?.projectType}" as inactive?`}
        confirmText="Yes, Make Inactive"
        cancelText="Cancel"
        type="warning"
        isLoading={updateProject.isPending}
      />

      {projectToImplement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xl">
                Mark Project as Implemented
              </CardTitle>
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
                  onClick={() => void saveImplementDate(projectToImplement)}
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
                <input
                  type="text"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="input-modern"
                  placeholder="Type project name"
                />
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
                  <option value="inactive">Inactive</option>
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
              {(["all", "ongoing", "implemented", "inactive", "history"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    filter === k
                      ? "bg-farm-100 border-farm-300 text-farm-800 font-semibold"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {k === "all" ? "All" : k === "history" ? "History" : k === "ongoing" ? "Ongoing" : k === "implemented" ? "Implemented" : "Inactive"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-earth-600">
            Ongoing: {ongoingProjects.length} · Implemented: {implementedProjects.length} · Inactive: {inactiveProjects.length}
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
                              : p.status === "inactive"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.status === "implemented" ? "Implemented" : p.status === "inactive" ? "Inactive" : "Ongoing"}
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
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {p.status === "ongoing" && (
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => openImplementModal(p)}
                                disabled={isSaving}
                                className="bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Mark Implemented
                              </Button>
                            )}
                            {p.status !== "inactive" && (
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                className="bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
                                onClick={() => setProjectToMakeInactive(p)}
                                disabled={isSaving}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Make Inactive
                              </Button>
                            )}
                            <Button
                              size="sm"
                              type="button"
                              variant="outline"
                                className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                              onClick={() => setProjectToDelete(p)}
                              disabled={isSaving}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
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
