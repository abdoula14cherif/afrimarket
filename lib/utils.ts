// Générer un code de parrainage personnel
export function generatePersonalCode(nomComplet: string): string {
  const prenom = nomComplet.split(' ')[0].toUpperCase()
  const prefix = prenom.substring(0, Math.min(4, prenom.length))
  const randomNum = Math.floor(Math.random() * 9000 + 1000)
  return prefix + randomNum
}

// Récupérer le code de parrainage depuis l'URL
export function getReferralCodeFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const code = urlObj.searchParams.get('ref')
    return code ? code.toUpperCase() : null
  } catch {
    return null
  }
}

// Formater le prix
export function formatPrice(price: number): string {
  return price.toLocaleString() + ' F'
}