#!/usr/bin/env node

/**
 * Upsert bootstrap auth + public users for production E2E.
 * Defaults match local seed.dev-users.sql (admin / vendor1 / buyer1).
 * Override with BOOTSTRAP_* env vars.
 */

const { Client } = require('pg')

const BOOTSTRAP_USERS = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    envEmail: 'BOOTSTRAP_ADMIN_EMAIL',
    defaultEmail: 'admin@test.com',
    fullName: 'Super Admin',
    role: 'super-admin',
  },
  {
    id: '10000000-0000-4000-8000-000000000021',
    envEmail: 'BOOTSTRAP_VENDOR_EMAIL',
    defaultEmail: 'vendor1@test.com',
    fullName: 'Vendedor 1',
    role: 'seller',
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    envEmail: 'BOOTSTRAP_BUYER_EMAIL',
    defaultEmail: 'buyer1@test.com',
    fullName: 'Comprador 1',
    role: 'user',
  },
]

function resolveUsers() {
  const password = process.env.BOOTSTRAP_PASSWORD || '123456'
  return {
    password,
    users: BOOTSTRAP_USERS.map((user) => ({
      id: user.id,
      email: process.env[user.envEmail] || user.defaultEmail,
      fullName: user.fullName,
      role: user.role,
    })),
  }
}

async function upsertBootstrapUsers(dbUrl) {
  const { password, users } = resolveUsers()
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  try {
    for (const user of users) {
      const existing = await client.query('select id, email from auth.users where id = $1', [user.id])

      if (existing.rowCount === 0) {
        // Avoid email collisions with a different id.
        const byEmail = await client.query('select id from auth.users where email = $1', [user.email])
        if (byEmail.rowCount > 0) {
          throw new Error(
            `Cannot create bootstrap user ${user.email}: email already used by ${byEmail.rows[0].id}`,
          )
        }

        await client.query(
          `insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, recovery_sent_at, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at,
            confirmation_token, email_change, email_change_token_new, recovery_token
          ) values (
            '00000000-0000-0000-0000-000000000000'::uuid,
            $1::uuid,
            'authenticated',
            'authenticated',
            $2::text,
            crypt($3::text, gen_salt('bf')),
            now(), now(), now(),
            jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
            jsonb_build_object('full_name', $4::text, 'role', $5::text),
            now(), now(), '', '', '', ''
          )`,
          [user.id, user.email, password, user.fullName, user.role],
        )

        await client.query(
          `insert into auth.identities (
            id, user_id, identity_data, provider, provider_id,
            last_sign_in_at, created_at, updated_at
          ) values (
            $1::uuid, $1::uuid,
            jsonb_build_object('sub', $1::text, 'email', $2::text),
            'email', $2::text, now(), now(), now()
          )
          on conflict do nothing`,
          [user.id, user.email],
        )
      } else {
        await client.query(
          `update auth.users
           set
             email = $2::text,
             encrypted_password = crypt($3::text, gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
               || jsonb_build_object('full_name', $4::text, 'role', $5::text),
             updated_at = now()
           where id = $1::uuid`,
          [user.id, user.email, password, user.fullName, user.role],
        )

        await client.query(
          `insert into auth.identities (
            id, user_id, identity_data, provider, provider_id,
            last_sign_in_at, created_at, updated_at
          ) values (
            $1::uuid, $1::uuid,
            jsonb_build_object('sub', $1::text, 'email', $2::text),
            'email', $2::text, now(), now(), now()
          )
          on conflict do nothing`,
          [user.id, user.email],
        )
      }

      await client.query(
        `insert into public."user" (id, email, role, full_name, status)
         values ($1::uuid, $2::text, $3::text, $4::text, 'active')
         on conflict (id) do update set
           email = excluded.email,
           role = excluded.role,
           full_name = excluded.full_name,
           status = excluded.status`,
        [user.id, user.email, user.role, user.fullName],
      )
    }
  } finally {
    await client.end()
  }

  return { password, users }
}

module.exports = { upsertBootstrapUsers, resolveUsers, BOOTSTRAP_USERS }
