export type Farmer = {
  rsbsaCode: string; // Primary key
  lastName: string;
  firstName: string;
  middleName?: string;
  fullName: string;
  gender?: string;
  birthdate?: Date;
  phone?: string;
  
  // Farmer classifications
  isFarmer?: boolean;
  isFarmworker?: boolean;
  isFisherfolk?: boolean;
  isAgriyouth?: boolean;
  isIndigenousPeople?: boolean;
  isOrganicPractitioner?: boolean;
  isArb?: boolean;
  
  // Address fields
  farmerAddress1?: string;
  farmerAddress2?: string;
  farmerAddress3?: string;
  
  // Parcel/Farm information
  parcelNo?: number;
  parcelAddress1?: string;
  parcelAddress2?: string;
  parcelAddress3?: string;
  parcelArea?: number;
  cropArea?: number;
  farmType?: string;
  
  // Additional information
  tribe?: string;
  agency?: string;
  ownershipType?: string;
  ownerName?: string;
  dateEncoded?: Date;
  
  // Metadata
  notes?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FarmerCommodity = {
  id: string;
  rsbsaCode: string;
  commodityName: string;
  numberOfHeads?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type Transaction = {
  id: string;
  rsbsaCode: string;
  transactionType: string;
  amount?: number;
  description?: string;
  notes?: string;
  officeVisitAt?: Date;
  createdAt: Date;
}

export type DashboardStats = {
  totalFarmers: number;
  farmersVisitedThisMonth: number;
  visitsThisMonth: number;
}

export type ProjectStatus = "ongoing" | "implemented";

export type ProjectType =
  | "Crop Insurance"
  | "Livestock Insurance"
  | "ABSS"
  | "RCEF Inbred Seed Assistance"
  | "Hybrid Seed Assistance"
  | "Inbred Seed Fertilizer Assistance"
  | "Hybrid Seed Fertilizer Assistance"
  | "Farmers Financial Assistance - Loan"
  | "Farmers Financial Assistance - RFFA"
  | "Rabies Vaccination"
  | "Livestock / Poultry Treatment"
  | "Training"
  | "Technical Assistance"
  | "Soil Analysis";

export type Project = {
  id: string;
  projectType: ProjectType;
  status: ProjectStatus;
  implementedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};
