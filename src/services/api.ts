import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Farmer, FarmerCommodity, Transaction, DashboardStats, Project } from "@/types";

/** PostgREST/Supabase default max rows per request — paginate past this for full lists. */
const REST_PAGE_SIZE = 1000;

// Helper function to map database row to Farmer type
const mapFarmerFromDb = (row: Database["public"]["Tables"]["farmers"]["Row"]): Farmer => ({
  rsbsaCode: row.rsbsa_code,
  lastName: row.last_name,
  firstName: row.first_name,
  middleName: row.middle_name || undefined,
  fullName: row.full_name,
  gender: row.gender || undefined,
  birthdate: row.birthdate ? new Date(row.birthdate) : undefined,
  phone: row.phone || undefined,
  isFarmer: row.is_farmer ?? false,
  isFarmworker: row.is_farmworker ?? false,
  isFisherfolk: row.is_fisherfolk ?? false,
  isAgriyouth: row.is_agriyouth ?? false,
  isIndigenousPeople: row.is_indigenous_people ?? false,
  isOrganicPractitioner: row.is_organic_practitioner ?? false,
  isArb: row.is_arb ?? false,
  farmerAddress1: row.farmer_address_1 || undefined,
  farmerAddress2: row.farmer_address_2 || undefined,
  farmerAddress3: row.farmer_address_3 || undefined,
  parcelNo: row.parcel_no || undefined,
  parcelAddress1: row.parcel_address_1 || undefined,
  parcelAddress2: row.parcel_address_2 || undefined,
  parcelAddress3: row.parcel_address_3 || undefined,
  parcelArea: row.parcel_area || undefined,
  cropArea: row.crop_area || undefined,
  farmType: row.farm_type || undefined,
  tribe: row.tribe || undefined,
  agency: row.agency || undefined,
  ownershipType: row.ownership_type || undefined,
  ownerName: row.owner_name || undefined,
  dateEncoded: row.date_encoded ? new Date(row.date_encoded) : undefined,
  notes: row.notes || undefined,
  isActive: row.is_active ?? true,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Helper function to map Farmer type to database row
const mapFarmerToDb = (farmer: Omit<Farmer, "createdAt" | "updatedAt">) => ({
  rsbsa_code: farmer.rsbsaCode,
  last_name: farmer.lastName,
  first_name: farmer.firstName,
  middle_name: farmer.middleName || null,
  full_name: farmer.fullName,
  gender: farmer.gender || null,
  birthdate: farmer.birthdate ? farmer.birthdate.toISOString().split('T')[0] : null,
  phone: farmer.phone || null,
  is_farmer: farmer.isFarmer || false,
  is_farmworker: farmer.isFarmworker || false,
  is_fisherfolk: farmer.isFisherfolk || false,
  is_agriyouth: farmer.isAgriyouth || false,
  is_indigenous_people: farmer.isIndigenousPeople || false,
  is_organic_practitioner: farmer.isOrganicPractitioner || false,
  is_arb: farmer.isArb || false,
  farmer_address_1: farmer.farmerAddress1 || null,
  farmer_address_2: farmer.farmerAddress2 || null,
  farmer_address_3: farmer.farmerAddress3 || null,
  parcel_no: farmer.parcelNo || null,
  parcel_address_1: farmer.parcelAddress1 || null,
  parcel_address_2: farmer.parcelAddress2 || null,
  parcel_address_3: farmer.parcelAddress3 || null,
  parcel_area: farmer.parcelArea || null,
  crop_area: farmer.cropArea || null,
  farm_type: farmer.farmType || null,
  tribe: farmer.tribe || null,
  agency: farmer.agency || null,
  ownership_type: farmer.ownershipType || null,
  owner_name: farmer.ownerName || null,
  date_encoded: farmer.dateEncoded ? farmer.dateEncoded.toISOString() : null,
  notes: farmer.notes || null,
  is_active: farmer.isActive ?? true,
});

// Helper function to map database row to FarmerCommodity type
const mapCommodityFromDb = (row: Database["public"]["Tables"]["farmer_commodities"]["Row"]): FarmerCommodity => ({
  id: row.id,
  rsbsaCode: row.rsbsa_code,
  commodityName: row.commodity_name,
  numberOfHeads: row.number_of_heads || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Helper function to map database row to Transaction type
const mapTransactionFromDb = (row: Database["public"]["Tables"]["transactions"]["Row"]): Transaction => ({
  id: row.id,
  rsbsaCode: row.rsbsa_code,
  transactionType: row.transaction_type,
  amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : undefined,
  description: row.description || undefined,
  notes: row.notes || undefined,
  officeVisitAt: row.office_visit_at ? new Date(row.office_visit_at) : undefined,
  createdAt: new Date(row.created_at),
});

// Helper function to map Transaction type to database row
const mapTransactionToDb = (transaction: Omit<Transaction, "id" | "createdAt">) => ({
  rsbsa_code: transaction.rsbsaCode,
  transaction_type: transaction.transactionType,
  amount: transaction.amount ?? null,
  description: transaction.description || null,
  notes: transaction.notes || null,
  office_visit_at: transaction.officeVisitAt ? transaction.officeVisitAt.toISOString() : new Date().toISOString(),
});

const mapProjectFromDb = (row: Database["public"]["Tables"]["projects"]["Row"]): Project => ({
  id: row.id,
  projectType: row.project_type as Project["projectType"],
  status: row.status as Project["status"],
  implementedAt: row.implemented_at ? new Date(row.implemented_at) : undefined,
  notes: row.notes || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Farmers
export const farmerService = {
  list: async (includeInactive = false): Promise<Farmer[]> => {
    console.log(`📡 Fetching farmers from Supabase (includeInactive: ${includeInactive})...`);
    const allRows: Database["public"]["Tables"]["farmers"]["Row"][] = [];
    let from = 0;
    for (;;) {
      let query = supabase
        .from("farmers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.range(from, from + REST_PAGE_SIZE - 1);

      if (error) {
        console.error("❌ Error fetching farmers:", error);
        throw error;
      }
      const batch = data ?? [];
      allRows.push(...batch);
      if (batch.length < REST_PAGE_SIZE) break;
      from += REST_PAGE_SIZE;
    }
    console.log("✅ Farmers fetched:", allRows.length);
    return allRows.map(mapFarmerFromDb);
  },

  get: async (rsbsaCode: string): Promise<Farmer> => {
    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .eq("rsbsa_code", rsbsaCode)
      .single();

    if (error) throw error;
    return mapFarmerFromDb(data);
  },

  create: async (farmerData: Omit<Farmer, "createdAt" | "updatedAt">): Promise<Farmer> => {
    const { data, error } = await supabase
      .from("farmers")
      .insert(mapFarmerToDb(farmerData) as never)
      .select()
      .single();

    if (error) throw error;
    return mapFarmerFromDb(data);
  },

  update: async (rsbsaCode: string, farmerData: Partial<Farmer>): Promise<Farmer> => {
    const updateData: Database["public"]["Tables"]["farmers"]["Update"] = {};
    
    if (farmerData.lastName !== undefined) updateData.last_name = farmerData.lastName;
    if (farmerData.firstName !== undefined) updateData.first_name = farmerData.firstName;
    if (farmerData.middleName !== undefined) updateData.middle_name = farmerData.middleName || null;
    if (farmerData.fullName !== undefined) updateData.full_name = farmerData.fullName;
    if (farmerData.phone !== undefined) updateData.phone = farmerData.phone || null;
    if (farmerData.birthdate !== undefined) updateData.birthdate = farmerData.birthdate ? farmerData.birthdate.toISOString().split('T')[0] : null;
    if (farmerData.gender !== undefined) updateData.gender = farmerData.gender || null;
    if (farmerData.isFarmer !== undefined) updateData.is_farmer = farmerData.isFarmer;
    if (farmerData.isFarmworker !== undefined) updateData.is_farmworker = farmerData.isFarmworker;
    if (farmerData.isFisherfolk !== undefined) updateData.is_fisherfolk = farmerData.isFisherfolk;
    if (farmerData.isAgriyouth !== undefined) updateData.is_agriyouth = farmerData.isAgriyouth;
    if (farmerData.isIndigenousPeople !== undefined) updateData.is_indigenous_people = farmerData.isIndigenousPeople;
    if (farmerData.isOrganicPractitioner !== undefined) updateData.is_organic_practitioner = farmerData.isOrganicPractitioner;
    if (farmerData.isArb !== undefined) updateData.is_arb = farmerData.isArb;
    if (farmerData.farmerAddress1 !== undefined) updateData.farmer_address_1 = farmerData.farmerAddress1 || null;
    if (farmerData.farmerAddress2 !== undefined) updateData.farmer_address_2 = farmerData.farmerAddress2 || null;
    if (farmerData.farmerAddress3 !== undefined) updateData.farmer_address_3 = farmerData.farmerAddress3 || null;
    if (farmerData.parcelNo !== undefined) updateData.parcel_no = farmerData.parcelNo || null;
    if (farmerData.parcelAddress1 !== undefined) updateData.parcel_address_1 = farmerData.parcelAddress1 || null;
    if (farmerData.parcelAddress2 !== undefined) updateData.parcel_address_2 = farmerData.parcelAddress2 || null;
    if (farmerData.parcelAddress3 !== undefined) updateData.parcel_address_3 = farmerData.parcelAddress3 || null;
    if (farmerData.parcelArea !== undefined) updateData.parcel_area = farmerData.parcelArea || null;
    if (farmerData.cropArea !== undefined) updateData.crop_area = farmerData.cropArea || null;
    if (farmerData.farmType !== undefined) updateData.farm_type = farmerData.farmType || null;
    if (farmerData.tribe !== undefined) updateData.tribe = farmerData.tribe || null;
    if (farmerData.agency !== undefined) updateData.agency = farmerData.agency || null;
    if (farmerData.ownershipType !== undefined) updateData.ownership_type = farmerData.ownershipType || null;
    if (farmerData.ownerName !== undefined) updateData.owner_name = farmerData.ownerName || null;
    if (farmerData.notes !== undefined) updateData.notes = farmerData.notes || null;
    if (farmerData.isActive !== undefined) updateData.is_active = farmerData.isActive;

    const { data, error } = await supabase
      .from("farmers")
      .update(updateData as never)
      .eq("rsbsa_code", rsbsaCode)
      .select()
      .single();

    if (error) throw error;
    return mapFarmerFromDb(data);
  },

  delete: async (rsbsaCode: string): Promise<void> => {
    const { error } = await supabase
      .from("farmers")
      .update({ is_active: false } as never)
      .eq("rsbsa_code", rsbsaCode);

    if (error) throw error;
  },

  search: async (query: string): Promise<Farmer[]> => {
    const allRows: Database["public"]["Tables"]["farmers"]["Row"][] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .or(
          `full_name.ilike.%${query}%,phone.ilike.%${query}%,rsbsa_code.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,middle_name.ilike.%${query}%`
        )
        .order("created_at", { ascending: false })
        .range(from, from + REST_PAGE_SIZE - 1);

      if (error) throw error;
      const batch = data ?? [];
      allRows.push(...batch);
      if (batch.length < REST_PAGE_SIZE) break;
      from += REST_PAGE_SIZE;
    }
    return allRows.map(mapFarmerFromDb);
  },
};

// Commodities
export const commodityService = {
  listByFarmer: async (rsbsaCode: string): Promise<FarmerCommodity[]> => {
    const { data, error } = await supabase
      .from("farmer_commodities")
      .select("*")
      .eq("rsbsa_code", rsbsaCode)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data?.map(mapCommodityFromDb) ?? [];
  },

  create: async (commodity: Omit<FarmerCommodity, "id" | "createdAt" | "updatedAt">): Promise<FarmerCommodity> => {
    const { data, error } = await supabase
      .from("farmer_commodities")
      .insert({
        rsbsa_code: commodity.rsbsaCode,
        commodity_name: commodity.commodityName,
        number_of_heads: commodity.numberOfHeads || 0,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return mapCommodityFromDb(data);
  },

  update: async (id: string, commodity: Partial<FarmerCommodity>): Promise<FarmerCommodity> => {
    const updateData: Database["public"]["Tables"]["farmer_commodities"]["Update"] = {};
    
    if (commodity.commodityName !== undefined) updateData.commodity_name = commodity.commodityName;
    if (commodity.numberOfHeads !== undefined) updateData.number_of_heads = commodity.numberOfHeads || 0;

    const { data, error } = await supabase
      .from("farmer_commodities")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapCommodityFromDb(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("farmer_commodities")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /** All commodity rows (paginated) — used for dashboard farm-type analytics */
  listAll: async (): Promise<FarmerCommodity[]> => {
    const allRows: Array<{ id: string; rsbsa_code: string; commodity_name: string; created_at: string; updated_at: string }> = [];
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("farmer_commodities")
        .select("id, rsbsa_code, commodity_name, created_at, updated_at")
        .order("created_at", { ascending: false })
        .range(from, from + REST_PAGE_SIZE - 1);

      if (error) throw error;
      const batch = data ?? [];
      allRows.push(...batch);
      if (batch.length < REST_PAGE_SIZE) break;
      from += REST_PAGE_SIZE;
    }
    return allRows.map(row => ({
      id: row.id,
      rsbsaCode: row.rsbsa_code,
      commodityName: row.commodity_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },
};

// Transactions
export const transactionService = {
  list: async (): Promise<Transaction[]> => {
    const allRows: Database["public"]["Tables"]["transactions"]["Row"][] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("office_visit_at", { ascending: false })
        .range(from, from + REST_PAGE_SIZE - 1);

      if (error) throw error;
      const batch = data ?? [];
      allRows.push(...batch);
      if (batch.length < REST_PAGE_SIZE) break;
      from += REST_PAGE_SIZE;
    }
    return allRows.map(mapTransactionFromDb);
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
    
    if (transactionData.rsbsaCode !== undefined) updateData.rsbsa_code = transactionData.rsbsaCode;
    if (transactionData.transactionType !== undefined) updateData.transaction_type = transactionData.transactionType;
    if (transactionData.amount !== undefined) updateData.amount = transactionData.amount ?? null;
    if (transactionData.description !== undefined) updateData.description = transactionData.description || null;
    if (transactionData.notes !== undefined) updateData.notes = transactionData.notes || null;
    if (transactionData.officeVisitAt !== undefined) updateData.office_visit_at = transactionData.officeVisitAt ? transactionData.officeVisitAt.toISOString() : null;

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

  listByFarmer: async (rsbsaCode: string): Promise<Transaction[]> => {
    const allRows: Database["public"]["Tables"]["transactions"]["Row"][] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("rsbsa_code", rsbsaCode)
        .order("office_visit_at", { ascending: false })
        .range(from, from + REST_PAGE_SIZE - 1);

      if (error) throw error;
      const batch = data ?? [];
      allRows.push(...batch);
      if (batch.length < REST_PAGE_SIZE) break;
      from += REST_PAGE_SIZE;
    }
    return allRows.map(mapTransactionFromDb);
  },
};

// Projects
export const projectService = {
  list: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProjectFromDb);
  },

  create: async (input: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        project_type: input.projectType,
        status: input.status,
        implemented_at: input.implementedAt ? input.implementedAt.toISOString() : null,
        notes: input.notes || null,
      } as never)
      .select()
      .single();
    if (error) throw error;
    return mapProjectFromDb(data);
  },

  update: async (id: string, input: Partial<Project>): Promise<Project> => {
    const updateData: Database["public"]["Tables"]["projects"]["Update"] = {};
    if (input.projectType !== undefined) updateData.project_type = input.projectType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.implementedAt !== undefined) {
      updateData.implemented_at = input.implementedAt ? input.implementedAt.toISOString() : null;
    }
    if (input.notes !== undefined) updateData.notes = input.notes || null;

    const { data, error } = await supabase
      .from("projects")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapProjectFromDb(data);
  },

  delete: async (id: string): Promise<void> => {
    console.log(`📡 Deleting project with ID: ${id}`);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("❌ Supabase deletion error:", error);
      throw error;
    }
    
    console.log(`✅ Supabase deletion successful.`);
  },
};

async function resolveTotalFarmerCount(): Promise<number> {
  const { data, error } = await supabase.from("dashboard_stats").select("total_farmers").maybeSingle();
  if (!error && data != null && data.total_farmers != null) {
    return Number(data.total_farmers);
  }
  const { count, error: countError } = await supabase
    .from("farmers")
    .select("rsbsa_code", { count: "exact", head: true });
  if (countError) throw countError;
  return count ?? 0;
}

/** Paginate transactions in a visit date range (PostgREST row limit is typically 1000). */
async function fetchRsbsaCodesInVisitRange(startIso: string, endIso: string): Promise<string[]> {
  const codes: string[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("transactions")
      .select("rsbsa_code")
      .gte("office_visit_at", startIso)
      .lte("office_visit_at", endIso)
      .order("office_visit_at", { ascending: true })
      .range(from, from + REST_PAGE_SIZE - 1);

    if (error) throw error;
    const batch = data ?? [];
    for (const row of batch) {
      if (row?.rsbsa_code) codes.push(row.rsbsa_code);
    }
    if (batch.length < REST_PAGE_SIZE) break;
    from += REST_PAGE_SIZE;
  }
  return codes;
}

async function fetchTransactionRowsInVisitRange(
  startIso: string,
  endIso: string
): Promise<Database["public"]["Tables"]["transactions"]["Row"][]> {
  const allRows: Database["public"]["Tables"]["transactions"]["Row"][] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("office_visit_at", startIso)
      .lte("office_visit_at", endIso)
      .order("office_visit_at", { ascending: true })
      .range(from, from + REST_PAGE_SIZE - 1);

    if (error) throw error;
    const batch = data ?? [];
    allRows.push(...batch);
    if (batch.length < REST_PAGE_SIZE) break;
    from += REST_PAGE_SIZE;
  }
  return allRows;
}

const RSBSA_IN_CHUNK = 150;

// Dashboard
export const dashboardService = {
  stats: async (month?: number | null, year?: number, day?: number): Promise<DashboardStats> => {
    const now = new Date();
    const selectedYear = year !== undefined ? year : now.getFullYear();
    const selectedDay = day !== undefined ? day : undefined;

    let startDate: Date;
    let endDate: Date;

    if (month !== undefined && month !== null) {
      if (selectedDay !== undefined && selectedDay !== null) {
        startDate = new Date(selectedYear, month - 1, selectedDay, 0, 0, 0, 0);
        endDate = new Date(selectedYear, month - 1, selectedDay, 23, 59, 59, 999);
      } else {
        startDate = new Date(selectedYear, month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(selectedYear, month, 0, 23, 59, 59, 999);
      }
    } else {
      // Yearly
      startDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const [totalFarmers, visitCodes] = await Promise.all([
      resolveTotalFarmerCount(),
      fetchRsbsaCodesInVisitRange(startIso, endIso),
    ]);

    const uniqueFarmers = new Set(visitCodes);

    return {
      totalFarmers,
      farmersVisitedThisMonth: uniqueFarmers.size,
      visitsThisMonth: visitCodes.length,
    };
  },

  /** List visits (transactions with farmer names) for a given month/year and optional day, for PDF export */
  visitsList: async (month: number | null, year: number, day?: number): Promise<Array<Transaction & { farmerName: string }>> => {
    let startDate: Date;
    let endDate: Date;

    if (month !== null) {
      if (day !== undefined && day !== null) {
        startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      } else {
        startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
      }
    } else {
      // Yearly
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const txRows = await fetchTransactionRowsInVisitRange(startDate.toISOString(), endDate.toISOString());
    const transactions = txRows.map(mapTransactionFromDb);

    const rsbsaCodes = [...new Set(transactions.map((t) => t.rsbsaCode))];
    if (rsbsaCodes.length === 0) return [];

    const nameByRsbsaCode: Record<string, string> = {};
    for (let i = 0; i < rsbsaCodes.length; i += RSBSA_IN_CHUNK) {
      const chunk = rsbsaCodes.slice(i, i + RSBSA_IN_CHUNK);
      const { data: farmersData, error: farmersError } = await supabase
        .from("farmers")
        .select("rsbsa_code, full_name")
        .in("rsbsa_code", chunk);

      if (farmersError) throw farmersError;
      (farmersData || []).forEach((f) => {
        nameByRsbsaCode[f.rsbsa_code] = f.full_name || "Unknown";
      });
    }

    return transactions.map((t) => ({
      ...t,
      farmerName: nameByRsbsaCode[t.rsbsaCode] || "Unknown",
    }));
  },
};
