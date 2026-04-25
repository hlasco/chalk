import { uid } from './uid';

export function makeBoulder({ gi, styles=[], sent=true, attempts=1, perceived=1, source=null }) {
  return {
    id: uid(),
    gi,
    styles: [...styles],
    perceived,
    sends: sent ? 1 : 0,
    attempts,
    ...(source ? { source } : {}),
  };
}
