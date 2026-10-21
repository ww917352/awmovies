// Cookie name constants only, with no DB/Node-only imports, so proxy.ts
// can read them without pulling in `pg`.
export const SESSION_COOKIE = 'session';
export const PWD_CHANGE_COOKIE = 'pwd_change_required';
