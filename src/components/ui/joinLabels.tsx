import { Fragment, type ReactNode } from 'react';

// Label parts joined with " · ", e.g. "1976 Oscar · Best Picture · No. 12".
export function joinLabels(parts: ReactNode[]): ReactNode[] {
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && ' · '}
      {part}
    </Fragment>
  ));
}
