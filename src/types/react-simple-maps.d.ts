declare module 'react-simple-maps' {
  import { ReactNode, CSSProperties } from 'react'

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: CSSProperties
    children?: ReactNode
  }

  interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    disablePanning?: boolean
    children?: ReactNode
  }

  interface GeographiesProps {
    geography: string
    children: (props: { geographies: Geography[] }) => ReactNode
  }

  interface Geography {
    rsmKey: string
    [key: string]: unknown
  }

  interface GeographyProps {
    key?: string
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties
      hover?: CSSProperties
      pressed?: CSSProperties
    }
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void
  }

  interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
  export function Marker(props: MarkerProps): JSX.Element
}
