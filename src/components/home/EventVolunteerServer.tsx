import { getCachedAgenda } from "@/app/(public)/actions/public-data";
import { AgendaKegiatan } from "@/types/agenda";
import { isDeadlinePassedJakarta } from "@/lib/registration-validation";
import EventVolunteer from "./EventVolunteer";

export default async function EventVolunteerServer() {
  const agendas = (await getCachedAgenda()) as AgendaKegiatan[];
  const publishedAgendas = agendas.filter((a) => a.is_published);

  // Server Vercel berjalan di UTC — gunakan waktu WIB (UTC+7) agar
  // perbandingan time_range konsisten dengan zona waktu Indonesia
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const liveEvents: AgendaKegiatan[] = [];
  const upcomingEvents: AgendaKegiatan[] = [];
  const pastEvents: AgendaKegiatan[] = [];
  const volunteerOpportunities: AgendaKegiatan[] = [];

  for (const agenda of publishedAgendas) {
    if (agenda.type === "event") {
      const eventDate = agenda.date ? new Date(agenda.date) : new Date();
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate.getTime() < today.getTime()) {
        pastEvents.push(agenda);
      } else if (eventDate.getTime() === today.getTime()) {
        let isPast = false;
        let isUpcoming = false;

        if (agenda.time_range) {
          // Parse formats like "08:00 - 12:00", "08.00-12.00 WIB", "08:00 s/d 12:00"
          const timeMatch = agenda.time_range.match(/(\d{1,2})[:.](\d{2})\s*(?:-|s\/d|to)\s*(\d{1,2})[:.](\d{2})/i);
          if (timeMatch) {
            const startHour = parseInt(timeMatch[1], 10);
            const startMin = parseInt(timeMatch[2], 10);
            const endHour = parseInt(timeMatch[3], 10);
            const endMin = parseInt(timeMatch[4], 10);

            const eventStart = new Date(today);
            eventStart.setHours(startHour, startMin, 0, 0);

            const eventEnd = new Date(today);
            eventEnd.setHours(endHour, endMin, 0, 0);

            if (now.getTime() > eventEnd.getTime()) {
              isPast = true;
            } else if (now.getTime() < eventStart.getTime()) {
              isUpcoming = true;
            }
          }
        }

        if (isPast) {
          pastEvents.push(agenda);
        } else if (isUpcoming) {
          upcomingEvents.push(agenda);
        } else {
          liveEvents.push(agenda);
        }
      } else {
        upcomingEvents.push(agenda);
      }
    } else if (agenda.type === "volunteer") {
      if (!isDeadlinePassedJakarta(agenda.deadline)) {
        volunteerOpportunities.push(agenda);
      }
    }
  }

  return (
    <EventVolunteer
      showHeader={false}
      liveEvents={liveEvents}
      upcomingEvents={upcomingEvents}
      volunteerOpportunities={volunteerOpportunities}
      pastEvents={pastEvents}
    />
  );
}
