import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  Calendar,
  Users,
  UserCog,
  Building2
} from 'lucide-react';
import { BiSolidReport } from "react-icons/bi";
import { rolesAPI } from '../../api/roles.api';

export const Sidebar: React.FC = () => {
  const { u_name } = useAuth();
  const location = useLocation();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch permissions from roles API based on user's role
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const roles = await rolesAPI.getRoles();
        console.log("Fetched roles:", roles);

        // Find the current user's role
        const userRoleName = u_name?.role?.name || u_name?.rolename;
        console.log("Current user role:", userRoleName);

        // Get permissions for the user's specific role
        const userRole = roles.find(
          (role: any) => role.name.toLowerCase() === userRoleName?.toLowerCase() && role.is_enabled
        );

        if (userRole) {
          const perms = userRole.permissions.map((p: any) => p.code);
          console.log("User permissions:", perms);
          setPermissions(perms);
        } else {
          console.log("No matching role found or role is disabled");
          setPermissions([]);
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    if (u_name) {
      fetchPermissions();
    }
  }, [u_name]);

  const userRole = u_name?.role?.name?.toLowerCase() || 'user';

  // Helper function to check if user has any permission starting with a prefix
  const hasPermissionStartingWith = (prefix: string) => {
    return permissions.some(perm => perm.startsWith(prefix));
  };

  // Sidebar navigation with dynamic permission checking
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: LayoutDashboard 
    },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: FolderKanban,
      permissionPrefix: 'project_' // Shows if user has any permission starting with 'project_'
    },
    { 
      name: 'Timesheet', 
      href: '/timesheet', 
      icon: Clock,
      permissionPrefix: 'timesheet_'
    },
    { 
      name: 'Calendar', 
      href: '/calendar', 
      icon: Calendar,
      permissionPrefix: 'calendar_'
    },
    { 
      name: 'User', 
      href: '/user', 
      icon: Users,
      permissionPrefix: 'user_'
    },
    { 
      name: 'Role', 
      href: '/role', 
      icon: UserCog,
      permissionPrefix: 'role_'
    },
    { 
      name: 'Client', 
      href: '/client', 
      icon: Building2,
      permissionPrefix: 'client_'
    },
    { 
      name: 'Report', 
      href: '/report', 
      icon: BiSolidReport,
      permissionPrefix: 'report_'
    },
     { 
      name: 'Role Permission', 
      href: '/rolepermission', 
      icon: UserCog,
      permissionPrefix: 'role_permission_'
    },
  ];

  const adminNavigation = [
    { 
      name: 'Users', 
      href: '/admin/users', 
      icon: Users,
      permissionPrefix: 'admin_user_'
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter(item => {
    // Dashboard is always visible
    if (item.href === '/') return true;
    
    // Check if user has any permission for this page
    if (item.permissionPrefix) {
      return hasPermissionStartingWith(item.permissionPrefix);
    }
    
    return true;
  });

  const filteredAdminNavigation = adminNavigation.filter(item => {
    if (item.permissionPrefix) {
      return hasPermissionStartingWith(item.permissionPrefix);
    }
    return true;
  });

  // Show loading state while fetching permissions
  if (loading) {
    return (
      <div style={{ width: "250px", backgroundColor: "#f8f9fa" }}>
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <div className="flex items-center flex-shrink-0 px-4 py-4">
              <h1 className="text-2xl font-bold text-primary-600">TaskFlow</h1>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "250px", backgroundColor: "#f8f9fa" }}>
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-4">
            <h1 className="text-2xl font-bold text-primary-600">TaskFlow</h1>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1">
            {filteredNavigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">
                  {React.createElement(item.icon, { className: "w-5 h-5" })}
                </span>
                {item.name}
              </Link>
            ))}

            {/* Admin Section */}
            {filteredAdminNavigation.length > 0 && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </p>
                </div>

                {filteredAdminNavigation.map(item => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg">
                      {React.createElement(item.icon, { className: "w-5 h-5" })}
                    </span>
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Footer / User Info */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {u_name?.user_name
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{u_name?.email}</p>
                <p className="text-xs font-medium text-gray-500 capitalize">
                  {u_name?.rolename}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};