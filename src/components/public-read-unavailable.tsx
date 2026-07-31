export function PublicReadUnavailable() {
  return (
    <div
      className="empty-state"
      role="status"
      data-public-read-availability="unavailable"
    >
      <p>The publication is temporarily unavailable.</p>
      <p>Please try again later.</p>
    </div>
  );
}
