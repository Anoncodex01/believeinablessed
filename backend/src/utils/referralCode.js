/**
 * Name-based affiliate referral codes
 * Example: "Alvin Uri" → ALVINURI, next Alvin → ALVINURI2
 */
import supabase from '../config/supabase.js';

export function slugifyAffiliateName(name) {
  const slug = String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase()
    .slice(0, 24);

  return slug || 'AFFILIATE';
}

/** Old random format like BIBA0B15BCN / BIBX7K2M (BIB + digits). */
export function isLegacyReferralCode(code) {
  const value = String(code || '').trim();
  // Name-based codes never need migration unless they are the old BIB+random style.
  // Require a digit so real names like "BIBIANA" are not rewritten.
  return /^BIB/i.test(value) && /\d/.test(value);
}

export async function generateUniqueReferralCode(name, excludeUserId = null) {
  const base = slugifyAffiliateName(name);
  let attempt = 0;

  while (attempt < 50) {
    const code = attempt === 0 ? base : `${base}${attempt + 1}`;
    let query = supabase
      .from('users')
      .select('id')
      .ilike('referral_code', code)
      .limit(1);

    const { data, error } = await query;
    if (error) {
      console.error('Error checking referral code uniqueness:', error);
      return `${base}${Date.now().toString(36).toUpperCase().slice(-4)}`;
    }

    const existing = data?.[0];
    if (!existing || (excludeUserId && existing.id === excludeUserId)) {
      return code;
    }
    attempt += 1;
  }

  return `${base}${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

/**
 * Ensure user has a name-based referral code.
 * Converts legacy BIB… codes to the owner's name.
 */
export async function ensureNameBasedReferralCode(user) {
  if (!user?.id || !user?.name) return user?.referral_code || null;

  const current = user.referral_code;
  if (current && !isLegacyReferralCode(current)) {
    // Already name-like; keep unless empty
    return current;
  }

  const nextCode = await generateUniqueReferralCode(user.name, user.id);
  if (current && current.toUpperCase() === nextCode.toUpperCase()) {
    return current;
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      referral_code: nextCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('referral_code')
    .single();

  if (error) {
    console.error('Failed to update referral code to name-based:', error);
    return current || nextCode;
  }

  console.log(`🔗 Referral code updated for ${user.name}: ${current || '(none)'} → ${data.referral_code}`);
  return data.referral_code;
}
