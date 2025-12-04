import { db, type Item, type Outfit, type Trip, type TripItem, type WishlistItem } from '@/db'
import { trackDemoExited, trackDemoToRealConversion } from './analytics'

const DEMO_MODE_KEY = 'fitsome-demo-mode'
const DEMO_TYPE_KEY = 'fitsome-demo-type'
const USER_DATA_BACKUP_KEY = 'fitsome-user-data-backup'

export type DemoType = 'him' | 'her'

// Cloud-like data structure (mirrors R2 storage)
interface CloudData {
    version: number
    updatedAt: string
    items: Item[]
    trips: Trip[]
    tripItems: TripItem[]
    outfits: Outfit[]
    wishlist: WishlistItem[]
}

// Check if demo mode is active
export function isDemoMode(): boolean {
    return localStorage.getItem(DEMO_MODE_KEY) === 'true'
}

// Get current demo type
export function getDemoType(): DemoType | null {
    const type = localStorage.getItem(DEMO_TYPE_KEY)
    return type === 'him' || type === 'her' ? type : null
}

// Set demo mode state
function setDemoModeState(active: boolean, type?: DemoType): void {
    if (active) {
        localStorage.setItem(DEMO_MODE_KEY, 'true')
        if (type) {
            localStorage.setItem(DEMO_TYPE_KEY, type)
        }
    } else {
        localStorage.removeItem(DEMO_MODE_KEY)
        localStorage.removeItem(DEMO_TYPE_KEY)
    }
}

// Backup current user data before entering demo mode
async function backupUserData(): Promise<void> {
    try {
        const items = await db.items.toArray()
        const trips = await db.trips.toArray()
        const tripItems = await db.tripItems.toArray()
        const outfits = await db.outfits.toArray()
        const wishlist = await db.wishlist.toArray()

        // Only backup if user has data
        if (items.length > 0 || trips.length > 0 || outfits.length > 0 || wishlist.length > 0) {
            const backup = {
                items,
                trips,
                tripItems,
                outfits,
                wishlist,
                backedUpAt: new Date().toISOString(),
            }
            localStorage.setItem(USER_DATA_BACKUP_KEY, JSON.stringify(backup))
        }
    } catch (e) {
        console.error('Failed to backup user data:', e)
    }
}

// Restore user data after exiting demo mode
async function restoreUserData(): Promise<void> {
    try {
        const backupStr = localStorage.getItem(USER_DATA_BACKUP_KEY)
        if (!backupStr) return

        const backup = JSON.parse(backupStr)

        // Clear current (demo) data
        await db.items.clear()
        await db.trips.clear()
        await db.tripItems.clear()
        await db.outfits.clear()
        await db.wishlist.clear()

        // Restore user data
        if (backup.items?.length) await db.items.bulkPut(backup.items)
        if (backup.trips?.length) await db.trips.bulkPut(backup.trips)
        if (backup.tripItems?.length) await db.tripItems.bulkPut(backup.tripItems)
        if (backup.outfits?.length) await db.outfits.bulkPut(backup.outfits)
        if (backup.wishlist?.length) await db.wishlist.bulkPut(backup.wishlist)

        // Clear backup after successful restore
        localStorage.removeItem(USER_DATA_BACKUP_KEY)
    } catch (e) {
        console.error('Failed to restore user data:', e)
    }
}

/**
 * Convert image URL to base64 data URL
 */
async function imageUrlToBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) return null

        const blob = await response.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

/**
 * Load demo data from the new cloud-like structure
 * Structure mirrors real R2 storage:
 *   /demo/{type}/data.json
 *   /demo/{type}/images/{imageRef}
 */
