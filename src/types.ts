export type UserProfile = {
  id: string
  name: string
  email: string
  avatar_url: string
  phone?: string
  nickname?: string
  home_location: string
  favorite_meetup: string
}

export type LocationStatus = 'In Korome' | 'Nearby' | 'Wayanad' | 'Outside Wayanad' | 'Abroad'

export type UserLocation = {
  user_id: string
  lat: number
  lng: number
  status: LocationStatus
  last_seen: string
  location_name?: string
  arrived_at?: string
  left_at?: string
  online: boolean
  
  // Joined fields for realtime dashboard
  profiles?: UserProfile
}
