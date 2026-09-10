export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Hero */}

      <div
        className="
        h-48
        rounded-[32px]
        bg-slate-200
      "
      />

      {/* Stats */}

      <div
        className="
        grid
        grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-6
        gap-4
      "
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="
            h-32
            rounded-[28px]
            bg-slate-200
            "
          />
        ))}
      </div>

      {/* Charts */}

      <div
        className="
        grid
        xl:grid-cols-2
        gap-6
      "
      >
        <div
          className="
          h-[420px]
          rounded-[30px]
          bg-slate-200
          "
        />

        <div
          className="
          h-[420px]
          rounded-[30px]
          bg-slate-200
          "
        />
      </div>

      {/* Bottom */}

      <div
        className="
        grid
        xl:grid-cols-2
        gap-6
      "
      >
        <div
          className="
          h-[450px]
          rounded-[30px]
          bg-slate-200
          "
        />

        <div
          className="
          h-[450px]
          rounded-[30px]
          bg-slate-200
          "
        />
      </div>

    </div>
  );
}