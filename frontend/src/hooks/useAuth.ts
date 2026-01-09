"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, login, logout, signup, loadAccessTokenFromStorage, setAccessToken } from "../lib/api";

export function useBootstrapAuth() {
  useEffect(() => {
    loadAccessTokenFromStorage();
  }, []);
}

export function useCurrentUser() {
  useBootstrapAuth();
  return useQuery({
    queryKey: ["me"],
    queryFn: getProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      setAccessToken(null);
      await qc.resetQueries();
    },
  });
}
