import { argon2id, hash, verify, type HashOptions } from 'argon2';

const ARGON2_OPTIONS: HashOptions = { type: argon2id };

/** argon2id hash of `__nomnom_dummy_password__` (computed once for timing-safe login). */
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$1Z/8Q69BEHJ2IK5KDCTLPQ$8ge9PtVa1SZDgZlu7DQJIHGPtT/GkjBYUAV85KRh12s';

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hashValue: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(hashValue, plain);
  } catch {
    return false;
  }
}

export async function verifyPasswordOrDummy(
  hashValue: string | null,
  plain: string,
): Promise<boolean> {
  if (hashValue === null) {
    await verifyPassword(DUMMY_PASSWORD_HASH, plain);
    return false;
  }
  return verifyPassword(hashValue, plain);
}
