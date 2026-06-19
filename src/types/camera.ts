export interface TrafficCamera {
  name: string;
  lat: number;
  lng: number;
  /**
   * Must point to a publicly accessible camera feed (e.g. a state 511/DOT
   * traffic camera). Snapshot feeds (.jpg/.png) are shown as an
   * auto-refreshing image; stream feeds (.mp4/.m3u8) are shown in a
   * <video> element. The bundled entries in cameras.json are placeholders —
   * replace feedUrl with a real public feed before relying on this layer.
   */
  feedUrl: string;
}
