import {
  Bell, Search, Settings, BookOpen, LogOut, ChevronDown
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/50 px-6 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1ca560] text-white group-hover:bg-[#158045] transition-colors">
            <BookOpen size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#1ca560] transition-colors">EduSync</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-[#1ca560] transition-colors">Advisory Board</Link>
          <Link href="/attendance" className="hover:text-[#1ca560] transition-colors">SF2 Attendance</Link>
          <Link href="/composite" className="hover:text-[#1ca560] transition-colors">Composite Grades</Link>
          <Link href="/sf5" className="hover:text-[#1ca560] transition-colors">SF5</Link>
          <div className="h-4 w-px bg-slate-300 mx-2"></div>
          <Link href="/workload" className="hover:text-[#1ca560] transition-colors">Teacher Workload</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-[300px] sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, LRN, forms..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white/50 pl-9 pr-4 text-sm outline-none focus:border-[#1ca560] focus:ring-1 focus:ring-[#1ca560]"
          />
        </div>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500"></span>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
          <Settings size={18} />
        </button>
        
        <div className="border-l h-6 mx-1 border-slate-300 hidden sm:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="ml-1 flex items-center gap-2 hover:bg-slate-50 p-1 pr-2 rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#1ca560]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-400 to-[#1ca560] shadow-inner border border-emerald-600"></div>
              <div className="hidden flex-col items-start sm:flex text-sm text-left">
                <span className="font-semibold text-slate-900 leading-none">C. Rubino</span>
                <span className="text-[10px] uppercase font-bold text-[#1ca560] tracking-wider mt-0.5">Class Adviser</span>
              </div>
              <ChevronDown size={14} className="text-slate-400 ml-1 hidden sm:block" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] bg-white p-1">
            <Link href="/login" className="w-full">
               <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer font-medium p-2">
                 <LogOut className="mr-2 h-4 w-4" />
                 <span>Secure Log out</span>
               </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
