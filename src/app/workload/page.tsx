import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileOutput, ArrowRight } from "lucide-react"
import Link from "next/link"

const workloads = [
  {
    id: 1,
    subject: "Filipino 8",
    section: "ARIES",
    students: 34,
    schedule: "M/W/F 8:00 AM - 9:00 AM",
    slug: "filipino-8-aries",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    subject: "MAPEH 8",
    section: "TAURUS",
    students: 40,
    schedule: "T/TH 10:00 AM - 11:30 AM",
    slug: "mapeh-8-taurus",
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    id: 3,
    subject: "Filipino 9",
    section: "GEMINI",
    students: 38,
    schedule: "M/W/F 1:00 PM - 2:00 PM",
    slug: "filipino-9-gemini",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-pink-500"
  }
]

export default function WorkloadDashboard() {
  return (
    <div className="flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teaching Workload</h1>
        <p className="text-muted-foreground mt-1">Manage your E-Class Records and grading.</p>
      </div>

      {/* Grid of Subjects */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workloads.map((workload) => (
          <Link href={`/ecr/${workload.slug}`} key={workload.id} className="group block">
            <Card className="h-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${workload.gradient}`}></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{workload.subject}</CardTitle>
                    <CardDescription className="font-semibold text-slate-600 mt-1">Section: {workload.section}</CardDescription>
                  </div>
                  <div className={`p-2 rounded-lg ${workload.color} text-white`}>
                    <FileOutput className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="h-4 w-4 mr-2" />
                    {workload.students} Enrolled Students
                  </div>
                  <div className="flex items-center text-sm text-slate-500 mt-1">
                    {workload.schedule}
                  </div>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#1ca560] group-hover:text-[#158045] transition-colors">
                  Open E-Class Record <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
