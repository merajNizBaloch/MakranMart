type OrderEvent = {
  id: string;
  from_status: string | null;
  to_status: string;
  note?: string | null;
  created_at: string;
};

function label(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OrderTimeline({
  events,
  showNotes = true,
}: {
  events: OrderEvent[];
  showNotes?: boolean;
}) {
  return (
    <div className="order-timeline">
      {events.map((event, index) => (
        <div className="order-timeline-event" key={event.id}>
          <div className="order-timeline-marker">
            <span>{index + 1}</span>
            {index < events.length - 1 && <i />}
          </div>

          <div className="order-timeline-copy">
            <div className="order-timeline-line">
              <strong>
                {event.from_status === event.to_status
                  ? "Order note"
                  : label(event.to_status)}
              </strong>
              <time dateTime={event.created_at}>
                {new Date(event.created_at).toLocaleString("en-PK", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>

            {showNotes && event.note && <p>{event.note}</p>}
          </div>
        </div>
      ))}

      {!events.length && (
        <div className="order-timeline-empty">No timeline events yet.</div>
      )}
    </div>
  );
}
