"use client";

import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {Plus} from "lucide-react";
import Ticket from "@/app/ticketProp/component/ticket";
import {apiService} from "@/app/lib/api";
import {UserStorage} from "@/app/utils/userStorage";
import styles from "@/styles/event-hub.module.css";

interface TicketData {
  id: string;
  eventTitle: string;
  eventImage?: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  ticketType: string;
  price: number;
  currency: string;
  purchaser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  organizer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  purchaseDate: string;
  status: "valid" | "used" | "expired";
}

interface TicketsProps {
  tickets?: any[];
}

const Tickets = ({tickets: propTickets}: TicketsProps) => {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If tickets are passed as props, use them
    if (propTickets && propTickets.length > 0) {
      transformAndSetTickets(propTickets);
    } else {
      fetchUserTickets();
    }
  }, [propTickets]);

  const transformAndSetTickets = (purchases: any[]) => {
    try {
      setLoading(true);
      setError(null);

      const user = UserStorage.getUserData();
      console.log("Current user data:", user);
      console.log("Purchases to transform:", purchases);

      // Transform purchase data to ticket format
      const transformedTickets: TicketData[] = purchases
        .filter((purchase: any) => {
          console.log("Purchase payment status:", purchase.paymentStatus);
          return purchase.paymentStatus === "completed";
        })
        .map((purchase: any) => {
          const event = purchase.event || {};
          const ticket = purchase.ticket || {};

          console.log("Transforming purchase:", {
            purchaseId: purchase.id,
            eventTitle: event.title,
            ticketType: ticket.ticketType,
            paymentStatus: purchase.paymentStatus
          });

          return {
            id: purchase.id,
            eventTitle: event.title || "Event",
            eventImage: event.eventImage,
            venue: event.location || "Venue",
            address: event.location || "",
            date: event.startDate
              ? new Date(event.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "",
            time: event.startDate
              ? new Date(event.startDate).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "",
            ticketType: ticket.ticketType || "General Admission",
            price: parseFloat(purchase.totalAmount) || 0,
            currency: purchase.currency || "PI",
            purchaser: {
              id: user?.id || "",
              name: user?.username || "User",
              email: user?.email || "",
              avatar: user?.profileImage,
            },
            organizer: event.organizer
              ? {
                  id: event.organizer.id,
                  name:
                    event.organizer.username ||
                    event.organizer.firstName ||
                    "Organizer",
                  avatar: event.organizer.profileImage,
                }
              : undefined,
            purchaseDate: purchase.createdAt || new Date().toISOString(),
            status: determineTicketStatus(event.startDate, event.endDate),
          };
        });

      console.log("Transformed tickets count:", transformedTickets.length);
      console.log("Transformed tickets:", transformedTickets);
      setTickets(transformedTickets);
      setLoading(false);
    } catch (err) {
      console.error("Error transforming tickets:", err);
      setError("Failed to process tickets");
      setLoading(false);
    }
  };

  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getUserPurchases(1, 50);
      console.log("Fetched purchases:", response);

      if (response.success && response.data) {
        transformAndSetTickets(response.data);
      } else {
        setError(response.message || "Failed to load tickets");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to load tickets");
      setLoading(false);
    }
  };

  const determineTicketStatus = (
    startDate: string,
    endDate: string
  ): "valid" | "used" | "expired" => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now > end) return "expired";
    if (now >= start && now <= end) return "used";
    return "valid";
  };

  const handleDownloadTicket = (ticketId: string) => {
    console.log(`Downloaded ticket: ${ticketId}`);
  };

  const handleShareTicket = (ticketId: string) => {
    console.log(`Shared ticket: ${ticketId}`);
  };

  if (loading) {
    return (
      <div className={styles["tickets-content"]}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["tickets-content"]}>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchUserTickets}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className={styles["tickets-content"]}>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tickets found</p>
          <p className="text-sm text-gray-400 mb-6">
            Purchase tickets to see them here
          </p>
          <button
            type="button"
            onClick={() => router.push("/events")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["tickets-content"]}>
      {/* Tickets List */}
      <div className={styles["tickets-list"]}>
        {tickets.map((ticket) => (
          <div key={ticket.id} className={styles["ticket-item"]}>
            <Ticket
              ticketData={ticket}
              onDownload={() => handleDownloadTicket(ticket.id)}
              onShare={() => handleShareTicket(ticket.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tickets;
