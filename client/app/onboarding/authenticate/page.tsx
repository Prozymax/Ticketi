"use client";
import {useState} from "react";
import {slides} from "@/onboarding_data";
import "@/styles/onboarding.css";
import OnboardingSlide from "./components/page";

export default function OnboardingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;

    if (distance > 50) {
      // swipe left → next
      nextSlide();
    } else if (distance < -50) {
      // swipe right → prev
      prevSlide();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div
      className="relative w-full max-w-lg mx-auto overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{transform: `translateX(-${currentIndex * 100}%)`}}
      >
        {slides.map((data, idx) => (
          <div key={idx} className="w-full flex-shrink-0">
            <OnboardingSlide
              data={data}
              isLastSlide={idx === slides.length - 1}
            />
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="nav-dots flex justify-center">
        {slides.map((_, idx) => (
          <button
            title="slide_nav"
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`w-3 h-3 rounded-full ${
              idx === currentIndex ? "bg-purple-600 w-8" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