async function loadDemoData(type: DemoType): Promise<CloudData | null> {
    try {
        // Load data.json from /demo/{type}/data.json (mirrors R2 structure)
        const response = await fetch(`/demo/${type}/data.json`)
        if (!response.ok) {
            throw new Error(`Failed to fetch demo data for type: ${type}`)
        }
        const data: CloudData = await response.json()

        // Load images for items that have imageRef (mirrors how cloud sync works)
        if (data.items) {
            const itemsWithImages = await Promise.all(
                data.items.map(async (item) => {
                    // If item has imageRef, load from /demo/{type}/images/{imageRef}
                    if (item.imageRef && !item.imageData) {
                        const imageUrl = `/demo/${type}/images/${item.imageRef}`
                        const imageData = await imageUrlToBase64(imageUrl)
                        if (imageData) {
                            return { ...item, imageData, imageSyncStatus: 'synced' as const }
                        }
                    }
                    return item
                })
            )
            data.items = itemsWithImages
        }

        return data
    } catch (e) {
        console.error('Failed to load demo data:', e)
        return null
    }
}

// Enter demo mode with specific type
export async function enterDemoMode(type: DemoType = 'him'): Promise<boolean> {
    try {
        // Analytics tracking is now done in the Landing page before calling this

        // Backup existing user data
        await backupUserData()

        // Clear current data
        await db.items.clear()
        await db.trips.clear()
        await db.tripItems.clear()
        await db.outfits.clear()
        await db.wishlist.clear()

        // Load and import demo data (cloud-like structure)
        const demoData = await loadDemoData(type)
        if (!demoData) {
            throw new Error('Could not load demo data')
        }

        // Import demo data (directly from cloud-like structure)
        if (demoData.items?.length) {
            await db.items.bulkPut(demoData.items)
        }
        if (demoData.trips?.length) {
            await db.trips.bulkPut(demoData.trips)
        }
        if (demoData.tripItems?.length) {
            await db.tripItems.bulkPut(demoData.tripItems)
        }
        if (demoData.outfits?.length) {
            await db.outfits.bulkPut(demoData.outfits)
        }
        if (demoData.wishlist?.length) {
            await db.wishlist.bulkPut(demoData.wishlist)
        }

        // Set demo mode flag with type
        setDemoModeState(true, type)

        return true
    } catch (e) {
        console.error('Failed to enter demo mode:', e)
        return false
    }
}

// Exit demo mode
export async function exitDemoMode(): Promise<boolean> {
    try {
        // Track analytics
        const demoType = getDemoType()
        if (demoType) {
            trackDemoExited(demoType)
        }

        // Check if user has their own data (converted from demo)
        const backupStr = localStorage.getItem(USER_DATA_BACKUP_KEY)
        if (backupStr) {
            trackDemoToRealConversion()
        }

        // Clear demo data
        await db.items.clear()
        await db.trips.clear()
        await db.tripItems.clear()
        await db.outfits.clear()
        await db.wishlist.clear()

        // Restore user data if available
        await restoreUserData()

        // Clear demo mode flag
        setDemoModeState(false)

        return true
    } catch (e) {
        console.error('Failed to exit demo mode:', e)
        return false
    }
}

// Check if user has backup data
export function hasUserDataBackup(): boolean {
    return Boolean(localStorage.getItem(USER_DATA_BACKUP_KEY))
}

// Get demo data stats for a specific type
export async function getDemoStats(type: DemoType): Promise<{ items: number; outfits: number; trips: number }> {
    try {
        // Quick fetch without loading images for stats
        const response = await fetch(`/demo/${type}/data.json`)
        if (!response.ok) {
            return { items: 0, outfits: 0, trips: 0 }
        }
        const demoData: CloudData = await response.json()
        return {
            items: demoData.items?.length || 0,
            outfits: demoData.outfits?.length || 0,
            trips: demoData.trips?.length || 0,
        }
    } catch {
        return { items: 0, outfits: 0, trips: 0 }
    }
}

// Get demo type labels for display
export function getDemoTypeLabel(type: DemoType): { title: string; subtitle: string; emoji: string } {
    if (type === 'her') {
        return {
            title: 'For Her',
            subtitle: 'Fashion, accessories & style essentials',
            emoji: '👠',
        }
    }
    return {
        title: 'For Him',
        subtitle: 'Tech, gear & everyday essentials',
        emoji: '⌚',
    }
}
