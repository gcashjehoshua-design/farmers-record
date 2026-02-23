export type Farmer = {
  id: string;
  fullName: string;
  phone: string;
  rsbsaNumber?: string;
  dateOfBirth?: Date;
  address?: string;
  barangay?: string;
  zipCode?: string;
  farmType?: string;
  farmLocation?: string;
  organization?: string;
  dateOfOfficeVisit?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Transaction = {
  id: string;
  farmerId: string;
  transactionType: string;
  amount?: number;
  description?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
}

export type DashboardStats = {
  totalFarmers: number;
  farmersVisitedThisMonth: number;
  visitsThisMonth: number;
}
