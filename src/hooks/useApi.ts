import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { farmerService, commodityService, transactionService, dashboardService, projectService } from "@/services/api";
import type { Farmer, FarmerCommodity, Transaction, Project } from "@/types";

// Farmers hooks
export const useFarmers = (includeInactive = false) => {
  return useQuery({
    queryKey: ["farmers", includeInactive],
    queryFn: () => farmerService.list(includeInactive),
  });
};

export const useFarmer = (rsbsaCode: string) => {
  return useQuery({
    queryKey: ["farmer", rsbsaCode],
    queryFn: () => farmerService.get(rsbsaCode),
    enabled: !!rsbsaCode,
  });
};

export const useCreateFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Farmer, "createdAt" | "updatedAt">) => 
      farmerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["commodities"] });
    },
  });
};

export const useUpdateFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ rsbsaCode, data }: { rsbsaCode: string; data: Partial<Farmer> }) =>
      farmerService.update(rsbsaCode, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", variables.rsbsaCode] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["commodities"] });
    },
  });
};

export const useDeleteFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rsbsaCode: string) => farmerService.delete(rsbsaCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// Commodities hooks
export const useCommoditiesByFarmer = (rsbsaCode: string) => {
  return useQuery({
    queryKey: ["commodities", "farmer", rsbsaCode],
    queryFn: () => commodityService.listByFarmer(rsbsaCode),
    enabled: !!rsbsaCode,
  });
};

export const useCreateCommodity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<FarmerCommodity, "id" | "createdAt" | "updatedAt">) =>
      commodityService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commodities", "farmer", variables.rsbsaCode] });
      queryClient.invalidateQueries({ queryKey: ["commodities", "all"] });
    },
  });
};

export const useUpdateCommodity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FarmerCommodity> }) =>
      commodityService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commodities"] });
      queryClient.invalidateQueries({ queryKey: ["commodities", "all"] });
    },
  });
};

export const useDeleteCommodity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => commodityService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commodities"] });
      queryClient.invalidateQueries({ queryKey: ["commodities", "all"] });
    },
  });
};

export const useAllCommodities = () => {
  return useQuery({
    queryKey: ["commodities", "all"],
    queryFn: () => commodityService.listAll(),
  });
};

// Transactions hooks
export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionService.list(),
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transactionService.get(id),
    enabled: !!id,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Transaction, "id" | "createdAt">) =>
      transactionService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "farmer", variables.rsbsaCode] });
    },
  });
};

export const useTransactionsByFarmer = (rsbsaCode: string) => {
  return useQuery({
    queryKey: ["transactions", "farmer", rsbsaCode],
    queryFn: () => transactionService.listByFarmer(rsbsaCode),
    enabled: !!rsbsaCode,
  });
};

// Dashboard hooks
export const useDashboardStats = (month?: number | null, year?: number, day?: number) => {
  return useQuery({
    queryKey: ["dashboard", month, year, day],
    queryFn: () => dashboardService.stats(month, year, day),
  });
};

export const useVisitsList = (month: number | null, year: number, day?: number) => {
  return useQuery({
    queryKey: ["visitsList", month, year, day],
    queryFn: () => dashboardService.visitsList(month, year, day),
    enabled: (month === null || (month >= 1 && month <= 12)) && year > 0,
  });
};

// Projects hooks
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => projectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
