import { useQuery } from "@tanstack/react-query";
import { is } from "drizzle-orm";
import {useNavigate} from "react-router-dom";
import { navigate } from "wouter/use-browser-location";

async function fetchUser() {
  const accessToken = localStorage.getItem("accessToken");
  
  if (!accessToken) {
    throw new Error("No access token");
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    // Try to refresh token
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json();
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        
        // Retry original request with new token
        const retryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/user`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        
        if (retryResponse.ok) {
          return retryResponse.json();
        }
      }
    }
    
    // Clear invalid tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    throw new Error("Authentication failed");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return response.json();
}

export function useAuth() {
  //console.log("useAuth hook called");
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    });

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.reload();
    }
  };
  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout,
  };
}
