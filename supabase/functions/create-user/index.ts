// Creates an admin or employee account.
//
// Runs server-side because creating an auth user needs the service_role key,
// which must never reach the browser. The caller's own JWT is verified first
// and the role hierarchy is re-checked here as well as in the database:
//   superadmin -> may create admin or employee
//   admin      -> may create employee
//
// Deploy:  supabase functions deploy create-user
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by
// the platform; no secrets are hardcoded here.

import { createClient } from 'jsr:@supabase/supabase-js@2';

type AppRole = 'superadmin' | 'admin' | 'employee';

interface CreateUserBody {
  readonly username?: unknown;
  readonly password?: unknown;
  readonly fullName?: unknown;
  readonly role?: unknown;
}

// Accounts are identified by username. Supabase Auth still needs an email, so
// we derive a deterministic one that is never delivered to — the account is
// created already confirmed. Must match src/config/constants.ts and the
// username_to_email() function in migration 0003.
const INTERNAL_EMAIL_DOMAIN = 'cosmetics.local';

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

const CREATABLE_BY: Record<AppRole, readonly AppRole[]> = {
  superadmin: ['admin', 'employee'],
  admin: ['employee'],
  employee: [],
};

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

const isRole = (value: unknown): value is AppRole =>
  value === 'superadmin' || value === 'admin' || value === 'employee';

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Function is not configured correctly.' }, 500);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing authorization header.' }, 401);
  }

  // Identify the caller using their own JWT.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Your session is not valid.' }, 401);
  }

  const { data: callerRow, error: callerError } = await callerClient
    .from('users')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (callerError || !callerRow) {
    return json({ error: 'Could not resolve your account.' }, 403);
  }

  if (!callerRow.is_active || !isRole(callerRow.role)) {
    return json({ error: 'Your account is not active.' }, 403);
  }

  let body: CreateUserBody;
  try {
    body = (await request.json()) as CreateUserBody;
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const { username, password, fullName, role } = body;

  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username.trim().toLowerCase())) {
    return json(
      { error: 'Username must be 3-32 characters: letters, numbers, dot, underscore or hyphen.' },
      400,
    );
  }
  if (typeof password !== 'string' || password.length < 8) {
    return json({ error: 'Password must be at least 8 characters.' }, 400);
  }
  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    return json({ error: 'Full name is required.' }, 400);
  }
  if (!isRole(role)) {
    return json({ error: 'Unknown role.' }, 400);
  }

  if (!CREATABLE_BY[callerRow.role].includes(role)) {
    return json({ error: `A ${callerRow.role} cannot create a ${role} account.` }, 403);
  }

  const normalisedUsername = username.trim().toLowerCase();
  const email = `${normalisedUsername}@${INTERNAL_EMAIL_DOMAIN}`;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fail with a clear message rather than a unique-violation from the trigger.
  const { data: existing } = await adminClient
    .from('users')
    .select('id')
    .eq('username', normalisedUsername)
    .maybeSingle();

  if (existing) {
    return json({ error: `The username "${normalisedUsername}" is already taken.` }, 409);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), username: normalisedUsername },
  });

  if (createError || !created.user) {
    return json({ error: createError?.message ?? 'Could not create the account.' }, 400);
  }

  // The handle_new_user trigger already inserted the row as 'employee';
  // set the requested role now that the caller has been authorised.
  const { error: roleError } = await adminClient
    .from('users')
    .update({ role, full_name: fullName.trim() })
    .eq('id', created.user.id);

  if (roleError) {
    // Don't leave a half-provisioned account behind.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: 'Could not assign the role. The account was rolled back.' }, 500);
  }

  return json(
    { id: created.user.id, username: normalisedUsername, fullName: fullName.trim(), role },
    201,
  );
});
