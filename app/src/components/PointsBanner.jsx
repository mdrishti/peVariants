export default function PointsBanner({ points, total }) {
  if (points == null) return null;
  return (
    <div className="points-banner">
      🎉 Congrats — you gained <strong>{points}</strong> point{points === 1 ? '' : 's'}!
      {total != null && <span> Total: <strong>{total}</strong> pts</span>}
    </div>
  );
}
