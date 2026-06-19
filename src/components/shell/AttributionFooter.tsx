const SOURCES = [
  { name: "OpenSky Network", url: "https://opensky-network.org" },
  { name: "AISStream.io", url: "https://aisstream.io" },
  { name: "USGS", url: "https://earthquake.usgs.gov" },
  { name: "NASA EONET", url: "https://eonet.gsfc.nasa.gov" },
  { name: "NOAA / NWS", url: "https://www.weather.gov" },
  { name: "RainViewer", url: "https://www.rainviewer.com" },
  { name: "VDOT 511", url: "https://511virginia.org" },
];

export function AttributionFooter() {
  return (
    <div className="flex h-5 w-full shrink-0 items-center justify-center gap-1 border-t border-border bg-bg-panel px-3 text-[9px] text-text-muted">
      <span>Live data courtesy of:</span>
      {SOURCES.map((s, i) => (
        <span key={s.name}>
          {s.name}
          {i < SOURCES.length - 1 ? " ·" : ""}
        </span>
      ))}
    </div>
  );
}
