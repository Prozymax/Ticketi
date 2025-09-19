import {events} from "@/events_data";
import EmptyEventsComponent from "./components/empty_catalogue/page";
import EventCatalogue from "./components/catalogue/EventCatalogue";
import BrandNav from "./components/brand_nav/page";


export default function EventsPage() {
  return events.length > 0 ? (
    <div className="bg-black-900">
    <BrandNav eventsExist={true} />
    <EventCatalogue events={events} />
    </div>
  ) : (
    <div className="bg-black-900">
    <BrandNav eventsExist={false} />
    <EmptyEventsComponent />
    </div>
  );

}
