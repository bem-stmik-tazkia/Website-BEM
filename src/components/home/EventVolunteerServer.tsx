import { getKegiatans } from "@/app/admin/kegiatan/actions";
import { AgendaKegiatan } from "@/types/agenda";
import EventVolunteer from "./EventVolunteer";

export default async function EventVolunteerServer() {
  const agendas = await getKegiatans();
  const publishedAgendas = agendas.filter((a) => a.is_published);

  const today = new Date();
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
        liveEvents.push(agenda);
      } else {
        upcomingEvents.push(agenda);
      }
    } else if (agenda.type === "volunteer") {
      const deadlineDate = agenda.deadline
        ? new Date(agenda.deadline)
        : new Date();
      deadlineDate.setHours(0, 0, 0, 0);

      if (deadlineDate.getTime() >= today.getTime()) {
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
