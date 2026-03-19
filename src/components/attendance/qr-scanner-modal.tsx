import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Scan, CheckCircle2, QrCode } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTeacherStore } from "@/store/useStore"
import { Input } from "@/components/ui/input"

export function QRScannerModal() {
  const [open, setOpen] = useState(false)
  const [scanValue, setScanValue] = useState("")
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  
  const students = useTeacherStore(s => s.students)
  const updateAttendance = useTeacherStore(s => s.updateAttendance)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the hidden input to capture generic USB Barcode Scanner events
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanValue) return

    const student = students.find(s => s.lrn === scanValue)
    if (student) {
       // Log the exact moment of scan securely to local cache
       const today = new Date().toISOString().split('T')[0] 
       updateAttendance(student.lrn, { date: today, status: 'P' })
       
       setLastScanned(student.name)
       setScanValue("")
       
       // Keep focus for next scan
       inputRef.current?.focus()
       
       // Clear success message after 3 seconds
       setTimeout(() => setLastScanned(null), 3000)
    } else {
       alert("Invalid or unrecognized student QR Code.")
       setScanValue("")
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
        <Scan className="mr-2 h-4 w-4" /> Launch QR Scanner
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <QrCode className="mr-2 h-6 w-6 text-blue-600" />
            Live QR Attendance
          </DialogTitle>
          <DialogDescription>
            Position the student's ID card within the scanner viewfinder. Ensure good lighting.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4 flex flex-col items-center justify-center p-8 border-4 border border-dashed border-slate-300 rounded-2xl bg-slate-900 overflow-hidden h-[300px]">
           
           {/* Decorative scanning line */}
           <div className="absolute top-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
           
           {/* Viewfinder corners */}
           <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-lg"></div>
           <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-lg"></div>
           <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-lg"></div>
           <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-lg"></div>

           {lastScanned ? (
             <div className="flex flex-col items-center justify-center z-10 animate-in zoom-in duration-300">
               <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                 <CheckCircle2 className="text-white h-10 w-10" />
               </div>
               <span className="text-white px-4 py-1.5 bg-black/60 rounded-full font-bold tracking-wide backdrop-blur-sm">
                 PRESENT
               </span>
               <span className="text-emerald-300 font-medium mt-2 text-center text-lg">{lastScanned}</span>
             </div>
           ) : (
             <div className="text-center z-10">
               <Scan className="h-16 w-16 text-white/20 mx-auto mb-2" />
               <p className="text-white/60 font-medium">Ready to scan...</p>
             </div>
           )}

           {/* Hidden input to capture physical USB scanner strokes or manual testing */}
           <form onSubmit={handleScan} className="absolute bottom-0 opacity-0">
             <Input 
                ref={inputRef}
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                autoFocus
             />
           </form>
        </div>

        <div className="text-center mt-2 text-sm text-slate-500">
          * A USB Barcode scanner acts as a keyboard. Ensure this window is focused. Alternatively, you can type an LRN and hit Enter.
        </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
