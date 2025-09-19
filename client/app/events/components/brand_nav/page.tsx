'use client'
import Image from "next/image"
import '@/styles/home.css';
import '@/styles/mobileview/home.css';
import { useRouter } from "next/navigation";


export default function BrandNav({ eventsExist } : { eventsExist: boolean }) {
  const router = useRouter()

  const visitProfile = () => {
    router.push('/profile')
  }
    return (
      <div className="nav">
        <div className="header">
          <div className="logo">
            Ticket<span className="color-span">i</span>
          </div>
          {eventsExist && (
            <div className="explore-search-icon">
              <svg width="40" height="40" viewBox="0 0 20 20" fill="none">
                <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2" />
                <path
                  d="M21 21L16.65 16.65"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          <div className="profile-avatar" onClick={visitProfile}>
            <img src="/Avatar.png" alt="Profile" className="avatar-small" />
          </div>
        </div>
      </div>
    );
}