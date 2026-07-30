import {
  type CrossOrigin,
  type Decoding,
  type FetchPriority,
  type HTMLAttributes,
  type Loading,
} from './base'

export type HTMLAudioAttributes = HTMLMediaAttributes

export type HTMLCanvasAttributes = {
  height?: string
  width?: string
} & HTMLAttributes

export type HTMLImageAttributes = {
  alt?: string
  crossorigin?: CrossOrigin
  decoding?: Decoding
  fetchpriority?: FetchPriority
  height?: string
  loading?: Loading
  referrerpolicy?: string
  sizes?: string
  src?: string
  srcset?: string
  usemap?: string
  width?: string
} & HTMLAttributes

export type HTMLMediaAttributes = {
  autoplay?: string
  controls?: string
  crossorigin?: CrossOrigin
  loop?: string
  muted?: string
  preload?: 'auto' | 'metadata' | 'none'
  src?: string
} & HTMLAttributes

export type HTMLPictureAttributes = HTMLAttributes

export type HTMLSourceAttributes = {
  height?: string
  media?: string
  sizes?: string
  src?: string
  srcset?: string
  type?: string
  width?: string
} & HTMLAttributes

export type HTMLTrackAttributes = {
  default?: string
  kind?: 'captions' | 'chapters' | 'descriptions' | 'metadata' | 'subtitles'
  label?: string
  src?: string
  srclang?: string
} & HTMLAttributes

export type HTMLVideoAttributes = {
  height?: string
  playsinline?: string
  poster?: string
  width?: string
} & HTMLMediaAttributes
