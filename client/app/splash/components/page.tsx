import Link from "next/link";
import '@/styles/terms.css'
import "@/styles/mobileview/terms.css";

interface LegalContent {
    param: string;
    title: string;
    content: string;
}

export default function TermsAndPrivacyPage({ content } : { content: LegalContent }) {
  return (
    <div className="main-container">
      <div className="main">
        <h1 className="header">{content?.title}</h1>
        <p
          className="text-content"
          dangerouslySetInnerHTML={{__html: content?.content}}
        ></p>
        <p className="agreement flex items-center justify-center gap-3">
          {content?.param == "terms" && (
            <>
              <input type="checkbox" name="agree" id="checkbox" />
              <label htmlFor="checkbox">
                I agree to the terms and condition
              </label>
            </>
          )}
        </p>
        <p className="submit_next flex items-center justify-center">
          {content?.param === "terms" ? (
            <>
              <Link href={"/onboarding"}>
                <button type="button" title="next_btn">Next</button>
              </Link>
            </>
          ) : (
            <>
              <Link href={"/splash/terms"}>
                <button type="button" title="next_btn">Next</button>
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
