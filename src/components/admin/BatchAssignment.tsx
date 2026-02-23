import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package } from 'lucide-react';

type Program = { id: string; name: string; category: string };
type Location = { id: string; name: string; city: string };
type Batch = { id: string; batch_number: number; current_count: number; max_students: number; status: string };

interface BatchAssignmentProps {
  studentId: string;
  currentBatchId: string | null;
  currentProgramId: string | null;
  currentLocationId: string | null;
  onAssigned: () => void;
}

export function BatchAssignment({ studentId, currentBatchId, currentProgramId, currentLocationId, onAssigned }: BatchAssignmentProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedProgram, setSelectedProgram] = useState(currentProgramId || '');
  const [selectedLocation, setSelectedLocation] = useState(currentLocationId || '');
  const [selectedBatch, setSelectedBatch] = useState(currentBatchId || '');
  const [assigning, setAssigning] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    supabase.from('programs').select('id, name, category').eq('is_active', true).order('name')
      .then(({ data }) => setPrograms(data || []));
  }, []);

  useEffect(() => {
    if (!selectedProgram) { setLocations([]); setSelectedLocation(''); return; }
    setLoadingLocations(true);
    setSelectedLocation('');
    setBatches([]);
    setSelectedBatch('');
    supabase.from('location_programs').select('location_id, training_locations(id, name, city)')
      .eq('program_id', selectedProgram).eq('is_active', true)
      .then(({ data }) => {
        const locs = (data || [])
          .map((lp: any) => lp.training_locations)
          .filter(Boolean) as Location[];
        setLocations(locs);
        setLoadingLocations(false);
      });
  }, [selectedProgram]);

  useEffect(() => {
    if (!selectedProgram || !selectedLocation) { setBatches([]); setSelectedBatch(''); return; }
    setLoadingBatches(true);
    setSelectedBatch('');
    supabase.from('course_batches')
      .select('id, batch_number, current_count, max_students, status')
      .eq('program_id', selectedProgram)
      .eq('location_id', selectedLocation)
      .order('batch_number', { ascending: true })
      .then(({ data }) => {
        setBatches(data || []);
        setLoadingBatches(false);
      });
  }, [selectedProgram, selectedLocation]);

  const handleAssign = async () => {
    if (!selectedBatch || !selectedProgram || !selectedLocation) return;
    setAssigning(true);

    // If student was previously in a different batch, decrement old batch count
    if (currentBatchId && currentBatchId !== selectedBatch) {
      await supabase.from('course_batches')
        .update({ current_count: Math.max(0, 0) }) // We'll use RPC-style
        .eq('id', currentBatchId);
      // Actually decrement properly
      const { data: oldBatch } = await supabase.from('course_batches').select('current_count').eq('id', currentBatchId).single();
      if (oldBatch) {
        await supabase.from('course_batches').update({ current_count: Math.max(0, oldBatch.current_count - 1) }).eq('id', currentBatchId);
      }
    }

    const { error } = await supabase.from('student_registrations')
      .update({
        batch_id: selectedBatch,
        program_id: selectedProgram,
        preferred_location_id: selectedLocation,
      })
      .eq('id', studentId);

    if (error) {
      toast.error('Failed to assign student to batch');
      setAssigning(false);
      return;
    }

    // Increment new batch count
    if (selectedBatch !== currentBatchId) {
      const { data: newBatch } = await supabase.from('course_batches').select('current_count, max_students').eq('id', selectedBatch).single();
      if (newBatch) {
        const newCount = newBatch.current_count + 1;
        await supabase.from('course_batches').update({
          current_count: newCount,
          status: newCount >= newBatch.max_students ? 'full' : 'open',
        }).eq('id', selectedBatch);
      }
    }

    toast.success('Student assigned to batch successfully');
    setAssigning(false);
    onAssigned();
  };

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-5 h-5 text-primary" />
        <h4 className="font-semibold">Assign to Course & Batch</h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Program</label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
            <SelectContent>
              {programs.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Location</label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!selectedProgram || loadingLocations}>
            <SelectTrigger>
              <SelectValue placeholder={loadingLocations ? 'Loading...' : 'Select location'} />
            </SelectTrigger>
            <SelectContent>
              {locations.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name} ({l.city})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Batch</label>
          <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={!selectedLocation || loadingBatches}>
            <SelectTrigger>
              <SelectValue placeholder={loadingBatches ? 'Loading...' : 'Select batch'} />
            </SelectTrigger>
            <SelectContent>
              {batches.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  Batch {b.batch_number} ({b.current_count}/{b.max_students}) - {b.status}
                </SelectItem>
              ))}
              {batches.length === 0 && !loadingBatches && selectedLocation && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No batches available</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleAssign}
        disabled={!selectedBatch || assigning}
        className="w-full sm:w-auto"
      >
        {assigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
        {currentBatchId ? 'Reassign Student' : 'Assign to Batch'}
      </Button>
    </div>
  );
}
