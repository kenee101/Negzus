// hooks/useRoleBasedAccess.js
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

export const USER_ROLES = {
  USER: 'user',
  BUSINESS: 'business',
  STATION_MANAGER: 'station_manager',
  ADMIN: 'admin'
};

export const PERMISSIONS = {
  // User permissions
  VIEW_STATIONS: 'view_stations',
  SUBSCRIBE_TO_STATIONS: 'subscribe_to_stations',
  VIEW_FUEL_PRICES: 'view_fuel_prices',
  RECEIVE_NOTIFICATIONS: 'receive_notifications',
  
  // Business permissions
  MANAGE_BUSINESS_PROFILE: 'manage_business_profile',
  VIEW_BUSINESS_ANALYTICS: 'view_business_analytics',
  
  // Station Manager permissions
  MANAGE_FUEL_INVENTORY: 'manage_fuel_inventory',
  SEND_NOTIFICATIONS: 'send_notifications',
  VIEW_STATION_ANALYTICS: 'view_station_analytics',
  MANAGE_STATION_SETTINGS: 'manage_station_settings',
  
  // Admin permissions
  MANAGE_ALL_STATIONS: 'manage_all_stations',
  MANAGE_USER_ROLES: 'manage_user_roles',
  VIEW_SYSTEM_ANALYTICS: 'view_system_analytics',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings'
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: [
    PERMISSIONS.VIEW_STATIONS,
    PERMISSIONS.SUBSCRIBE_TO_STATIONS,
    PERMISSIONS.VIEW_FUEL_PRICES,
    PERMISSIONS.RECEIVE_NOTIFICATIONS
  ],
  [USER_ROLES.BUSINESS]: [
    PERMISSIONS.VIEW_STATIONS,
    PERMISSIONS.SUBSCRIBE_TO_STATIONS,
    PERMISSIONS.VIEW_FUEL_PRICES,
    PERMISSIONS.RECEIVE_NOTIFICATIONS,
    PERMISSIONS.MANAGE_BUSINESS_PROFILE,
    PERMISSIONS.VIEW_BUSINESS_ANALYTICS
  ],
  [USER_ROLES.STATION_MANAGER]: [
    PERMISSIONS.VIEW_STATIONS,
    PERMISSIONS.VIEW_FUEL_PRICES,
    PERMISSIONS.MANAGE_FUEL_INVENTORY,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_STATION_ANALYTICS,
    PERMISSIONS.MANAGE_STATION_SETTINGS
  ],
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS) // Admin has all permissions
};

