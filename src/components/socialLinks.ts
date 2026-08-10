import type { ComponentType } from 'react'
import { SiFacebook, SiInstagram, SiPinterest, SiTiktok, SiYoutube } from 'react-icons/si'
import { FaLinkedin } from 'react-icons/fa6'
import type { Website } from '@/types'

type SocialField =
  | 'social_youtube'
  | 'social_facebook'
  | 'social_instagram'
  | 'social_tiktok'
  | 'social_linkedin'
  | 'social_pinterest'

export const SOCIAL_PLATFORMS: Array<{ field: SocialField; label: string; icon: ComponentType<{ className?: string }> }> = [
  { field: 'social_youtube', label: 'YouTube', icon: SiYoutube },
  { field: 'social_facebook', label: 'Facebook', icon: SiFacebook },
  { field: 'social_instagram', label: 'Instagram', icon: SiInstagram },
  { field: 'social_tiktok', label: 'TikTok', icon: SiTiktok },
  { field: 'social_linkedin', label: 'LinkedIn', icon: FaLinkedin },
  { field: 'social_pinterest', label: 'Pinterest', icon: SiPinterest },
]

type ConfiguredSocialLink = { field: SocialField; label: string; icon: ComponentType<{ className?: string }>; url: string }

export function configuredSocialLinks(website: Pick<Website, SocialField>): ConfiguredSocialLink[] {
  return SOCIAL_PLATFORMS.map((platform) => ({ ...platform, url: website[platform.field] })).filter(
    (platform): platform is ConfiguredSocialLink => Boolean(platform.url)
  )
}
