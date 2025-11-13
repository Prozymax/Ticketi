"use client";

import {useRef, useEffect} from "react";
import Image from "next/image";
import JsBarcode from "jsbarcode";

interface TicketProps {
  ticketData: {
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
  };
  onDownload?: () => void;
  onShare?: () => void;
}

const Ticket = ({ticketData}: TicketProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Initialize barcode with ticket ID
  useEffect(() => {
    if (barcodeRef.current) {
      try {
        // Use ticket ID for barcode (more reliable than username)
        const barcodeData = ticketData.id.slice(-12).toUpperCase();
        JsBarcode(barcodeRef.current, barcodeData, {
          format: "CODE128",
          width: 1.8,
          height: 140,
          displayValue: false,
          background: "#ffffff", // White background for barcode
          lineColor: "#000000", // Black barcode lines for proper scanning
          margin: 2,
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [ticketData.id]);

  return (
    <div className="w-full mx-auto mb-4">
      {/* Ticket Container */}
      <div
        ref={ticketRef}
        className="relative bg-black shadow-lg overflow-hidden"
      >
        <div className="flex h-48">
          {/* Left Side - Vertical Barcode */}
          <div className="w-16 bg-blue-700 flex items-center justify-center border-r border-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-1">
              <div className="transform -rotate-90 flex flex-col items-center gap-1 bg-white px-2 py-1">
                <svg
                  ref={barcodeRef}
                  className="h-32"
                  style={{width: "auto", maxWidth: "200px"}}
                />
                <div className="text-red-800 text-[8px] font-mono tracking-wider">
                  {ticketData.id.slice(-12).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Center - Event Image */}
          <div className="flex-1 relative bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700">
            {ticketData.eventImage ? (
              <Image
                src={ticketData.eventImage}
                alt={ticketData.eventTitle}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold opacity-30">
                  {ticketData.eventTitle.charAt(0)}
                </span>
              </div>
            )}

            {/* Status Badge */}
            <div
              className={`absolute top-3 left-3 px-3 py-1 rounded-md text-[11px] font-bold shadow-lg ${
                ticketData.status === "valid"
                  ? "bg-green-500 text-white"
                  : ticketData.status === "used"
                  ? "bg-yellow-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {ticketData.status.toUpperCase()}
            </div>
          </div>

          {/* Right Side - Event Details (Purple Section) */}
          <div className="w-40 bg-[#001A53] flex flex-col items-center justify-center">
            {/* Host Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden mb-8 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center ring-2 ring-purple-800">
              {ticketData.organizer?.avatar ? (
                <Image
                  src={ticketData.organizer.avatar}
                  alt={ticketData.organizer.name || "Host"}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-bold">
                  {(ticketData.organizer?.name || "H").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Host Label */}
            <div className="text-white-900 text-[.8rem] mb-1">
              Host
            </div>

            {/* Event Title */}
            <h2 className="text-sm font-bold text-[#7d5b9c] w-[80%] text-center px-2" style={{lineHeight: '1.2', maxWidth: '100%', wordBreak: 'break-word'}}>
              {ticketData.eventTitle}
            </h2>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className="flex justify-center space-x-3 mt-4">
        <button
          type="button"
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download size={16} />
          <span>{isDownloading ? "Downloading..." : "Download"}</span>
        </button>
        <button
          type="button"
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          onClick={handleShare}
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div> */}
    </div>
  );
};

export default Ticket;