export function useRoleBasedAccess() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [managedStations, setManagedStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadUserRoleAndPermissions();
    }
  }, [user?.id]);

  const loadUserRoleAndPermissions = async () => {
    try {
      setLoading(true);
      
      // Get user profile with role from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, station_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const role = userProfile?.role || USER_ROLES.USER;
      setUserRole(role);
      setPermissions(ROLE_PERMISSIONS[role] || []);

      // If user is a station manager, get their managed stations
      if (role === USER_ROLES.STATION_MANAGER || role === USER_ROLES.ADMIN) {
        // First check station_managers table
        const { data: stationManagers, error: managersError } = await supabase
          .from('station_managers')
          .select(`
            station_id,
            stations (
              id,
              name,
              address
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        let stations = [];
        
        if (!managersError && stationManagers) {
          stations = stationManagers.map(sm => sm.stations).filter(Boolean);
        }

        // Also check if user has a direct station assignment
        if (userProfile.station_id) {
          const { data: directStation, error: stationError } = await supabase
            .from('stations')
            .select('id, name, address')
            .eq('id', userProfile.station_id)
            .single();

          if (!stationError && directStation) {
            // Add to stations if not already included
            const existingStation = stations.find(s => s.id === directStation.id);
            if (!existingStation) {
              stations.push(directStation);
            }
          }
        }

        setManagedStations(stations);
      }
    } catch (error) {
      console.error('Error loading user role and permissions:', error);
      setUserRole(USER_ROLES.USER);
      setPermissions(ROLE_PERMISSIONS[USER_ROLES.USER]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasRole = (role) => {
    return userRole === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  const canManageStation = (stationId) => {
    if (hasRole(USER_ROLES.ADMIN)) return true;
    if (hasRole(USER_ROLES.STATION_MANAGER)) {
      return managedStations.some(station => station.id === stationId);
    }
    return false;
  };

  const isAdmin = () => hasRole(USER_ROLES.ADMIN);
  const isStationManager = () => hasRole(USER_ROLES.STATION_MANAGER);
  const isBusiness = () => hasRole(USER_ROLES.BUSINESS);
  const isUser = () => hasRole(USER_ROLES.USER);

  return {
    userRole,
    permissions,
    managedStations,
    loading,
    hasPermission,
    hasRole,
    hasAnyRole,
    canManageStation,
    isAdmin,
    isStationManager,
    isBusiness,
    isUser,
    refetch: loadUserRoleAndPermissions
  };
}

// Utility functions for role management
export const roleUtils = {
  getRoleDisplayName: (role) => {
    const roleNames = {
      [USER_ROLES.USER]: 'User',
      [USER_ROLES.BUSINESS]: 'Business',
      [USER_ROLES.STATION_MANAGER]: 'Station Manager',
      [USER_ROLES.ADMIN]: 'Administrator'
    };
    return roleNames[role] || 'Unknown';
  },

  getRoleColor: (role) => {
    const roleColors = {
      [USER_ROLES.USER]: '#4ade80',
      [USER_ROLES.BUSINESS]: '#3b82f6',
      [USER_ROLES.STATION_MANAGER]: '#f59e0b',
      [USER_ROLES.ADMIN]: '#ef4444'
    };
    return roleColors[role] || '#6b7280';
  },

  canPromoteToRole: (currentRole, targetRole) => {
    const hierarchy = {
      [USER_ROLES.USER]: 0,
      [USER_ROLES.BUSINESS]: 1,
      [USER_ROLES.STATION_MANAGER]: 2,
      [USER_ROLES.ADMIN]: 3
    };
    
    return hierarchy[currentRole] >= hierarchy[targetRole];
  },

  assignStationManager: async (userId, stationId, assignedBy) => {
    try {
      // Update user role to station_manager
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: USER_ROLES.STATION_MANAGER })
        .eq('id', userId);

      if (roleError) throw roleError;

      // Add station manager assignment
      const { error: assignError } = await supabase
        .from('station_managers')
        .insert({
          user_id: userId,
          station_id: stationId,
          is_active: true
        });

      if (assignError) throw assignError;
      return { success: true };
    } catch (error) {
      console.error('Error assigning station manager:', error);
      return { success: false, error: error.message };
    }
  },

  removeStationManager: async (userId, stationId) => {
    try {
      // Deactivate station manager assignment
      const { error } = await supabase
        .from('station_managers')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('station_id', stationId);

      if (error) throw error;

      // Check if user has any other active station assignments
      const { data: activeAssignments } = await supabase
        .from('station_managers')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      // If no active assignments, downgrade role to user
      if (!activeAssignments || activeAssignments.length === 0) {
        await supabase
          .from('users')
          .update({ role: USER_ROLES.USER })
          .eq('id', userId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing station manager:', error);
      return { success: false, error: error.message };
    }
  },

  updateUserRole: async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }
  },

  getUsersByRole: async (role = null) => {
    try {
      let query = supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone_number,
          role,
          created_at,
          station_managers (
            station_id,
            is_active,
            stations (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, users: data || [] };
    } catch (error) {
      console.error('Error getting users by role:', error);
      return { success: false, error: error.message, users: [] };
    }
  },

  // Helper function to check if user can manage a specific station
  checkStationManagementPermission: async (userId, stationId) => {
    try {
      // Get user role and station assignments
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, station_id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Admin can manage all stations
      if (userData.role === USER_ROLES.ADMIN) {
        return { success: true, canManage: true };
      }

      // Check if user is assigned to this station directly
      if (userData.station_id === stationId) {
        return { success: true, canManage: true };
      }

      // Check station_managers table
      const { data: managerData, error: managerError } = await supabase
        .from('station_managers')
        .select('id')
        .eq('user_id', userId)
        .eq('station_id', stationId)
        .eq('is_active', true)
        .single();

      if (!managerError && managerData) {
        return { success: true, canManage: true };
      }

      return { success: true, canManage: false };
    } catch (error) {
      console.error('Error checking station management permission:', error);
      return { success: false, canManage: false, error: error.message };
    }
  }
};