#!/usr/bin/env node

/**
 * Build and start Next.js using .env.production (local production smoke test).
 *
 * Preloads production vars into process.env before spawning Next so they take
 * precedence over .env.local (Next does not override existing process.env).
 *
 *   npm run prod
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const { loadEnv } = require('./lib/load-env')

const root = process.cwd()
const prodEnvPath = path.join(root, '.env.production')

if (!fs.existsSync(prodEnvPath)) {
  console.error(
    '\nMissing .env.production. Copy from .env.production.example and fill in values.\n',
  )
  process.exit(1)
}

loadEnv(['.env.production'])
process.env.NODE_ENV = 'production'

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('\n▶ Production build (next build)…\n')
run('npx', ['next', 'build'])

console.log('\n▶ Production server (next start)…\n')
run('npx', ['next', 'start'])
