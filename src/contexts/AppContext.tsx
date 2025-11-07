import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { EventType, Project, User, AppContextType } from "../utils/types";
import { formatDate, formatTime } from "../utils/timeCalculations";
import { projectsAPI } from "../api/projects.api";
import { timesheetsAPI } from "../api/timesheet.api";
import { usersAPI } from "../api/users.api"; // ✅ Your existing users API

// ✅ Extend AppContextType to include users
interface ExtendedAppContextType extends AppContextType {
  users: User[];
  isLoadingUsers: boolean;
  refreshUsers: () => void;
}

const AppContext = createContext<ExtendedAppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  console.log(children, "children");
  
  const [events, setEvents] = useState<EventType[]>(() => {
    const saved = localStorage.getItem('calendar_events');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
    }
    return [];
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]); // ✅ Add users state
  const [isLoadingTimesheet, setIsLoadingTimesheet] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false); // ✅ Add loading state

  // ✅ Fetch users from backend API
  const fetchUsers = useCallback(async () => {
    console.log('👥 Fetching users from backend...');
    setIsLoadingUsers(true);
    
    try {
      const data = await usersAPI.getUsers(); // Use your actual users API
      console.log('📋 Fetched users:', data);
      
      setUsers(data); // Store users as-is from backend
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]); // Set empty array on error
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch and calculate time entries for all projects
  const fetchTimesheetData = useCallback(async (projectsList: Project[]) => {
    if (projectsList.length === 0) return;

    console.log('🔄 Fetching timesheets for all projects...');
    setIsLoadingTimesheet(true);
    
    try {
      const updatedProjects = await Promise.all(
        projectsList.map(async (project) => {
          try {
            // Fetch timesheets for this project
            const timesheets = await timesheetsAPI.getTimesheetByProject(project.id);
            console.log(`📊 Timesheets for project "${project.name}" (ID: ${project.id}):`, timesheets);

            // Group timesheets by date and sum durations
            const timeEntries: { [key: string]: string } = {};

            if (Array.isArray(timesheets)) {
  timesheets.forEach((timesheet: any) => {
    // Convert start_date safely to local date (ignore timezone shifts)
    const utcDate = new Date(timesheet.start_date);
    const date = new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate()
    );

    const dateKey = formatDate(date);
    const duration = timesheet.duration || timesheet.hours || 0;

    console.log(`✅ Final Date: ${dateKey}, Duration: ${duration}`);
  });
}


            console.log(`  Final timeEntries for ${project.name}:`, timeEntries);

            return {
              ...project,
              timeEntries
            };
          } catch (err) {
            console.error(`Failed to fetch timesheets for project ${project.name}:`, err);
            return {
              ...project,
              timeEntries: {}
            };
          }
        })
      );

      console.log('📋 All projects with updated time entries:', updatedProjects);
      setProjects(updatedProjects);
    } catch (err) {
      console.error('Failed to calculate time entries:', err);
    } finally {
      setIsLoadingTimesheet(false);
    }
  }, []);

  // ✅ Fetch projects and users on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch users first
        await fetchUsers();
        
        // Fetch projects
        const data = await projectsAPI.getProjects();
        console.log('📦 Fetched projects:', data);
        
        const formattedProjects = data.map((p: any) => ({
          id: p.id,
          name: p.project_name,
          description: p.description,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          startDate: p.start_date,
          endDate: p.end_date,
          status: "active",
          timeEntries: {} as { [key: string]: string },
        }));
        
        // Fetch timesheet data after projects are loaded
        await fetchTimesheetData(formattedProjects);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };
    
    fetchInitialData();
  }, []); // Only run on mount

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(events));
  }, [events]);

  const addEvent = (event: EventType) => {
    setEvents(prev => [...prev, event]);
  };

  const updateEvent = (id: number, updatedEvent: Partial<EventType>) => {
    setEvents(prev =>
      prev.map(event => (event.id === id ? { ...event, ...updatedEvent } : event))
    );
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const updateProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  // Optional: Refresh timesheet data manually
  const refreshTimesheets = useCallback(() => {
    if (projects.length > 0) {
      fetchTimesheetData(projects);
    }
  }, [projects, fetchTimesheetData]);

  // ✅ Add refresh users function
  const refreshUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <AppContext.Provider 
      value={{ 
        events, 
        projects, 
        users, // ✅ Add users
        addEvent, 
        updateEvent, 
        deleteEvent, 
        updateProjects,
        refreshTimesheets,
        refreshUsers, // ✅ Add refresh users
        isLoadingTimesheet,
        isLoadingUsers // ✅ Add loading state
      }}
    >
      {children}
    </AppContext.Provider>
  );
};