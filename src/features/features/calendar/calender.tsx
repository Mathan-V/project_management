import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  momentLocalizer,
  Views,
  type SlotInfo,
  type View as CalendarView,
  type Event,
} from "react-big-calendar";
import moment from "moment";
import DatePicker from "react-datepicker";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";

import { projectsAPI } from "../../../api/projects.api";
import { timesheetsAPI } from "../../../api/timesheet.api";
import type { EventType } from "../../../utils/types";
import { EventModal } from "./EventModal";

const localizer = momentLocalizer(moment);

const CalendarViewComponent: React.FC = () => {
  const [calendarEvents, setCalendarEvents] = useState<EventType[]>([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(Views.WEEK);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

  // Form state
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [projectName, setProjectName] = useState(""); // <-- string
  const [tags, setTags] = useState("");
  const [billable, setBillable] = useState(true);
  const [status, setStatus] = useState("PENDING"); // <-- NEW

  const userId = JSON.parse(localStorage.getItem("user") || "{}")?.id;

  // FETCH PROJECTS
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsAPI.getProjects();
        const formatted = data.map((p: any) => ({
          value: p.project_name,
          label: p.project_name,
        }));
        setProjectOptions(formatted);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchProjects();
  }, []);

  // FETCH TIMESHEETS FROM BACKEND
  const fetchTimesheets = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserName = userData?.user_name;
      const currentRoleId = userData?.role_id;

      const response = await timesheetsAPI.getTimesheetsAll();
      const isAdmin = currentRoleId === 4;

      const filtered = isAdmin
        ? response
        : response.filter((item: any) => item.creator?.user_name === currentUserName);

      const mapped: EventType[] = filtered.map((t: any) => ({
        id: t.id,
        title: t.description || "No Description",
        start: new Date(t.start_date),
        end: new Date(t.end_date),
        description: t.description,
        project_name: t.project?.project_name || "",
        status: t.status,
        tags: t.tags || [],
        billable: t.billable ?? false,
        created_by: t.creator?.user_name || "Unknown",
      }));

      setCalendarEvents(mapped);
    } catch (error) {
      console.error("Failed to fetch timesheets:", error);
    }
  }, []);

  // Load on mount + after save
  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  // OPEN ADD MODAL
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = moment(slotInfo.start).format("HH:mm");
    const end = moment(slotInfo.end).format("HH:mm");

    setIsEditMode(false);
    setSelectedSlot(slotInfo);
    setStartTime(start);
    setEndTime(end);
    setSelectedDate(slotInfo.start);
    setDescription("");
    setProjectName("");
    setTags("");
    setBillable(true);
    setStatus("PENDING");
    setShowModal(true);
  };

  // OPEN EDIT MODAL
  const handleSelectEvent = (event: Event) => {
    const e = event as EventType;
    const start = moment(e.start).format("HH:mm");
    const end = moment(e.end).format("HH:mm");

    setIsEditMode(true);
    setEditingEvent(e);
    setStartTime(start);
    setEndTime(end);
    setSelectedDate(e.start!);
    setDescription(e.description || "");
    setProjectName(e.project_name || "");
    setTags((e.tags || []).join(", "));
    setBillable(!!e.billable);
    setStatus(e.status || "PENDING");
    setShowModal(true);
  };

  // SAVE HANDLER – called by EventModal
  const handleSave = () => {
    fetchTimesheets(); // RE-FETCH → UI updates instantly
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!editingEvent?.id || !window.confirm("Delete this entry?")) return;
    try {
      await timesheetsAPI.deleteTimesheet(editingEvent.id);
      fetchTimesheets();
      setShowModal(false);
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleDuplicate = () => {
    if (!editingEvent) return;
    // Duplicate logic can be moved to backend or done locally
    alert("Duplicate not implemented in backend yet");
  };

  const getDateRangeText = () => {
    if (view === Views.WEEK) {
      const start = moment(date).startOf("week");
      const end = moment(date).endOf("week");
      return `${start.format("DD/MM/YYYY")} - ${end.format("DD/MM/YYYY")}`;
    }
    return moment(date).format("DD/MM/YYYY");
  };

  const handleNavigate = (direction: "prev" | "next") => {
    const amount = view === Views.DAY ? 1 : 7;
    const newDate = moment(date)
      [direction === "next" ? "add" : "subtract"](amount, "days")
      .toDate();
    setDate(newDate);
  };

  // COLOR BY STATUS
  const eventPropGetter = (event: any) => {
    let bg = "#9ca3af";
    if (event.status === "APPROVED") bg = "#16a34a";
    else if (event.status === "PENDING") bg = "#f59e0b";
    else if (event.status === "REJECTED") bg = "#dc2626";
    return { style: { backgroundColor: bg, color: "white" } };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600 mr-2">CALENDAR</span>
          <button
            onClick={() => setView(Views.WEEK)}
            className={`px-4 py-2 text-sm font-medium rounded ${
              view === Views.WEEK
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView(Views.DAY)}
            className={`px-4 py-2 text-sm font-medium rounded ${
              view === Views.DAY
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            Day
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-2 text-sm border rounded flex items-center gap-2 hover:bg-gray-50"
            >
              <CalendarDays size={16} />
              {getDateRangeText()}
            </button>
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 z-50 bg-white shadow-lg rounded-lg p-4">
                <DatePicker
                  selected={date}
                  onChange={(d) => {
                    if (d) {
                      setDate(d);
                      setShowDatePicker(false);
                    }
                  }}
                  inline
                />
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleNavigate("prev")}
              className="p-2 border rounded hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => handleNavigate("next")}
              className="p-2 border rounded hover:bg-gray-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4 overflow-y-auto">
        <Calendar
          selectable
          localizer={localizer}
          events={calendarEvents}
          view={view}
          onView={setView}
          views={[Views.DAY, Views.WEEK]}
          startAccessor="start"
          endAccessor="end"
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          className="h-full bg-white rounded-lg border"
          step={15}
          timeslots={1}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventPropGetter}
          components={{
            event: ({ event }) => (
              <div>
                <div className="font-semibold text-xs">{event.description}</div>
                <div className="text-xs opacity-75">{event.status}</div>
              </div>
            ),
          }}
        />
      </div>

      {/* MODAL */}
      <EventModal
        show={showModal}
        isEditMode={isEditMode}
        editingEvent={editingEvent}
        startTime={startTime}
        endTime={endTime}
        selectedDate={selectedDate}
        description={description}
        project={projectName}   
        tags={tags}
        billable={billable}
        status={status}           
        userId={userId}
        onClose={() => setShowModal(false)}
        onSave={handleSave}     
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        setStartTime={setStartTime}
        setEndTime={setEndTime}
        setSelectedDate={setSelectedDate}
        setDescription={setDescription}
        setProject={setProjectName}
        setTags={setTags}
        setBillable={setBillable}
        setStatus={setStatus}        
      />
    </div>
  );
};

export default CalendarViewComponent;