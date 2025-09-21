import type { SessionState } from "@/types/api";

interface LeftRailProps {
  state: SessionState;
}

export function LeftRail({ state }: LeftRailProps) {
  console.log("🎛️ LeftRail rendered with state:", {
    url: state.url,
    status: state.transcriptStatus,
    questionsCount: state.questions.length,
    conversationsCount: state.conversations.length,
  });

  // return (
  //   <div className="w-80 min-h-screen bg-muted/30 border-r flex flex-col">
  //     {/* Status indicator */}
  //     <div className="p-4 border-b bg-card/50">
  //       <div className="text-center">
  //         <h3 className="font-semibold text-sm mb-2">Session Stats</h3>
  //         <div className="text-xs text-muted-foreground space-y-2">
  //           <div className="flex justify-between items-center py-1 px-2 rounded bg-muted/50">
  //             <span>Conversations:</span>
  //             <span className="font-medium text-foreground">
  //               {state.conversations.length}
  //             </span>
  //           </div>
  //           <div className="flex justify-between items-center py-1 px-2 rounded bg-muted/50">
  //             <span>Total Snippets:</span>
  //             <span className="font-medium text-foreground">
  //               {state.allSnippets.length}
  //             </span>
  //           </div>
  //           <div className="flex justify-between items-center py-1 px-2 rounded bg-muted/50">
  //             <span>MCQ Sets:</span>
  //             <span className="font-medium text-foreground">
  //               {state.mcqSets.length}
  //             </span>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Additional info or features can go here */}
  //     <div className="flex-1 p-4">
  //       <div className="text-center space-y-4">
  //         {state.transcriptStatus === "loaded" && (
  //           <div className="bg-success/10 border border-success/20 rounded-lg p-3">
  //             <div className="text-xs text-success font-medium">
  //               ✓ Video loaded successfully
  //             </div>
  //             <div className="text-xs text-muted-foreground mt-1">
  //               Ready for analysis and questioning
  //             </div>
  //           </div>
  //         )}

  //         {state.transcriptStatus === "loading" && (
  //           <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
  //             <div className="text-xs text-primary font-medium">
  //               ⏳ Processing video...
  //             </div>
  //             <div className="text-xs text-muted-foreground mt-1">
  //               Please wait while we analyze the content
  //             </div>
  //           </div>
  //         )}

  //         {state.transcriptStatus === "error" && (
  //           <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
  //             <div className="text-xs text-destructive font-medium">
  //               ⚠ Processing failed
  //             </div>
  //             <div className="text-xs text-muted-foreground mt-1">
  //               Try loading another video
  //             </div>
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   </div>
  // );
}

console.log("🔧 LeftRail component loaded");
