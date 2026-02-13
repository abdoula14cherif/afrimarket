import { supabase } from '../../lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const [usersCount, balances] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('balances').select('amount')
    ])

    const totalGains = balances.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

    res.status(200).json({
      users: usersCount.count || 0,
      gains: totalGains,
      parrainages: 3
    })
  } catch (error) {
    console.error('❌ Erreur stats:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}