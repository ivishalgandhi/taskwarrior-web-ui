export default function CalendarHeader({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-4 border-b bg-card">
      {children}
    </div>
  )
}
