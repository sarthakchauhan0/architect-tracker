import ClientDetailContent from './ClientDetailContent';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function ClientDetailPage() {
  return <ClientDetailContent />;
}
