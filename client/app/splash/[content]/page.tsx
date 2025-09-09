import { legalContents } from "@/legalContent";
import TermsAndPrivacyPage from "../components/page";
import '@/styles/terms.css'

export default function ContentPage( { params = { content: "terms" } } : { params: { content: string; } } ) {
    const pageContent = legalContents.find((content) => content.param.toLowerCase() === params.content.toLowerCase());
    return (
        <TermsAndPrivacyPage content={pageContent!} />
    )
}