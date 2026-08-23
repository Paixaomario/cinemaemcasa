interface LogoProps {
  width?: number;
  className?: string;
  iconOnly?: boolean;
}

// Agente de layout: logo oficial usado em todo lugar onde antes
// aparecia o texto "CINEMA EM CASA". iconOnly usa o símbolo recortado
// (sem o texto), ideal para espaços pequenos como o menu encolhido.
export function Logo({ width = 140, className, iconOnly = false }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={iconOnly ? '/logo-icon.png' : '/logo.png'}
      alt="Cinema em Casa"
      style={{ width, height: 'auto' }}
      className={className}
    />
  );
}
