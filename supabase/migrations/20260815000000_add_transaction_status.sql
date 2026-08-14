-- Add status column to transactions table
ALTER TABLE public.transactions
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ongoing';

-- Add check constraint for status values
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_status_check CHECK (status IN ('ongoing', 'done'));

-- Create index for better query performance on status
CREATE INDEX idx_transactions_status ON public.transactions(status);

-- Update existing transactions to have 'ongoing' status (already set by default, but explicit for clarity)
UPDATE public.transactions SET status = 'ongoing' WHERE status IS NULL;
