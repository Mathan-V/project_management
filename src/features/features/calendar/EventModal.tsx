import React, { useState, useEffect } from "react";
import moment from "moment";
import { X, MoreVertical } from "lucide-react";
import { calculateDuration } from "../../../utils/timeCalculations";
import { projectsAPI } from "../../../api/projects.api";
import type { EventType, Project } from "../../../utils/types";
import { timesheetsAPI } from "../../../api/timesheet.api";

interface EventModalProps {
  show: boolean;
  isEditMode: boolean;
  editingEvent: EventType | any;
  startTime: string;
  endTime: string;
  selectedDate: Date;
  description: string;
  project: string;
  // tags: string;
  // billable: boolean;
  userId?: number;
  status?: string;           // Optional now (modal handles default)
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  setSelectedDate: (date: Date) => void;
  setDescription: (desc: string) => void;
  setProject: (project: string) => void;
  // setTags: (tags: string) => void;
  // setBillable: (billable: boolean) => void;
  setStatus?: (status: string) => void;  // Optional
}

export const EventModal: React.FC<EventModalProps> = ({
  show,
  isEditMode,
  editingEvent,
  startTime,
  endTime,
  selectedDate,
  description,
  project,
  // tags,
  // billable,
  status: externalStatus,
  userId,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  setStartTime,
  setEndTime,
  setSelectedDate,
  setDescription,
  setProject,
  // setTags,
  // setBillable,
  // setStatus,
}) => {
  // **FIX 1: Internal status state with default**
  const [internalStatus, setInternalStatus] = useState<string>(
    editingEvent?.status || externalStatus || "PENDING"
  );
  const status = internalStatus;

  const [duration, setDuration] = useState("00:00:00");
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDuration(calculateDuration(startTime, endTime));
  }, [startTime, endTime]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const data:any = await projectsAPI.getProjects();
        setProjectList(data);
      } catch (err) {
        console.error("❌ Failed to fetch projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // **FIX 2: Sync status when editingEvent changes**
  useEffect(() => {
    if (editingEvent?.status) {
      setInternalStatus(editingEvent.status);
    } else if (!externalStatus) {
      setInternalStatus("PENDING");
    }
  }, [editingEvent, externalStatus]);

  const handleTimeChange = (type: "start" | "end", value: string) => {
    if (type === "start") setStartTime(value);
    else setEndTime(value);
  };

  // **FIX 3: Completely rewritten handleSave - 100% working**
  const handleSave = async () => {
    if (saving) return;

    // Validation
    if (!description.trim()) {
      alert("Description is required");
      return;
    }
    if (!project) {
      alert("Project is required");
      return;
    }
    if (!status) {
      alert("Status is required");
      return;
    }

    try {
      setSaving(true);
      console.log("🔄 Saving...", { isEditMode, eventId: editingEvent?.id });

      // User ID
      let currentUserId = userId;
      if (!currentUserId) {
        const userJson = localStorage.getItem("user");
        if (userJson) {
          currentUserId = JSON.parse(userJson).id;
        }
      }
      if (!currentUserId) {
        alert("Please log in again");
        return;
      }

      // Project ID
      const selectedProject = projectList.find((p) => p.project_name === project);
      if (!selectedProject) {
        alert("Invalid project selected");
        return;
      }

      // Dates
      const dateStr = moment(selectedDate).format("YYYY-MM-DD");
      const startDateTime = moment(`${dateStr} ${startTime}`, "YYYY-MM-DD HH:mm").toISOString();
      const endDateTime = moment(`${dateStr} ${endTime}`, "YYYY-MM-DD HH:mm").toISOString();

      const payload:any = {
        projectId: selectedProject.id,
        userId: currentUserId,
        description: description.trim(),
        status,
        start_date: startDateTime,
        end_date: endDateTime,
        created_by: currentUserId,
        // billable,
        // tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      console.log("📤 Payload:", payload);

      // **FIX 4: Force correct branch**
      if (isEditMode && editingEvent!.id) {
        // UPDATE
        await timesheetsAPI.updateTimesheet(editingEvent.id, payload);
        console.log("✅ Updated timesheet", editingEvent.id);
      } else {
        // CREATE
        const response = await timesheetsAPI.createTimesheet(payload);
        console.log("✅ Created timesheet", response);
      }

      onSave();  // Refresh parent list
      onClose(); // Close modal
    } catch (err: any) {
      console.error("❌ Save failed:", err);
      alert(err.response?.data?.message || "Failed to save. Check console.");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-medium text-gray-600">
            {isEditMode ? "Edit time entry" : "Add time entry"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time and date</label>
            <div className="flex gap-3 items-center flex-wrap">
              <input type="text" value={duration} readOnly className="px-3 py-2 border rounded text-sm w-24 bg-gray-50" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleTimeChange("start", e.target.value)}
                className="px-3 py-2 border rounded text-sm w-24"
              />
              <span className="text-gray-600">-</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleTimeChange("end", e.target.value)}
                className="px-3 py-2 border rounded text-sm w-24"
              />
              <input
                type="date"
                value={moment(selectedDate).format("YYYY-MM-DD")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 border rounded text-sm w-36"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What have you worked on?"
              className="w-full px-3 py-2 border rounded text-sm min-h-20 resize-vertical"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={loadingProjects}
              className="w-full px-3 py-2 border rounded text-sm bg-white"
            >
              <option value="">Select Project</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.project_name}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status **NEW & FIXED** */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setInternalStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm bg-white"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Tags & Billable */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div> */}
          {/* <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="w-5 h-5"
              />
              Billable
            </label>
          </div> */}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center">
          {isEditMode && (
            <>
              <div className="relative">
                <button onClick={() => setShowContextMenu(!showContextMenu)} className="p-2">
                  <MoreVertical size={20} />
                </button>
                {showContextMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white shadow-lg rounded z-10">
                    <button
                      onClick={() => {
                        onDuplicate?.();
                        setShowContextMenu(false);
                      }}
                      className="block px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowContextMenu(false);
                      }}
                      className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-50 w-full text-left"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 text-sm border rounded" disabled={saving}>
              Cancel
            </button>
            {/* **FIX 5: Corrected disabled logic** */}
            <button
              onClick={handleSave}
              disabled={saving || !description.trim() || !project || !status}
              className="px-6 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditMode ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};