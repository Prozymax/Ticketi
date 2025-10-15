"use client";
import "@/styles/onboarding.css";
import Image from "next/image";

interface OnboardingData {
  title: string;
  description: string;
  image: string;
}

interface OnboardingSlideProps {
  data: OnboardingData;
}

export default function OnboardingSlide({ data }: OnboardingSlideProps) {

  return (
    <div className="slide-content">
      <h1
        className="headline"
        dangerouslySetInnerHTML={{__html: data?.title}}
      ></h1>
      <p className="description">{data?.description}</p>
      <div className="vector_illustration">
        {data?.image && (
          <Image 
            src={data.image} 
            alt="vector_illustration"
            width={300}
            height={300}
            priority
          />
        )}
      </div>
    </div>
  );
}
