import '@/styles/splash.css'
import '@/styles/mobileview/splash.css'


export default function SplashPage() {
    return (
        <main className="flex flex-col items-center main">
            <div className="logo-container">
                <img src="/logo.png" alt="Tiketi_Logo" className="logo" />
            </div>
        </main>
    )
}