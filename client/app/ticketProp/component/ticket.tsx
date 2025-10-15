"use client";

import {useRef, useEffect, useState, useCallback} from "react";
import {MapPin, Calendar, Clock, Download, Share2} from "lucide-react";
import Image from "next/image";
import html2canvas from "html2canvas";
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

const Ticket = ({ticketData, onDownload, onShare}: TicketProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate barcode data
  const generateBarcodeData = useCallback(() => {
    const data = {
      ticketId: ticketData.id,
      eventTitle: ticketData.eventTitle,
      purchaserId: ticketData.purchaser.id,
      purchaseDate: ticketData.purchaseDate,
      status: ticketData.status,
    };
    return JSON.stringify(data);
  }, [ticketData.id, ticketData.eventTitle, ticketData.purchaser.id, ticketData.purchaseDate, ticketData.status]);

  // Initialize barcode
  useEffect(() => {
    if (barcodeRef.current) {
      const barcodeData = generateBarcodeData();
      JsBarcode(barcodeRef.current, barcodeData, {
        format: "CODE128",
        width: 1.5,
        height: 80,
        displayValue: false,
        background: "transparent",
        lineColor: "#000000",
      });
    }
  }, [generateBarcodeData]);

  // Download ticket as image
  const handleDownload = async () => {
    if (!ticketRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement("a");
      link.download = `ticket-${ticketData.eventTitle
        .replace(/\s+/g, "-")
        .toLowerCase()}-${ticketData.id}.png`;
      link.href = canvas.toDataURL();
      link.click();

      if (onDownload) onDownload();
    } catch (error) {
      console.error("Error downloading ticket:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Share ticket
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ticketData.eventTitle} - Ticket`,
          text: `Check out my ticket for ${ticketData.eventTitle}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
    if (onShare) onShare();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Ticket Container */}
      <div 
        ref={ticketRef}
        className="relative bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-700 rounded-lg shadow-lg overflow-hidden"
      >
        {/* Barcode Section - Left */}
        <div className="absolute left-0 top-0 h-full w-20 bg-black flex flex-col items-center justify-center">
          <svg 
            ref={barcodeRef} 
            className="transform -rotate-90 w-15 h-48"
          />
          <div className="text-white text-xs font-mono mt-4 transform -rotate-90 whitespace-nowrap">
            {ticketData.id.slice(-8).toUpperCase()}
          </div>
        </div>

        {/* Main Ticket Content */}
        <div className="ml-20 p-6 flex">
          {/* Left Content - Event Details */}
          <div className="flex-1 text-white">
            {/* Event Title */}
            <h1 className="text-2xl font-bold mb-4 text-purple-100">
              {ticketData.eventTitle}
            </h1>

            {/* Location */}
            <div className="flex items-start mb-4">
              <MapPin size={20} className="text-purple-200 mr-3 mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium text-purple-100">{ticketData.venue}</div>
                <div className="text-sm text-purple-200">{ticketData.address}</div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center">
                <Calendar size={18} className="text-purple-200 mr-2" />
                <span className="text-purple-100">{ticketData.date}</span>
              </div>
              <div className="flex items-center">
                <Clock size={18} className="text-purple-200 mr-2" />
                <span className="text-purple-100">{ticketData.time}</span>
              </div>
            </div>

            {/* Ticket Type and Price */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-200">{ticketData.ticketType}</span>
              <span className="text-lg font-bold text-white">
                {ticketData.price} {ticketData.currency}
              </span>
            </div>
          </div>

          {/* Right Content - Purchaser Info */}
          <div className="flex flex-col items-center justify-center ml-8 bg-blue-900 rounded-lg p-4 min-w-[200px]">
            {/* Purchaser Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-orange-400 flex items-center justify-center">
              {ticketData.purchaser.avatar ? (
                <Image
                  src={ticketData.purchaser.avatar}
                  alt={ticketData.purchaser.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-bold">
                  {ticketData.purchaser.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Purchaser Name */}
            <div className="text-white font-medium text-center">
              {ticketData.purchaser.name}
            </div>
            
            {/* Purchase Date */}
            <div className="text-blue-200 text-xs text-center mt-1">
              Purchased: {new Date(ticketData.purchaseDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
          ticketData.status === 'valid' ? 'bg-green-500 text-white' :
          ticketData.status === 'used' ? 'bg-gray-500 text-white' :
          'bg-red-500 text-white'
        }`}>
          {ticketData.status.toUpperCase()}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-20 right-0 h-1 bg-gradient-to-r from-pink-400 to-purple-400"></div>
        <div className="absolute bottom-0 left-20 right-0 h-1 bg-gradient-to-r from-pink-400 to-purple-400"></div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        <button
          type="button"
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download size={20} />
          <span>{isDownloading ? "Downloading..." : "Download"}</span>
        </button>
        <button
          type="button"
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          onClick={handleShare}
        >
          <Share2 size={20} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default Ticket;
