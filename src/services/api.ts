import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Farmer, Transaction, DashboardStats } from "@/types";

// Helper function to map database row to Farmer type
const mapFarmerFromDb = (row: Database["public"]["Tables"]["farmers"]["Row"]): Farmer => ({
  id: row.id,
  fullName: row.full_name,
  phone: row.phone,
  rsbsaNumber: row.rsbsa_number || undefined,
  dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : undefined,
  address: row.address || undefined,
  barangay: row.barangay || undefined,
  zipCode: row.zip_code || undefined,
  farmType: row.farm_type || undefined,
  farmLocation: row.farm_location || undefined,
  organization: row.organization || undefined,
  notes: row.notes || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Helper function to map Farmer type to database row
const mapFarmerToDb = (farmer: Omit<Farmer, "id" | "createdAt" | "updatedAt">) => ({
  full_name: farmer.fullName,
  phone: farmer.phone,
  rsbsa_number: farmer.rsbsaNumber ?? null,
  date_of_birth: farmer.dateOfBirth ? farmer.dateOfBirth.toISOString() : null,
  address: farmer.address || null,
  barangay: farmer.barangay || null,
  zip_code: farmer.zipCode || null,
  farm_type: farmer.farmType || null,
  farm_location: farmer.farmLocation || null,
  organization: farmer.organization || null,
  notes: farmer.notes || null,
});

// Helper function to map database row to Transaction type
const mapTransactionFromDb = (row: Database["public"]["Tables"]["transactions"]["Row"]): Transaction => ({
  id: row.id,
  farmerId: row.farmer_id,
  transactionType: row.transaction_type,
  amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : undefined,
  description: row.description || undefined,
  notes: row.notes || undefined,
  date: new Date(row.office_visit_at),
  createdAt: new Date(row.created_at),
});

// Helper function to map Transaction type to database row
const mapTransactionToDb = (transaction: Omit<Transaction, "id" | "createdAt">) => ({
  farmer_id: transaction.farmerId,
  transaction_type: transaction.transactionType,
  amount: transaction.amount ?? null,
  description: transaction.description || null,
  notes: transaction.notes || null,
  office_visit_at: transaction.date.toISOString(),
});

// Farmers
export const farmerService = {
  list: async (): Promise<Farmer[]> => {
    console.log("📡 Fetching farmers from Supabase...");
    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching farmers:", error);
      throw error;
    }
    console.log("✅ Farmers fetched:", data?.length ?? 0);
    return data?.map(mapFarmerFromDb) ?? [];
  },

  get: async (id: string): Promise<Farmer> => {
    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return mapFarmerFromDb(data);
  },

  create: async (farmerData: Omit<Farmer, "id" | "createdAt" | "updatedAt">): Promise<Farmer> => {
    const { data, error } = await supabase
      .from("farmers")
      .insert(mapFarmerToDb(farmerData) as never)
      .select()
      .single();

    if (error) throw error;
    return mapFarmerFromDb(data);
  },

  update: async (id: string, farmerData: Partial<Farmer>): Promise<Farmer> => {
    const updateData: Database["public"]["Tables"]["farmers"]["Update"] = {};
    
    if (farmerData.fullName !== undefined) updateData.full_name = farmerData.fullName;
    if (farmerData.phone !== undefined) updateData.phone = farmerData.phone;
    if (farmerData.rsbsaNumber !== undefined) updateData.rsbsa_number = farmerData.rsbsaNumber ?? null;
    if (farmerData.dateOfBirth !== undefined) updateData.date_of_birth = farmerData.dateOfBirth ? farmerData.dateOfBirth.toISOString() : null;
    if (farmerData.address !== undefined) updateData.address = farmerData.address || null;
    if (farmerData.barangay !== undefined) updateData.barangay = farmerData.barangay || null;
    if (farmerData.zipCode !== undefined) updateData.zip_code = farmerData.zipCode || null;
    if (farmerData.farmType !== undefined) updateData.farm_type = farmerData.farmType || null;
    if (farmerData.farmLocation !== undefined) updateData.farm_location = farmerData.farmLocation || null;
    if (farmerData.organization !== undefined) updateData.organization = farmerData.organization || null;
    if (farmerData.notes !== undefined) updateData.notes = farmerData.notes || null;

    const { data, error } = await supabase
      .from("farmers")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapFarmerFromDb(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("farmers")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  search: async (query: string): Promise<Farmer[]> => {
    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,rsbsa_number.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(mapFarmerFromDb);
  },
};

// Transactions
export const transactionService = {
  list: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("office_visit_at", { ascending: false });

    if (error) throw error;
    return data.map(mapTransactionFromDb);
  },

  get: async (id: string): Promise<Transaction> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return mapTransactionFromDb(data);
  },

  create: async (transactionData: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> => {
    const { data, error } = await supabase
      .from("transactions")
      .insert(mapTransactionToDb(transactionData) as never)
      .select()
      .single();

    if (error) throw error;
    return mapTransactionFromDb(data);
  },

  update: async (id: string, transactionData: Partial<Transaction>): Promise<Transaction> => {
    const updateData: Database["public"]["Tables"]["transactions"]["Update"] = {};
    
    if (transactionData.farmerId !== undefined) updateData.farmer_id = transactionData.farmerId;
    if (transactionData.transactionType !== undefined) updateData.transaction_type = transactionData.transactionType;
    if (transactionData.amount !== undefined) updateData.amount = transactionData.amount ?? null;
    if (transactionData.description !== undefined) updateData.description = transactionData.description || null;
    if (transactionData.notes !== undefined) updateData.notes = transactionData.notes || null;
    if (transactionData.date !== undefined) updateData.office_visit_at = transactionData.date.toISOString();

    const { data, error } = await supabase
      .from("transactions")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapTransactionFromDb(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  listByFarmer: async (farmerId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("farmer_id", farmerId)
      .order("office_visit_at", { ascending: false });

    if (error) throw error;
    return data.map(mapTransactionFromDb);
  },
};

// Dashboard
export const dashboardService = {
  stats: async (month?: number, year?: number, day?: number): Promise<DashboardStats> => {
    // Use provided month/year/day or default to current
    const now = new Date();
    const selectedMonth = month !== undefined ? month : now.getMonth() + 1; // 1-12
    const selectedYear = year !== undefined ? year : now.getFullYear();
    const selectedDay = day !== undefined ? day : undefined;

    // Calculate the start and end dates
    let startDate: Date;
    let endDate: Date;

    if (selectedDay !== undefined) {
      // Specific day
      startDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 0, 0, 0);
      endDate = new Date(selectedYear, selectedMonth - 1, selectedDay, 23, 59, 59);
    } else {
      // Entire month
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    }

    const [farmersRes, transRes] = await Promise.all([
      supabase.from("farmers").select("*", { count: "exact", head: true }),
      supabase
        .from("transactions")
        .select("farmer_id")
        .gte("office_visit_at", startDate.toISOString())
        .lte("office_visit_at", endDate.toISOString()),
    ]);

    if (farmersRes.error) throw farmersRes.error;
    if (transRes.error) throw transRes.error;

    // Calculate unique farmers and total visits for the selected period
    const transactions = transRes.data as Array<Pick<Database["public"]["Tables"]["transactions"]["Row"], "farmer_id">> | null;
    const uniqueFarmers = new Set(transactions?.map((t) => t.farmer_id) || []);
    const visits = transactions?.length || 0;

    return {
      totalFarmers: farmersRes.count || 0,
      farmersVisitedThisMonth: uniqueFarmers.size,
      visitsThisMonth: visits,
    };
  },

  /** List visits (transactions with farmer names) for a given month/year and optional day, for PDF export */
  visitsList: async (month: number, year: number, day?: number): Promise<Array<Transaction & { farmerName: string }>> => {
    let startDate: Date;
    let endDate: Date;
    if (day !== undefined) {
      startDate = new Date(year, month - 1, day, 0, 0, 0);
      endDate = new Date(year, month - 1, day, 23, 59, 59);
    } else {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    }

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .gte("office_visit_at", startDate.toISOString())
      .lte("office_visit_at", endDate.toISOString())
      .order("office_visit_at", { ascending: true });

    if (txError) throw txError;
    const transactions = (txData || []).map(mapTransactionFromDb);

    const farmerIds = [...new Set(transactions.map((t) => t.farmerId))];
    if (farmerIds.length === 0) return [];

    const { data: farmersData, error: farmersError } = await supabase
      .from("farmers")
      .select("id, full_name")
      .in("id", farmerIds);

    if (farmersError) throw farmersError;
    const nameByFarmerId: Record<string, string> = {};
    (farmersData || []).forEach((f: { id: string; full_name: string }) => {
      nameByFarmerId[f.id] = f.full_name || "Unknown";
    });

    return transactions.map((t: typeof transactions[0]) => ({
      ...t,
      farmerName: nameByFarmerId[t.farmerId] || "Unknown",
    }));
  },
};
