// mapLabelMarker.ts — a small custom Google Maps overlay that shows a


export interface LabelMarkerOptions {
  position: { lat: number; lng: number };
  label: string;
  color?: string;
  onClick?: () => void;
}

// `google` must be the already-loaded `(window as any).google` object. Call
export function createLabelMarkerClass(google: any) {
  return class LabelMarker extends google.maps.OverlayView {
    private position: { lat: number; lng: number };
    private label: string;
    private color: string;
    private onClickHandler?: () => void;
    private div: HTMLDivElement | null = null;

    constructor(options: LabelMarkerOptions) {
      super();
      this.position = options.position;
      this.label = options.label;
      this.color = options.color ?? "#B11226";
      this.onClickHandler = options.onClick;
    }

    onAdd() {
      const div = document.createElement("div");
      Object.assign(div.style, {
        position: "absolute",
        cursor: "pointer",
        transform: "translate(-50%, -100%)",
        transformOrigin: "bottom center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "transform 0.15s ease-out",
        zIndex: "1",
      });

      const pill = document.createElement("div");
      pill.textContent = this.label;
      Object.assign(pill.style, {
        maxWidth: "170px",
        padding: "5px 11px",
        borderRadius: "999px",
        background: this.color,
        color: "#fff",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        fontWeight: "600",
        lineHeight: "1.2",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        boxShadow: "0 2px 6px rgba(0,0,0,0.32)",
        border: "1.5px solid rgba(255,255,255,0.9)",
      });

      const pointer = document.createElement("div");
      Object.assign(pointer.style, {
        width: "0",
        height: "0",
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: `6px solid ${this.color}`,
        marginTop: "-1px",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))",
      });

      div.appendChild(pill);
      div.appendChild(pointer);

      div.addEventListener("mouseenter", () => {
        div.style.transform = "translate(-50%, -100%) scale(1.07)";
        div.style.zIndex = "10";
      });
      div.addEventListener("mouseleave", () => {
        div.style.transform = "translate(-50%, -100%) scale(1)";
        div.style.zIndex = "1";
      });
      div.addEventListener("click", () => this.onClickHandler?.());

      this.div = div;
      this.getPanes().overlayMouseTarget.appendChild(div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(this.position.lat, this.position.lng),
      );
      if (point) {
        this.div.style.left = `${point.x}px`;
        this.div.style.top = `${point.y}px`;
      }
    }

    onRemove() {
      if (this.div) {
        this.div.remove();
        this.div = null;
      }
    }
  };
}