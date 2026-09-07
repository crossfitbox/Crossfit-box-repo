import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import { KioskCheckin } from './kiosk-checkin';

export default async function KioskEntryPage({ params }: { params: { token: string } }) {
  const { data: kiosk } = await supabaseAdmin
    .from('kiosk_tokens')
    .select('id, box_id, location_id, active, boxes(name, primary_color)')
    .eq('token', params.token)
    .eq('active', true)
    .maybeSingle();

  if (!kiosk) notFound();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl text-primary text-center mb-1">
          {(kiosk as any).boxes?.name}
        </h1>
        <p className="text-secondary text-center text-sm mb-8">Check-in</p>
        <KioskCheckin boxId={kiosk.box_id} locationId={kiosk.location_id} kioskTokenId={kiosk.id} />
      </div>
    </div>
  );
}
