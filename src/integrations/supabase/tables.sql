
-- This is for reference only - these tables should already exist in the Supabase database

-- Create exam_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  graded_by UUID REFERENCES public.profiles(id)
);

-- Update teacher_details to include additional fields
ALTER TABLE IF EXISTS public.teacher_details
ADD COLUMN IF NOT EXISTS qualifications TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create Row Level Security policies
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Only teachers who created the exam can see the results
CREATE POLICY "Teachers can view their exam results" 
ON public.exam_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_id AND e.created_by = auth.uid()
  )
);

-- Teachers can update feedback for exams they created
CREATE POLICY "Teachers can update their exam results" 
ON public.exam_results 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_id AND e.created_by = auth.uid()
  )
);

-- Students can view their own results
CREATE POLICY "Students can view their own results" 
ON public.exam_results 
FOR SELECT 
USING (
  student_id = auth.uid()
);
