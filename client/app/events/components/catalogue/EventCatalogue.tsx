'use client';
import Image from 'next/image';
import EventCard from './EventCard';
import '@/styles/event-card.css';
import { useRouter } from 'next/navigation';

interface EventProp {
  image: string;
  title: string;
  ticket_price: string;
  venue: string;
  data: string;
  time: string;
  ticket_amount: number;
};

export default function EventCatalogue({ events = [] } : { events? : EventProp[] }) {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push('/create-event')
  }

  // Safety check for events array
  if (!events || events.length === 0) {
    return (
      <div className="event-catalogue">
        <div className="no-events">
          <p>No events available at the moment.</p>
        </div>
        <p className="create-event" onClick={handleCreateEvent}>
          <i className="fa-solid fa-plus"></i>&nbsp;&nbsp;Create Event
        </p>
      </div>
    );
  }



  return (
    <div className="event-catalogue">
      <div className="events-grid">
        <p className="near_user flex items-center py-8">
          <Image
            src="/icons/united-kingdom.png"
            width={25}
            height={25}
            alt="flag_icon"
          />
          &nbsp;&nbsp; Events events near you
        </p>
        {events.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}
      </div>

      <div className="events-grid">
        <p className="near_user flex items-center py-8">
          <Image src="/icons/fire.png" width={25} height={25} alt="flag_icon" />
          &nbsp;&nbsp; Trending Events
        </p>
        {events.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}
      </div>

      <div className="events-grid">
        <p className="near_user flex items-center py-8">
          <Image src="/icons/globe.png" width={25} height={25} alt="flag_icon" />
          &nbsp;&nbsp; Events around the world
        </p>
        {events.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}
      </div>

      <p className="create-event" onClick={handleCreateEvent}>
        <i className="fa-solid fa-plus"></i>&nbsp;&nbsp;Create Event
      </p>
    </div>
  );
}