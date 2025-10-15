'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import Ticket from '@/app/ticketProp/component/ticket';
import '@/styles/event-hub.css';

interface TicketsProps {
  tickets?: unknown[];
}

const Tickets = ({ tickets: propTickets }: TicketsProps) => {
  const router = useRouter();

  // Mock ticket data - replace with actual API data
  const mockTickets = [
    {
      id: 'TKT-001-2024',
      eventTitle: 'Token2049 Singapore',
      eventImage: '/images/event.png',
      venue: 'Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG)',
      date: 'October 1st & 2nd',
      time: '10am Daily UTC',
      ticketType: 'General Admission',
      price: 12.998,
      currency: 'π',
      purchaser: {
        id: 'USR-001',
        name: 'woodylightyearx',
        email: 'woody@example.com',
        avatar: '/api/placeholder/50/50'
      },
      purchaseDate: '2024-09-15T10:30:00Z',
      status: 'valid' as const
    },
    {
      id: 'TKT-002-2024',
      eventTitle: "Woody's End of Year Pi House Party",
      eventImage: '/images/event.png',
      venue: 'Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG)',
      date: 'October 1st & 2nd',
      time: '10am Daily UTC',
      ticketType: 'VIP Access',
      price: 25.5,
      currency: 'π',
      purchaser: {
        id: 'USR-001',
        name: 'woodylightyearx',
        email: 'woody@example.com',
        avatar: '/api/placeholder/50/50'
      },
      purchaseDate: '2024-09-20T14:15:00Z',
      status: 'valid' as const
    }
  ];

  const ticketsData = propTickets || mockTickets;

  const handleCreateEvent = () => {
    router.push('/create-event');
  };

  const handleDownloadTicket = (ticketId: string) => {
    console.log(`Downloaded ticket: ${ticketId}`);
  };

  const handleShareTicket = (ticketId: string) => {
    console.log(`Shared ticket: ${ticketId}`);
  };

  return (
    <div className="tickets-content">
      {/* Tickets List */}
      <div className="tickets-list">
        {ticketsData.map((ticket, index) => (
          <div key={ticket.id} className="ticket-item">
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