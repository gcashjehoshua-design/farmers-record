import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type UserRole = "admin" | "staff";

export interface AppUser {
  id: string;
  authUserId: string;
  fullName: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: AppUser | null;
  users: AppUser[];
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (input: { fullName: string; username: string; role: UserRole; password: string }) => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AppUserRow = Database["public"]["Tables"]["app_users"]["Row"];

function mapRowToAppUser(row: AppUserRow): AppUser {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    username: row.email.replace("@passicity.gov.ph", ""),
    role: (row.role as UserRole) ?? "staff",
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

const getEmailFromUsername = (username: string) => {
  const normalized = username.trim().toLowerCase();
  if (normalized.includes("@")) return normalized;
  return `${normalized}@passicity.gov.ph`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Load current session and profile on mount
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshCurrentUserAndUsers();
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      void refreshCurrentUserAndUsers();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshCurrentUserAndUsers = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Failed to get auth user:", authError);
    }

    const authUser = authData?.user;
    if (!authUser) {
      setUser(null);
      setUsers([]);
      return;
    }

    // Find or create app_users profile for this auth user
    const { data: rows, error: profileError } = await (supabase as any)
      .from("app_users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .limit(1);

    if (profileError) {
      console.error("Failed to load app_users profile:", profileError);
      setUser(null);
      setUsers([]);
      return;
    }

    let profileRow = rows && rows[0];

    if (!profileRow) {
      // If this is the first user in the system, make them admin. Otherwise default to staff.
      const { count, error: countError } = await (supabase as any)
        .from("app_users")
        .select("id", { count: "exact", head: true });

      if (countError) {
        console.error("Failed to count app_users:", countError);
        setUser(null);
        setUsers([]);
        return;
      }

      const role: UserRole = count === 0 ? "admin" : "staff";
      const fullName =
        (authUser.user_metadata && (authUser.user_metadata.full_name as string)) ||
        authUser.email ||
        "User";

      // Retry logic with exponential backoff for race condition on new device login
      let insertData;
      let insertError;
      let retries = 0;
      const MAX_RETRIES = 3;

      while (retries < MAX_RETRIES) {
        const result = await (supabase as any)
          .from("app_users")
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email ?? "",
            full_name: fullName,
            role,
            is_active: true,
          })
          .select("*")
          .single();

        insertData = result.data;
        insertError = result.error;

        if (!insertError) break;

        retries++;
        if (retries < MAX_RETRIES) {
          // Exponential backoff: 100ms, 300ms, 900ms
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(3, retries - 1) * 100)
          );
        }
      }

      if (insertError || !insertData) {
        console.error("Failed to create app_users profile after retries:", insertError);
        setUser(null);
        setUsers([]);
        return;
      }

      profileRow = insertData;
    }

    if (!profileRow.is_active) {
      await supabase.auth.signOut();
      setUser(null);
      setUsers([]);
      return;
    }

    const currentUser = mapRowToAppUser(profileRow);

    // If admin, load all users; otherwise just self
    if (currentUser.role === "admin") {
      const { data: allRows, error: listError } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false });
      if (listError || !allRows) {
        console.error("Failed to list app_users:", listError);
        setUser(currentUser);
        setUsers([currentUser]);
        return;
      }
      setUser(currentUser);
      setUsers(allRows.map(mapRowToAppUser));
    } else {
      setUser(currentUser);
      setUsers([currentUser]);
    }
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      users,
      loading,
      login: async (username, password) => {
        const email = getEmailFromUsername(username);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw new Error(error.message || "Failed to sign in.");
        }
        await refreshCurrentUserAndUsers();
      },
      logout: async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUsers([]);
      },
      createUser: async ({ fullName, username, role, password }) => {
        if (!user || user.role !== "admin") {
          throw new Error("Only admin users can create accounts.");
        }

        const email = getEmailFromUsername(username);

        // Call PostgreSQL RPC function to create user
        try {
          const { error: rpcError } = await (supabase as any).rpc("admin_create_user", {
            p_full_name: fullName.trim(),
            p_email: email,
            p_role: role,
            p_password: password,
          });

          if (rpcError) {
            throw new Error(rpcError.message || "Failed to create user");
          }

          await refreshCurrentUserAndUsers();
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Failed to create user - unexpected error");
        }
      },
      updateUserRole: async (id, role) => {
        if (!user || user.role !== "admin") {
          throw new Error("Only admin users can update roles.");
        }

        const { error } = await (supabase as any)
          .from("app_users")
          .update({ role })
          .eq("id", id);

        if (error) {
          throw new Error(error.message || "Failed to update user role.");
        }

        await refreshCurrentUserAndUsers();
      },
      toggleUserActive: async (id) => {
        if (!user || user.role !== "admin") {
          throw new Error("Only admin users can change status.");
        }

        const { data, error } = await (supabase as any)
          .from("app_users")
          .select("is_active")
          .eq("id", id)
          .limit(1);

        if (error || !data || !data[0]) {
          throw new Error(error?.message || "Failed to load user status.");
        }

        const nextActive = !data[0].is_active;

        const { error: updateError } = await (supabase as any)
          .from("app_users")
          .update({ is_active: nextActive })
          .eq("id", id);

        if (updateError) {
          throw new Error(updateError.message || "Failed to update user status.");
        }

        await refreshCurrentUserAndUsers();
      },
      deleteUser: async (id) => {
        if (!user || user.role !== "admin") {
          throw new Error("Only admin users can delete users.");
        }

        try {
          const { error: rpcError } = await (supabase as any).rpc("admin_delete_user", {
            p_user_id: id,
          });

          if (rpcError) {
            throw new Error(rpcError.message || "Failed to delete user");
          }

          await refreshCurrentUserAndUsers();
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Failed to delete user - unexpected error");
        }
      },
    }),
    [user, users, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}

