"use client";
import styles from "@/styles/onboarding.module.css";
import Image from "next/image";

interface OnboardingData {
  title: string;
  description: string;
  image: string;
}

interface OnboardingSlideProps {
  data: OnboardingData;
}

export default function OnboardingSlide({data}: OnboardingSlideProps) {
  return (
    <div className={styles["slide-content"]}>
      <h1
        className={styles.headline}
        dangerouslySetInnerHTML={{__html: data?.title}}
      ></h1>
      <p className={styles.description}>{data?.description}</p>
      <div className={styles.vector_illustration}>
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
