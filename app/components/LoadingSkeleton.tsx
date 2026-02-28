export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-800 rounded-lg p-6 h-32" />
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 h-28" />
        <div className="bg-gray-800 rounded-lg p-6 h-28" />
        <div className="bg-gray-800 rounded-lg p-6 h-28" />
        <div className="bg-gray-800 rounded-lg p-6 h-28" />
      </div>
    </div>
  );
}