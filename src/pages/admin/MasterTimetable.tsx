
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AppState, TimetableStatus, createSectionKey } from "@/types/timetable";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";

const MasterTimetable: React.FC = () => {
  const { year, dept, section } = useParams<{ year: string; dept: string; section: string }>();
  const { toast } = useToast();
  const [appState, setAppState] = useState<AppState | null>(null);
  
  useEffect(() => {
    if (year && dept && section) {
      // Get stored app state
      const storedState = localStorage.getItem(`appState_${year}_${dept}_${section}`);
      if (storedState) {
        try {
          setAppState(JSON.parse(storedState));
        } catch (error) {
          console.error("Failed to parse app state:", error);
        }
      }
    }
  }, [year, dept, section]);

  const handleConfirmMaster = () => {
    if (!appState || !year || !dept || !section) return;
    
    const sectionKey = createSectionKey(year, dept, section);
    const currentTimetable = appState.timetables[sectionKey];
    
    if (!currentTimetable) {
      toast({
        title: "No timetable found",
        description: "Please generate a timetable draft first.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a master card from the current timetable
    const newMasterCard = {
      sectionKey,
      year,
      dept,
      section,
      createdAt: new Date(),
      lastEdited: new Date(),
      status: 'Confirmed' as const,
      grid: currentTimetable.grid
    };
    
    // Update the timetable status to Master
    const updatedTimetables = {
      ...appState.timetables,
      [sectionKey]: {
        ...currentTimetable,
        status: TimetableStatus.Master
      }
    };
    
    // Add to master cards
    const updatedMasterCards = [...appState.masterCards, newMasterCard];
    
    // Add a recent update
    const newUpdate = {
      id: `update_${Date.now()}`,
      time: new Date(),
      message: `Timetable for ${year} Year ${dept} Section ${section} confirmed as Master`,
      type: 'timetable' as const,
      relatedId: sectionKey
    };
    
    const updatedAppState = {
      ...appState,
      timetables: updatedTimetables,
      masterCards: updatedMasterCards,
      recentUpdates: [newUpdate, ...appState.recentUpdates.slice(0, 19)]
    };
    
    setAppState(updatedAppState);
    
    // Save to localStorage
    localStorage.setItem(`appState_${year}_${dept}_${section}`, JSON.stringify(updatedAppState));
    
    toast({
      title: "Master timetable confirmed",
      description: "The timetable has been set as the master timetable."
    });
  };

  if (!appState) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const sectionKey = createSectionKey(year || '', dept || '', section || '');
  const currentTimetable = appState.timetables[sectionKey];
  const isTimetableAvailable = currentTimetable && Object.keys(currentTimetable.grid).length > 0;
  const isMaster = currentTimetable?.status === TimetableStatus.Master;
  
  const matchingMasterCards = appState.masterCards.filter(
    card => card.sectionKey === sectionKey
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link to={`/admin/dashboard/${year}`} className="text-muted-foreground hover:text-foreground">
            {year} Year
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link to={`/admin/dashboard/${year}/${dept}`} className="text-muted-foreground hover:text-foreground">
            {dept}
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link to={`/admin/dashboard/${year}/${dept}/${section}`} className="text-muted-foreground hover:text-foreground">
            Section {section}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span>Master Timetable</span>
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight mt-2">
          Master Timetable
        </h2>
        <p className="text-muted-foreground">
          Finalize and manage the master timetable
        </p>
      </div>

      <div className="flex justify-between">
        <Link to={`/admin/dashboard/${year}/${dept}/${section}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        {isTimetableAvailable && !isMaster && (
          <Button onClick={handleConfirmMaster} className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Confirm as Master
          </Button>
        )}
      </div>
      
      {!isTimetableAvailable && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Timetable Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Please generate a timetable draft first before confirming a master timetable.
            </p>
            <Link to={`/admin/timetables/${year}/${dept}/${section}`}>
              <Button>Generate Timetable</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      {isTimetableAvailable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Timetable</CardTitle>
              <Badge className={isMaster ? "bg-green-500" : "bg-yellow-500"}>
                {isMaster ? "Master" : "Draft"}
              </Badge>
            </div>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-center py-8">Timetable Grid Visualization Placeholder</p>
              <p className="text-center text-muted-foreground">
                {isMaster 
                  ? "This is the confirmed master timetable for this section." 
                  : "Confirm this timetable to set it as the master timetable."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {matchingMasterCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Master Timetable History</CardTitle>
            <CardDescription>
              Previous confirmed master timetables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchingMasterCards.map((card, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      {card.year} Year {card.dept} - Section {card.section}
                    </h4>
                    <Badge className="bg-green-500">Confirmed</Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Created: {new Date(card.createdAt).toLocaleString()}</span>
                    <span>Last edited: {new Date(card.lastEdited).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MasterTimetable;
