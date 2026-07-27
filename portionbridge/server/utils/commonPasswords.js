/**
 * A static list of the most common/weak passwords, checked (case-insensitively)
 * against every submitted password to reject trivially guessable choices even
 * when they technically satisfy the length/character-class rules
 * (e.g. "Password123!" satisfies every regex rule but is extremely common).
 *
 * This is intentionally a plain in-memory array rather than an external API
 * call — password validation must never depend on network availability.
 */
const COMMON_WEAK_PASSWORDS = [
  'password', 'password1', 'password123', 'password1234', 'password!23',
  '12345678', '123456789', '1234567890', 'qwerty123', 'qwertyuiop',
  'letmein123', 'welcome123', 'admin1234', 'administrator', 'iloveyou1',
  'monkey123', 'dragon123', 'football1', 'baseball1', 'superman1',
  'trustno1', 'sunshine1', 'princess1', 'passw0rd', 'passw0rd!',
  'abc123456', 'abcd1234', '1q2w3e4r', '1qaz2wsx', 'qazwsx123',
  'zxcvbnm1', 'asdfghjk', 'letmein1', 'freedom1', 'whatever1',
  'starwars1', 'shadow123', 'master123', 'jordan23', 'harley123',
  'ranger12', 'buster123', 'thomas12', 'hunter12', 'george12',
  'summer2024', 'summer2025', 'winter2024', 'winter2025', 'welcome1',
  'changeme', 'changeit', 'temppass1', 'default123', 'guest1234',
  'test12345', 'demo12345', 'sample123', 'qwerty12345', 'password12345',
];

/**
 * Returns true if the given password (case-insensitive, trimmed) matches
 * a known common/weak password.
 */
function isCommonWeakPassword(password) {
  const normalized = password.trim().toLowerCase();
  return COMMON_WEAK_PASSWORDS.includes(normalized);
}

module.exports = { COMMON_WEAK_PASSWORDS, isCommonWeakPassword };
