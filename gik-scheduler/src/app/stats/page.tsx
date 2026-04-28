"use client";

import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, ClockIcon, TargetIcon, ActivityIcon, FileWarningIcon, ZapIcon } from "lucide-react";

export default function StatsPage() {
  const stats = useStore((state) => state.stats);

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center p-8">
         <Card className="max-w-md w-full text-center p-6 bg-muted/20">
           <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
           <CardTitle className="mb-2">No Generation Data</CardTitle>
           <p className="text-muted-foreground text-sm">
             You need to run the Schedule Generation process from the Dashboard first to view algorithmic performance metrics and constraint satisfaction scores.
           </p>
         </Card>
      </div>
    );
  }

  // Derived metrics
  const completionPercentage = Math.round((stats.totalAssigned / stats.totalCourses) * 100);

  return (
    <div className="p-8 pb-32 h-full overflow-y-auto">
       <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Algorithm Analytics</h1>
            <p className="text-muted-foreground mt-1">Constraint Satisfaction Engine runtime diagnostics and post-generation metrics.</p>
       </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CSP Execution Time</CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.timeMs.toLocaleString()} ms</div>
              <p className="text-xs text-muted-foreground mt-1">Total runtime including MRV sorting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backtrack Operations</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.backtracks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total graph branch cancellations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soft Constraint Efficiency</CardTitle>
              <ZapIcon className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.softScore} pts</div>
              <p className="text-xs text-muted-foreground mt-1">Capacity matches & workload balance checks</p>
            </CardContent>
          </Card>
       </div>

       <div className="grid gap-6 md:grid-cols-2">
           <Card className="col-span-1">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <TargetIcon className="h-5 w-5"/> Target Hard Constraints
                </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="font-medium text-sm">Constraint Viability</span>
                     <Badge variant={stats.hardConstraintsMet ? "default" : "destructive"}>
                        {stats.hardConstraintsMet ? "Satisfied" : "Failed / Timeout"}
                     </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-4">
                     <span className="font-medium text-sm">Course Sessions Placed</span>
                     <span className="text-sm font-bold text-primary">{stats.totalAssigned} / {stats.totalCourses}</span>
                  </div>

                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden mt-2">
                     <div 
                        className={`h-full ${completionPercentage === 100 ? 'bg-primary' : 'bg-destructive'}`} 
                        style={{ width: `${completionPercentage}%`}} 
                     />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{completionPercentage}% Placement Rate</p>
                </div>
             </CardContent>
           </Card>

           <Card className="col-span-1">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <FileWarningIcon className="h-5 w-5"/> Status & Remarks
                </CardTitle>
             </CardHeader>
             <CardContent>
                 <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
                     <ul className="space-y-4 text-sm">
                         <li className="flex flex-col gap-1 border-b pb-2">
                            <span className="font-semibold text-primary">MRV Heuristic Applied</span>
                            <span className="text-muted-foreground leading-relaxed">Variable ordering prioritized unassigned sections locally utilizing fallback capacities.</span>
                         </li>
                         <li className="flex flex-col gap-1 border-b pb-2">
                            <span className="font-semibold text-primary">Forward Checking Log</span>
                            <span className="text-muted-foreground leading-relaxed">Pruned {stats.backtracks} branches avoiding immediate conflicts for teachers and rooms.</span>
                         </li>
                         {!stats.hardConstraintsMet && (
                             <li className="flex flex-col gap-1 pb-2">
                                <span className="font-semibold text-destructive">Incomplete Mapping</span>
                                <span className="text-muted-foreground leading-relaxed">The algorithm hit the 10s maximum timeout limitation before finding a terminal state node. The local maximum optimum partial structure was retained and returned.</span>
                             </li>
                         )}
                         {stats.hardConstraintsMet && (
                             <li className="flex flex-col gap-1 pb-2">
                                <span className="font-semibold text-green-500">Perfect Graph Solution</span>
                                <span className="text-muted-foreground leading-relaxed">A terminal state node was achieved without violating hard structural constraints in the multidimensional constraint graph.</span>
                             </li>
                         )}
                     </ul>
                 </ScrollArea>
             </CardContent>
           </Card>
       </div>
    </div>
  );
}
