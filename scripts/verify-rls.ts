import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
(globalThis as any).WebSocket = WebSocket


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function run() {
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { global: { WebSocket } })
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { WebSocket } })
  const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { WebSocket } })

  console.log('Creating users...')
  const email1 = `user1_${Date.now()}@test.com`
  const email2 = `user2_${Date.now()}@test.com`
  
  await adminClient.auth.admin.createUser({ email: email1, password: 'password123', email_confirm: true })
  await adminClient.auth.admin.createUser({ email: email2, password: 'password123', email_confirm: true })

  await client1.auth.signInWithPassword({ email: email1, password: 'password123' })
  await client2.auth.signInWithPassword({ email: email2, password: 'password123' })

  
  const user1 = (await client1.auth.getUser()).data.user
  const user2 = (await client2.auth.getUser()).data.user

  if (!user1 || !user2) {
    throw new Error('Failed to create users')
  }

  console.log('Inserting symbols...')
  await adminClient.from('symbols').insert({ ticker: 'RELIANCE', name: 'Reliance Ind' }).select()
  
  console.log('User 1 inserting into watchlist...')
  const { data: w1, error: e1 } = await client1
    .from('watchlist_items')
    .insert({ user_id: user1.id, symbol: 'RELIANCE', tag: 'momentum' })
    .select()
    .single()
    
  if (e1) console.error('Error inserting for User 1:', e1.message)
  else console.log('User 1 watchlist item inserted:', w1.id)

  console.log('User 2 attempting to view User 1 watchlist...')
  const { data: view2 } = await client2.from('watchlist_items').select('*')
  console.log('User 2 sees items:', view2?.length)
  if (view2?.length !== 0) {
    console.error('RLS FAILED: User 2 can see items from other users.')
  } else {
    console.log('RLS PASS: User 2 cannot see User 1 items.')
  }

  console.log('User 2 attempting to update User 1 watchlist...')
  const { data: up2, error: eup2 } = await client2
    .from('watchlist_items')
    .update({ tag: 'value' })
    .eq('id', w1.id)
    .select()
  console.log('User 2 update result:', up2)
  if (up2 && up2.length > 0) {
    console.error('RLS FAILED: User 2 can update User 1 items.')
  } else {
    console.log('RLS PASS: User 2 cannot update User 1 items.')
  }

  console.log('User 2 attempting to delete User 1 watchlist...')
  const { data: del2, error: edel2 } = await client2
    .from('watchlist_items')
    .delete()
    .eq('id', w1.id)
    .select()
  console.log('User 2 delete result:', del2)
  if (del2 && del2.length > 0) {
    console.error('RLS FAILED: User 2 can delete User 1 items.')
  } else {
    console.log('RLS PASS: User 2 cannot delete User 1 items.')
  }
}

run().catch(console.error)
