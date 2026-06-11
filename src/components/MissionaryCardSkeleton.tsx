export default function MissionaryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Foto */}
      <div className="relative w-full aspect-[3/4] bg-gray-200 animate-pulse" />

      {/* Informações */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Nome */}
        <div className="h-3.5 bg-gray-200 rounded animate-pulse w-4/5" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5 mt-0.5" />

        {/* Missão */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-2.5 w-2.5 bg-gray-200 rounded-full animate-pulse shrink-0" />
          <div className="h-3 bg-gray-200 rounded animate-pulse flex-1" />
        </div>

        {/* Badge de status */}
        <div className="h-5 bg-gray-200 rounded-full animate-pulse w-20 mt-1" />

        {/* Tempo */}
        <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mt-0.5" />
      </div>

      {/* Borda inferior */}
      <div className="h-0.5 bg-gray-200" />
    </div>
  )
}
