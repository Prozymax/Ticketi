export interface myEventProp {
  image: string;
  title: string;
  ticket_price: string;
  venue: string;
  data: string;
  time: string;
  ticket_amount: number;
}

export const events: myEventProp[] = [
  {
    image: "event.png",
    title: "Token2049 Singapore",
    ticket_price: "12.998",
    venue: "Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG)",
    data: "October 1st & 2nd",
    time: "10am Daily UTC",
    ticket_amount: 106,
  },
  {
    image: "event.png",
    title: "Elvis xBox Gathering - House Party",
    ticket_price: "12.998",
    venue: "Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG)",
    data: "October 1st & 2nd",
    time: "10am Daily UTC",
    ticket_amount: 106,
  },
];
