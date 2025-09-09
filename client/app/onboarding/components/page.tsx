import "@/styles/onboarding.css";


interface OnboardingData {
    title: string;
    description: string;
    image: string;
}

export default function OnboardingSlide({ data } : { data: OnboardingData } ) {
  return (
    <div className="main-container flex flex-col items-center justify-center">
      <main className="flex flex-col items-center justify-center">
        <h1 className="headline" dangerouslySetInnerHTML={{ __html: data?.title }}>
         </h1>
        <p className="description">
          {data?.description}
        </p>
        <div className="vector_illustration">
            {data?.image &&
                <img src={data.image} alt="vector_illustration"/>
            }
        </div>

        <div className="auth_btn flex items-center text-center justify-center">
          <button type="button" title="Authenticate with Pi Network">
            Authenticate with Pi Network
          </button>
        </div>
      </main>
    </div>
  );
}
