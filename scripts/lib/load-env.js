// Minimal, dependency-free .env loader for ops scripts.
// Mirrors Next.js load order without overriding real shell/CI env vars.

const fs = require('fs')
const path = require('path')

function parseEnvFile(content) {
  const out = {}
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    } else {
      // Strip trailing inline comments (" #...") for unquoted values.
      const hash = value.indexOf(' #')
      if (hash !== -1) value = value.slice(0, hash).trim()
    }

    out[key] = value
  }
  return out
}

/**
 * Load env files into process.env. Later files override earlier ones, but real
 * shell/CI variables always win (so production env on Vercel is never clobbered).
 */
function loadEnv(files = ['.env', '.env.local']) {
  const root = process.cwd()
  const shellKeys = new Set(Object.keys(process.env))

  for (const file of files) {
    const full = path.join(root, file)
    if (!fs.existsSync(full)) continue
    const parsed = parseEnvFile(fs.readFileSync(full, 'utf8'))
    for (const [key, value] of Object.entries(parsed)) {
      if (shellKeys.has(key)) continue
      process.env[key] = value
    }
  }
}

module.exports = { loadEnv, parseEnvFile }
