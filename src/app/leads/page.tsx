import LeadScraper from '@/components/LeadScraper';

export const metadata = {
    title: 'Lead Discovery | Defcon App',
    description: 'AI-Powered lead generation and qualification system.',
};

export default function LeadsPage() {
    return (
        <div className="min-h-screen pt-24">
            <LeadScraper />
        </div>
    );
}
