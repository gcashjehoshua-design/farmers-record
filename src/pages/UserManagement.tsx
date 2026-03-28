import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, UserPlus, Users, Trash2, ToggleLeft, ToggleRight, Mail, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function UserManagement() {
  const { user, users, createUser, updateUserRole, toggleUserActive, deleteUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || user.role !== "admin") {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="max-w-md w-full rounded-2xl border-2 border-red-200 bg-red-50 px-6 py-5 text-red-800 shadow-farm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold text-base">Access restricted</p>
              <p className="text-sm mt-1">
                Only administrator accounts can manage users. Please log in as an administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createUser({
        fullName,
        email,
        role,
        password,
      });
      setFormSuccess("User account created successfully.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("staff");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-farm-50/80">
        <div className="container mx-auto px-4 max-w-5xl py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-farm-100 rounded-2xl">
              <Shield className="w-10 h-10 text-farm-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1 text-gray-900">
                User Management
              </h1>
              <p className="text-base md:text-lg text-gray-700">
                Create and manage administrator and staff accounts.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-8 space-y-6">
        {/* Create User */}
        <Card className="card-modern border-farm-200 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-farm-100 rounded-xl">
                <UserPlus className="w-6 h-6 text-farm-700" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display">Create New User</CardTitle>
                <CardDescription className="text-base">
                  Add a new administrator or staff account to the system.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {formSuccess}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleCreateUser}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                    Full name
                  </label>
                  <Input
                    type="text"
                    className="input-modern h-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-earth-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      className="input-modern h-11 pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                    Role
                  </label>
                  <select
                    className="input-modern h-14 w-full text-base px-4"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "admin" | "staff")}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-earth-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      className="input-modern h-11 pl-9 pr-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-earth-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      className="input-modern h-11 pl-9 pr-11"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="btn-farm w-full md:w-auto h-11 px-8 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Creating user…" : "Create user"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Existing Users */}
        <Card className="card-modern border-earth-200 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="bg-gradient-to-r from-earth-50 to-earth-100 border-b-2 border-earth-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-earth-100 rounded-xl">
                <Users className="w-6 h-6 text-earth-700" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display">Existing Users</CardTitle>
                <CardDescription className="text-base">
                  View all registered users, their roles, and status.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Name</TableHead>
                    <TableHead className="w-[25%]">Email</TableHead>
                    <TableHead className="w-[15%]">Role</TableHead>
                    <TableHead className="w-[12%] text-center">Status</TableHead>
                    <TableHead className="w-[18%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-earth-600">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.id === user.id;
                      return (
                        <TableRow key={u.id} className="hover:bg-earth-50/60">
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-earth-900">{u.fullName}</span>
                              <span className="text-xs text-earth-500">
                                Created {new Date(u.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-sm">{u.email}</TableCell>
                          <TableCell className="py-3 text-sm capitalize">
                            <select
                              className="input-modern h-11 text-sm px-4 w-full"
                              value={u.role}
                              onChange={(e) =>
                                updateUserRole(u.id, e.target.value as "admin" | "staff")
                              }
                              disabled={isSelf}
                            >
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                                u.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {u.isActive ? (
                                <>
                                  <ToggleRight className="w-3.5 h-3.5" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-3.5 h-3.5" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 border-2 border-earth-200 hover:border-earth-400 text-xs"
                                onClick={() => toggleUserActive(u.id)}
                                disabled={isSelf}
                              >
                                {u.isActive ? (
                                  <>
                                    <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="w-3.5 h-3.5 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-9 px-3 text-xs"
                                onClick={() => deleteUser(u.id)}
                                disabled={isSelf}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

