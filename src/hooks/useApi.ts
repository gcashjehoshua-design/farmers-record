import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { farmerService, transactionService, dashboardService } from "@/services/api";
import type { Farmer, Transaction } from "@/types";

// Farmers hooks
export const useFarmers = () => {
  return useQuery({
    queryKey: ["farmers"],
    queryFn: () => farmerService.list(),
  });
};

export const useFarmer = (id: string) => {
  return useQuery({
    queryKey: ["farmer", id],
    queryFn: () => farmerService.get(id),
    enabled: !!id,
  });
};

export const useCreateFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Farmer, "id" | "createdAt" | "updatedAt">) => 
      farmerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Farmer> }) =>
      farmerService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["farmer", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => farmerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useTransactionsByFarmer = (farmerId: string) => {
  return useQuery({
    queryKey: ["transactions", "farmer", farmerId],
    queryFn: () => transactionService.listByFarmer(farmerId),
    enabled: !!farmerId,
  });
};

// Dashboard hooks
export const useDashboardStats = (month?: number, year?: number, day?: number) => {
  return useQuery({
    queryKey: ["dashboard", month, year, day],
    queryFn: () => dashboardService.stats(month, year, day),
  });
};

export const useVisitsList = (month: number, year: number, day?: number) => {
  return useQuery({
    queryKey: ["visitsList", month, year, day],
    queryFn: () => dashboardService.visitsList(month, year, day),
    enabled: !!month && !!year,
  });
};
