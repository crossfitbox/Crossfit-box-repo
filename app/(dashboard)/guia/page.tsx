import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

interface Step {
  label: string;
  description: string;
  href: string;
  done: boolean;
}

async function getSteps(boxId: string): Promise<Step[]> {
  const [box, plans, classes, wods, coaches, members] = await Promise.all([
    supabaseAdmin.from('boxes').select('logo_url, primary_color').eq('id', boxId).maybeSingle(),
    supabaseAdmin.from('membership_plans').select('id', { count: 'exact', head: true }).eq('box_id', boxId),
    supabaseAdmin.from('classes').select('id', { count: 'exact', head: true }).eq('box_id', boxId),
    supabaseAdmin.from('wods').select('id', { count: 'exact', head: true }).eq('box_id', boxId),
    supabaseAdmin
      .from('box_members')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', boxId)
      .eq('role', 'coach'),
    supabaseAdmin
      .from('box_members')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', boxId)
      .eq('role', 'athlete'),
  ]);

  return [
    {
      label: 'Personaliza la marca de tu box',
      description: 'Logo y colores — así se ve la app para tus atletas',
      href: '/',
      done: Boolean(box.data?.logo_url),
    },
    {
      label: 'Crea al menos un plan de membresía',
      description: 'Precio, cupos por período, mensual o anual',
      href: '/planes/nuevo',
      done: (plans.count ?? 0) > 0,
    },
    {
      label: 'Programa tus primeras clases',
      description: 'Horario, tipo de clase, coach asignado',
      href: '/clases/nueva',
      done: (classes.count ?? 0) > 0,
    },
    {
      label: 'Publica tu primer WOD',
      description: 'El entrenamiento que verán los atletas hoy',
      href: '/wods/nueva',
      done: (wods.count ?? 0) > 0,
    },
    {
      label: 'Agrega tus coaches',
      description: 'Créalos en Supabase Auth y asígnalos como coach en Miembros',
      href: '/miembros',
      done: (coaches.count ?? 0) > 0,
    },
    {
      label: 'Ajusta los permisos por rol',
      description: 'Qué puede hacer un coach vs. un admin en el panel',
      href: '/roles',
      done: false, // se marca manualmente — no hay forma de saber si "ya lo revisaste"
    },
    {
      label: 'Invita a tus primeros atletas',
      description: 'Se registran desde la app móvil con el slug de tu box',
      href: '/miembros',
      done: (members.count ?? 0) > 0,
    },
  ];
}

export default async function GuidePage() {
  const session = await requireStaffSession();
  const steps = await getSteps(session.boxId);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">Guía de inicio</h1>
        <p className="text-secondary text-sm">
          {doneCount} de {steps.length} pasos completados — sigue este orden para
          dejar tu box operando
        </p>
      </div>

      <div className="h-1.5 bg-border rounded-full overflow-hidden mb-8 max-w-md">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-2 max-w-2xl">
        {steps.map((step, i) => (
          <Link
            key={step.label}
            href={step.href}
            className="flex items-start gap-4 border border-border rounded p-4 hover:bg-surface transition-colors"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                step.done
                  ? 'bg-success/15 text-success'
                  : 'bg-surface text-secondary border border-border'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <div>
              <div className="text-sm text-primary">{step.label}</div>
              <div className="text-xs text-secondary mt-0.5">{step.description}</div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-secondary text-xs mt-8 max-w-2xl">
        Esta guía se actualiza sola según lo que ya tengas configurado — no hay
        que marcar nada a mano, salvo "Ajusta los permisos" (es una revisión,
        no algo que se "complete" una sola vez).
      </p>
    </div>
  );
}
