import Link from "next/link";
import styles from "@/styles/terms.module.css";
import "@/styles/mobileview/terms.module.css";

interface LegalContent {
  param: string;
  title: string;
  content: string;
}

export default function TermsAndPrivacyPage({
  content,
}: {
  content: LegalContent;
}) {
  return (
    <div className={styles['main-container']}>
      <div className={styles.main}>
        <h1 className={styles.header}>{content?.title}</h1>
        <p
          className={styles['text-content']}
          dangerouslySetInnerHTML={{
            __html: typeof content?.content === "string" ? content.content : "",
          }}
        ></p>
        <p className={`${styles.agreement} ${styles.flex} ${styles['items-center']} ${styles['justify-center']} ${styles['gap-3']}`}>
          {content?.param == "terms" && (
            <>
              <input type="checkbox" name="agree" id="checkbox" />
              <label htmlFor="checkbox">
                I agree to the terms and condition
              </label>
            </>
          )}
        </p>
        <p className={`${styles.submit_next} ${styles.flex} ${styles['items-center']} ${styles['justify-center']}`}>
          {content?.param === "terms" ? (
            <>
              <Link href={"/onboarding/authenticate"}>
                <button type="button" title="next_btn">
                  Next
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link href={"/splash/terms"}>
                <button type="button" title="next_btn">
                  Next
                </button>
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

