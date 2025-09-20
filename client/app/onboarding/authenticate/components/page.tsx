"use client"
import "@/styles/onboarding.css";
// import { usePiNetwork } from "@/app/hooks/usePiNetwork";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface OnboardingData {
    title: string;
    description: string;
    image: string;
}

interface OnboardingSlideProps {
  data: OnboardingData;
  isLastSlide?: boolean;
}

export default function OnboardingSlide({ data, isLastSlide = false }: OnboardingSlideProps) {
  // const { authenticate, isLoading, error, isSDKReady } = usePiNetwork();
  const router = useRouter();
  const isLoading = false, isSDKReady = true, error = false;
  const [authError, setAuthError] = useState<string | null>(null);

  const handlePiAuthentication = async () => {
    try {
      setAuthError(null);
      
      // Authenticate with Pi Network
      // await authenticate();
      
      // Set first visit cache and user data
      // const { UserStorage } = await import('../../../utils/userStorage');
      // UserStorage.setHasVisited();
      // UserStorage.setOnboardingCompleted();
      
      // Navigate to edit-username page
      router.push('/onboarding/edit-username');
      
    } catch (error) {
      console.error('Pi Network authentication failed:', error);
      setAuthError('Authentication failed. Please try again.');
    }
  };

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

        {/* Only show auth button on the last slide */}
        {isLastSlide && (
          <div className="auth_btn flex items-center text-center justify-center">
            <button 
              type="button" 
              title="Authenticate with Pi Network"
              onClick={handlePiAuthentication}
              disabled={isLoading || !isSDKReady}
              className={`pi-auth-button ${isLoading ? 'loading' : ''} ${!isSDKReady ? 'disabled' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Authenticating...
                </>
              ) : !isSDKReady ? (
                'Loading Pi SDK...'
              ) : (
                'Authenticate with Pi Network'
              )}
            </button>
            
            {/* Error message */}
            {(error || authError) && (
              <div className="auth-error">
                {error || authError}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
